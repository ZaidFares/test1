/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * An Action to be sent to the server. The action is sent by calling the <code>call()</code> method.
 * <p>
 * The <code>set</code> method returns the <code>Action</code> instance to allow the fields of the
 * action to be set in fluent style.
 * @see VirtualDevice#createAction(string)
 *
 * @alias iotcs.enterprise.impl.Action
 * @class iotcs.enterprise.impl.Action
 * @ignore
 * @private
 */
iotcs.enterprise.impl.Action = class {
    // Static private functions
    /**
     * Returns a DeviceModelAction for the action with the specified name which is associated with
     * the VirtualDevice.
     *
     * @param {iotcs.enterprise.VirtualDevice} virtualDevice - The virtual device associated with
     *        the action.
     * @param {string} actionName - The name of the action.
     * @return {(DeviceModelAction | null)} The device model action or <code>null</code>.
     *
     * @ignore
     */
    static _getDeviceModelAction(virtualDevice, actionName) {
        /** @type {object} */
        let deviceModelJson = virtualDevice.getDeviceModel();
        let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);
        return deviceModel._getDeviceModelActions().get(actionName);
    }

    /**
     * Constructs an Action.
     *
     * @param {VirtualDevice} virtualDevice - A virtual device.
     * @param {string} actionName - The action name.
     */
    constructor(virtualDevice, actionName) {
        this.deviceModelAction = iotcs.enterprise.impl.Action._getDeviceModelAction(virtualDevice,
                                                                                    actionName);

        if (!this.deviceModelAction) {
            iotcs.error("'" + actionName + "' not found.");
        }

        this.actionName = actionName;
        /** @type {VirtualDevice} */
        this.virtualDevice = virtualDevice;
        this.argumentValues = {};
    }

    // DJM: Why do we have public functions for a private class?
    // Public functions
    call() {
        this.virtualDevice.callMultiArgAction(this.actionName, this.getArguments());
    }

    /**
     * Checks the bounds (upper and lower), if there are any bounds, of the value of the argument.
     *
     * @param {DeviceModelActionArgument} argument - The argument to check.
     * @param {number} value - The value of the argument.
     * @throws error If there are bounds for the argument and the value is outside the bounds.
     */
    checkBounds(argument, value) {
        /** @type {number} */
        const upperBound = argument._getUpperBound();
        /** @type {number} */
        const lowerBound = argument._getLowerBound();

        // Assumption here is that lowerBound <= upperBound
        if (upperBound != null) {
            if (value > upperBound) {
                iotcs.error(this.deviceModelAction._getName() + " '" + argument._getName() +
                    "' out of range: " + value + " > " + upperBound);
            }
        }

        if (lowerBound != null) {
            if (value < lowerBound) {
                iotcs.error(this.deviceModelAction._getName() + " '" + argument._getName() +
                    "' out of range: " + value + " < " + lowerBound);
            }
        }
    }

    /**
     * Returns the argument with the specified name.
     *
     * @param {string} fieldName - The name of the argument.
     * @return {iotcs.impl.DeviceModelActionArgument} The argument or <code>null</code>.
     */
    getArgument(fieldName) {
        if (!this.deviceModelAction) {
            return null;
        }

        /** @type {Array<iotcs.impl.DeviceModelActionArgument>} */
        for (const argument of this.deviceModelAction._getArguments()) {
            if (argument._getName() === fieldName) {
                return argument;
            }
        }

        return null;
    }

    /**
     * Returns the attributes to be updated and their values.
     *
     * @return {Map<string, *>} An object containing the attributes to update.
     */
    getArguments() {
        // @type {object}
        let attributes = {};

        /** @type {iotcs.impl.DeviceModelActionArgument[]} */
        let args = this.deviceModelAction._getArguments();

        /** @type {iotcs.impl.DeviceModelActionArgument} */
        args.forEach(arg => {
            let name = arg._getName();
            let value = this.argumentValues[arg._getName()];

            if (!value) {
                value = arg._getDefaultValue();

                if (!value) {
                    iotcs.error("Missing required argument '" + name + "' to action '" +
                        this.deviceModelAction._getName() + "'");
                }
            }

            attributes[name] = value;
        });

        return attributes;
    }

    /**
     * Sets the value for the argument with the specified name.
     *
     * @param {string} argumentName - The name of the argument.
     * @param {*} value - The value.
     * @return {Action} An Action for the argument.
     * @throws error If the argument is not in the device model or of is the incorrect type.
     */
    set(argumentName, value) {
        /** @type {iotcs.impl.DeviceModelActionArgument} */
        let argument = this.getArgument(argumentName);

        if (!argument) {
            iotcs.error(argumentName + " not in device model.");
        }

        /** @type {string} */
        let typeOfValue = typeof value;

        switch (argument._getArgType()) {
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                if (typeOfValue !== 'number') {
                    iotcs.error("Value for '" + argumentName + "' is not a NUMBER");
                }

                this.checkBounds(argument, value);
                break;
        case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
            if (typeOfValue !== 'number') {
                iotcs.error("Value for '" + argumentName + "' is not an INTEGER");
            }

            this.checkBounds(argument, value);
            break;
        case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
            if (typeof value.getMonth !== 'function') {
                iotcs.error("Value for '" + argumentName + "' is not a DATETIME");
            }

            value = new Date().getTime();
            break;
        case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
            if (typeOfValue !== 'boolean') {
                iotcs.error("value for '" + argumentName + "' is not a BOOLEAN");
            }

            break;
        case iotcs.impl.DeviceModelAttribute.Type.STRING:
            if (typeOfValue !== 'string') {
                iotcs.error("value for '" + argumentName + "' is not a STRING");
            }

            break;
        case iotcs.impl.DeviceModelAttribute.Type.URI:
            if (!(value instanceof iotcs.ExternalObject)) {
                iotcs.error("value for '" + argumentName + "' is not an ExternalObject");
            }

            break;
        }

        this.argumentValues[argumentName] = value;
        return this;
    }
};
