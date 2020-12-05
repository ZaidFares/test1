/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @class
 */
/** @ignore */
iotcs.enterprise.impl.Attribute = class {
    // Static private functions
    /** @ignore */
    static _checkAndGetNewValue(newValue, spec) {
        if (spec._type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in the date time parameter.');
                return;
            }
        }

        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, newValue)) {
            iotcs.error('type mismatch; attribute "' + spec._name + '" has type [' + spec._type + ']');
            return;
        }

        return newValue;
    }

    /** @ignore */
    static _checkAndGetNewValueCallback(newValue, spec, virtualDevice, callback) {
        let isURICallback = false;

        if (spec._type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in the date time parameter.');
                return;
            }
        }

        if (spec._type === 'URI') {
            if (newValue instanceof iotcs.ExternalObject) {
                // Nothing to do.
            } else if (typeof newValue === 'string') {
                // Get URI from server.
                if (_isStorageCloudURI(newValue)) {
                    isURICallback = true;

                    virtualDevice._enterpriseClient._createStorageObject(newValue, (storage, error) => {
                        if (error) {
                            iotcs.error('Error during creation storage object: ' + error);
                            return;
                        }

                        let storageObject = new iotcs.enterprise.StorageObject(storage.getURI(),
                            storage.getName(), storage.getType(), storage.getEncoding(),
                            storage.getDate(), storage.getLength());

                        storageObject._setDevice(virtualDevice);
                        storageObject._setSyncEventInfo(spec._name, virtualDevice);

                        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, storageObject)) {
                            iotcs.error('Type mismatch.  Attribute "' + spec._name + '" has type [' +
                                        spec._type + '].');
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

        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec._name + '" has type [' + spec._type +
                        '].');
            return;
        }

        if (!isURICallback) {
            callback(newValue);
        }
    }

    /** @ignore */
    static _equal(newValue, oldValue, spec) {
        if (spec._type === 'DATETIME' && (newValue instanceof Date) && (oldValue instanceof Date)) {
            return (newValue.getTime() === oldValue.getTime());
        } else {
            return (newValue === oldValue);
        }
    }

    /** @ignore */
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
            return;
        }
    }

    /**
     * @param {object} attributeSpec - The attribute specification in JSON format.
     */
    constructor(attributeSpec) {
        _mandatoryArg(attributeSpec, 'object');
        
        if ((!attributeSpec.name) || (!attributeSpec.type)) {
            iotcs.error('Attribute specification in device model is incomplete.');
            return;
        }

        this._spec = {
            _alias: (attributeSpec.alias || null),
            _defaultValue: ((typeof attributeSpec.defaultValue !== 'undefined') ?
                            attributeSpec.defaultValue : null),
            _description: (attributeSpec.description || ''),
            _name: attributeSpec.name,
            _range: (attributeSpec.range ?
                     this._parseRange(attributeSpec.type, attributeSpec.range) : null),
            _type: attributeSpec.type,
            _writable: (attributeSpec.writable || false)
        };
        

        this._lastKnownValue = this._spec._defaultValue;
        this._lastUpdate = null;
        this._localUpdateRequest = false;
        // Using _ here explicitly because we may need to set value to null, which is an invalid
        // value and if we do that, the setter and validation checks will kick in.
        this._value = this._spec._defaultValue;
    }

    // "Private/Protected" functions
    /** @private */
    _getNewValue(newValue, virtualDevice, callback) {
        try {
            if (this._isValidValue(newValue)) {
                iotcs.enterprise.impl.Attribute._checkAndGetNewValueCallback(newValue, this._spec,
                    virtualDevice, attributeValue =>
                {
                    if (callback) {
                        callback(attributeValue);
                    }
                });
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    // @TODO: see comment in AbstractVirtualDevice; this is not clean especially it is supposed to
    // be a private function and yet used in 4 other objects ...etc...; this looks like a required
    // ((semi-)public) API ... or an $impl.XXX or a function ()...
    /** @private */
    _isValidValue(newValue) {
        try {
            newValue = iotcs.enterprise.impl.Attribute._checkAndGetNewValue(newValue, this._spec);
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }

        if (typeof newValue === 'undefined') {
            iotcs.createError('Trying to set an invalid value.');
            return false;
        }

        if (this._spec._range && ((newValue < this._spec._range.low) ||
                                  (newValue > this._spec._range.high)))
        {
            iotcs.createError('Trying to set a value out of range [' + this._spec._range.low +
                              ' - ' + this._spec._range.high + ']');
            return false;
        }

        return true;
    }

    /** @private */
    _localUpdate(newValue, nosync) {
        if (this._isValidValue(newValue)) {
            newValue = iotcs.enterprise.impl.Attribute._checkAndGetNewValue(newValue, this._spec);

            if (!this._spec._writable) {
                iotcs.error('Illegal write access.  Attribute "' + this._spec._name +
                            '" is read-only."');
                return;
            }

            if (iotcs.enterprise.impl.Attribute._equal(newValue, this._value, this._spec)) {
                return;
            }

            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;

            let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                newValue.getURI() : newValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name + '" of type "' +
                this._spec._type + '" from ' + consoleValue + ' to ' + consoleNewValue + '.');
 
            // _value, not value so the setter doesn't execute.
            this._value = newValue;
            this._localUpdateRequest = true;

            if (!nosync) {
                if (!self.device || !(self.device instanceof iotcs.enterprise.VirtualDevice)) {
                    return;
                }

                let attributes = {};
                attributes[this._spec._name] = newValue;
                self.device.controller.updateAttributes(attributes, true);
            }
        }  else {
            iotcs.error('Invalid value.');
        }
    }

    /** @private */
    _onUpdateResponse(error) {
        if (error) {
            let consoleValue =
                (this._value instanceof iotcs.ExternalObject)? this._value.getURI() : this._value;

            let consoleLastValue = (this.lastKnownValue instanceof iotcs.ExternalObject) ?
                this.lastKnownValue.getURI() : this.lastKnownValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name + '" of type "' +
                this._spec._type + '" from ' + consoleValue + ' to ' + consoleLastValue + '.');

            this._value = this.lastKnownValue;
        }

        this.lastUpdate = new Date().getTime();
        this._localUpdateRequest = false;
    }

    /** @ignore */
    _parseRange(type, rangeStr) {
        _mandatoryArg(type, 'string');
        _mandatoryArg(rangeStr, 'string');

        if ((type !== 'NUMBER') && (type !== 'INTEGER')) {
            iotcs.error('Device model specification is invalid.');
            return;
        }

        let rangeLimits = rangeStr.split(',');

        if (rangeLimits.length != 2) {
            iotcs.error('Device model specification is invalid.');
            return;
        }

        let first = parseFloat(rangeLimits[0]);
        let second = parseFloat(rangeLimits[1]);

        return {
            low: Math.min(first,second),
            high: Math.max(first,second)
        };
    }

    /** @private */
    _remoteUpdate(newValue) {
        try {
            if (this._isValidValue(newValue)) {
                this.lastUpdate = Date.now();

                if (iotcs.enterprise.impl.Attribute._equal(newValue, this.lastKnownValue,
                                                           this._spec))
                {
                    return;
                }

                this.lastKnownValue = newValue;

                if (!(this._spec._writable && this._localUpdateRequest)) {
                    let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                        this._value.getURI() : this._value;

                    let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                        newValue.getURI() : newValue;

                    iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name +
                        '" of type "' + this._spec._type + '" from ' + consoleValue + ' to ' +
                        consoleNewValue + '.');

                    this._value = newValue;
                }
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    // Public functions
    get defaultValue() {
        return this._spec._defaultValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} description - the description
     * of this attribute
     */
    get description() {
        return this._spec._description;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} id - the unique/reproducible
     * id for this attribute (usually its name)
     */
    get id() {
        return this._spec._name;
    }

    get lastKnownValue() {
        return this._lastKnownValue;
    }

    get lastUpdate() {
        return this._lastUpdate;
    }

    get onChange() {
        return this._onChange;
    }

    get onError() {
        return this._onError;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} type - one of <code>INTEGER</code>,
     * <code>NUMBER</code>, <code>STRING</code>, <code>BOOLEAN</code>,
     * <code>DATETIME</code>
     */
    get type() {
        return this._spec._type;
    }

    get value() {
        return this._value;
    }

    /**
     * @ignore
     * @memberof iotcs.Attribute
     * @member {boolean} writable - expressing whether
     * this attribute is writable or not
     */
    get writable() {
        return this._spec._writable;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} lastKnownValue - 
     * used for getting the current value of this attribute 
     */
    set lastKnownValue(newValue) {
        this._lastKnownValue = newValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {Date} lastUpdate - the date of the last value update
     */
    set lastUpdate(newValue) {
        this._lastUpdate = newValue;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {function(Object)} onChange - function called
     * back when value as changed on the server side. Callback
     * signature is <code>function (e) {}</code>, where <code>e</code> 
     * is <code>{'attribute':this, 'newFunction':, 'oldValue':}</code>
     */
    set onChange(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set to onChange to something that is not a function!');
            return;
        }

        this._onChange = newFunction;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {function(Object)} onError - function called
     * back when value could not be changed. Callback signature is
     * <code>function (e) {}</code>, where <code>e</code> is 
     * <code>{'attribute':this, 'newFunction':, 'tryValue':}</code>
     */
    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onError to something that is not a function!');
            return;
        }

        this._onError = newFunction;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {(number|string|boolean|Date)} value - used for setting or
     * getting the current value of this attribute (subject to whether it is writable
     * or not).
     */
    set value(newValue) {
        this._localUpdate(newValue, false);
    }
};

