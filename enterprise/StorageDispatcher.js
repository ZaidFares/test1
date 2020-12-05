/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.enterprise.impl.StorageDispatcher = class extends iotcs.StorageDispatcher {
    constructor(enterpriseClient) {
        _mandatoryArg(enterpriseClient, iotcs.enterprise.EnterpriseClient);
        super(enterpriseClient);

        if (enterpriseClient.storageDispatcher) {
            return enterpriseClient.storageDispatcher;
        }

        let poolingInterval = iotcs.oracle.iot.client.monitor.pollingInterval;
        let startPooling = null;
        let self = this;

        let processCallback = (storageDispatcher, state, bytes) => {
            storageDispatcher._setProgressState(state);
            let progress = new iotcs.StorageDispatcher.Progress(storageDispatcher);
            progress._setBytesTransferred(bytes);
            self.onProgress(progress);
        };

        let deliveryCallback = (storageDispatcher, error, bytes) => {
            storageDispatcher._setProgressState(iotcs.StorageDispatcher.Progress.State.COMPLETED);
            let progress = new iotcs.StorageDispatcher.Progress(storageDispatcher);
            progress._setBytesTransferred(bytes);
            self.onProgress(progress, error);
        };

        let errorCallback = (storageDispatcher, error, bytes) => {
            storageDispatcher._setProgressState(iotcs.StorageDispatcher.Progress.State.FAILED);
            let progress = new iotcs.StorageDispatcher.Progress(storageDispatcher);
            progress._setBytesTransferred(bytes);
            self.onProgress(progress, error);
        };

        let sendMonitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (startPooling + poolingInterval)) {
                if (enterpriseClient._refreshing || enterpriseClient._storageRefreshing) {
                    startPooling = currentTime;
                    return;
                }

                let storageDispatcher = self._priorityQueue._pop();

                while (storageDispatcher !== null) {
                    storageDispatcher._setProgressState(iotcs.StorageDispatcher.Progress.State.IN_PROGRESS);
                    self.onProgress(new iotcs.StorageDispatcher.Progress(storageDispatcher));
                    enterpriseClient._syncStorage(storageDispatcher, deliveryCallback,
                                                   errorCallback, processCallback);
                    storageDispatcher = self._priorityQueue._pop();
                }

                startPooling = currentTime;
            }
        });

        startPooling = Date.now();
        sendMonitor._start();
    }

    // Private/protected functions
    /** @ignore */
    _cancel(storage) {
        _mandatoryArg(storage, iotcs.StorageObject);
        super.cancel(storage);
    }

    /** @ignore */
    _queue(storage) {
        _mandatoryArg(storage, iotcs.StorageObject);
        super.queue(storage);
    }

    _stop() {
        this._sendMonitor._stop();
    }
};

