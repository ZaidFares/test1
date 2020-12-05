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
 * {@link iotcs.device.DirectlyConnectedDevice#createStorageObject}.
 *
 * <b>Monitor sync completions:</b><br>
 * <code>storageObject.onSync = function (syncEvent);</code><br>
 * where syncEvent is a  iotcs.device.Sync.SyncEvent.
 * <p>
 *
 * @param {?string} uri - The full URI of the object in the Storage Cloud.
 * @param {?string} name - The name of the object used in the Storage Cloud.
 * @param {?string} type - The type of the object, if <code>null</code> then
 *        {@link iotcs.device.StorageObject.MIME_TYPE}.
 * @param {?string} encoding - The encoding of the object, or <code>null</code> if none.
 * @param {?Date} date - The last-modified date of the object.
 * @param {number} [length = -1] - The length of the object.
 *
 * @alias iotcs.device.StorageObject
 * @class iotcs.device.StorageObject
 * @extends iotcs.ExternalObject
 * @memberof iotcs.device
 */
iotcs.device.StorageObject = class extends iotcs.StorageObject {
    constructor(uri, name, type, encoding, date, length) {
        super(uri, name, type, encoding, date, length);

        this._deviceForSync = null;
        this._inputPath = null;
        this._nameForSyncEvent = null;
        this._outputPath = null;
        this._syncEvents = [];
        this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
        this._onSync = arg => {};
    }

    // "Private" functions
    _createSyncEvent() {
        return new iotcs.device.StorageObject.SyncEvent(this, this._nameForSyncEvent,
            this._deviceForSync);
    }

    _addSyncEvent(syncEvent) {
        switch (this.getSyncStatus()) {
        case iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC:
        case iotcs.device.StorageObject.SyncStatus.SYNC_PENDING:
            this._syncEvents.push(syncEvent);
            break;
        case iotcs.device.StorageObject.SyncStatus.IN_SYNC:
        case iotcs.device.StorageObject.SyncStatus.SYNC_FAILED:
            this._onSync(syncEvent);
            break;
        }
    }

    _handleStateChange() {
        if (this._deviceForSync) {
            this._deviceForSync._handleStorageObjectStateChange(this);
        }
    }

    _setDevice(device) {
        if (device instanceof iotcs.device.util.DirectlyConnectedDevice) {
            this._dcdUtil = device;
        } else {
            iotcs.error("Invalid device type.");
        }
    }

    _setSyncEventInfo(name, virtualDevice) {
        this._nameForSyncEvent = name;
        this._deviceForSync = virtualDevice;
    }

    // "Public" functions
    get onSync() {
        return this._onSync;
    }

    /**
     * Returns an unmodifiable copy of the custom metadata of this storage object.
     *
     * @returns {?object} The custom metadata for this storage object, or <code>null</code>.
     *
     * @function getCustomMetadata
     * @memberof iotcs.device.StorageObject
     */
    getCustomMetadata() {
        return this._metadata;
    }

    /**
     * Get the date and time the content was created or last modified in cloud storage.
     *
     * @returns {?Date} date the content was last modified in cloud storage,
     * or <code>null</code> if the content has not been uploaded
     * @memberof iotcs.device.StorageObject
     * @function getDate
     */
    getDate() {
        return this._date;
    }

    /**
     * Get the compression scheme of the content.
     *
     * @returns {?string} the compression scheme of the content,
     * or <code>null</code> if the content is not compressed
     * @memberof iotcs.device.StorageObject
     * @function getEncoding
     */
    getEncoding() {
        return this._encoding;
    }

    /**
     * Get the input file path when uploading content.
     *
     * @returns {string} input file path
     * @memberof iotcs.device.StorageObject
     * @function getInputPath
     */
    getInputPath() {
        return this._inputPath;
    }

    /**
     * Get the length of the content in bytes.
     * This is the number of bytes required to upload or download the content.
     *
     * @returns {number} the length of the content in bytes, or <code>-1</code> if unknown
     * @memberof iotcs.device.StorageObject
     * @function getLength
     */
    getLength() {
        return this._length;
    }

    /**
     * Get the the name of this object in the storage cloud.
     * This is name and path of the file that was uploaded to the storage cloud.
     *
     * @returns {string} name
     * @memberof iotcs.device.StorageObject
     * @function getName
     */
    getName() {
        return this._name;
    }

    /**
     * Get the output file path when downloading content.
     *
     * @returns {string} output file path
     * @memberof iotcs.device.StorageObject
     * @function getOutputPath
     */
    getOutputPath() {
        return this._outputPath;
    }

    /**
     * Get the status of whether or not the content is in sync with the storage cloud.
     *
     * @see {@link iotcs.device.StorageObject.SyncStatus}
     * @memberof iotcs.device.StorageObject
     * @function getSyncStatus
     */
    getSyncStatus() {
        return this._syncStatus;
    }

    /**
     * Get the mime-type of the content.
     *
     * @returns {string} type
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     * @memberof iotcs.device.StorageObject
     * @function getType
     */
    getType() {
        return this._type;
    }

    /**
     * Get the URI value.
     *
     * @returns {?string} A URI, or <code>null</code> if unknown.
     * @memberof iotcs.device.StorageObject.
     * @function getURI
     */
    getURI() {
        return this._uri;
    }

    set onSync(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onSync that is not a function!');
            return;
        }

        this._onSync = newFunction;
    }

    /**
     * Adds this metadata to the StorageObject.
     *
     * @param key {string} - The metadata key.
     * @param value {string} - The metadata value.
     * @throws Error - If key or value are <code>undefined</code>, <code>null</code>, or empty.
     *
     * @function setCustomMetadata
     * @memberof iotcs.device.StorageObject
     */
    setCustomMetadata(key, value) {
        if (!key || (key.length < 1) || !value || (value.length < 1)) {
            iotcs.error('Key and value must be non-empty strings.');
        }

        this._metadata[key] = value;
    }

    /**
     * Set an input file path for content to be uploaded.
     * The implementation allows for either the input path to be set,
     * or the output path to be set, but not both.
     * If the input path parameter is not null, the output path will be set to null.
     *
     * @param {string} path - input file path to which the content will be read.
     *
     * @memberof iotcs.device.StorageObject
     * @function setInputPath
     */
    setInputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.device.StorageObject.SyncStatus.SYNC_PENDING");
            return;
        }

        if (this._inputPath === null || this._inputPath !== path) {
            this._inputPath = path;
            this._outputPath = null;
            this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
            super.setInputStream(fs.createReadStream(path));
        }
    }

    /**
     * Set an output file path for content to be downloaded.
     * The implementation allows for either the output path to be set,
     * or the input path to be set, but not both.
     * If the output path parameter is not null, the input path will be set to null.
     *
     * @param {string} path - output file path to which the content will be written.
     *
     * @memberof iotcs.device.StorageObject
     * @function setOutputPath
     */
    setOutputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.device.StorageObject.SyncStatus.SYNC_PENDING");
            return;
        }

        if (this._outputPath === null || this._outputPath !== path) {
            this._outputPath = path;
            this._inputPath = null;
            this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
            super.setOutputStream(this, fs.createWriteStream(path));
        }
    }

    /**
     * Notify the library to sync content with the storage cloud.
     *
     * @memberof iotcs.device.StorageObject
     * @function sync
     */
    sync() {
        let syncEvent = this._createSyncEvent();

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC) {
            if (this._inputStream || this._outputStream) {
                this._syncStatus = iotcs.device.StorageObject.SyncStatus.SYNC_PENDING;
            } else {
                iotcs.error("Input path or output path must be set.");
                return;
            }

            this._addSyncEvent(syncEvent);
            new iotcs.device.util.StorageDispatcher(this._dcdUtil).queue(this);
        } else {
            this._addSyncEvent(syncEvent);
        }
    }
};


/**
 * Callback function called when sync is complete.
 *
 * @callback iotcs.device.StorageObject~onSyncCallback
 *
 * @param {iotcs.device.Sync.SyncEvent} event - A SyncEvent with the result of the sync.
 */
