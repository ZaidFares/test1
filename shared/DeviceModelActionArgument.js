/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * iotcs.impl.DeviceModelActionArgument
 */
iotcs.impl.DeviceModelActionArgument = class {
    // Static private/protected functions
    /**
     * @param {string} A JSON string.
     * @return {iotcs.impl.DeviceModelActionArgument}
     * @throws Error If the argument type is not one of iotcs.impl.DeviceModelAttribute.Type.
     */
    static _fromJson(jsonObject) {
        /** @type {string} */
        let name = jsonObject.name != null ? jsonObject.name : 'value';
        /** @type {string} */
        let type = jsonObject.type;
        let argType = iotcs.impl.DeviceModelAttribute.getType(type);

        /** @type {string} */
        let range = jsonObject.range ? jsonObject.range : null;
        /** @type {number} */
        let min, max;

        if (range) {
            let ranges = range.split(',');
            min = ranges[0];
            max = ranges[1];
        } else {
            min = null;
            max = null;
        }

        let defaultValue = jsonObject.defaultValue;
        return new iotcs.impl.DeviceModelActionArgument(name, argType, min, max, defaultValue);
    }

    /**
     *
     * @param {string} name
     * @param {string} description
     * @param {iotcs.impl.DeviceModelAttribute.Type} argType
     * @param {number} lowerBound
     * @param {number} upperBound
     * @param {object} defaultValue
     */
    constructor(name, description, argType, lowerBound, upperBound, defaultValue) {
        /** @type {string} */
        this._name = name;
        /** @type {string} */
        this._description = description;

        /** @type {iotcs.impl.DeviceModelAttribute.Type} */
        this._argType = argType;

        if (this._argType === iotcs.impl.DeviceModelAttribute.Type.INTEGER ||
            this._argType === iotcs.impl.DeviceModelAttribute.Type.NUMBER)
        {

        /** @type {number} */
            this._lowerBound = lowerBound;
            /** @type {number} */
            this._upperBound = upperBound;
        } else {
            /** @type {number} */
            this._lowerBound = this._upperBound = null;
        }

        /** @type {object} */
        this._defaultValue = defaultValue;
    }

    // Private/protected functions
    /**
     * The data type of the argument to the action.  If the action does not take an argument, then
     * this method will return {@code null}.
     *
     * @return {iotcs.impl.DeviceModelAttribute.Type} The action argument's data type, or {@code null}.
     */
    _getArgType() {
        return this._argType;
    }

    /**
     * Get the default value of the argument as defined by the device model.  If there is no
     * {@code defaultValue} for the argument in the device model, then this method will return
     * {@code null}.  The value {@code null} is <em>not</em> a default value.
     *
     * @return {object} The default value of the attribute, or {@code null} if no default is
     *         defined.
     */
    _getDefaultValue() {
        return null;
    }

    /**
     * For {@link Type#NUMBER} and {@link Type#INTEGER} only, give the lower bound of the acceptable
     * range of values for the action's argument.  {@code null} is always returned for actions other
     * than {@code NUMBER} or {@code INTEGER} type.
     *
     * @return {number} A number or {@code null} if no lower bound has been set.
     */
    _getLowerBound() {
        return this._lowerBound;
    }

    /**
     * Get the argument name.
     *
     * @return {string} The action name from the device model.
     */
    _getName() {
        return this._name;
    }

    /**
     * For {@link Type#NUMBER} and {@link Type#INTEGER} only, give the upper bound of the acceptable
     * range of values for the action's argument.  {@code null} is always returned for actions other
     * than {@code NUMBER} or {@code INTEGER} type.
     *
     * @return {number} A number, or {@code null} if no upper bound has been set.
     */
    _getUpperBound() {
        return this._upperBound;
    }

    /**
     * Returns a string representation of this instance.
     *
     * @return {string} A string  representation of this instance.
     */
    _toString() {
        return `iotcs.impl.DeviceModelActionArgument[name=${this._name}, type=${this._type}, ' +
               'lowerBound=${this._lowerBound}, upperBound=${this._upperBound}, ' +
               'default=${this._default}]`;
    }
};

