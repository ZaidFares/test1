/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An event passed to the onSync callback when content referred to by an attribute value has been
 * successfully synchronized, or has failed to be synchronized.
 *
 * @param {iotcs.device.StorageObject} storageObject - The storage object to synchronize.
 * @param {string} [name] - The name of the storage object.
 * @param {iotcs.device.VirtualDevice} [virtualDevice]
 *
 * @alias iotcs.device.StorageObject.SyncEvent
 * @class iotcs.device.StorageObject.SyncEvent
 * @memberof iotcs.device.StorageObject
 */
iotcs.device.StorageObject.SyncEvent = class {
    constructor(storageObject, name, virtualDevice) {
        _mandatoryArg(storageObject, iotcs.device.StorageObject);
        _optionalArg(name, "string");
        _optionalArg(virtualDevice, iotcs.device.VirtualDevice);

        this._properties= {
            _storage: storageObject,
            _name: name,
            _virtualDevice: virtualDevice
        };
    }

    /**
     * Get the name of the attribute, action, or format that this event is associated with.
     *
     * @function getName
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {string} The name, or <code>null</code> if sync was called independently.
     */
    getName() {
        return this._properties._name;
    }

    /**
     * Get the StorageObject that is the source of this event.
     *
     * @function getSource
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {iotcs.device.StorageObject} The storage object.
     */
    getSource() {
        return this._properties._storage;
    }

    /**
     * Get the virtual device that is the source of the event.
     *
     * @function getVirtualDevice
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {iotcs.device.VirtualDevice} the virtual device, or <code>null</code> if sync was
     *          called independently.
     */
    getVirtualDevice() {
        return this._properties._virtualDevice;
    }
};
