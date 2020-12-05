/*
 * Copyright (c) 2018, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Describes a field of a message.
 */
iotcs.impl.DeviceModelFormatField = class {
    /**
     *
     * @param {string} name
     * @param {string} description
     * @param {string} type
     * @param {boolean} optional
     */
    constructor(name, description, type, optional) {
        this._name = name;
        this._description = description;
        this._optional = optional;

        if (DeviceModelAttribute.Type.hasOwnProperty(type)) {
            this._type = type;
        } else {
            this._type = null;
        }
    }

    // Private/protected functions
    /**
     * @return {string}
     */
    _getName() {
        return this._name;
    }

    /**
     * @return {string} - DeviceModelAttribute.Type
     */
    _getType() {
        return this._type;
    }

    /**
     * @return {boolean}
     */
    _isOptional() {
        return this._optional;
    }

    /**
     * @return {string}
     */
    _toString() {
        let str = 'name = ' + this._name +
        ', description = ' + this._description +
        ', type = ' + this._type +
        ', optional = ' + this._optional + 'optional';

        return str;
    }
};
