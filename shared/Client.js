/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: Add and validate this.tam = new iotcs.impl.TrustedAssetsManager();.

/**
 * Client of the Oracle IoT Cloud Service. A client is a
 * directly-connected device, a gateway, or an enterprise
 * application.
 *
 * @alias iotcs.Client
 * @class iotcs.Client
 */
iotcs.Client = class {
    constructor() {
        this._cache = this._cache || {};
        this._cache.deviceModels = {};
        this._useVirtualStorageDirectories =
            (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
            (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);
    }

    // Public functions
    // DJM: Need to fix the internalDev references.
    /**
     * Create a new {@link iotcs.StorageObject} with the given object name and mime&ndash;type.
     *
     * @param {string} name - The unique name to be used to reference the content in storage.
     * @param {string} [type=iotcs.device.StorageObject.MIME_TYPE] - The mime-type of the content.
     * @returns {iotcs.StorageObject} A storage object.
     *
     * @function createStorageObject
     * @memberof iotcs.Client
     */
    createStorageObject(name, type) {
        _mandatoryArg(name, "string");
        _optionalArg(type, "string");

        // this._internalDev is defined in iotcs.device.util.DirectlyConnectedDevice.
        if (this._useVirtualStorageDirectories &&
            (this._internalDev._dcdImpl._tam.getEndpointId() !== null))
        {
            this._internalDev._storageObjectName =
                this._internalDev._dcdImpl._tam.getEndpointId() + "/" + name;
        } else {
            this._internalDev._storageObjectName = name;
        }

        // The storage object is created here, but it's data isn't filled in until we get to the
        // iotcs.device.util.DirectlyConnectedDeviceUtil.syncStorage call.
        let storage = new iotcs.device.StorageObject(undefined, this._internalDev._storageObjectName,
                                                     type, undefined, undefined, undefined);

        storage._setDevice(this._internalDev);
        return storage;
    }

    /**
     * Create an AbstractVirtualDevice instance with the given device model for the given device
     * identifier.  This method creates a new AbstractVirtualDevice instance for the given
     * parameters.  The client library does not cache previously created AbstractVirtualDevice
     * objects.
     * <p>
     * A device model can be obtained by it's afferent urn with the Client if it is registered on the
     * cloud.
     *
     * @param {string} endpointId - The endpoint identifier of the device being modeled.
     * @param {object} deviceModel - The device model object holding the full description of that
     *        device model that this device implements.
     * @returns {iotcs.AbstractVirtualDevice} The newly created virtual device.
     *
     * @function createVirtualDevice
     * @memberof iotcs.Client
     * @see {@link iotcs.Client#getDeviceModel}
     */
    createVirtualDevice(endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');
        return new iotcs.AbstractVirtualDevice(endpointId, deviceModel);
    }

    /**
     * Get the device model for the specified device model URN.
     *
     * @param {string} deviceModelUrn - The urn of the device model.
     * @param {function} callback - The callback function.  This function is called with the
     *        following argument: a deviceModel object holding a full description e.g.
     *        <code>{ name:"", description:"", fields:[...], created:date, isprotected:boolean,
     *        lastmodified:date ...}</code>.  If an error occurs the deviceModel object is
     *        <code>null</code> and an error object is passed: callback(deviceModel, error) and the
     *        reason can be taken from the error message.
     *
     * @function getDeviceModel
     * @memberof iotcs.client
     */
    getDeviceModel(deviceModelUrn, callback) {
        _mandatoryArg(deviceModelUrn, 'string');
        _mandatoryArg(callback, 'function');

        let deviceModel = this._cache.deviceModels[deviceModelUrn];

        if (deviceModel) {
            callback(deviceModel);
            return;
        }

        var self = this;

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/deviceModels/' + deviceModelUrn
        }, '', (response, error) => {
            if (!response || error || !(response.urn)){
                callback(null, iotcs.createError('Invalid response on get device model: ', error));
                return;
            }

            let deviceModel = response;
            Object.freeze(deviceModel);
            self._cache.deviceModels[deviceModelUrn] = deviceModel;
            callback(deviceModel);
        }, () => {
            self.getDeviceModel(deviceModelUrn, callback);
        }, (iotcs.impl.Platform._userAuthNeeded() ? null :
            (iotcs.device.impl.DirectlyConnectedDeviceImpl ?
             new iotcs.device.impl.DirectlyConnectedDeviceImpl() :
             new iotcs.enterprise.impl.EnterpriseClientImpl())));
    }
};

