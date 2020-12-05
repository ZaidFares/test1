/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceAnalog combines a device (endpoint id and attributes) with a model.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DeviceAnalog = class {
    /**
     *
     * @param {iotcs.device.impl.DirectlyConnectedDeviceImpl} directlyConnectedDevice
     * @param {DeviceModel} deviceModel
     * @param {string} endpointId the endpoint ID of the DirectlyConnectedDevice with this device
     * model.
     */
    constructor(directlyConnectedDevice, deviceModel, endpointId) {
        /**
         *
         * @type {Map<string, object>}
         *
         * @ignore
         * @private
         */
        this._attributeValueMap = new Map();

        /**
         *
         * @type {iotcs.device.impl.DirectlyConnectedDeviceImpl}
         *
         * @ignore
         * @private
         */
        this._directlyConnectedDevice = directlyConnectedDevice;

        /**
         *
         * @type {iotcs.device.impl.DeviceModel}
         *
         * @ignore
         * @private
         */
        this._deviceModel = deviceModel;

        /**
         *
         * @type {string}
         *
         * @ignore
         * @private
         */
        this._endpointId = endpointId;
    }

    /**
     * Invoke an action. The {@code argumentValues} parameter may be empty if there are no arguments
     * to pass, but will not be {@code null}.
     *
     * @param {string} actionName The name of the action to call.
     * @param {Map<string, ?>} argumentValues  The data to pass to the action, possibly an empty
     *        Map but never {@code null}.
     * @throws {iotcs.error} If
     */
    _call(actionName, argumentValues) {
        /** @type {Map<string, iotcs.device.impl.DeviceModelAction} */
        const deviceModelActionMap = this._deviceModel.getDeviceModelActions();

        if (!deviceModelActionMap) {
            return;
        }

        /** @type {iotcs.device.impl.DeviceModelAction} */
        const deviceModelAction = deviceModelActionMap.get(actionName);

        if (!deviceModelAction) {
            return;
        }

        // What this is doing is pushing a request message into the message
        // queue for the requested action. To the LL, it is handled just like
        // any other RequestMessage. But we don't want this RM going to the
        // server, so the source and destination are set to be the same
        // endpoint id. In SendReceiveImpl, if there is a RequestMessage
        // with a source == destination, it is treated it specially.
        /** @type {object} */
        let requestMessage = {};

        requestMessage.payload = {
            body: '',
            method: 'POST',
            url: "deviceModels/" + this._getDeviceModel()._getUrn() + "/actions/" + actionName
        };

        requestMessage.destination = this._getEndpointId();
        requestMessage.source = this._getEndpointId();
        requestMessage.type = iotcs.message.Message.Type.REQUEST;

        /** @type {Array<iotcs.device.impl.DeviceModelActionArgument>} */
        const argumentList = deviceModelAction._getArguments();

        try {
            /** @type {object} */
            let actionArgs = null;

            /** @type {iotcs.device.impl.DeviceModelActionArgument} */
            argumentList.forEach (argument => {
                /** @type {object} */
                let value = argumentValues.get(argument._getName());

                if (!value) {
                    value = argument._getDefaultValue();

                    if (!value) {
                        iotcs.error("Action not called: missing argument '" + argument._getName() +
                            " in call to '" + actionName + "'.");
                        return;
                    }
                }

                this._encodeArg(actionArgs, deviceModelAction, argument, value);
            });

            requestMessage.payload.body = actionArgs._toString();
        } catch (error) {
            iotcs.log(error.message);
            return;
        }

        /** @type {boolean} */
        const useLongPolling = iotcs.oracle.iot.client.device.disableLongPolling;

        // Assumption here is that, if you are using long polling, you are using message dispatcher.
        // This could be a bad assumption. But if long polling is disabled, putting the message on
        // the request buffer will work regardless of whether message dispatcher is used.
        if (useLongPolling) {
            try {
                /** @type {iotcs.device.Message} (ResponseMessage) */
                const responseMessage =
                    new iotcs.device.impl.util.RequestDispatcher().dispatch(requestMessage);
            } catch (error) {
                console.log(error);
            }
        } else {
            // Not long polling, push request message back on request buffer.
            try {
                /** @type {iotcs.device.Message} (ResponseMessage) */
                const responseMessage =
                    new iotcs.device.impl.util.RequestDispatcher().dispatch(requestMessage);
            } catch (error) {
                console.log(error);
            }
        }
    }

    /**
     * Determines if value is outside the lower and upper bounds of the argument.
     *
     * @param {DeviceModelAction} deviceModelAction
     * @param {DeviceModelActionArgument} argument
     * @param {number} value
     * @throws {error} if value is less than the lower bound or greater than the upper bound of the
     *         argument.
     */
    _checkBounds(deviceModelAction, argument, value) {
        /** @type {number} */
        const upperBound = argument._getUpperBound();
        /** @type {number} */
        const lowerBound = argument._getLowerBound();

        // Assumption here is that lowerBound <= upperBound.
        if (upperBound) {
            if (value > upperBound) {
                iotcs.error(deviceModelAction._getName() + " '" + argument._getName() +
                          "' out of range: " + value + " > " + upperBound + '.');
            }
        }

        if (lowerBound) {
            if(value < lowerBound) {
                iotcs.error(deviceModelAction._getName() + " '" + argument._getName() +
                          "' out of range: " + value + " < " + lowerBound + '.');
            }
        }
    }

    /**
     * Checks the data type of the value against the device model, converts the value to the
     * required type if needed, and adds the argument/value to the jsonObject.
     *
     * @param {object} jsonObject - The JSON object to add the argument and value to.
     * @param {DeviceModelAction} deviceModelAction - The device model action.
     * @param {DeviceModelActionArgument} argument - The device model action argument specification.
     * @param {object} value - The argument value.
     * @throws iotcs.error If there was a problem encoding the argument.
     */
    _encodeArg(jsonObject, deviceModelAction, argument, value) {
        /** @type {string} */
        const actionName = deviceModelAction._getName();
        /** @type {string} */
        const argumentName = argument._getName();
        /** @type {string} */
        const typeOfValue = typeof value;

        /** @type {DeviceModelAttribute.Type} */
        switch (argument._getArgType()) {
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                if (typeOfValue !== 'number') {
                    iotcs.error(actionName + " value for '" + argument + "' is not a NUMBER.");
                }

                this._checkBounds(deviceModelAction, argument, value);
                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
                if (typeOfValue !== 'integer') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not an INTEGER.");
                }

                this._checkBounds(deviceModelAction, argument, value);
                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
                if ((typeOfValue !== 'date') && (typeOfValue !== 'long')) {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a DATETIME.");
                }

                if (typeOfValue === 'date') {
                    let d = new Date();
                    jsonObject.put(argumentName, value.getMilliseconds());
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
                if (typeOfValue !== 'boolean') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a BOOLEAN.");
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.STRING:
                if (typeOfValue !== 'string') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a STRING.");
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.URI:
                if (!(value instanceof iotcs.ExternalObject)) {
                    iotcs.error(actionName + " value for '" + argumentName +
                        "' is not an ExternalObject.");
                }

                jsonObject.put(argumentName, value);
                break;
            default:
                iotcs.error(actionName + " argument '" + argumentName + "' has an unknown type.");
        }
    }

    /**
     * Returns the attribute value of the attribute with the specified name.  If the attribute value
     * is not available, returns the attribute's default value.
     *
     * @param {string} attributeName - The name of the attribute.
     * @return {object} The attribute's value or default value.
     */
    _getAttributeValue(attributeName) {
        /** @type {iotcs.device.impl.Attribute} */
        let deviceModelAttribute = this._deviceModel.getDeviceModelAttributes().get(attributeName);

        if (deviceModelAttribute === null) {
            iotcs.error(this._deviceModel.getUrn() + " does not contain attribute " +
                attributeName);
        }

        let value = this._attributeValueMap.get(attributeName);

        if (value === null) {
            value = deviceModelAttribute._getDefaultValue();
        }

        return value;
    }


    /**
     * Returns the device model.
     *
     * @returns {DeviceModel} The device model.
     */
    _getDeviceModel() {
        return this._deviceModel;
    }

    /**
     * Returns the device's endpoint ID.
     *
     * @return {string} The device's endpoint ID.
     */
    _getEndpointId() {
        return this._directlyConnectedDevice._getEndpointId();
    }

    /**
     * Enqueue's the message for dispatching.
     *
     * @param {Message} message - The message to be enqueued.
     */
    _queueMessage(message) {
        try {
            this._directlyConnectedDevice._messageDispatcher.queue(message);
        } catch(error) {
            console.log('Error queueing message: ' + error);
        }
    }

    /**
     * Set the named attribute to the given value.
     *
     * @param {string} attribute - The attribute to set.
     * @param {object} value - The value of the attribute.
     * @throws Error If the attribute is not in the device model, the value is <code>null</code>, or
     *         the value does not match the attribute type.
     */
    _setAttributeValue(attribute, value) {
        if (value === null) {
            throw new Error("value cannot be null");
        }

        let deviceModelAttribute = this._deviceModel.getDeviceModelAttributes().get(attribute);

        if (!deviceModelAttribute) {
            throw new Error(this._deviceModel.getUrn() + " does not contain attribute " +
                            attribute);
        }

        /** @type {DeviceModelAttribute.Type} */
        let type = deviceModelAttribute.getType();
        let badValue;
        let typeOfValue = null;

        switch (type) {
            // TODO: We don't need all of these types in JavaScript.
            case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
            case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                typeOfValue = typeof value === 'number';
                badValue = !typeOfValue;
                break;
            case iotcs.impl.DeviceModelAttribute.Type.STRING:
            case iotcs.impl.DeviceModelAttribute.Type.URI:
                typeOfValue = typeof value === 'string';
                badValue = !typeOfValue;
                break;
            case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
                typeOfValue = typeof value === 'boolean';
                badValue = !typeOfValue;
                break;
            default:
                throw new Error('Unknown type ' + type);
        }

        if (badValue) {
            throw new Error("Cannot set '"+ this._deviceModel.getUrn() + ":attribute/" + attribute +
                            "' to " + value.toString());
        }

        this._attributeValueMap.set(attribute, value);
    }
};
