/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The Controller class executes actions and updates attributes on virtual devices by invoking HTTP
 * requests on the server.
 *
 * @class
 * @ignore
 */
iotcs.enterprise.impl.Controller = class {
    // Static private/protected functions
    /**@ignore*/
    static _actionExecuteResponseProcessor(response, device, actionName, error) {
        let action = device[actionName];

        if (action.onAction) {
            action.onAction(response, error);
        }
    }

    /**@ignore*/
    static _attributeUpdateResponseProcessor (response, device, attributeNameValuePairs, extError) {
        let error = false;

        if (!response || extError) {
            error = true;
            response = extError;
        } else {
            error = (response.status === 'FAILED' ||
                     (!response.response) ||
                     (!response.response.statusCode) ||
                     (response.response.statusCode > 299) ||
                     (response.response.statusCode < iotcs.StatusCode.OK));
        }

        let attrObj = {};
        let newValObj = {};
        let tryValObj = {};

        for (let attributeName in attributeNameValuePairs) {
            let attribute = device[attributeName];
            attribute._onUpdateResponse(error);
            attrObj[attribute.id] = attribute;
            newValObj[attribute.id] = attribute.value;
            tryValObj[attribute.id] = attributeNameValuePairs[attributeName];

            if (error && attribute._onError) {
                let onAttributeErrorTuple = {
                    attribute: attribute,
                    newValue: attribute.value,
                    tryValue: attributeNameValuePairs[attributeName],
                    errorResponse: response
                };

                attribute._onError(onAttributeErrorTuple);
            }
        }

        if (error && device.onError) {
            let onDeviceErrorTuple = {
                attributes: attrObj,
                newValues: newValObj,
                tryValues: tryValObj,
                errorResponse: response
            };

            device.onError(onDeviceErrorTuple);
        }
    }

    /** @ignore */
    static _checkIfDeviceIsDeviceApp(virtualDevice, callback) {
        if (virtualDevice._isDeviceApp) {
            callback();
            return;
        }

        let deviceId = virtualDevice.getEndpointId();
        let filter = new iotcs.enterprise.Filter();
        filter = filter.eq('id',deviceId);

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot +
                (virtualDevice._enterpriseClient._appid ?
                 ('/apps/' + virtualDevice._enterpriseClient._appid) : '') +
                '/deviceApps' +
                '?fields=type' +
                '&q=' +
                filter.toString()
        }, '', (response, error) => {
            if (!response || error || !response.items || !Array.isArray(response.items)) {
                iotcs.createError('Invalid response on device app check request - assuming virtual device is a device.');
            } else {
                if ((response.items.length > 0) &&
                    response.items[0].type &&
                    (response.items[0].type === 'DEVICE_APPLICATION'))
                {
                    virtualDevice._isDeviceApp = 2;
                    callback();
                    return;
                }
            }

            virtualDevice._isDeviceApp = 1;
            callback();
        }, () => {
            iotcs.enterprise.impl._checkIfDeviceIsDeviceApp(virtualDevice, callback);
        }, virtualDevice._enterpriseClient._activeEnterpriseClientImpl);
    }

    /**
     * Constructs a Controller.
     *
     * @param {AbstractVirtualDevice} device - The device associated with this controller.
     */
    constructor(device) {
        _mandatoryArg(device, iotcs.AbstractVirtualDevice);

        this._device = device;
        this._requestMonitors = {};
    }

    // Private/protected functions
    /**
     * @TODO MISSING DESCRIPTION
     *
     * @memberof iotcs.util.Controller
     * @function close
     */
    _close() {
        for(let key in this._requestMonitors) {
            this._requestMonitors[key]._stop();
        }

        this._requestMonitors = {};
        this._device = null;
    }

    /**
     * Invokes the action specified in actionName with multiple arguments specified in args.
     *
     * @function invokeMultiArgAction
     * @memberof iotcs.util.Controller
     *
     * @param {string} actionName The name of the action to invoke.
     * @param {Map<string, string>} [args] - A <code>Map</code> of action argument names to action
     *        argument values to pass for action execution.  The arguments are specific to the
     *        action.  The description of the arguments is provided in the device model.
     */
    _invokeMultiArgAction(actionName, args) {
        _mandatoryArg(actionName, 'string');

        if (!this._device[actionName]) {
            iotcs.error('Action: "' + actionName + '" not found in the device model.');
            return;
        }

        /** @type {*} */
        let checkedArgs;

        if ((checkedArgs = this._device[actionName].checkAndGetVarArgs(args)) === null) {
            iotcs.error('Invalid parameters on call to action: "' + actionName + '".');
            return;
        }

        let self = this;
        let deviceModelUrn = self._device.getDeviceModel().urn;
        let endpointId = self._device.getEndpointId();
        let selfDevice = self._device;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: 'POST',
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/actions/' + actionName
            }, ((typeof checkedArgs !== 'undefined') ?
                JSON.stringify(checkedArgs) : JSON.stringify({})), (response, error) => {
                    if (!response || error || !(response.id)) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', error));

                        return;
                    }

                    let reqId = response.id;

                    try {
                        self._requestMonitors[reqId] =
                            new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                        {
                            iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(
                                response, selfDevice, actionName, error);
                        }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                        self._requestMonitors[reqId]._start();
                    } catch (e) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', e));
                    }

                }, () => {
                    self._invokeMultiArgAction(actionName, checkedArgs);
                }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }

    /**
     * Invokes the action specified in actionName with a single argument specified in arg.
     *
     * @function invokeSingleArgAction
     * @memberof iotcs.util.Controller
     *
     * @param {string} actionName The name of the action to invoke.
     * @param {*} [args] - The argument to pass for action execution.  The arguments are specific
     *        to the action.  The description of the argument is provided in the device model.
     */
    _invokeSingleArgAction(actionName, arg) {
        _mandatoryArg(actionName, 'string');

        if (!this._device[actionName]) {
            iotcs.error('Action: "' + actionName + '" not found in the device model.');
            return;
        }

        let checkedValue;

        // If the action has no argument, the checkedValue will still be undefined after this check.
        if ((checkedValue = this._device[actionName].checkAndGetVarArg(arg)) === null) {
            iotcs.error('Invalid parameters on call to action: "' + actionName + '".');
            return;
        }

        let self = this;
        let endpointId = self._device.getEndpointId();
        let deviceModelUrn = self._device.getDeviceModel().urn;
        let selfDevice = self._device;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: 'POST',
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/actions/' + actionName
            }, ((typeof checkedValue !== 'undefined') ?
                JSON.stringify({value: checkedValue}) : JSON.stringify({})), (response, error) =>
                {
                    if (!response || error || !(response.id)) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', error));
                        return;
                    }

                    let reqId = response.id;

                    try {
                        self._requestMonitors[reqId] =
                            new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                        {
                            iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(
                                response, selfDevice, actionName, error);
                        }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                        self._requestMonitors[reqId]._start();
                    } catch (e) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', e));
                    }
                }, () => {
                    self._invokeSingleArgAction(actionName, checkedValue);
                }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }

    /**
     * Updates the specified attributes by checking the attributes against the device model and sending
     * a message to the server to update the attributes.
     *
     * @param {object} attributeNameValuePairs - An object containing attribute names with associated
     *        attribute values. e.g. { name1:value1, name2:value2, ...}.
     * @param {boolean} [singleAttribute] - Indicates if one attribute needs to be updated. Could be
     *        omitted, in which case the value is false.
     *
     * @function updateAttributes
     * @memberof iotcs.util.Controller
     */
    _updateAttributes(attributeNameValuePairs, singleAttribute) {
        _mandatoryArg(attributeNameValuePairs, 'object');

        if (Object.keys(attributeNameValuePairs).length === 0) {
            return;
        }

        for(let attributeName in attributeNameValuePairs) {
            if (!this._device[attributeName]) {
                iotcs.error('Device model attribute mismatch.');
                return;
            }
        }

        let endpointId = this._device.getEndpointId();
        let deviceModelUrn = this._device.getDeviceModel().urn;
        let selfDevice = this._device;
        let self = this;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: (singleAttribute ? 'PUT' : 'POST'),
                headers: (singleAttribute ? {} : {
                    'X-HTTP-Method-Override': 'PATCH'
                }),
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/attributes' +
                    (singleAttribute ? ('/' + Object.keys(attributeNameValuePairs)[0]) : '')
            }, (singleAttribute ?
                JSON.stringify({value: attributeNameValuePairs[Object.keys(attributeNameValuePairs)[0]]}) :
                JSON.stringify(attributeNameValuePairs)), (response, error) =>
            {
                if (!response || error || !(response.id)) {
                    iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(null,
                        selfDevice, attributeNameValuePairs,
                        iotcs.createError('Invalid response on update async request: ', error));
                    return;
                }

                let reqId = response.id;

                try {
                    self._requestMonitors[reqId] =
                        new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                    {
                        iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(response,
                            selfDevice, attributeNameValuePairs, error);
                    }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                    self._requestMonitors[reqId]._start();
                } catch (e) {
                    iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(null,
                        selfDevice, attributeNameValuePairs,
                        iotcs.createError('Invalid response on update async request: ', e));
                }
            }, () => {
                self._updateAttributes(attributeNameValuePairs, singleAttribute);
            }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }
};

