/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An object for receiving progress via the Progress callback.
 *
 * @param {StorageObject} storageObject - The storage object which progress will be tracked.
 *
 * @alias iotcs.device.util.StorageDispatcher.Progress
 * @class iotcs.device.util.StorageDispatcher.Progress
 * @extends iotcs.StorageDispatcher.Progress
 * @memberof iotcs.device.util.StorageDispatcher
 */
iotcs.device.util.StorageDispatcher.Progress = class extends iotcs.StorageDispatcher.Progress {
    constructor(storageObject) {
        super(storageObject);
        _mandatoryArg(storageObject, iotcs.StorageObject);
    }

    // Public functions
    /**
     * Get the number of bytes transferred.  This can be compared to the length of content obtained
     * by calling {@link iotcs.StorageObject#getLength}.
     *
     * @function getBytesTransferred
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {number} The number of bytes transferred.
     */
    getBytesTransferred() {
        return super.getBytesTransferred();
    }

    /**
     * Get the state of the transfer.
     *
     * @function getState
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {iotcs.device.util.StorageDispatcher.Progress.State} The state of the transfer.
     */
    getState() {
        return super.getState();
    }

    /**
     * Get the StorageObject that was queued for which this progress event pertains.
     *
     * @function getStorageObject
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {iotcs.StorageObject} A StorageObject.
     */
    getStorageObject() {
        return super.getStorageObject();
    }
};
