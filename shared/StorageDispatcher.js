/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.StorageDispatcher = class {
    constructor(device) {
        // TODO: device appears to never be used, but it's in the public API.
        _mandatoryArg(device, "object");

        this._priorityQueue =
            new iotcs.impl.PriorityQueue(iotcs.oracle.iot.client.maximumStorageObjectsToQueue);

        this._onProgress = (arg, error) => {};
        device.storageDispatcher = this;
    }

    // Private/protected functions
    _push(storage) {
        this._priorityQueue._push(storage);
    }

    _remove(storage) {
        return this._priorityQueue._remove(storage);
    }

    // Public functions
    /**
     * Cancel the transfer of content to or from storage. This call has no effect if the transfer
     * is completed, already cancelled, has failed, or the storageObject is not queued.
     *
     * @param {iotcs.StorageObject} The content storageObject to be cancelled.
     */
    cancel(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        let cancelled = false;

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.QUEUED) {
            cancelled = (this._remove(storageObject) !== null);
        }

        if (cancelled ||
            storageObject._progressState === iotcs.StorageDispatcher.Progress.State.IN_PROGRESS)
        {
            storageObject._setProgressState(iotcs.StorageDispatcher.Progress.State.CANCELLED);
        }

        if (cancelled) {
            this._onProgress(new iotcs.StorageDispatcher.Progress(storageObject));
        }
    }

    // DJM: Should this be public or private?
    get onProgress() {
        return this._onProgress;
    }

    /**
     * Add a StorageObject to the queue to upload/download content to/from the Storage Cloud.
     *
     * @param {iotcs.StorageObject} The content storageObject to be queued.
     */
    queue(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.COMPLETED) {
            return;
        }

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.QUEUED ||
            storageObject._progressState === iotcs.StorageDispatcher.Progress.State.IN_PROGRESS)
        {
            iotcs.error("Can't queue storage during transfer process.");
            return;
        }

        storageObject._setProgressState(iotcs.StorageDispatcher.Progress.State.QUEUED);
        this._push(storageObject);
        this._onProgress(new iotcs.StorageDispatcher.Progress(storageObject));
    }

    // DJM: Should this be public or private?
    set onProgress(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trrying to set something to onProgress that is not a function!');
            return;
        }

        this._onProgress = newFunction;
    }
};

