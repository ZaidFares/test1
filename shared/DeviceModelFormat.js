/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * DeviceModelFormat
 */
iotcs.impl.DeviceModelFormat = class {
    /**
     * @param {string} urn
     * @param {string} name
     * @param {string} description
     * @param {iotcs.message.Message.Type} type
     * @param {DeviceModelFormatField[]} fields
     */
    constructor(urn, name, description, type, fields) {
        // Instance "variables"/properties.
        this._urn = urn;
        this._name = name;
        this._description = description;
        this._fields = fields;

        if (iotcs.message.Message.Type.hasOwnProperty(type)) {
            this._type = type;
        } else {
            this._type = null;
        }
    }

    // Private/protected functions
    /**
     * @return {string}
     */
    _getDescription() {
        return this._description;
    }

    /**
     *
     * @return {DeviceModelFormatField[]}
     */
    _getFields() {
        return this._fields;
    }

    /**
     * @return {string}
     */
    _getName() {
        return this._name;
    }

    /**
     * @return {string}
     */
    _getType() {
        return this._type;
    }

    /**
     * @return {string}
     */
    _getUrn() {
        return this._urn;
    }

    /**
     * @return {string}
     */
    _toString() {
        let str =
            'name = ' + this._name +
            ', description = ' + this._description +
            ', type = ' + this._type +
            ',\n fields = [';


        let firstItem = true;

        this._fields.forEach(field => {
            if (!firstItem) {
                str += ',';
            } else {
                firstItem = false;
            }

            str += '\n {' + field + '}"';
        });

        if (!firstItem) {
            str += '\n';
        }

        str += ' ]';
        return str;
    }
};

