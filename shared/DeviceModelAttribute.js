/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceModelAttribute is the model of an attribute in a {@link DeviceModel}.
 */
iotcs.impl.DeviceModelAttribute = class {
    // Static private/protected functions
    /**
     * Returns the DeviceModelAttribute.Type for the type specified, or throws an Error if the type
     * specified is not one of the Types.
     *
     * @param {string} type
     * @return {DeviceModelAttribute.Type}
     */
    static _getType(type) {
        switch(type) {
            case 'BOOLEAN':
            case 'boolean':
                return iotcs.impl.DeviceModelAttribute.Type.BOOLEAN;
            case 'DATETIME':
            case 'datetime':
                return iotcs.impl.DeviceModelAttribute.Type.DATETIME;
            case 'INTEGER':
            case 'integer':
                return iotcs.impl.DeviceModelAttribute.Type.INTEGER;
            case 'NUMBER':
            case 'number':
                return iotcs.impl.DeviceModelAttribute.Type.NUMBER;
            case 'STRING':
            case 'string':
                return iotcs.impl.DeviceModelAttribute.Type.STRING;
            case 'URI':
            case 'uri':
                return iotcs.impl.DeviceModelAttribute.Type.URI;
            default:
                throw new Error('Invalid type: ' + type);
        }
    }

    /**
     *
     * @param {string} urn
     * @param {string} name
     * @param {string} description
     * @param {Type} type
     * @param {number} lowerBound
     * @param {number} upperBound
     * @param {Access} access
     * @param {string} alias
     * @param {object} defaultValue
     * @constructor
     */
    constructor(urn, name, description, type, lowerBound, upperBound, access, alias, defaultValue) {
        /**
         *
         *
         * @type {Access}
         */
        this._access = access;
        /**
         * The attribute's name.
         *
         * @type {string}
         * @deprecated
         */
        this._alias = alias;
        /**
         * The attribute's default value.
         *
         * @type {object}
         */
        this._defaultValue = defaultValue;
        /**
         * The attribute's description.
         *
         * @type {string}
         */
        this._description = description;
        /**
         * The name of the attribute
         *
         * @type {string}
         */
        this._name = name;
        /**
         * The attribute's lower bound.
         *
         * @type {number}
         */
        this._lowerBound = lowerBound;
        /**
         * The attribute type.
         *
         * @type {Type}
         */
        this._type = type;
        /**
         * The URN of the attribute.
         *
         * @type {string}
         */
        this._urn = urn;
        /**
         * The attribute's upper bound.
         *
         * @type {number}
         */
        this._upperBound = upperBound;
    }

    // Private/protected functions
    /**
     * Return the access rules for the attribute. The default is READ-ONLY
     *
     * @return {Access} the access rule for the attribute
     */
    _getAccess() {
        return this._access;
    }

    /**
     * Get the attribute name.
     *
     * @return {string} an alternative name for the attribute.
     * @deprecated Use {@link #getName()}
     */
    _getAlias() {
        return this._alias;
    }

    /**
     * Get the default value of the attribute as defined by the device model. If there is no
     * {@code defaultValue} for the attribute in the device model, then this method will return
     * {@code null}. The value {@code null} is <em>not</em> a default value.
     *
     * @return {object} the default value of the attribute, or {@code null} if no default is
     *         defined.
     */
    _getDefaultValue() {
        return this._defaultValue;
    }

    /**
     * A human friendly description of the attribute. If the model does not
     * contain a description, this method will return an empty string.
     *
     * @return {string} the attribute description, or an empty string.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Get the URN of the device type model this attribute comes from.
     *
     * @return {string} the URN of the device type model.
     */
    _getModel() {
        return this._urn;
    }

    /**
     * Get the attribute name.
     *
     * @return {string} the attribute name from the device model.
     */
    _getName() {
        return this._name;
    }

    /**
     * The data type of the attribute. If the access type of the attribute is
     * executable, this method will return null.
     *
     * @return {Type} the attribute's data type, or null.
     */
    _getType() {
        return this._type;
    }

    /**
     * For {@link Type#NUMBER} only, give the lower bound of the
     * acceptable range of values. Null is always returned for attributes
     * other than {@code NUMBER} type.
     *
     * @return {number} a Number, or null if no lower bound has been set.
     */
    _getLowerBound() {
        return this._lowerBound;
    }

    /**
     * For {@link Type#NUMBER} only, give the upper bound of the
     * acceptable range of values. Null is always returned for attributes
     * other than {@code NUMBER} type.
     *
     * @return {number} a Number, or null if no upper bound has been set
     */
    _getUpperBound() {
        return this._upperBound;
    }
};

iotcs.impl.DeviceModelAttribute.Access = {
    EXECUTABLE: 'EXECUTABLE',
    READ_ONLY: 'READ_ONLY',
    READ_WRITE: 'READ_WRITE',
    WRITE_ONLY: 'WRITE_ONLY'
};

Object.freeze(iotcs.impl.DeviceModelAttribute.Access);

iotcs.impl.DeviceModelAttribute.Type = {
    BOOLEAN: 'BOOLEAN',
    DATETIME: 'DATETIME',
    INTEGER: 'INTEGER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    URI: 'URI'
};

Object.freeze(iotcs.impl.DeviceModelAttribute.Type);

