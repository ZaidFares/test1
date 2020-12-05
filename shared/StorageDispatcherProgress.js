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
 * @ignore
 *
 * @alias iotcs.StorageDispatcher.Progress
 * @class iotcs.StorageDispatcher.Progress
 * @memberof iotcs.StorageDispatcher
 */
iotcs.StorageDispatcher.Progress = class {
    /**
     * @ignore
     */
    constructor(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        this._storageObject = storageObject;
        this._progressState = storageObject._progressState;
        this._bytesTransferred = 0;
    }

    // Private/protected functions
    /**
     * @ignore
     */
    getBytesTransferred() {
        return this._bytesTransferred;
    }

    /**
     * @ignore
     */
    getState() {
        return this._progressState;
    }

    /**
     * @ignore
     */
    getStorageObject() {
        return this._storageObject;
    }

    /**
     * @ignore
     */
    _setBytesTransferred(bytes) {
        this._bytesTransferred = bytes;
    }
};

iotcs.StorageDispatcher.Progress.State = {
    /** Up/download was cancelled before it completed */
    CANCELLED: "CANCELLED",
    /** Up/download completed successfully */
    COMPLETED: "COMPLETED",
    /** Up/download failed without completing */
    FAILED: "FAILED",
    /** Up/download is currently in progress */
    IN_PROGRESS: "IN_PROGRESS",
    /** Initial state */
    INITIATED: "INITIATED",
    /** Up/download is queued and not yet started */
    QUEUED: "QUEUED"
};

Object.freeze(iotcs.StorageDispatcher.Progress.State);
