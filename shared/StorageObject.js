/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This StorageObject is the base class for the device and enterprise StorageObject's.
 *
 * StorageObject provides information about content in cloud storage.  For creation use
 * {@link iotcs.device.util.DirectlyConnectedDevice#createStorageObject}.
 *
 * @param {?string} uri - The full URI of the object in the Storage Cloud.
 * @param {?string} name - The name of the object used in the Storage Cloud.
 * @param {?string} type - The type of the object, if <code>null</code> then
 *        {@link iotcs.StorageObject.MIME_TYPE}.
 * @param {?string} encoding - The encoding of the object, or <code>null</code> if none.
 * @param {?Date} date - The last-modified date of the object.
 * @param {number} [length = -1] - The length of the object.
 *
 * @alias iotcs.StorageObject
 * @class
 * @extends iotcs.ExternalObject
 * @memberof iotcs
 */
iotcs.StorageObject = class extends iotcs.ExternalObject {
    constructor(uri, name, type, encoding, date, length) {
        super(uri);
        _optionalArg(uri, 'string');
        _optionalArg(name, 'string');
        _optionalArg(type, 'string');
        _optionalArg(encoding, 'string');
        _optionalArg(date, Date);
        _optionalArg(length, 'number');

        // DJM: Can the _spec contents be _ prefixed also?
        this._spec = {
            /** @type {object} */
            metadata: {},
            name: name || null,
            type: type || iotcs.StorageObject.MIME_TYPE,
            encoding: encoding || null,
            date: date || null,
            length: length || -1
        };

        /**
         * "New" storage authentication information.  The storageContainerUrl contains the storage
         * object name, therefore it needs to be associated with the storage object.  Storage object
         * authentication data specification:
         *
         * {
         *    'authToken': {string}
         *    'authStartTime': {date}
         *    'storageContainerUrl': {string}
         *    'headers': {object}
         * }
         */
        this._storageAuthenticationData = null;
        this._dcdUtil = null;
        this._date = this._spec.date;
        this._encoding = this._spec.encoding;
        this._inputStream = null;
        /** @type {object} */
        this._metadata = this._spec.metadata;
        this._name = this._spec.name;
        this._outputStream = null;
        this._progressState = iotcs.StorageDispatcher.Progress.State.INITIATED;
        this._type = this._spec.type;
    }

    // Private/protected functions
    get _length() {
        return this._spec.length;
    }

    _isCancelled() {
        return this._progressState === iotcs.StorageDispatcher.Progress.State.CANCELLED;
    }

    set _length(newLength) {
        this._spec.length = newLength;
    }

    _setAttributes(date, length) {
        this._date = date;
        this._length = length;
    }

    _setDevice(device) {
        if (device instanceof iotcs.device.util.DirectlyConnectedDevice) {
            this._dcdUtil = device;
        } else {
            iotcs.error("Invalid device type.");
        }
    }

    _setProgressState(state) {
        this._progressState = state;
    }

    _setURI(uri) {
        this._uri = uri;
    }

    // Public functions
    /**
     * Returns the metadata.
     *
     * @returns {?object} The custom metadata for this storage object, or <code>null</code>.
     *
     * @function getCustomMetadata
     * @memberof iotcs.StorageObject
     *
     */
    getCustomMetadata() {
        return this._metadata;
    }

    /**
     * Get the date and time the content was created or last modified in cloud storage.
     *
     * @function getDate
     * @memberof iotcs.StorageObject

     * @returns {?Date} The date the content was last modified in cloud storage, or <code>null</code>
     *          if the content has not been uploaded.
     */
    getDate() {
        return this._date;
    }

    /**
     * Get the compression scheme of the content.
     *
     * @function getEncoding
     * @memberof iotcs.StorageObject
     *
     * @returns {?string} The compression scheme of the content, or <code>null</code> if the content
     *          is not compressed.
     */
    getEncoding() {
        return this._encoding;
    }

    /**
     * Get the length of the content in bytes.  This is the number of bytes required to upload or
     * download the content.
     *
     * @function getLength
     * @memberof iotcs.StorageObject
     *
     * @returns {number} The length of the content in bytes, or <code>-1</code> if unknown.
     */
    getLength() {
        return this._length;
    }

    /**
     * Get the the name of this object in the storage cloud.  This is name and path of the file that
     * was uploaded to the storage cloud.
     *
     * @function getName
     * @memberof iotcs.StorageObject
     *
     * @returns {string} The name of this object in the storage cloud.
     */
    getName() {
        return this._name;
    }

    /**
     * Get the mime-type of the content.
     *
     * @function getType
     * @memberof iotcs.StorageObject
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     *
     * @returns {string} the mime-type of the content.
     */
    getType() {
        return this._type;
    }

    /**
     * Get the input file path when uploading content.
     *
     * @function getInputStream
     * @memberof iotcs.StorageObject
     *
     * @returns {?stream.Readable} The input stream, or <code>null</code> if not set.
     */
    getInputStream() {
        return this._inputStream;
    }

    /**
     * Get the output file path when downloading content.
     *
     * @function getOutputStream
     * @memberof iotcs.StorageObject
     *
     * @returns {?stream.Writable} The output stream, or <code>null</code> if not set.
     */
    getOutputStream() {
        return this._outputStream;
    }

    /**
     * Get the URI value.
     *
     * @function getURI
     * @memberof iotcs.StorageObject
     *
     * @returns {?string} The URI, or <code>null</code> if unknown.
     */
    getURI() {
        if (this._storageAuthenticationData && this._storageAuthenticationData.storageUrl) {
            this._uri = this._storageAuthenticationData.storageUrl;
        }

        return this._uri;
    }

    /**
     * Adds this metadata to the StorageObject.
     *
     * @param key {string} - The metadata key.
     * @param value {string} - The metadata value.
     * @throws Error - If key or value are <code>undefined</code>, <code>null</code>, or empty.
     *
     * @function setCustomMetadata
     * @memberof iotcs.StorageObject
     */
    setCustomMetadata(key, value) {
        if (!key || (key.length < 1) || !value || (value.length < 1)) {
            iotcs.error('key and value must be non-empty strings.');
        }

        this._metadata[key] = value;
    }

    /**
     * Set an input stream for content to be uploaded.  The implementation allows for either the
     * input stream to be set, or the output stream to be set, but not both.  If the input stream
     * parameter is not null, the output stream will be set to null.
     *
     * @function setInputStream
     * @memberof iotcs.StorageObject
     *
     * @param {stream.Readable} stream - A readable stream to which the content will be read.
     */
    setInputStream(stream) {
        _mandatoryArg(stream, require('stream').Readable);

        switch (this._progressState) {
        case iotcs.StorageDispatcher.Progress.State.QUEUED:
        case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            iotcs.error("Can't set input stream during transfer process.");
            return;
        case iotcs.StorageDispatcher.Progress.State.COMPLETED:
            this._progressState = iotcs.StorageDispatcher.Progress.INITIATED;
        }

        let fs = require('fs');
        let stats = fs.statSync(stream.path);
        this._length = stats.size;
        this._inputStream = stream;
        this._outputStream = null;
    }

    /**
     * Set an output stream for content to be downloaded.  The implementation allows for either the
     * output stream to be set, or the input stream to be set, but not both.  If the output stream
     * parameter is not null, the input stream will be set to null.
     *
     * @function setOutputStream
     * @memberof iotcs.StorageObject
     *
     * @param {stream.Writable} stream - A writable stream to which the content will be written.
     */
    setOutputStream(stream) {
        _mandatoryArg(stream, require('stream').Writable);

        switch (this._progressState) {
        case iotcs.StorageDispatcher.Progress.State.QUEUED:
        case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            iotcs.error("Can't set output stream during transfer process.");
            return;
        case iotcs.StorageDispatcher.Progress.State.COMPLETED:
            this._progressState = iotcs.StorageDispatcher.Progress.INITIATED;
        }

        this._outputStream = stream;
        this._inputStream = null;
    }

    /**
     * Synchronize content with the Storage Cloud Service.
     *
     * @function sync
     * @memberof iotcs.StorageObject
     *
     * @param {function(storage, error)} callback - The callback function.
     */
    sync(callback) {
        _mandatoryArg(callback, 'function');
        this._dcdUtil._syncStorage(this, callback, callback);
    }
};

/**
 * @constant MIME_TYPE
 * @memberof iotcs.StorageObject
 * @type {string}
 * @default "application/octet-stream"
 */
// DJM: Is this an un-changeable constant?
iotcs.StorageObject.MIME_TYPE = "application/octet-stream";
Object.freeze(iotcs.StorageObject.MIME_TYPE);
