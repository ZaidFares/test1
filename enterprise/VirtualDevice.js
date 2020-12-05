/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: jsdoc issue: MessageEnumerator appears in iotcs.* and not at index level (probably due to
//       missing class jsdoc on iotcs.enterprise.MessageEnumerator) @DONE

/**
 * VirtualDevice is a representation of a device model
 * implemented by an endpoint. A device model is a
 * specification of the attributes, formats, and resources
 * available on the endpoint.
 * <p>
 * The VirtualDevice API is specific to the enterprise
 * client. Also it implements the device monitoring and
 * control specific to the enterprise client and the call
 * to an action method. Actions are defined in the device
 * model.
 * <p>
 * A device model can be obtained by it's afferent urn with the
 * EnterpriseClient if it is registered on the cloud.
 * <p>
 * The VirtualDevice has the attributes and actions of the device
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
 * <code>device.maxThreshold.onError = function (errorTuple);</code><br>
 * <code>device.maxThreshold.value = 27;</code><br>
 * where errorTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , tryValue: ... , errorResponse: ...}</code>.
 * The library will throw an error in the value to update is invalid
 * according to the device model.
 * <p>
 * <b>Monitor a specific attribute for any value change (that comes from the cloud):</b><br>
 * <code>device.temperature.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , oldValue: ...}</code>.
 * <p>
 * <b>Monitor all attributes for any value change (that comes from the cloud):</b><br>
 * <code>device.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object with array type properties of the form
 * <code>[{attribute: ... , newValue: ... , oldValue: ...}]</code>.
 * <p>
 * <b>Monitor all update errors:</b><br>
 * <code>device.onError = function (errorTuple);</code><br>
 * where errorTuple is an object with array type properties (besides errorResponse) of the form
 * <code>{attributes: ... , newValues: ... , tryValues: ... , errorResponse: ...}</code>.
 * <p>
 * <b>Monitor a specific alert format for any alerts that where generated:</b><br>
 * <code>device.tooHot.onAlerts = function (alerts);</code><br>
 * where alerts is an array containing all the alerts generated of the specific format. An
 * alert is an object of the form:
 * <code>{eventTime: ... , severity: ... , fields: {field1: value1, field2: value2 ... }}</code>.
 * The onAlerts can be set also by urn:
 * <code>device['temperature:format:tooHot'].onAlerts = function (alerts);</code><br>
 * <p>
 * <b>Monitor all alerts generated for all formats:</b><br>
 * <code>device.onAlerts = function (alerts);</code><br>
 * where alerts is an object containing all the alert formats as keys and each has as value the above described array:
 * <code>{formatUrn1: [ ... ], formatUrn2: [ ... ], ... }</code>.
 * <p>
 * <b>Monitor a specific custom message format for any messages that where generated:</b><br>
 * <code>device.rfidDetected.onData = function (data);</code><br>
 * where data is an array containing all the custom data messages generated of the specific format. A
 * data object is an object of the form:
 * <code>{eventTime: ... , severity: ... , fields: {field1: value1, field2: value2 ... }}</code>.
 * The onData can be set also by urn:
 * <code>device['temperature:format:rfidDetected'].onData = function (data);</code><br>
 * <p>
 * <b>Monitor all custom data messages generated for all formats:</b><br>
 * <code>device.onData = function (data);</code><br>
 * where data is an object containing all the custom formats as keys and each has as value the above described array:
 * <code>{formatUrn1: [ ... ], formatUrn2: [ ... ], ... }</code>.
 * <p>
 * A VirtualDevice can also be created with the appropriate
 * parameters from the EnterpriseClient.
 *
 * @param {string} endpointId - The endpoint id of this device.
 * @param {object} deviceModel - The device model object holding the full description of that device
 *        model that this device implements.
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        device application context.
 *
 * @alias iotcs.enterprise.VirtualDevice
 * @class iotcs.enterprise.VirtualDevice
 * @extends iotcs.AbstractVirtualDevice
 * @memberof iotcs.enterprise
 * @see {@link iotcs.enterprise.EnterpriseClient#getDeviceModel}
 * @see {@link iotcs.enterprise.EnterpriseClient#createVirtualDevice}
 */
iotcs.enterprise.VirtualDevice = class extends iotcs.AbstractVirtualDevice {
    constructor(endpointId, deviceModel, client) {
        super(endpointId, deviceModel);
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);

        this._attributes = this;
        this._controller = new iotcs.enterprise.impl.Controller(this);
        this._enterpriseClient = client;
        this._onAlerts = arg => {};
        this._onData = arg => {};

        let attributes = this._deviceModel.attributes;

        for (let indexAttr in attributes) {
            let attribute = new iotcs.enterprise.impl.Attribute(attributes[indexAttr]);

            if (attributes[indexAttr].alias) {
                iotcs.AbstractVirtualDevice._link(attributes[indexAttr].alias, this, attribute);
            }

            iotcs.AbstractVirtualDevice._link(attributes[indexAttr].name, this, attribute);
        }

        this.actions = this;

        let actions = this._deviceModel.actions;

        for (let indexAction in actions) {
            let actionSpec = new iotcs.enterprise.impl.ActionSpec(actions[indexAction]);

            if (actions[indexAction].alias) {
                iotcs.AbstractVirtualDevice._link(actions[indexAction].alias, this.actions, actionSpec);
            }

            iotcs.AbstractVirtualDevice._link(actions[indexAction].name, this.actions, actionSpec);
        }

        let self = this;

        if (this._deviceModel.formats) {
            this.alerts = this;
            this.dataFormats = this;

            this._deviceModel.formats.forEach(format => {
                if (format.type && format.urn) {
                    if (format.type === 'ALERT') {
                        let alert = new iotcs.enterprise.impl.Alert(format);

                        if (format.name) {
                            iotcs.AbstractVirtualDevice._link(format.name, self.alerts, alert);
                        }

                        iotcs.AbstractVirtualDevice._link(format.urn, self.alerts, alert);
                    }

                    if (format.type === 'DATA') {
                        let data = new iotcs.enterprise.impl.Data(format);

                        if (format.name) {
                            iotcs.AbstractVirtualDevice._link(format.name, self.dataFormats, data);
                        }

                        iotcs.AbstractVirtualDevice._link(format.urn, self.dataFormats, data);
                    }
                }
            });
        }

        this._isDeviceApp = 0;
        Object.preventExtensions(this);
        iotcs.enterprise.EnterpriseClient._deviceMonitorInitialization(this);
    }

    // Private/protected functions
    // Public functions
    /**
     * Execute an action. The library will throw an error if the action is not in the model or if the
     * argument is invalid (or not present when it should be).  The actions are as attributes properties
     * of the virtual device.
     * <p>
     * The response from the cloud to the execution of the action can be retrieved by setting a callback
     * function to the onAction property of the action:<br> <code>device.reset.onAction = function
     * (response);</code><br> <code>device.call('reset');</code><br> where response is a JSON
     * representation of the response from the cloud if any.
     *
     * @function call
     * @memberof iotcs.enterprise.VirtualDevice
     *
     * @param {string} actionName - The name of the action to execute.
     * @param {object} [arg] - An optional unique argument to pass for action execution.  This is
     *        specific to the action and description of it is provided in the device model.
     */
    call(actionName, arg) {
        _mandatoryArg(actionName, 'string');

        if (arg && (arg.length > 2)) {
            iotcs.error('Invalid number of arguments.');
        }

        let action = this[actionName];

        if (!action) {
            iotcs.error('Action "' + actionName + '" is not executable.');
            return;
        }

        this._controller._invokeSingleArgAction(action._name, arg);
    }

    /**
     * Execute an action. The library will throw an error if the action is not in the model or if the
     * arguments are invalid (or not present when they should be).  The actions are as attribute
     * properties of the virtual device.
     * <p>
     * The response from the cloud to the execution of the action can be retrieved by setting a callback
     * function to the onAction property of the action:<br> <code>device.reset.onAction = function
     * (response);</code><br> <code>device.call('reset');</code><br> where response is a JSON
     * representation of the response from the cloud, if any.
     *
     * @function callMultiArgAction
     * @memberof iotcs.enterprise.VirtualDevice
     *
     * @param {string} actionName - The name of the action to execute.
     * @param {object} args - An of action argument names to action argument values to pass for action
     *        execution.  The arguments are specific to the action.  The description of the arguments is
     *        provided in the device model.
     *
     * @ignore
     * @private
     */
    callMultiArgAction(actionName, args) {
        _mandatoryArg(args, 'object');

        let action = this[actionName];

        if (!action) {
            iotcs.error('Action "' + actionName + '" is not executable.');
            return;
        }

        this._controller._invokeMultiArgAction(action._name, args);
    }

    /**
     * @ignore
     * @inheritdoc
     */
    close() {
        if (this._controller) {
            this._controller._close();
        }

        if (this._client) {
            this._client._removeVirtualDevice(this);
        }

        this._controller = null;
        this._endpointId = null;
        this._onChange = arg => {};
        this._onError = arg => {};
        this._onAlerts = arg => {};
    }

    /**
     * Create an Action for this VirtualDevice. The action will be created for the named action in
     * the device model.
     *
     * @param {string} actionName - The name of the action.
     * @return {Action} - A DeviceModelAction.
     */
    createAction(actionName) {
        return new iotcs.enterprise.impl.Action(this, actionName);
    }

    get onAlerts() {
        return this._onAlerts;
    }

    get onData() {
        return this._onData;
    }

    set onAlerts(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onAlerts that is not a function!');
            return;
        }

        this._onAlerts = newFunction;
    }

    set (newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onData that is not a function!');
            return;
        }

        this._onData = newFunction;
    }

    /**
     * @ignore
     * @inheritdoc
     */
    update(attributes) {
        _mandatoryArg(attributes, 'object');

        if (Object.keys(attributes).length === 0) {
            return;
        }

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this._attributes) {
                this._attributes[attribute]._localUpdate(value, true); //XXX not clean
            } else {
                iotcs.error('Unknown attribute "' + attribute + '".');
                return;
            }
        }

        if (this._controller) {
            this._controller._updateAttributes(attributes, false);
        }
    }
};


