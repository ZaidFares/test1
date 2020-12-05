/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Attribute is an attribute in the device model.
 *
 * @class
 * @ignore
 */
iotcs.device.impl.Attribute = class {
    // Static private functions
    /**
     * @param {any} newValue
     * @param {object} spec
     * @return {any} - The new value or <code>null</code>.
     *
     * @ignore
     */
    static _checkAndGetNewValue(newValue, spec) {
        if (spec.type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in date time parameter.');
                return null;
            }
        }

        if (!iotcs.device.impl.Attribute._matchType(spec.type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec.name + '" has type [' + spec.type +
                        '].');
            return null;
        }

        return newValue;
    }

    /**
     * Determines if the value matches the requested type.  The requested type must be one of:
     *   - BOOLEAN
     *   - DATETIME
     *   - INTEGER 
     *   - NUMBER
     *   - STRING
     *   - URI
     *
     * @return {boolean|null} - <code>true</code> if the <code>value</code> is of the type specified
     *         in <code>reqType</code>, or <code>null</code> if the requeted type is not one of ther
     *         ones supported.
     * @throws error If the requested type is not one of the supported ones.
     *
     * @ignore
     */
    static _matchType(reqType, value) {
        _mandatoryArg(reqType, 'string');

        switch(reqType) {
        case 'INTEGER':
            return ((typeof value === 'number') && (value % 1 === 0));
        case 'NUMBER':
            return (typeof value === 'number');
        case 'STRING':
            return (typeof value === 'string');
        case 'BOOLEAN':
            return (typeof value === 'boolean');
        case 'DATETIME':
            return (value instanceof Date);
        case 'URI':
            return (value instanceof iotcs.ExternalObject) || (typeof value === 'string');
        default:
            iotcs.error('Illegal type.');
            return null;
        }
    }

    /**
     * {
     *    low: <value>,
     *    hight: <value>
     * }
     * @return {object} An <code>object</code> containing the parsed low and high range, or
     *         <code>null</null> if there was an error parsing the range.
     * 
     * @ignore
     */
    static _parseRange(type, rangeStr) {
        _mandatoryArg(type, 'string');
        _mandatoryArg(rangeStr, 'string');

        if ((type !== 'NUMBER') && (type !== 'INTEGER')) {
            iotcs.error('Device model specification is invalid.');
            return null;
        }

        let rangeLimits = rangeStr.split(',');

        if (rangeLimits.length != 2) {
            iotcs.error('Device model specification is invalid.');
            return null;
        }

        let first = parseFloat(rangeLimits[0]);
        let second = parseFloat(rangeLimits[1]);

        return {
            low: Math.min(first,second),
            high: Math.max(first,second)
        };
    }

    constructor(attributeSpec) {
        _mandatoryArg(attributeSpec, 'object');

        if ((!attributeSpec.name) || (!attributeSpec.type)) {
            iotcs.error('Attribute specification in device model is incomplete.');
            return;
        }

        this._spec = {
            name: attributeSpec.name,
            description: (attributeSpec.description || ''),
            type: attributeSpec.type,
            writable: (attributeSpec.writable || false),
            alias: (attributeSpec.alias || null),
            range: (attributeSpec.range ?
                    iotcs.device.impl.Attribute._parseRange(attributeSpec.type, attributeSpec.range) : null),
            defaultValue: ((typeof attributeSpec.defaultValue !== 'undefined') ?
                           attributeSpec.defaultValue : null)
        };

        if (this._spec.type === "URI" && (typeof this._spec.defaultValue === "string")) {
            this._spec.defaultValue = new iotcs.ExternalObject(this._spec.defaultValue);
        }

        // Private properties
        /**
         * @ignore
         */
        this._value = this._spec.defaultValue;

        /**
         * @ignore
         */
        this._lastKnownValue = this._spec.defaultValue;

        /**
         * @ignore
         */
        this._lastUpdate = null;

        // Public properties
        /**
         * @memberof iotcs.Attribute
         * @member {string} description - the description
         * of this attribute
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.defaultValue = this._spec.defaultValue;

        /**
         * @memberof iotcs.Attribute
         * @member {string} description - the description
         * of this attribute
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.description = this._spec.description;

        /**
         * @memberof iotcs.Attribute
         * @member {string} id - the unique/reproducible
         * id for this attribute (usually its name)
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.id = this._spec.name;

        /**
         * @memberof iotcs.Attribute
         * @member {string} type - one of <code>INTEGER</code>,
         * <code>NUMBER</code>, <code>STRING</code>, <code>BOOLEAN</code>,
         * <code>DATETIME</code>
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.type = this._spec.type;

        /**
         * @ignore
         * @memberof iotcs.Attribute
         * @member {boolean} writable - expressing whether
         * this attribute is writable or not
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.writable = this._spec.writable;
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _checkAndGetNewValueCallback(newValue, spec, virtualDevice, callback) {
        let isURICallback = false;

        if (spec.type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in date time parameter.');
                return;
            }
        }

        if (spec.type === 'URI') {
            if (newValue instanceof iotcs.ExternalObject) {
                // nothing to do
            } else if (typeof newValue === 'string') {
                // get uri from server
                if (this._isStorageCloudURI(newValue)) {
                    isURICallback = true;

                    virtualDevice._client._internalDev.createStorageObject(newValue,
                        (storage, error) => {
                            if (error) {
                                iotcs.error('Error during creation storage object: ' + error);
                                return;
                            }

                            let storageObject = new iotcs.device.StorageObject(storage.getURI(),
                                                                             storage.getName(),
                                                                             storage.getType(),
                                                                             storage.getEncoding(),
                                                                             storage.getDate(),
                                                                             storage.getLength());

                            storageObject._setDevice(virtualDevice._client._internalDev);
                            storageObject._setSyncEventInfo(spec.name, virtualDevice);

                            if (!iotcs.device.impl.Attribute._matchType(spec.type, storageObject)) {
                                iotcs.error('Type mismatch.  Attribute "' + spec.name +
                                          '" has type [' + spec.type + ']');
                                return;
                            }

                            callback(storageObject);
                        });

                    return;
                } else {
                    newValue = new iotcs.ExternalObject(newValue);
                }
            } else {
                iotcs.error('Invalid URI parameter.');
                return;
            }
        }

        if (!iotcs.device.impl.Attribute._matchType(spec.type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec.name + '" has type [' + spec.type + '].');
            return;
        }

        if (!isURICallback) {
            callback(newValue, true);
        }
    }

    /**
     * @ignore
     */
    _equal(newValue, oldValue, spec) {
        if (spec.type === 'DATETIME' &&
            (newValue instanceof Date) &&
            (oldValue instanceof Date))
        {
            return (newValue.getTime() === oldValue.getTime());
        } else {
            return (newValue === oldValue);
        }
    }

    /**
     * @private
     */
    _getNewValue(newValue, virtualDevice, callback) {
        try {
            if (this._isValidValue(newValue)) {
                this._checkAndGetNewValueCallback(newValue, this._spec, virtualDevice,
                                                  (attributeValue, isSync) => {
                                                      if (callback) {
                                                          callback(attributeValue, isSync);
                                                      }
                                                  });
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    //@TODO: See comment in AbstractVirtualDevice; this is not clean especially it is supposed to be
    // a private function and yet used in 4 other objects ...etc...; this looks like a required
    // ((semi-)public) API ... or an $impl.XXX or a function ()...
    _isValidValue(newValue) {
        try {
            newValue = iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                                                                                  this._spec);
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }

        if (typeof newValue === 'undefined') {
            iotcs.createError('Trying to set an invalid value.');
            return false;
        }

        if (this._spec.range &&
            ((newValue < this._spec.range.low) || (newValue > this._spec.range.high)))
        {
            iotcs.createError('Trying to set a value out of range [' + this._spec.range.low + ' - ' +
                              this._spec.range.high + '].');

            return false;
        }

        return true;
    }

    /**
     * @private
     */
    _localUpdate(newValue, nosync) {
        if (this._isValidValue(newValue)) {
            newValue = iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                                                                                  this._spec);

            if (this._equal(newValue, this._value, this._spec)) {
                return;
            }

            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;
            let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                newValue.getURI() : newValue;
            iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                                       this._spec.type + '" from ' + consoleValue + ' to ' +
                                       consoleNewValue + '.');
            this._value = newValue;
            this._lastKnownValue = newValue;

            if (!nosync) {
                let attributes = {};
                attributes[this._spec.name] = newValue;

                if (!self.device || !(self.device instanceof iotcs.device.VirtualDevice)) {
                    return;
                }

                this._virtualDevice._updateAttributes(attributes);
            }
        } else {
            iotcs.error('Invalid value.');
        }
    }

    /**
     * @private
     */
    _onUpdateResponse(error) {
        if (error) {
            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;

            let consoleLastKnownValue = (this._lastKnownValue instanceof iotcs.ExternalObject) ?
                this._lastKnownValue.getURI() : this._lastKnownValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                                       this._spec.type + '" from ' + consoleValue + ' to ' +
                                       consoleLastKnownValue + '.');

            this._value = this._lastKnownValue;
        } else {
            this._lastKnownValue = this._value;
        }

        this._lastUpdate = new Date().getTime();
    }

    /**
     * @private
     */
    _remoteUpdate(newValue) {
        try {
            if (this._isValidValue(newValue)) {
                if (!this._spec.writable) {
                    iotcs.createError('Trying to set a read only value.');
                    return false;
                }

                this._lastUpdate = Date.now();

                if (this._equal(newValue, this._lastKnownValue, this._spec)) {
                    return true;
                }

                this._lastKnownValue = newValue;

                let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                    this._value.getURI() : this._value;
                let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                    newValue.getURI() : newValue;

                iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                          this._spec.type + '" from ' + consoleValue + ' to ' + consoleNewValue +
                          '.');

                this._value = newValue;
                return true;
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }
    }

    // Public functions
    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} lastKnownValue - Used for getting the current value of
     *         this attribute
     */
    get lastKnownValue() {
        return this._lastKnownValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {Date} lastUpdate - The date of the last value update.
     */
    get lastUpdate() {
        return this._lastUpdate;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {function(Object)} onChange - Function called back when value as changed on the
     *         server side. Callback signature is <code>function (e) {}</code>, where <code>e</code>
     *         is <code>{'attribute':this, 'newValue':, 'oldValue':}</code>.
     */
    get onChange() {
        return this._onChange;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {function(Object)} onError - Function called back when value could not be changed.
     *         Callback signature is <code>function (e) {}</code>, where <code>e</code> is
     *         <code>{'attribute':this, 'newValue':, 'tryValue':}</code>.
     */
    get onError() {
        return this._onError;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} value - Used for setting or getting the current value
     *         of this attribute (subject to whether it is writable or not).
     */
    get value() {
        return this._value;
    }

    set lastKnownValue(newValue) {
       // Do nothing. 
    }

    set lastUpdate(newValue) {
        // Do nothing. 
    }

    set value(newValue) {
        this._localUpdate(newValue, false);
    }

    set onChange(newFunction) {
        if (!newFunction|| (typeof newFunction!== 'function')) {
            iotcs.error('Trying to set to onChange to something that is not a function!');
            return;
        }

        this._onChange = newFunction;
    }

    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set to onError to something that is not a function!');
            return;
        }

        this._onError = newFunction;
    }

};
