/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @classdesc
 * StorageObject provides information about content in cloud storage.  For creation use
 * {@link iotcs.enterprise.DirectlyConnectedDevice#createStorageObject}.
 *
 * @class
 * @memberof iotcs.enterprise
 * @alias iotcs.enterprise.StorageObject
 * @extends iotcs.ExternalObject
 *
 * @param {?string} uri - The full URI of the object in the Storage Cloud.
 * @param {?string} name - The name of the object used in the Storage Cloud.
 * @param {?string} type - The type of the object, if <code>null</code> then
 *        {@link iotcs.enterprise.StorageObject.MIME_TYPE}.
 * @param {?string} encoding - The encoding of the object, or <code>null</code> if none.
 * @param {?Date} date - The last-modified date of the object.
 * @param {number} [length = -1] - The length of the object.
 */
iotcs.enterprise.StorageObject = class extends iotcs.StorageObject {
    constructor(url, name, type, encoding, date, length) {
        super(url, name, type, encoding, date, length);

        this._deviceForSync = null;
        this._inputPath = null;
        this._nameForSyncEvent = null;
        this.__onSync = arg => {};
        this._outputPath = null;
        this._syncEvents = [null];
        this._syncStatus = iotcs.enterprise.StorageObject.SyncStatus.NOT_IN_SYNC;

    }

    // Private/protected functions
    _addSyncEvent(syncEvent) {
        switch (this._getSyncStatus()) {
        case iotcs.enterprise.StorageObject.SyncStatus.NOT_IN_SYNC:
        case iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING:
            this._syncEvents.push(syncEvent);
            break;
        case iotcs.enterprise.StorageObject.SyncStatus.IN_SYNC:
        case iotcs.enterprise.StorageObject.SyncStatus.SYNC_FAILED:
            this.__onSync(syncEvent);
            break;
        }
    }

    _createSyncEvent() {
        return new iotcs.enterprise.StorageObject.SyncEvent(this._nameForSyncEvent,
                                                            this._deviceForSync);
    }

    get _onSync() {
        return this.__onSync;
    }

    /**
     * Returns the custom metadata of this storage object.
     *
     * @returns {?object} The custom metadata for this storage object, or <code>null</code>.
     *
     * @function getCustomMetadata
     * @memberof iotcs.enterprise.StorageObject
     */
    _getCustomMetadata() {
        return this._metadata;
    }

    _getInputPath() {
        return this._inputPath;
    }

    _getOutputPath() {
        return this._outputPath;
    }

    _getSyncStatus() {
        return this._syncStatus;
    }

    _handleStateChange() {
        if (this._deviceForSync) {
            this._deviceForSync._handleStorageObjectStateChange(this);
        }
    }

    set _onSync(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onSync that is not a function!');
            return;
        }

        this.__onSync = newFunction;
    }

    /**
     * Adds this metadata to the StorageObject.
     *
     * @param key {string} - The metadata key.
     * @param value {string} - The metadata value.
     * @throws Error - If key or value are <code>undefined</code>, <code>null</code>, or empty.
     *
     * @function setCustomMetadata
     * @memberof iotcs.enterprise.StorageObject
     */
    _setCustomMetadata(key, value) {
        if (!key || (key.length < 1) || !value || (value.length < 1)) {
            iotcs.error('key and value must be non-empty strings.');
        }

        this._metadata[key] = value;
    }

    _setDevice(device) {
        if (device instanceof iotcs.AbstractVirtualDevice || device instanceof iotcs.Client) {
            this._dcd = device;
        } else {
            iotcs.error("Invalid client type.");
        }
    }

    _setSyncEventInfo(name, virtualDevice) {
        this._nameForSyncEvent = name;
        this._deviceForSync = virtualDevice;
    }

    _sync() {
        let syncEvent = this._createSyncEvent();

        if (this._syncStatus === iotcs.enterprise.StorageObject.SyncStatus.NOT_IN_SYNC) {
            if (this._inputStream || this._outputStream) {
                this._syncStatus = iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING;
            } else {
                iotcs.error("Input path or output path must be set.");
                return;
            }

            this._addSyncEvent(syncEvent);

            if (this._dcd instanceof iotcs.Client) {
                new iotcs.enterprise.StorageDispatcher(this._dcd).queue(this);
            } else {
                new iotcs.enterprise.StorageDispatcher(this._dcd.client).queue(this);
            }
        } else {
            this._addSyncEvent(syncEvent);
        }
    }

    // Public functions
    setInputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING.");
            return;
        }
        if (this._inputPath === null || this._inputPath !== path) {
            this._inputPath = path;
            this._outputPath = null;
            this._syncStatus = iotcs.enterprise.StorageObject.SyncStatus.NOT_IN_SYNC;
            super.setInputStream(this, require("fs").createReadStream(path));
        }
    }

    setOutputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.enterprise.StorageObject.SyncStatus.SYNC_PENDING.");
            return;
        }

        if (this._outputPath === null || this._outputPath !== path) {
            this._outputPath = path;
            this._inputPath = null;
            this._syncStatus = iotcs.enterprise.StorageObject.SyncStatus.NOT_IN_SYNC;

            let fs = require('fs');
            let idx = path.lastIndexOf('/');

            if (idx > -1) {
                try {
                    fs.mkdirSync(path.substring(0, idx));
                } catch(error) {
                    // Do nothing.
                }
            }

            super.setOutputStream(this, fs.createWriteStream(path));
        }
    }
};

/**
 * Enumeration of sync status's.
 *
 * @alias SyncStatus
 * @enum {string}
 * @memberof iotcs.enterprise.StorageObject
 * @readonly
 * @static
 */
iotcs.enterprise.StorageObject.SyncStatus = {
    /** The content is not in sync with the storage cloud. */
    NOT_IN_SYNC: "NOT_IN_SYNC",
    /** The content is not in sync with the storage cloud, but a sync is pending. */
    SYNC_PENDING: "SYNC_PENDING",
    /** The content is in sync with the storage cloud. */
    IN_SYNC: "IN_SYNC",
    /** The content is not in sync with the storage cloud because the upload or download failed. */
    SYNC_FAILED: "SYNC_FAILED"
};

Object.freeze(iotcs.enterprise.StorageObject.SyncStatus);

