/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The StorageDispatcher queues content for automatic upload to, or download from, the Oracle
 * Storage Cloud Service.
 * <p>
 * There can be only one StorageDispatcher instance per DirectlyConnectedDevice at a time and it is
 * created at first use.  To close an instance of a StorageDispatcher the
 * <code>DirectlyConnectedDevice.close</code> method must be used.
 * <p>
 * The onProgress function can be used to set handlers that are used for notifying as the transfer
 * progresses:
 * <p>
 * <code>storageDispatcher.onProgress = function (progress, error);</code><br>
 * where {@link Progress|iotcs.device.util.StorageDispatcher.Progress} progress is an object
 * represents the transfer progress of storage object.
 *
 * @param {iotcs.device.util.DirectlyConnectedDevice} device - The directly connected device
 *        (Messaging API) associated with this storage dispatcher.
 *
 * @alias iotcs.device.util.StorageDispatcher
 * @class iotcs.device.util.StorageDispatcher
 * @extends iotcs.StorageDispatcher
 * @memberof iotcs.device.util
 */
iotcs.device.util.StorageDispatcher = class extends iotcs.StorageDispatcher {
    constructor(device) {
        _mandatoryArg(device, iotcs.device.util.DirectlyConnectedDevice);

        if (device.storageDispatcher) {
            return device.storageDispatcher;
        }

        super(device);

        _mandatoryArg(device, iotcs.device.util.DirectlyConnectedDevice);

        this._dcdUtil = device;
        this._poolingInterval = iotcs.oracle.iot.client.device.defaultMessagePoolingInterval;
        this._startPooling = null;

        let deliveryCallback = (storage, error, bytes) => {
            storage._setProgressState(iotcs.StorageDispatcher.Progress.State.COMPLETED);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress, error);
        };

        let errorCallback = (storage, error, bytes) => {
            storage._setProgressState(iotcs.StorageDispatcher.Progress.State.FAILED);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress, error);
        };

        let processCallback = (storage, state, bytes) => {
            storage._setProgressState(state);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress);
        };

        let self = this;

        this._sendMonitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (self._startPooling + self._poolingInterval)) {
                if (!device.isActivated() ||
                    device._activating ||
                    device._refreshing ||
                    device._storageRefreshing)
                {
                    self._startPooling = currentTime;
                    return;
                }

                let storage = self._priorityQueue._pop();

                while (storage !== null) {
                    storage._setProgressState(iotcs.StorageDispatcher.Progress.State.IN_PROGRESS);
                    self.onProgress(new iotcs.device.util.StorageDispatcher.Progress(storage));
                    self._dcdUtil._syncStorage(storage, deliveryCallback, errorCallback,
                                               processCallback);
                    storage = self._priorityQueue._pop();
                }

                self._startPooling = currentTime;
            }
        });

        self._startPooling = Date.now();
        self._sendMonitor._start();
    }

    // Private/protected functions
    _stop() {
        this._sendMonitor._stop();
    }

    // Public functions
    /**
     * Cancel the transfer of content to or from storage.  This call has no effect if the transfer is
     * completed, already cancelled, has failed, or the storageObject is not queued.
     *
     * @function cancel
     * @memberof iotcs.device.util.StorageDispatcher
     *
     * @param {iotcs.StorageObject} storageObject - The content storageObject to be cancelled.
     */
    cancel(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);
        super.cancel(this, storageObject);
    }

    /**
     * Add a StorageObject to the queue to upload/download content to/from the Storage Cloud.
     *
     * @function queue
     * @memberof iotcs.device.util.StorageDispatcher
     *
     * @param {iotcs.StorageObject} storageObject - The content storageObject to be queued.
     */
    queue(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);
        super.queue(storageObject);
    }
};

