/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.enterprise.StorageObject.SyncEvent = class {
    constructor(storage, name, virtualDevice) {
        _mandatoryArg(storage, iotcs.enterprise.StorageObject);
        _optionalArg(name, "string");
        _optionalArg(virtualDevice, iotcs.enterprise.VirtualDevice);

        this._storage = storage;
        this._name = name;
        this._virtualDevice = virtualDevice;
    }

    // Private/protected functions
    _getName() {
        return this._name;
    }

    _getSource() {
        return this._storage;
    }

    _getVirtualDevice() {
        return this._virtualDevice;
    }
};



