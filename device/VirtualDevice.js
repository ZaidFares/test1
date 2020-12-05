/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * VirtualDevice is a representation of a device model
 * implemented by an endpoint. A device model is a
 * specification of the attributes, formats, and resources
 * available on the endpoint.
 * <p>
 * This VirtualDevice API is specific to the device
 * client. This implements the alerts defined in the
 * device model and can be used for raising alerts to
 * be sent to the server for the device. Also it has
 * action handlers for actions that come as requests
 * from the server side.
 * <p>
 * A device model can be obtained by it's afferent urn with the
 * DirectlyConnectedDevice if it is registered on the cloud.
 * <p>
 * The VirtualDevice has the attributes, actions and alerts of the device
 * model as properties and it provides functionality to the device
 * model in the following ways:
 * <p>
 * <b>Get the value of an attribute:</b><br>
 * <code>let value = device.temperature.value;</code><br>
 * <p>
 * <b>Get the last known value of an attribute:</b><br>
 * <code>let lastValue = device.temperature.lastKnownValue;</code><br>
 * <p>
 * <b>Set the value of an attribute (with update on cloud and error callback handling):</b><br>
 * <code>device.temperature.onError = function (errorTuple);</code><br>
 * <code>device.temperature.value = 27;</code><br>
 * where errorTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , tryValue: ... , errorResponse: ...}</code>.
 * The library will throw an error in the value to update is invalid
 * according to the device model.
 * <p>
 * <b>Monitor a specific attribute for any value change (that comes from the cloud):</b><br>
 * <code>device.maxThreshold.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , oldValue: ...}</code>.
 * To tell the cloud that the attribute update has failed
 * an error must be thrown in the onChange function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor a specific action that was requested from the server:</b><br>
 * <code>device.reset.onAction = function (value);</code><br>
 * where value is an optional parameter given if the action has parameters
 * defined in the device model. To tell the cloud that an action has failed
 * an error must be thrown in the onAction function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor all attributes for any value change (that comes from the cloud):</b><br>
 * <code>device.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object with array type properties of the form
 * <code>[{attribute: ... , newValue: ... , oldValue: ...}]</code>.
 * To tell the cloud that the attribute update has failed
 * an error must be thrown in the onChange function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor all update errors:</b><br>
 * <code>device.onError = function (errorTuple);</code><br>
 * where errorTuple is an object with array type properties (besides errorResponse) of the form
 * <code>{attributes: ... , newValues: ... , tryValues: ... , errorResponse: ...}</code>.
 * <p>
 * <b>Raising alerts:</b><br>
 * <code>let alert = device.createAlert('urn:com:oracle:iot:device:temperature_sensor:too_hot');</code><br>
 * <code>alert.fields.temp = 100;</code><br>
 * <code>alert.fields.maxThreshold = 90;</code><br>
 * <code>alert.raise();</code><br>
 * If an alert was not sent the error is handled by the device.onError handler where errorTuple has
 * the following structure:<br>
 * <code>{attributes: ... , errorResponse: ...}</code><br>
 * where attributes are the alerts that failed with fields already set, so the alert can be retried
 * only by raising them.
 * <p>
 * <b>Sending custom data fields:</b><br>
 * <code>let data = device.createData('urn:com:oracle:iot:device:motion_sensor:rfid_detected');</code><br>
 * <code>data.fields.detecting_motion = true;</code><br>
 * <code>data.submit();</code><br>
 * If the custom data fields were not sent, the error is handled by the device.onError handler where errorTuple has
 * the following structure:<br>
 * <code>{attributes: ... , errorResponse: ...}</code><br>
 * where attributes are the Data objects that failed to be sent with fields already set, so the Data objects can be retried
 * only by sending them.
 * <p>
 * A VirtualDevice can also be created with the appropriate
 * parameters from the DirectlyConnectedDevice.
 *
 * @param {string} endpointId - The endpoint ID of this device.
 * @param {object} deviceModel - The device model object holding the full description of that device
 *        model that this device implements.
 * @param {iotcs.device.DirectlyConnectedDevice} client - The device client used as message
 *        dispatcher for this virtual device.
 *
 * @see {@link DirectlyConnectedDevice#getDeviceModel|iotcs.device.DirectlyConnectedDevice#getDeviceModel}
 * @see {@link DirectlyConnectedDevice#createVirtualDevice|iotcs.device.DirectlyConnectedDevice#createVirtualDevice}
 *
 * @alias iotcs.device.VirtualDevice
 * @class iotcs.device.VirtualDevice
 * @extends iotcs.AbstractVirtualDevice
 * @memberof iotcs.device
 */
iotcs.device.VirtualDevice = class extends iotcs.AbstractVirtualDevice {
    constructor(endpointId, deviceModel, dcd) {
        super(endpointId, deviceModel);
        // Instance "variables"/properties...see constructor.
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');
        _mandatoryArg(dcd, iotcs.device.DirectlyConnectedDevice);

        // The device client used as a message dispatcher for this virtual device.
        /** @type {DirectlyConnectedDevice} */
        this._dcd = dcd;

        let persistenceStore = iotcs.device.impl.PersistenceStoreManager._get(endpointId);
        this._devicePolicyManager = new iotcs.device.impl.DevicePolicyManager(dcd);

        if (this._devicePolicyManager) {
            persistenceStore
                ._openTransaction()
                ._putOpaque('DevicePolicyManager', this._devicePolicyManager)
                ._commit();
        }

        // actionCallbackMap is a mapping from action name to a callback.
        /** @type {Map<string, function>} */
        this._actionCallbackMap = undefined;
        // callableMap is a mapping from action name to an oracle.iot.client.device.VirtualDevice.Callable.
        /** @type {Map<string, function>} */
        this._callableMap = new Map();
        // DJM: This references a class function inside the constructor...is this OK?
        this._attributeMap = this._createAttributeMap(this, deviceModel);
        this._messageDispatcher = new iotcs.device.util.MessageDispatcher(this._dcd._internalDev);
        let messageDispatcher = this._messageDispatcher; // TODO: fix references to local dispatcher.
        this._attributes = this;

        // The key is the set of attributes that are referred to in the computedMetric formula.
        // The value is the attribute that is computed.
        /** @type {Set<Pair<Set<string>, string>>} */
        this._computedMetricTriggerMap = new Set();
        /** @type {DevicePolicyManager} */
        this._devicePolicyManager =
            iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(endpointId);
        this._devicePolicyManager._addChangeListener(this);
        // Millisecond time in the future at which the policy value should be computed.
        /** @type {number} */
        this._expiry = 0;
        // {Map<string, Set<Map<string, object>>>}
        this._pipelineDataCache = new Map();
        // { attributeName : pipelineIndex }
        /** @type {Map<string, number>} */
        this._pipelineIndices = new Map();
        // Window based policy support (as in "window", not Windows OS). Have one scheduled task for
        // each policy "slide" value. The slide value is how much to move the window, so we want to run
        // the policy when the slide expires. When the slide expires, the runnable will call back each
        // VirtualDeviceAttribute that has a policy for that slide value.
        // Window and slide are the key.
        // { {window,slide} : ScheduledPolicyData }
        /** @type {Map<ScheduledPolicyDataKey, ScheduledPolicyData>} */
        this._scheduledPolicies = new Map();
        // How much the window moves is used to calculate expiry.
        /** @type {number} */
        this._slide = 0;
        /** @type {TimedPolicyThread} */
        this._timedPolicyThread = new iotcs.device.impl.TimedPolicyThread(this);

        let self = this;

        let attributeHandler = requestMessage => {
            let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

            if (!method || (method !== 'PUT')) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                  iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
            }

            let urlAttribute =
                requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

            if ((urlAttribute in self._attributes) &&
                (self._attributes[urlAttribute] instanceof iotcs.device.impl.Attribute))
            {
                try {
                    let attribute = self._attributes[urlAttribute];
                    let data = null;
                    let isDone = false;

                    try {
                        data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                          iotcs.StatusCode.BAD_REQUEST, '');
                    }

                    let oldValue = attribute.value;

                    if (!data ||
                        (typeof data.value === 'undefined') ||
                        !attribute._isValidValue(data.value))
                    {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                          iotcs.StatusCode.BAD_REQUEST, '');
                    }

                    // DJM: Lexical this OK here?
                    this.attribute._getNewValue(data.value, self, (attributeValue, isSync) => {
                        let onChangeTuple = {
                            attribute: attribute,
                            newValue: attributeValue,
                            oldValue: oldValue
                        };

                        if (attribute.onChange) {
                            attribute.onChange(onChangeTuple);
                        }

                        if (self.onChange) {
                            self.onChange([onChangeTuple]);
                        }

                        attribute._remoteUpdate(attributeValue);
                        let message = new iotcs.message.Message();

                        message
                            .type(iotcs.message.Message.Type.DATA)
                            .source(this.getEndpointId())
                            .format(this.deviceModel.urn + ":attributes");

                        message.dataItem(urlAttribute, attributeValue);
                        messageDispatcher.queue(message);

                        if (isSync) {
                            isDone = true;
                        } else {
                            messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage,
                                                                                                iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                        }
                    });

                    if (isDone) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                          '');
                    } else {
                        return iotcs.message.Message.buildResponseWaitMessage();
                    }
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                      iotcs.StatusCode.BAD_REQUEST, '');
                }
            } else {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                  '');
            }
        };

        let attributes = self._deviceModel.attributes;

        for (let indexAttr in attributes) {
            let attribute = new iotcs.device.impl.Attribute(attributes[indexAttr]);

            if (attributes[indexAttr].alias) {
                iotcs.AbstractVirtualDevice._link(attributes[indexAttr].alias, this, attribute);
                messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                                'deviceModels/' + self._deviceModel.urn + '/attributes/' +
                                                                                attributes[indexAttr].alias, attributeHandler);
            }

            iotcs.AbstractVirtualDevice._link(attributes[indexAttr].name, this, attribute);
            messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                            'deviceModels/' + self._deviceModel.urn + '/attributes/' + attributes[indexAttr].name,
                                                                            attributeHandler);
        }

        this._actions = this;

        /**
         * Function which handles action requests from the server.
         *
         * @param {iotcs.message.Message} requestMessage - The message containing the action
         *        information.
         * @returns {iotcs.message.Message} - A response message with the results of invoking the
         *          action.
         */
        let actionHandler = requestMessage => {
            let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
            let actionName =
                requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

            if (!method || (method !== 'POST')) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                  'Method Not Allowed.', '');
            }

            /** @typeof {object} JSON object. */
            let action = this._actions[actionName];

            if ((actionName in this._actions) &&
                (action instanceof iotcs.device.impl.ActionSpec) &&
                action.onAction)
            {
                try {
                    let action = this._actions[actionName];
                    /** @type {Map<string, object>} */
                    let actionArgs = [];
                    let data = null;
                    let isDone = false;

                    /**
                     * If argType is available, we have a legacy single-argument action.  If args is
                     * available, we have a new multi-argument action. 
                     */
                    if ((action._spec.argType)  || (action._spec.args)) {
                        try {
                            data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                        } catch (e) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN,
                                {}, 'Bad Request.', '');
                        }

                        if (!data) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN,
                                {}, iotcs.StatusCode.BAD_REQUEST, '');
                        }
                    } else {
                        // No-argument action.
                        data = {};
                    }

                    let dataLength = Object.keys(data).length;

                    if (dataLength === 1) {
                        // Single-argument action.
                        actionArgs.push(data);
                    } else if (dataLength > 1) {
                        // Multiple-arguments action.
                        // Dates need to be special-cased.
                        for (const key of Object.keys(data)) {
                            let arg;

                            for (let a of action._spec.args) {
                                if (key === a.name) {
                                    arg = a;
                                    break;
                                }
                            }

                            let value;

                            if (arg.type === 'DATETIME') {
                                value = new Date(parseInt(data[key]));
                            } else {
                                value = data[key];
                            }

                            actionArgs.push({'key': key, 'value': value});
                        }
                    }

                    if (actionArgs.length === 0) {
                        action._validateArgument(undefined, undefined, self,
                                                 (argName, argValue, virtualDevice, isSync) => {
                                                     let actionEvent = new iotcs.impl.ActionEvent(self, actionName);
                                                     action.onAction(actionEvent);

                                                     if (isSync) {
                                                         isDone = true;
                                                     } else {
                                                         messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                             requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                     }
                                                 });
                    } else if (actionArgs.length === 1) {
                        // Single action argument validation.
                        action._validateArgument(actionArgs[0].key, actionArgs[0].value, self,
                                                 (argName, argValue, virtualDevice, isSync) => {
                                                     let namedValue = new iotcs.impl.NamedValue(argName, argValue);
                                                     let actionEvent = new iotcs.impl.ActionEvent(virtualDevice, actionName, namedValue);
                                                     action.onAction(actionEvent);

                                                     if (isSync) {
                                                         isDone = true;
                                                     } else {
                                                         messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                             requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                     }
                                                 });
                    } else {
                        // Multiple action argument validation.
                        action._validateArguments(actionArgs, self,
                                                  (args, virtualDevice, isSync) => {
                                                      let namedValue = undefined;
                                                      let firstNamedValue = undefined;

                                                      // Create NamedValue objects for all args in the order they appear in
                                                      // the device model.
                                                      for (let i = 0; i < action._spec.args.length; i++) {
                                                          let specArgName = action._spec.args[i].name;

                                                          /** @typeof {object[]} */
                                                          for (let arg of args) {
                                                              if (arg.key === specArgName) {
                                                                  let nv = new iotcs.impl.NamedValue(arg.key, arg.value);

                                                                  if (namedValue) {
                                                                      namedValue.setNext(nv);
                                                                      namedValue = nv;
                                                                  } else {
                                                                      firstNamedValue = namedValue = nv;
                                                                  }

                                                                  break;
                                                              }
                                                          }
                                                      }

                                                      let actionEvent = new iotcs.impl.ActionEvent(virtualDevice, actionName,
                                                                                        firstNamedValue);

                                                      action.onAction(actionEvent);

                                                      if (isSync) {
                                                          isDone = true;
                                                      } else {
                                                          messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                              requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                      }
                                                  });
                    }

                    if (isDone) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                          '');
                    } else {
                        return iotcs.message.Message.buildResponseWaitMessage();
                    }
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.INTERNAL_SERVER_ERROR, {},
                                                                      iotcs.StatusCode.INTERNAL_SERVER_ERROR, '');
                }
            } else {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                  '');
            }
        };

        let actions = this._deviceModel.actions;

        for (let indexAction in actions) {
            let actionSpec = new iotcs.device.impl.ActionSpec(actions[indexAction]);

            if (actions[indexAction].alias) {
                iotcs.AbstractVirtualDevice._link(actions[indexAction].alias, this._actions, actionSpec);

                messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                                'deviceModels/' + this._deviceModel.urn + '/actions/' + actions[indexAction].alias,
                                                                                actionHandler);
            }

            iotcs.AbstractVirtualDevice._link(actions[indexAction].name, this._actions, actionSpec);

            messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                            'deviceModels/' + this._deviceModel.urn + '/actions/' + actions[indexAction].name,
                                                                            actionHandler);
        }

        if (this._deviceModel.formats) {
            this._alerts = this;
            this._dataFormats = this;

            // DJM: Lexeical this OK here?
            this._deviceModel.formats.forEach(format => {
                if (format.type && format.urn) {
                    if (format.type === 'ALERT') {
                        this._alerts[format.urn] = format;
                    }

                    if (format.type === 'DATA') {
                        this._dataFormats[format.urn] = format;
                    }
                }
            });
        }

        messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId, 'deviceModels/' +
            this._deviceModel.urn + '/attributes', requestMessage =>
            {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

                if (!method || (method !== 'PATCH')) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                      iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }

                if (this.onChange) {
                    try {
                        let data = null;

                        try {
                            data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                        } catch (e) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                              iotcs.StatusCode.BAD_REQUEST, '');
                        }

                        if (!data) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                              iotcs.StatusCode.BAD_REQUEST, '');
                        }
                        
                        let tupleArray = [];
                        let index = 0;
                        let isDoneForEach = new Array(Object.keys(data).length);
                        isDoneForEach.fill(false);

                        Object.keys(data).forEach(attributeName => {
                            let attribute = this._attributes[attributeName];

                            if (!attribute) {
                                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                                  iotcs.StatusCode.BAD_REQUEST, '');
                            }

                            let oldValue = attribute.value;

                            if (!attribute._isValidValue(data[attributeName])) {
                                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                                  iotcs.StatusCode.BAD_REQUEST, '');
                            }

                            attribute._getNewValue(data[attributeName], this,
                                (attributeValue, isSync) =>
                            {
                                let onChangeTuple = {
                                    attribute: attribute,
                                    newValue: attributeValue,
                                    oldValue: oldValue
                                };

                                if (attribute.onChange) {
                                    attribute.onChange(onChangeTuple);
                                }

                                tupleArray.push(onChangeTuple);

                                if (isSync) {
                                    isDoneForEach[index] = true;
                                }

                                if (++index === Object.keys(data).length) {
                                    // Run after last attribute handle.
                                    this._onChange(tupleArray);

                                    let message = new iotcs.message.Message();

                                    message
                                        .type(iotcs.message.Message.Type.DATA)
                                        .source(this.getEndpointId())
                                        .format(this._deviceModel.urn + ":attributes");

                                    Object.keys(data).forEach(attributeName1 => {
                                        let attribute1 = this._attributes[attributeName1];

                                        let attributeValue1 = tupleArray.filter(tuple => {
                                            return tuple.attribute === attribute1;
                                        }, attribute1)[0].newValue;

                                        attribute1._remoteUpdate(attributeValue1);
                                        message.dataItem(attributeName1, attributeValue1);
                                    });

                                    messageDispatcher.queue(message);
                                    // one of async attribute handle will be the last
                                    // check if at least one async attribute handle was called
                                    if (isDoneForEach.indexOf(false) !== -1) {
                                        messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                    }
                                }
                            });
                        });

                        if (isDoneForEach.indexOf(false) === -1) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                              '');
                        } else {
                            return iotcs.message.Message.buildResponseWaitMessage();
                        }
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.INTERNAL_SERVER_ERROR, {},
                                                                          iotcs.StatusCode.INTERNAL_SERVER_ERROR, '');
                    }
                } else {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                      '');
                }
            });

        // seal object
        Object.preventExtensions(this);
        this._dcd._addVirtualDevice(this);
    }

    // Private/protected functions
    /**
     * @ignore
     *
     * @param {number} window
     * @param {number} slide
     * @param {number} timeZero
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _addScheduledPolicy(window, slide, timeZero, attributeName, pipelineIndex) {
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy called.');
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy window = ' + window);
        /** @type {ScheduledPolicyDataKey} */
        const key = new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
        /** @type {ScheduledPolicyData} */
        let scheduledPolicyData = this._scheduledPolicies.get(key);
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy scheduledPolicyData = ' +
                        scheduledPolicyData);

        if (!scheduledPolicyData) {
            scheduledPolicyData =
                new iotcs.device.impl.ScheduledPolicyData(window, slide, timeZero);
            this._scheduledPolicies.set(key, scheduledPolicyData);
            this._timedPolicyThread._addTimedPolicyData(scheduledPolicyData);

            if (!this._timedPolicyThread._isAlive() && !this._timedPolicyThread._isCancelled()) {
                this._timedPolicyThread._start();
            }
        }

        scheduledPolicyData._addAttribute(attributeName, pipelineIndex);
    }

    /**
     * Invoke an action callback.
     *
     * @param {string} actionName - The name of the action from the device model.
     * @param {Map<string, *>} argumentValues - A map of argument names to values.
     * @return a success or failure status code.
     */
    _callImpl(actionName, argumentValues) {
        // If actionCallbackMap has the action name or "*" (all actions), or if callableMap (legacy)
        // contains the action name, then handle the action.
        /** @type {function} */
        const specificActionCallback =
              this._actionCallbackMap ? this._actionCallbackMap.get(actionName) : null;
        /** @type {function} */
        const allActionsCallback =
              this._actionCallbackMap ? this._actionCallbackMap.get("*") : null;
        /** @type {function} */
        const callable = this._callableMap ? this._callableMap.get(actionName) : null;

        if (!specificActionCallback && !allActionsCallback && !callable) {
            return StatusCode.NOT_IMPLEMENTED;
            //DJM: Where does requestMessage come from?
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST,
                                                            '');
        }

        try {
            /** @type {DeviceModelAction} */
            // DJM: Where is this function?  There is enterprise.Action.getDeviceModelAction...is
            //      this what we want?...wrong package if so.
            // DJM: Where is base defined?
            const deviceModelAction = Action.getDeviceModelAction(base.getDeviceModel(), actionName);

            if (!deviceModelAction) {
                return StatusCode.BAD_REQUEST;
            }

            /** @type {NamedValue} */
            const args = this._getActionArguments(deviceModelAction, argumentValues);

            /** @type {ActionEvent} */
            const actionEvent = new ActionEvent(this, actionName, args);

            if (specificActionCallback) {
                specificActionCallback.onAction(actionEvent);
            }

            if (allActionsCallback) {
                allActionsCallback.onAction(actionEvent);
            }

            if (callable) {
                /** @type {object} */
                const data = args ? args.getValue() : null;
                callable.call(this, data);
            }
            return StatusCode.ACCEPTED;
        } catch (error) {
            // The call method may throw errors. Since the client library has no knowledge of what these
            // might be, the Error is caught here.
            console.log(this.getEndpointId() + " : Call  : " + error);
            return StatusCode.BAD_REQUEST;
        }
    }

    /**
     * @ignore
     *
     * @param {Set<string>} updatedAttributes
     * @return {Set<string>}
     */
    _checkComputedMetrics(updatedAttributes) {
        if (!updatedAttributes || (updatedAttributes.size === 0)) {
            return new Set();
        }

        if (this._computedMetricTriggerMap.size === 0) {
            return new Set();
        }

        // This will be the set of attributes that have computed metrics
        // that are triggered by the set of updated attributes.
        /** @type {Set<string>} */
        let computedAttributes = new Set();

        // key is @type {Set<string>}, value is @type {string}.
        this._computedMetricTriggerMap.forEach((value, key) => {
            // If the set of attributes that the formula refers to
            // is a subset of the updated attributes, then compute
            // the value of the attribute.
            if (key.every(val => updatedAttributes.has(val))) {
                computedAttributes.add(value);
            }
        });

        if (computedAttributes.size > 0) {
            /** @type {Iterator<string>} */
            let computedAttributesAry = Array.from(computedAttributes.entries());

            for (let i = computedAttributesAry.length - 1; i > 0; i--) {
                /** @type {string} */
                const attributeName = computedAttributesAry[i];
                const attribute = this.getAttribute(attributeName);

                if (!attribute.isSettable()) {
                    iotcs.impl.Platform._debug('Attempt to modify read-only attribute "' + attributeName + '"');
                    computedAttributes.delete(attributeName);
                    continue;
                }

                /** @type {DevicePolicy} */
                // DJM: Where does endpointId come from?
                const devicePolicy = this._devicePolicyManager._getPolicy(this._deviceModel.urn,
                                                                          endpointId);

                if (!devicePolicy) {
                    continue;
                }

                /** @type {Set<DevicePolicyFunction>} */
                const pipeline = devicePolicy._getPipeline(attributeName);

                if (!pipeline || (pipeline.size === 0)) {
                    continue;
                }

                /** @type {Set<Map<string, object>>} */
                const pipelineData = this._getPipelineData(attributeName);

                // offer0 returns true if the attribute was set. If the attribute was not set,
                // then remove the attribute name from the list of attributesToCompute.
                /** @type {object} */
                const policyValue = this._offer0(attribute._getDeviceModelAttribute(),
                                                 attribute.get(), pipeline, pipelineData);

                if (policyValue) {
                    iotcs.impl.Platform._debug(endpointId + ' : Set   : ' + attributeName + '" = ' +
                                    policyValue);
                    attribute._update(policyValue);
                } else {
                    computedAttributesAry.splice(i, 1);
                }

                computedAttributes = new Set(computedAttributesAry);
            }
        }

        return computedAttributes;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {DeviceModel} deviceModel
     * @return {Map<string, iotcs.device.impl.VirtualDeviceAttribute>}
     */
    _createAttributeMap(virtualDevice, deviceModel) {
        /** @type {Map<string, iotcs.device.impl.VirtualDeviceAttribute<VirtualDevice, object>>} */
        const map = new Map();
        const deviceModelObj = iotcs.impl.DeviceModelParser._fromJson(deviceModel);

        deviceModelObj._getDeviceModelAttributes().forEach((attribute, attributeName) => {
            let vda = new iotcs.device.impl.VirtualDeviceAttribute(virtualDevice, attribute);
            map.set(attributeName, vda);
            /** @type {string} */
            let alias = attribute._getName();

            if (alias && (alias.length > 0)) {
                map.set(alias, vda);
            }
        });

        return map;
    }

    /**
     * Return the arguments of the device model action as a NamedValue chain. The name/value
     * pairs in the chain are in the same order as they appear in the device model action.
     * All arguments are returned. If there is no value for an argument in the JSON body,
     * the argument's default value is used.
     *
     * @param {DeviceModelAction } action - The action.
     * @param {Map<string,*>} argumentValues - The arguments as a JSON map.
     * @return {iotcs.impl.NamedValue} The root node of the NamedValue chain, or <code>null</code> if there are no
     *         arguments.
     */
    _getActionArguments(action, argumentValues) {
        // Multiple arguments for the callback are passed as a chain of NameValue's.  'args' is the
        //root of the NamedValue chain.
        /** @type {iotcs.impl.NamedValue} */
        let args = null;

        /** @type {string} */
        const actionName = action._getName();
        /** @type {DeviceModelActionArgument[]} */
        const deviceModelActionArguments = action.getArguments();

        if (deviceModelActionArguments && (deviceModelActionArguments.length > 0)) {
            // The current argument in the chain.
            /** @type {iotcs.impl.NamedValue} */
            let arg = null;

            // For each argument in the action, get the argument value from the JSON body and add it to
            // the value to 'arguments'.
            /** @type {DeviceModelActionArgument} */
            for (let actionArg of deviceModelActionArguments) {
                /** @type {string} */
                const argName = actionArg._getName();
                /** @type {*} */
                const argValue = argumentValues.has(argName) ?
                      argumentValues.get(argName) : actionArg._getDefaultValue();

                try {
                    if (typeof argValue === 'number') {
                        /** @type {number} */
                        const upperBound = actionArg._getUpperBound();

                        if (upperBound) {
                            if (argValue > upperBound) {
                                iotcs.error("argument '" + argName + "' to device model '" +
                                          this.getDeviceModel()._getUrn() + "' action '" +
                                          actionName + "' out of range: " + argValue + " > " +
                                          upperBound);
                            }
                        }

                        /** @type {number} */
                        const lowerBound = actionArg.getLowerBound();

                        if (lowerBound) {
                            if (argValue < lowerBound) {
                                iotcs.error(this.getDeviceModel()._getUrn() + "argument '" + argName +
                                          "' to device model '" + this.getDeviceModel().getUrn() +
                                          "' action '" + actionName + "' out of range: " + argValue +
                                          " < " + lowerBound);
                            }
                        }
                    }
                } catch (error) {
                    iotcs.error(action._getName() + " argument " + argName + " bad value: " +
                              argValue);
                }

                /** @type {iotcs.impl.NamedValue} */
                const namedValue = new iotcs.impl.NamedValue(argName, value);

                if (arg) {
                    arg._setNext(namedValue);
                    arg = namedValue;
                } else {
                    arg = args = namedValue;
                }
            }
        }

        return args;
    }

    /**
     * @ignore
     *
     * @param {string} attributeName
     * @return {VirtualDeviceAttribute}
     */
    _getAttribute(attributeName) {
        /** @type {VirtualDeviceAttribute} */
        const virtualDeviceAttribute = this._attributeMap.get(attributeName);

        if (!virtualDeviceAttribute) {
            throw new Error('No such attribute "' + attributeName +
                            '".\n\tVerify that the URN for the device model you created ' +
                            'matches the URN that you use when activating the device in ' +
                            'the Java application.\n\tVerify that the attribute name ' +
                            '(and spelling) you chose for your device model matches the ' +
                            'attribute you are setting in the Java application.');
        }

        return virtualDeviceAttribute;
    }

    /**
     * Returns the pipeline data for the specified attribute.
     *
     * @ignore
     *
     * @param {string} attribute
     * @param {function} callback
     * @return {Set<Map<string, object>>} the pipeline.
     */
    _getPipelineData(attribute, callback) {
        iotcs.impl.Platform._debug('VirtualDevice._getPipelineData called.');
        this._devicePolicyManager._getPolicy(this.getDeviceModel().urn, this.getEndpointId())
            .then(devicePolicy =>
                  {
                      if (!devicePolicy) {
                          callback(new Set());
                      }

                      let pipeline = devicePolicy._getPipeline(attribute);

                      if (!pipeline || (pipeline.size === 0)) {
                          callback(new Set());
                      }

                      // {Set<Map<string, object>>}
                      let pipelineData = this._pipelineDataCache.get(attribute);

                      if (!pipelineData) {
                          pipelineData = new Set();
                          this._pipelineDataCache.set(attribute, pipelineData);
                      }

                      // Create missing function maps.
                      if (pipelineData.size < pipeline.size) {
                          // Create missing function data maps.
                          for (let n = pipelineData.size, nMax = pipeline.size; n < nMax; n++) {
                              pipelineData.add(new Map());
                          }
                      }

                      callback(pipelineData);
                  }).catch(error => {
                      console.log('Error getting device policy: ' + error);
                  });
    }

    _handleStorageObjectStateChange(storage) {
        this._messageDispatcher._removeStorageDependency(storage);
    }

    /**
     * The main logic for handling a policy pipeline.
     *
     * @ignore
     *
     * @param {iotcs.impl.DeviceModelAttribute} attribute
     * @param {object} value
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {Set<Map<string, object>>} pipelineData
     * @return {object} a policy value.
     */
    _offer0(attribute, value, pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._offer0 called.');
        let attributeName = attribute._getName();
        let policyValue = value;

        if (pipeline && (pipeline.size > 0)) {
            iotcs.impl.Platform._debug('VirtualDevice._offer0 we have a pipeline, size = ' + pipeline.size);
            iotcs.device.impl.DeviceFunction.putInProcessValue(this.endpointId,
                                                                       this._deviceModel.urn,
                                                                       attributeName,
                                                                       policyValue);

            let pipelineAry = Array.from(pipeline);
            let pipelineDataAry = Array.from(pipelineData);

            for (let index = 0, maxIndex = pipelineAry.length; index < maxIndex; index++) {
                let devicePolicyFunction = pipelineAry[index];
                iotcs.impl.Platform._debug('VirtualDevice._offer0 devicePolicyFunction = ' +
                                devicePolicyFunction);

                /** @type {Map<string, object>} */
                let functionData;

                if (index < pipelineData.size) {
                    functionData = pipelineDataAry[index];
                } else {
                    functionData = new Map();
                    pipelineData.add(functionData);
                }

                /** @type {string} */
                const key = devicePolicyFunction._getId();
                /** @type {Map<string, object>} */
                const parameters = devicePolicyFunction._getParameters();
                /** @type {DeviceFunction} */
                const deviceFunction =
                      iotcs.device.impl.DeviceFunction._getDeviceFunction(key);
                iotcs.impl.Platform._debug('VirtualDevice.offer0 deviceFunction = ' + deviceFunction);

                if (!deviceFunction) {
                    continue;
                }

                if (deviceFunction._apply(this, attributeName, parameters, functionData,
                                          policyValue))
                {
                    iotcs.impl.Platform._debug('VirtualDevice._offer0 in deviceFunction.apply.');

                    /** @type {object} */
                    let valueFromPolicy = deviceFunction.get(this, attributeName, parameters,
                                                             functionData);

                    if (valueFromPolicy) {
                        policyValue = valueFromPolicy;

                        iotcs.device.impl.DeviceFunction._putInProcessValue(endpointId,
                            this._deviceModel.urn, attributeName, policyValue);
                    } else {
                        iotcs.impl.Platform._debug(attributeName + ' got null value from policy.' +
                                       deviceFunction._getDetails(parameters));

                        return null;
                    }
                } else {
                    iotcs.impl.Platform._debug('VirtualDevice._offer0 in deviceFunction.apply else.');

                    if (deviceFunction._getId().startsWith("filter")) {
                        iotcs.impl.Platform._debug('VirtualDevice: ' + endpointId + ': offer "' +
                                        attributeName + '" = ' + policyValue +
                                        ' rejected by policy "' +
                                        deviceFunction._getDetails(parameters) + '"');
                    }

                    return null;
                }

            }
        }

        return policyValue;
    }

    /**
     * DevicePolicyManager.ChangeListener interface
     *
     * @ignore
     *
     * @param {DevicePolicy} devicePolicy
     * @param {Set<string>} assignedDevices
     */
    _policyAssigned(devicePolicy, assignedDevices) {
        iotcs.impl.Platform._debug('VirtualDevice._policyAssigned called.');

        if (!assignedDevices || !assignedDevices.has(this.endpointId)) {
            return;
        }

        iotcs.impl.Platform._debug(this.endpointId + " : Policy assigned : " + devicePolicy._getId());
        /** @type {number} */
        const timeZero = new Date().getTime();

        devicePolicy._getPipelines().forEach((value, key) => {
            this._policyAssigned2(key, value, timeZero);
        });
    }

    /**
     *
     * @ignore
     *
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} newPipeline
     * @param {number} timeZero
     */
    _policyAssigned2(attributeName, newPipeline, timeZero) {
        iotcs.impl.Platform._debug('VirtualDevice._policyAssigned2 called.');

        if (newPipeline && (newPipeline.size > 0)) {
            /** @type {DevicePolicyFunction[]} */
            let newPipelineAry = Array.from(newPipeline);

            for (let index = 0, indexMax = newPipeline.size; index < indexMax; index++) {
                /** @type {DevicePolicyFunction} */
                const pipelineFunction = newPipelineAry[index];
                /** @type {string} */
                const id = pipelineFunction.getId();
                /** @type {Map<string, object>} */
                const parameters = pipelineFunction._getParameters();
                /** @type {number} */
                const newWindow = iotcs.device.impl.DeviceFunction._getWindow(parameters);

                if (newWindow > -1 && ('eliminateDuplicates' !== id)) {
                    /** @type {number} */
                    const newSlide =
                          iotcs.device.impl.DeviceFunction._getSlide(parameters, newWindow);
                    this._addScheduledPolicy(newWindow, newSlide, timeZero, attributeName, index);
                }

                // If the first policy in the chain is a computed metric,
                // see if it refers to other attributes.
                if ((index === 0) && ('computedMetric' === id)) {
                    /** @type {string} */
                    const formula = parameters.get('formula');
                    /** @type {Set<string>} */
                    const triggerAttributes = new Set();
                    /** @type {number} */
                    let pos = formula.indexOf('$(');

                    while (pos !== -1) {
                        /** @type {number} */
                        const end = formula.indexOf(')', pos + 1);

                        if ((pos === 0) || (formula.charAt(pos - 1) !== '$$')) {
                            /** @type {string} */
                            const attr = formula.substring(pos + '$('.length, end);

                            if (!attr.equals(attributeName)) {
                                triggerAttributes.add(attr);
                            }
                        }

                        pos = formula.indexOf('$(', end + 1);
                    }

                    if (triggerAttributes.size > 0) {
                        this._computedMetricTriggerMap.add(new iotcs.device.impl.Pair(triggerAttributes, attributeName));
                    }
                }
            }
        }
    }

    /**
     *
     * @ignore
     *
     * @param {DevicePolicy} devicePolicy
     * @param {Set<string>} unassignedDevices
     */
    _policyUnassigned(devicePolicy, unassignedDevices) {
        if (!unassignedDevices || !unassignedDevices.has(this._getEndpointId())) {
            return;
        }

        iotcs.impl.Platform._debug(this._getEndpointId() + " : Policy un-assigned : " + devicePolicy._getId());

        /** @type {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} */
        const updatedAttributes = new Set();

        devicePolicy._getPipelines().forEach((value, key) => {
            this._policyUnassigned2(updatedAttributes, key, value);
        });

        if (updatedAttributes.size > 0) {
            // Call updateFields to ensure the computed metrics get run,
            // and will put all attributes into one data message.
            this._updateFields(updatedAttributes);
        }
    }

    /**
     *
     * @ignore
     *
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} oldPipeline
     */
    _policyUnassigned2(updatedAttributes, attributeName, oldPipeline) {
        if (oldPipeline && (oldPipeline.size > 0)) {
            const oldPipelineAry = Array.from(oldPipeline);
            // The order in which the oldPipeline is finalized is important.
            // First, remove any scheduled policies so they don't get executed. Any
            // pending data will be committed in the next step.
            // Second, commit any "in process" values. This may cause a computedMetric
            // to be triggered.
            // Third, remove any computed metric triggers.
            // Lastly, remove any data for this pipeline from the policy data cache
            for (let index = 0, indexMax = oldPipelineAry.length; index < indexMax; index++) {
                /** @type {DevicePolicyFunction} */
                const oldPipelineFunction = oldPipelineAry[index];
                /** @type {string} */
                const id = oldPipelineFunction.getId();
                /** @type {Map<string, object>} */
                const parameters = oldPipelineFunction._getParameters();
                /** @type {number} */
                const window = iotcs.device.impl.DeviceFunction._getWindow(parameters);

                if ((window > -1) && ('eliminateDuplicates' !== id)) {
                    /** @type {number} */
                    const slide =
                          iotcs.device.impl.DeviceFunction._getSlide(parameters, window);
                    this._removeScheduledPolicy(slide, attributeName, index, window);
                }
            }

            // Commit values from old pipeline.
            /** @type {Set<Map<string, object>>} */
            this._getPipelineData(attributeName, pipelineData => {
                if (pipelineData && (pipelineData.size > 0)) {
                    if (iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES !== attributeName) {
                        this._processExpiredFunction2(updatedAttributes, attributeName, oldPipeline,
                                                      pipelineData);
                    } else {
                        this._processExpiredFunction1(oldPipeline, pipelineData);
                    }
                }

                if (attributeName) {
                    // Remove this attribute from the computedMetricTriggerMap.
                    this._computedMetricTriggerMap.forEach(computedMetricTriggerPair => {
                        if (attributeName === computedMetricTriggerPair._getValue()) {
                            this._computedMetricTriggerMap.delete(computedMetricTriggerPair);
                        }
                    });
                }

                // Remove data from cache.
                this._pipelineDataCache.delete(attributeName);
            });
        }
    }

    /**
     * Routine for handling invocation of a policy function when the window's
     * slide expires. This routine gets the value of the function, and then
     * processes the remaining functions in the pipeline (if any).
     *
     * @ignore
     *
     * @param {Set<DevicePolicyFunction>} pipeline
     * @param {Map<string, object>} pipelineData
     */
    _processExpiredFunction1(pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._processExpiredFunction1 called.');

        if (!pipeline || pipeline.size === 0) {
            return;
        }

        try {
            const pipelineAry = Array.from(pipeline);
            const pipelineDataAry = Array.from(pipelineData);
            /** @type {DevicePolicyFunction} */
            const devicePolicyFunction = pipelineAry[0];
            /** @type {string} */
            const functionId = devicePolicyFunction.getId();
            /** @type {Map<string, object>} */
            const config = devicePolicyFunction.getParameters();
            /** @type {Map<string, object>} */
            const data = pipelineDataAry[0];
            /** @type {DeviceFunction} */
            const deviceFunction =
                  iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                console.log('Device function "' + functionId + '" not found.');
                return;
            }

            /** @type {object} */
            let value = deviceFunction._get(this, null, config, data);

            if (value && (pipeline.size > 1)) {
                // Process remaining policies in the pipeline.
                value = this._offer0(null, value, pipeline.subList(1, pipeline.size),
                                     pipelineData.subList(1, pipelineData.size));
            }

            if (value) {
                /** @type {Set<Pair<Message, StorageObjectImpl>>} */
                const pairs = value;

                if (pairs.size === 0) {
                    return;
                }

                /** @type {Message[]} */
                let messages = new Array(pairs.size);

                for (let n = 0, nMax = pairs.size; n < nMax; n++) {
                    /** @type {Pair<Message, StorageObjectImpl>} */
                    const messagePair = pairs.get(n);
                    messages[n] = messagePair._getKey();
                    /** @type {StorageObject} */
                    const storageObject = messagePair._getValue();

                    if (storageObject) {
                        this._messageDispatcher._addStorageObjectDependency(storageObject,
                            messages[n]._getClientId());

                        storageObject.sync();
                    }
                }

                this._messageDispatcher.queue(messages);

            }
        } catch (error) {
            console.log('Error occurred: ' + error);
        }
    }

    /**
     * Routine for handling invocation of a policy function when the window's
     * slide expires. This routine gets the value of the function, and then
     * processes the remaining functions in the pipeline (if any).
     *
     * @ignore
     *
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} updatedAttributes
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} pipeline
     * @param {Set<Map<string, object>>} pipelineData
     */
    _processExpiredFunction2(updatedAttributes, attributeName, pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._processExpiredFunction2 called.');

        if (!pipeline || (pipeline.size === 0)) {
            return;
        }

        try {
            // Convert the pipeline and pipeline data Sets to arrays so we can index from them.
            let pipelineDataAry = Array.from(pipelineData);
            let pipelineAry = Array.from(pipeline);
            /** @type {VirtualDeviceAttribute} */
            const attribute = this._getAttribute(attributeName);
            /** @type {DeviceModelAttribute} */
            const deviceModelAttribute = attribute._getDeviceModelAttribute();
            /** @type {DevicePolicyFunction} */
            const devicePolicyFunction = pipelineAry[0];
            /** @type {string} */
            const functionId = devicePolicyFunction._getId();
            /** @type {Map<string, object>} */
            const config = devicePolicyFunction._getParameters();
            /** @type {Map<string, object>} */
            const data = pipelineDataAry[0];
            /** @type {DeviceFunction} */
            const deviceFunction =
                  iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                console.log('Device function "' + functionId + '" not found.');
                return;
            }

            /** @type {object} */
            let value = deviceFunction._get(null, attributeName, config, data);

            if (value && pipeline.size > 1) {
                // Process remaining policies in the pipeline.
                value = this._offer0(deviceModelAttribute, value, pipeline.subList(1, pipeline.size),
                                    pipelineData.subList(1, pipelineData.size));
            }

            if (value) {
                /** @type {object} */
                let policyValue = value;

                if (policyValue) {
                    iotcs.impl.Platform._debug('VirtualDevice.processExpiredFunction 2 adding to updatedAttributes:"' +
                                    attributeName + '" = ' + policyValue);
                    updatedAttributes.add(new iotcs.device.impl.Pair(attribute, policyValue));
                }
            }
        } catch (error) {
            console.log('Error occurred: ' + error);
        }
    }

    /**
     * Called from updateFields.
     *
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     *
     * @ignore
     */
    _processOnChange1(updatedAttributes) {
        if (updatedAttributes.size === 0) {
            return;
        }

        /** @type {Set<VirtualDeviceAttribute>} */
        const keySet = new Set();
        let dataMessage = new iotcs.message.Message();
        dataMessage.type(iotcs.message.Message.Type.DATA);
        let storageObject = new iotcs.device.impl.WritableValue();

        // Use for here so we can break out of the loop.
        /** @type {Pair<VirtualDeviceAttribute, object>} */
        for (let entry of updatedAttributes) {
            /** @type {VirtualDeviceAttribute} */
            const attribute = entry.getKey();
            keySet.add(attribute);
            /** @type {object} */
            const newValue = entry.getValue();

            try {
                this._processOnChange2(dataMessage, attribute, newValue, storageObject);
            } catch(error) {
                console.log(error);
                break;
            }
        }

        dataMessage.type(iotcs.message.Message.Type.DATA);

        try {
            this._queueMessage(dataMessage, storageObject._getValue());
        } catch(error) {
            console.log('Message queue error: ' + error);
        }
    }

    /**
     *
     * @ignore
     *
     * @param {iotcs.message.Message} dataMessage
     * @param {VirtualDeviceAttribute} virtualDeviceAttribute
     * @param {object} newValue
     * @param {WritableValue} storageObject
     */
    _processOnChange2(dataMessage, virtualDeviceAttribute, newValue, storageObject) {
        /** @type {DeviceModelAttribute} */
        const deviceModelAttribute = virtualDeviceAttribute._getDeviceModelAttribute();
        /** @type {string} */
        const attributeName = deviceModelAttribute._getName();

        dataMessage
            .format(this._deviceModel.urn + ":attributes")
            .source(this.endpointId);

        switch (deviceModelAttribute.getType()) {
        case 'INTEGER':
        case 'NUMBER':
        case 'STRING':
            dataMessage.dataItem(attributeName, newValue);
            break;
        case 'URI':
            if (newValue instanceof iotcs.device.impl.StorageObject) {
                if ((newValue.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC) ||
                    (newValue.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING))
                {
                    storageObject._setValue(newValue);
                }

                newValue._setSyncEventInfo(this, attributeName);
            }

            dataMessage.dataItem(attributeName, newValue.getUri());
            break;
        case 'DATETIME':
            if (newValue instanceof Date) {
                dataMessage.dataItem(attributeName, newValue.getTime());
            } else if (newValue instanceof Number) {
                dataMessage.dataItem(attributeName, newValue);
            }

            break;
        default:
            console.log('Unknown attribute type: ' + deviceModelAttribute.getType());
            throw new Error("Unknown attribute type " + deviceModelAttribute.getType());
        }
    }

    /**
     *
     * @ignore
     *
     * @param {Message} message
     * @param {StorageObject} storageObject
     */
    _queueMessage(message, storageObject) {
        /** @type {Pair<Message,StorageObjectImpl>} */
        const pair = new iotcs.device.impl.Pair(message, storageObject);
        /** @type {Array.Pair<Message, StorageObjectImpl>} */
        let pairs = [];
        pairs.push(pair);

        /** @type {string} */
        const deviceModelUrn = this._deviceModel.urn;
        const self = this;

        /** @type {DevicePolicy} */
        this._devicePolicyManager._getPolicy(this._deviceModel.urn, this.endpointId).then(
            devicePolicy =>
        {
            // Handling of device model level policies here...
            if (devicePolicy &&
                devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES))
            {
                // Some policies are negated by an alert of a given severity
                // (batching policies, for example)
                /** @type {AlertMessage.Severity} */
                let alertMessageSeverity = null;

                if (message._properties.type === iotcs.message.Message.Type.ALERT) {
                    /** @type {AlertMessage} */
                    alertMessageSeverity = message.getSeverity();
                }

                /** @type {Set<DevicePolicyFunction>} */
                const pipeline =
                      devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);
                /** @type {Set<Map<string, object>>} */
                const pipelineData =
                      this._getPipelineData(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);

                for (let index = 0, maxIndex = pipeline.size; index < maxIndex; index++) {
                    /** @type {DevicePolicyFunction} */
                    const devicePolicyFunction = pipeline.get(index);
                    /** @type {string} */
                    const id = devicePolicyFunction._getId();
                    /** @type {Map<string, object>} */
                    let parameters = devicePolicyFunction._getParameters();
                    /** @type {DeviceFunction} */
                    const deviceFunction =
                          iotcs.device.impl.DeviceFunction._getDeviceFunction(id);

                    if (!deviceFunction) {
                        continue;
                    }

                    /** @type {boolean} */
                    let alertOverridesPolicy;

                    if (alertMessageSeverity) {
                        /** @type {AlertMessage.Severity} */
                        let configuredSeverity = iotcs.message.Message.Type.ALERT.CRITICAL;
                        /** @type {string} */
                        const criterion = parameters.get("alertSeverity");

                        if (criterion) {
                            try {
                                configuredSeverity =  iotcs.message.Message.AlertMessage.Severity.valueOf(criterion);
                            } catch (error) {
                                configuredSeverity = iotcs.message.Message.Type.ALERT.CRITICAL;
                            }
                        }

                        alertOverridesPolicy =
                            configuredSeverity.compareTo(alertMessageSeverity) <= 0;
                    } else {
                        alertOverridesPolicy = false;
                    }

                    /** @type {Map<string, object>} */
                    let functionData;

                    if (index < pipelineData.size) {
                        functionData = pipelineData.get(index);
                    } else {
                        functionData = new Map();
                        pipelineData.add(functionData);
                    }

                    if (deviceFunction._apply(this, null, parameters, functionData, pair) ||
                        alertOverridesPolicy)
                    {
                        // If the policy was scheduled...
                        /** @type {number} */
                        const window =
                              iotcs.device.impl.DeviceFunction._getWindow(parameters);

                        if (window > 0) {
                            /** @type {number} */
                            const slide =
                                  iotcs.device.impl.DeviceFunction.getSlide(parameters,
                                                                                    window);
                            /** @type {ScheduledPolicyDataKey} */
                            const key =
                                  new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
                            /** @type {ScheduledPolicyData} */
                            const scheduledPolicyData = this._scheduledPolicies.get(key);
                            /** @type {number} */
                            const timeZero = new Date().getTime();

                            if (scheduledPolicyData) {
                                /** @type {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} */
                                const updatedAttributes = new Set();
                                scheduledPolicyData._processExpiredFunction(this,
                                                                            updatedAttributes,
                                                                            timeZero);

                                if (updatedAttributes.size > 0) {
                                    this._updateFields(updatedAttributes);
                                }

                                return;
                            }
                        }

                        /** @type {Set<Pair>} */
                        let value = deviceFunction._get(this, null, parameters, functionData);
                        pairs = Array.from(value);

                        iotcs.impl.Platform._debug('VirtualDevice: ' + endpointId + ' dispatching ' +
                                        pairs.length + ' messages per policy "' +
                                        deviceFunction._getDetails(parameters) + '"');
                    } else {
                        return;
                    }
                }
            }

            try {
                /** @type {Message[]} */
                let messages = new Array(pairs.length);
                // /** @type {MessageDispatcher} */
                // let messageDispatcher = new iotcs.device.util.MessageDispatcher(client);

                for (let n = 0; n < messages.length; n++) {
                    messages[n] = pairs[n].getKey();
                    /** @type {StorageObject} */
                    let storageObject = pairs[n].getValue();

                    if (storageObject) {
                        self.messageDispatcher._addStorageDependency(storageObject,
                                                                     message._properties.clientId);

                        storageObject.sync();
                    }
                }

                this.messages.forEach(message => {
                    iotcs.impl.Platform._debug('VirtualDevice.queueMessage, sending message: ' +
                                    iotcs.impl.Platform._inspect(message));
                    this._messageDispatcher.queue(message);
                });
            } catch (error) {
                console.log('Error: ' + error);
            }
        }).catch(error => {
            console.log('Error getting device policy: ' + error);
        });
    }

    /**
     *
     * @ignore
     *
     * @param {number} slide
     * @param {string} attributeName
     * @param {number} pipelineIndex
     * @param {number} window
     */
    _removeScheduledPolicy(slide, attributeName, pipelineIndex, window) {
        /** @type {ScheduledPolicyDataKey} */
        const key = new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
        /** @type {ScheduledPolicyData} */
        const scheduledPolicyData = this._scheduledPolicies.get(key);

        if (scheduledPolicyData) {
            scheduledPolicyData._removeAttribute(attributeName, pipelineIndex);

            if (scheduledPolicyData._isEmpty()) {
                this._scheduledPolicies.delete(key);
                this._timedPolicyThread._removeTimedPolicyData(scheduledPolicyData);
            }
        }
    }

    /**
     * Set a callback that is invoked when a specific action, or any action in the device model is
     * received.  To set a callback when any action is received, don't specify the action name.  This
     * may be called multiple times to set multiple callbacks.  If there is a callback for the
     * specific action and for all actions, both callbacks will be invoked, with the specific action
     * invoked first.
     *
     * @param {function} actionCallback A callback to invoke when an action is received.  If
     *        {@code null}, the existing callback will be removed
     *        @see #setOnAction(string, callback).
     * @param {string} [actionName] - The name of the action which will be invoked.
     */
    _setOnAction(actionCallback, actionName) {
        _mandatoryArg(actionCallback, 'function'); 

        if (actionName) {
            /** @type {DeviceModelAction} */
            // DJM: Where is this function?
            // DJM: Where is base defined?
            let deviceModelAction = this._getDeviceModelAction(base.getDeviceModel(), actionName);

            if (!deviceModelAction) {
                iotcs.error("Action not found in model.");
            }

            if (!this._actionCallbackMap) {
                this._actionCallbackMap = new Map();
            }

            this._actionCallbackMap.set(actionName, actionCallback);
        } else {
            if (!this._actionCallbackMap) {
                this._actionCallbackMap = new Map();
            }

            this._actionCallbackMap.set("*", actionCallback);
        }
    }

    /**
     * Updates the attributes for this VirtualDevice.  If an attribute is a StorageObject, kicks off
     * the synchronization process if the storage object is ready to be synchronized.
     *
     * @param {Object.<string, any>} attributes - The attributes to update.
     */
    _updateAttributes(attributes) {
        let message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(this.getEndpointId())
            .format(this._deviceModel.urn + ":attributes");

        let storageObjects = [];

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this) {
                if (value instanceof iotcs.StorageObject) {
                    let syncStatus = value.getSyncStatus();

                    if (syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC ||
                        syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
                        storageObjects.push(value);
                    }

                    value._setSyncEventInfo(attribute, this);
                    value.sync();
                }

                message.dataItem(attribute,value);
            } else {
                iotcs.error('Unknown attribute "' + attribute + '".');
                return;
            }
        }

        storageObjects.forEach(storageObject => {
            this._messageDispatcher._addStorageDependency(storageObject,
                                                    message._properties.clientId);
        });

        this._messageDispatcher.queue(message);
    }

    /**
     * Set all the attributes in an update batch. Errors are handled in the set call, including calling
     * the on error handler.
     *
     * {@inheritDoc}
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     *
     * @ignore
     */
    _updateFields(updatedAttributes) {
        iotcs.impl.Platform._debug('VirtualDevice._updateFields called.');
        /** @type {Set<string>} */
        const updatedAttributesToProcess = new Set();
        let updatedAttributesAry = Array.from(updatedAttributes);

        for (let i = updatedAttributesAry.length - 1; i >= 0; i--) {
            const attribute = updatedAttributesAry[i].getKey();
            /** @type {string} */
            const attributeName = attribute._getDeviceModelAttribute()._getName();

            try {
                // Here, we assume:
                // 1. That attribute is not null. If the attribute were not found
                //    an error would have been thrown from the VirtualDevice
                //    set(string attributeName, T value) method.
                // 2. That the set method validates the value. The call to
                //    update here should not throw an error because the
                //    value is bad.
                // 3. The author of this code knew what he was doing.
                if (!attribute.update(updatedAttributesAry[i].getValue())) {
                    updatedAttributesAry.splice(i, 1);
                } else {
                    updatedAttributesToProcess.add(attributeName);
                }
            } catch (error) {
                console.log('Error updating attributes: ' + error);
            }

            iotcs.device.impl.DeviceFunction._removeInProcessValue(this.endpointId,
                                                                           this._deviceModel.urn,
                                                                           attributeName);
        }

        // Here is the check to see if the updated attributes will trigger computedMetrics.
        // The returned set is the attributes whose computedMetrics resulted in an
        // attribute.update(value). Those attributes are added to the list of updated attributes
        // so that they are included in the resulting data message.
        /** @type {Set<string>} */
        const computedMetrics = this._checkComputedMetrics(updatedAttributesToProcess);

        computedMetrics.forEach(attr => {
            /** @type {VirtualDeviceAttribute} */
            const attribute = this._getAttribute(attr);
            /** @type {object} */
            const value = attribute.get();
            /** @type {Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>} */
            const pair = new iotcs.device.impl.Pair(attribute, value);
            updatedAttributes.add(pair);
        });

        this._processOnChange1(updatedAttributes);
    }

    // Public functions
    /**
     *
     * @ignore
     * @inheritdoc
     */
    close() {
        if (this._client) {
            this._client._removeVirtualDevice(this);
        }

        this._endpointId = null;
        this._onChange = arg => {};
        this._onError = arg => {};
    }

    /**
     * This method returns an Alert object created based on the
     * format given as parameter. An Alert object can be used to
     * send alerts to the server by calling the raise method,
     * after all mandatory fields of the alert are set.
     *
     * @param {string} formatUrn - the urn format of the alert spec
     * as defined in the device model that this virtual device represents
     *
     * @return {iotcs.device.Alert} The Alert instance
     *
     * @memberof iotcs.device.VirtualDevice
     * @function createAlert
     */
    createAlert(formatUrn) {
        return new iotcs.device.Alert(this, formatUrn);
    }

    /**
     * This method returns a Data object created based on the
     * format given as parameter. A Data object can be used to
     * send custom data fields to the server by calling the submit method,
     * after all mandatory fields of the data object are set.
     *
     * @param {string} formatUrn - the urn format of the custom data spec
     * as defined in the device model that this virtual device represents
     *
     * @return {iotcs.device.Data} The Data instance
     *
     * @memberof iotcs.device.VirtualDevice
     * @function createData
     */
    createData(formatUrn) {
        return new iotcs.device.Data(this, formatUrn);
    }

    /**
     * @ignore
     * @inheritdoc
     */
    getDeviceModel() {
        return super.getDeviceModel();
    }

    /**
     * @inheritdoc
     */
    update(attributes) {
        _mandatoryArg(attributes, 'object');

        if (Object.keys(attributes).length === 0) {
            return;
        }

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this) {
                this[attribute]._localUpdate(value, true); //XXX not clean
            } else {
                iotcs.error('Unknown attribute "' + attribute+'".');
                return;
            }
        }

        this._updateAttributes(attributes);
    }

    /**
     * Offer to set the value of an attribute. The attribute value is set depending upon any policy
     * that may have been configured for the attribute. If there is no policy for the given
     * attribute, offer behaves as if the set method were called. The value is validated according to
     * the constraints in the device model. If the value is not valid, an IllegalArgumentException is
     * raised.
     *
     * @param {string} attributeName - The name of an attribute from the device type model.
     * @param {any} value - The value to set.
     */
    offer(attributeName, value) {
        let tmp = {attributeName, value};
        /** @type {VirtualDeviceAttribute} */
        const attribute = this._getAttribute(attributeName);
        iotcs.impl.Platform._debug('VirtualDevice.offer attribute=' + attribute);

        if (!attribute) {
            throw new Error("No such attribute '" + attributeName +
                            "'.\n\tVerify that the URN for the device model you created " +
                            "matches the URN that you use when activating the device in " +
                            "the Java application.\n\tVerify that the attribute name " +
                            "(and spelling) you chose for your device model matches the " +
                            "attribute you are setting in the Java application.");
        }

        if (!attribute._isSettable()) {
            throw new Error("Attempt to modify read-only attribute '" + attributeName + "'.");
        }

        iotcs.impl.Platform._debug('VirtualDevice.offer this._deviceModel.urn=' + this._deviceModel.urn);

        /** @type {DevicePolicy} */
        this._devicePolicyManager._getPolicy(this._deviceModel.urn, this.endpointId).then(
            devicePolicy =>
       {
            iotcs.impl.Platform._debug('VirtualDevice.offer = devicePolicy = ' + devicePolicy);

            if (!devicePolicy) {
                const updateObj = {};
                updateObj[attributeName] = value;
                return this.update(updateObj);
            }

            /** @type {Set<DevicePolicyFunction>} */
            const pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('VirtualDevice.offer pipeline=' + pipeline);

            if (!pipeline || (pipeline.size === 0)) {
                const updateObj = {};
                updateObj[attributeName] = value;
                return this.update(updateObj);
            }

            /** @type {Set<Map<string, object>>} */
            this._getPipelineData(attributeName, pipelineData => {
                iotcs.impl.Platform._debug('VirtualDevice.offer pipelineData=' + pipelineData);
                /** @type {} */
                const policyValue = this.offer0(attribute.getDeviceModelAttribute(), value,
                                                 pipeline, pipelineData);

                iotcs.impl.Platform._debug('VirtualDevice.offer policyValue = ' + policyValue);

                if (policyValue) {
                    iotcs.impl.Platform._debug(this.endpointId + ' : Set   : "' + attributeName + '=' +
                                    policyValue);

                    // Handle calling offer outside of an update when there are computed metrics
                    // involved.  Call updateFields to ensure the computed metrics get run, and
                    // will put this attribute and computed attributes into one data message.
                    /** @type {Pair} */
                    const updatedAttributes = new Set();
                    updatedAttributes.add(new iotcs.device.impl.Pair(attribute, policyValue));
                    this._updateFields(updatedAttributes);
                }
            });
        }).catch(error => {
            console.log('Error offering value: ' + error);
        });
    }

};

// DJM: Fix these
// Callback JSDocs.
/**
 * Callback for iotcs.device.VirtualDevice.onError with the error.
 *
 * @callback iotcs.device.VirtualDevice~onErrorCallback
 *
 * @param {string} error - The error when sending this Alert.
 */
