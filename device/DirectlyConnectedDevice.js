/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A directly-connected device is able to send messages to, and receive messages from, the IoT
 * server.  When the directly-connected device is activated on the server, the server assigns a
 * logical-endpoint identifier.  This logical-endpoint identifier is required for sending
 * messages to, and receiving messages from, the server.
 * <p>
 * The directly-connected device is able to activate itself using the direct activation capability.
 * The data required for activation and authentication is retrieved from a TrustedAssetsStore
 * generated using the TrustedAssetsProvisioner tool using the Default TrustedAssetsManager.
 * <p>
 * This object represents the Virtualization API (high-level API) for the directly-connected device
 * and uses the MessageDispatcher for sending/receiving messages.  Also it implements the message
 * dispatcher, diagnostics and connectivity test capabilities.  Also it can be used for creating
 * virtual devices.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation. This is optional. If none is given the default global library parameter
 *        is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 * @param {boolean} [gateway] - <code>true</code> to indicate creation of a GatewayDevice
 *        representation.
 *
 * @alias iotcs.device.DirectlyConnectedDevice
 * @class iotcs.device.DirectlyConnectedDevice
 * @extends iotcs.Client
 * @memberof iotcs.device
 * @see {@link iotcs.device.util.MessageDispatcher}
 */
iotcs.device.DirectlyConnectedDevice = class extends iotcs.Client {
    constructor(taStoreFile, taStorePassword, gateway) {
        super();

        /**
         * @type {DirectlyConnectedDevice|GatewayDevice}
         *
         * @ignore
         */
        this._internalDev = gateway ?
            new iotcs.device.util.GatewayDevice(taStoreFile, taStorePassword) :
            new iotcs.device.util.DirectlyConnectedDevice(taStoreFile, taStorePassword);

        this._virtualDevices = {};
        this.messageDispatcher = new iotcs.device.util.MessageDispatcher(this._internalDev);
        this.messageDispatcher.onDelivery = this._messageResponseHandler;
        this.messageDispatcher.onError = this._messageResponseHandler;
        this.storageDispatcher = new iotcs.device.util.StorageDispatcher(this._internalDev);
        this.storageDispatcher.onProgress = this._storageHandler;
    }

    // Private/protected functions
    _addVirtualDevice(device){
        this._removeVirtualDevice(device);

        if (!this._virtualDevices[device.getEndpointId()]) {
            this._virtualDevices[device.getEndpointId()] = {};
        }
        this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn] = device;
    }

    _messageResponseHandler(messages, exception) {
        let deviceMap = {};
        let self = this;

        messages.forEach(messageObj => {
            let message = messageObj.getJSONObject();

            if ((message.type === iotcs.message.Message.Type.DATA) &&
                message.payload.data &&
                message.payload.format &&
                (message.payload.format.indexOf(':attributes') > -1))
            {
                let model = message.payload.format.substring(0,
                    message.payload.format.indexOf(':attributes'));

                let devId = message.source;

                if (!(devId in deviceMap)) {
                    deviceMap[devId] = {};
                }

                if (!(model in deviceMap)) {
                    deviceMap[devId][model] = {};
                }

                for (let key in message.payload.data) {
                    deviceMap[devId][model][key] = message.payload.data[key];
                }
            } else if (((message.type === iotcs.message.Message.Type.ALERT) ||
                        (message.type === iotcs.message.Message.Type.DATA)) &&
                       message.payload.format)
            {
                let devId1 = message.source;

                if (!(devId1 in deviceMap)) {
                    deviceMap[devId1] = {};
                }

                let format = message.payload.format;

                if (devId1 in self._virtualDevices) {
                    for (let model1 in self._virtualDevices[devId1]) {
                        if (format in self._virtualDevices[devId1][model1]) {
                            if (!(model1 in deviceMap)) {
                                deviceMap[devId1][model1] = {};
                            }

                            deviceMap[devId1][model1][format] = message.payload.data;
                        }
                    }
                }
            }
        });

        for (let deviceId in deviceMap) {
            for (let deviceModel in deviceMap[deviceId]) {
                if ((deviceId in self._virtualDevices) &&
                    (deviceModel in self._virtualDevices[deviceId]))
                {
                    let device = self._virtualDevices[deviceId][deviceModel];
                    let attributeNameValuePairs = deviceMap[deviceId][deviceModel];
                    let attrObj = {};
                    let newValObj = {};
                    let tryValObj = {};

                    for (let attributeName in attributeNameValuePairs) {
                        let attribute = device[attributeName];

                        if (attribute && (attribute instanceof iotcs.device.impl.Attribute)) {
                            attribute._onUpdateResponse(exception);
                            attrObj[attribute.id] = attribute;
                            newValObj[attribute.id] = attribute.value;
                            tryValObj[attribute.id] = attributeNameValuePairs[attributeName];

                            if (exception && attribute.onError) {
                                let onAttributeErrorTuple = {
                                    attribute: attribute,
                                    newValue: attribute.value,
                                    tryValue: attributeNameValuePairs[attributeName],
                                    errorResponse: exception
                                };

                                attribute._onError(onAttributeErrorTuple);
                            }
                        } else if (attribute && (attribute.type === 'ALERT')) {
                            attrObj[attribute.urn] = new iotcs.device.Alert(device, attribute.urn);
                            let data = attributeNameValuePairs[attributeName];

                            for (let key in data) {
                                attrObj[attribute.urn].fields[key] = data[key];
                            }
                        } else if (attribute && (attribute.type === 'DATA')) {
                            attrObj[attribute.urn] = new iotcs.device.Data(device, attribute.urn);
                            let data1 = attributeNameValuePairs[attributeName];

                            for (let key1 in data1) {
                                attrObj[attribute.urn].fields[key1] = data1[key1];
                            }
                        }
                    }

                    if (exception && device.onError) {
                        let onDeviceErrorTuple = {
                            attributes: attrObj,
                            newValues: newValObj,
                            tryValues: tryValObj,
                            errorResponse: exception
                        };

                        device.onError(onDeviceErrorTuple);
                    }
                }
            }
        }
    }

    _removeVirtualDevice(device) {
        if (this._virtualDevices[device.getEndpointId()]) {
            if (this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn]) {
                delete this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn];
            }

            if (Object.keys(this._virtualDevices[device.getEndpointId()]).length === 0) {
                delete this._virtualDevices[device.getEndpointId()];
            }
        }
    }

    _storageHandler(progress, error) {
        let storage = progress.getStorageObject();

        if (error) {
            if (storage._deviceForSync && storage._deviceForSync.onError) {
                let tryValues = {};
                tryValues[storage._nameForSyncEvent] = storage.getURI();

                let onDeviceErrorTuple = {
                    newValues: tryValues,
                    tryValues: tryValues,
                    errorResponse: error
                };

                storage._deviceForSync.onError(onDeviceErrorTuple);
            }
            return;
        }

        if (storage) {
            /** @type iotcs.StorageDispatcher.Progress */
            let state = progress.getState();
            let oldSyncStatus = storage.getSyncStatus();

            switch (state) {
            case iotcs.StorageDispatcher.Progress.State.COMPLETED:
                storage._syncStatus = iotcs.device.StorageObject.SyncStatus.IN_SYNC;
                break;
            case iotcs.StorageDispatcher.Progress.State.CANCELLED:
            case iotcs.StorageDispatcher.Progress.State.FAILED:
                storage._syncStatus = iotcs.device.StorageObject.SyncStatus.SYNC_FAILED;
                break;
            case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            case iotcs.StorageDispatcher.Progress.State.INITIATED:
            case iotcs.StorageDispatcher.Progress.State.QUEUED:
                // do nothing
            }

            if (oldSyncStatus !== storage.getSyncStatus()) {
                storage._handleStateChange();

                if (storage._onSync) {
                    let syncEvent;

                    while ((syncEvent = storage._syncEvents.pop()) != null) {
                        storage._onSync(syncEvent);
                    }
                }
            }
        }
    }

    // Public functions
    /**
     * Activate the device.  The device will be activated on the server if necessary.  When the
     * device is activated on the server. The activation would tell the server the models that the
     * device implements. Also the activation can generate additional authorization information that
     * will be stored in the TrustedAssetsStore and used for future authentication requests.  This
     * can be a time/resource consuming operation for some platforms.
     * <p>
     * If the device is already activated, this method will throw an exception.  The user should call
     * the isActivated() method prior to calling activate.
     *
     * @function activate
     * @memberOf iotcs.device.DirectlyConnectedDevice
     *
     * @param {string[]} deviceModelUrns - An array of deviceModel URNs implemented by this directly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with this object
     *        but in the activated state.  If the activation is not successful then the object will
     *        be <code>null</code> and an error object is passed in the form callback(device, error)
     *        and the reason can be taken from error.message.
     */
    activate(deviceModelUrns, callback) {
        if (this.isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => {
            _mandatoryArg(urn, 'string');
        });

        let deviceModels = deviceModelUrns;
        deviceModels.push('urn:oracle:iot:dcd:capability:diagnostics');
        deviceModels.push('urn:oracle:iot:dcd:capability:message_dispatcher');
        deviceModels.push('urn:oracle:iot:dcd:capability:device_policy');

        this._internalDev.activate(deviceModels, (activeDev, error) => {
            if (!activeDev || error) {
                callback(null, error);
                return;
            }

            callback(this);
        });
    }

    /**
     * This method will close this directly connected device (client) and
     * all it's resources. All monitors required by the message dispatcher
     * associated with this client will be stopped and all created virtual
     * devices will be removed.
     *
     * @memberof iotcs.device.DirectlyConnectedDevice
     * @function close
     */
    close() {
        this._internalDev.close();

        for (let key in this._virtualDevices) {
            for (let key1 in this._virtualDevices[key]) {
                this._virtualDevices[key][key1].close();
            }
        }
    }

    /**
     * Create a VirtualDevice instance with the given device model for the given device identifier.
     * This method creates a new VirtualDevice instance for the given parameters. The client library
     * does not cache previously created VirtualDevice objects.
     * <p>
     * A device model can be obtained by it's afferent URN with the DirectlyConnectedDevice if it is
     * registered on the cloud.
     *
     * @function createVirtualDevice
     * @memberof iotcs.device.DirectlyConnectedDevice
     * @see {@link iotcs.device.DirectlyConnectedDevice#getDeviceModel}
     *
     * @param {string} endpointId - The endpoint identifier of the device being modeled.
     * @param {object} deviceModel - The device model object holding the full description of that
     *        device model that this device implements.
     * @returns {iotcs.device.VirtualDevice} The newly created virtual device.
     */
    createVirtualDevice(endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');

        // // Add the device policy manager for the Gateway.
        // let persistenceStore = PersistenceStoreManager._get(endpointId);
        // let devicePolicyManager = new DevicePolicyManager(this);
        // console.log('DirectlyConnectedDevice devicePolicyManager for endpointId: ' + this._.internalDev.getEndpointId() + ' = ' + devicePolicyManager);
        //
        // if (devicePolicyManager) {
        //     persistenceStore
        //         ._openTransaction()
        //         ._putOpaque('DevicePolicyManager', devicePolicyManager)
        //         ._commit();
        // }

        // let dcd = new iotcs.device.DirectlyConnectedDevice(
        //     this._.internalDev._.internalDev._.tam.taStoreFile,
        //     this._.internalDev._.internalDev._.tam.sharedSecret,
        //     this);

        return new iotcs.device.VirtualDevice(endpointId, deviceModel, this);
    }

    /**
     * @inheritdoc
     */
    getDeviceModel(deviceModelUrn, callback) {
        return this._internalDev.getDeviceModel(deviceModelUrn, callback);
    }

    /**
     * Return the logical-endpoint identifier of this directly-connected device.  The logical-endpoint
     * identifier is assigned by the server as part of the activation process.
     *
     * @function getEndpointId
     * @memberof iotcs.device.DirectlyConnectedDevice
     *
     * @returns {string} The logical-endpoint identifier of this directly-connected device.
     */
    getEndpointId() {
        return this._internalDev.getEndpointId();
    }

    /**
     * This will return the directly connected device activated state.
     *
     * @function isActivated
     * @memberof iotcs.device.DirectlyConnectedDevice
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        return this._internalDev.isActivated();
    }
};
