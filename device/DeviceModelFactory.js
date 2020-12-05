/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @ignore
 */
iotcs.device.impl.DeviceModelFactory = class {
    constructor() {
        if (iotcs.device.impl.DeviceModelFactory._instanceDeviceModelFactory) {
            return iotcs.device.impl.DeviceModelFactory._instanceDeviceModelFactory;
        }

        this._cache = this.cache || {};
        this._cache.deviceModels = {};
        iotcs.device.impl.DeviceModelFactory._instanceDeviceMModelFactory = this;
    }

    /**
     *
     * @param dcdUtil {iotcs.device.util.DirectlyConnectedDevice}
     * @ignore
     */
    _getDeviceModel(dcdUtil, deviceModelUrn, callback) {
        iotcs.impl.Platform._debug('DeviceModelFactory.getDeviceModel Getting device model for deviceModelUrn: ' +
                       deviceModelUrn);

        _mandatoryArg(dcdUtil, iotcs.device.util.DirectlyConnectedDevice);

        if (!dcdUtil.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        _mandatoryArg(deviceModelUrn, 'string');
        _mandatoryArg(callback, 'function');

        let deviceModel = this._cache.deviceModels[deviceModelUrn];

        if (deviceModel) {
            callback(deviceModel);
            return;
        }

        let options = {
            headers: {
                'Authorization': dcdUtil._dcdImpl._bearer,
                'X-EndpointId': dcdUtil._dcdImpl._tam.getEndpointId()
            },
            method: 'GET',
            path: iotcs.impl._reqRoot + '/deviceModels/' + deviceModelUrn,
            tam: dcdUtil._dcdImpl._tam
        };

        iotcs.impl._protocolReq(options, '', (response, error) => {
            iotcs.impl.Platform._debug('DeviceModelFactory.getDeviceModel response = ' + response +
                           ', error = ' + error);

            if (!response || !(response.urn) || error) {
                callback(null, iotcs.createError('Invalid response when getting device model.',
                    error));
                return;
            }

            let deviceModel = response;

            if (!iotcs.oracle.iot.client.device.allowDraftDeviceModels && deviceModel.draft) {
                callback(null, iotcs.createError('Found draft device model.  Iotcsrary is not configured for draft device models.'));

                return;
            }

            Object.freeze(deviceModel);
            this._cache.deviceModels[deviceModelUrn] = deviceModel;
            callback(deviceModel);
        }, () => {
            this._getDeviceModel(dcdUtil, deviceModelUrn, callback);
        }, dcdUtil._dcdImpl);
    }
};
