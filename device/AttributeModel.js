/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The model of an attribute in a device model.
 *
 * @class
 */
iotcs.device.impl.AttributeModel  = class {
    constructor() {
        this._access = '';
        this._alias = '';
        /** @type {string} */
        this._description = '';
        this._deviceModelUrn = '';
        this._lowerBound = '';
        /** @type {string} */
        this._name = '';
        this._type = '';
        this._upperBound = '';
    }

    // Private/protected functions
    /**
     * Get the attribute name.
     *
     * @return {string} the attribute name from the device model.
     */
    _getName() {
        return this._name;
    }

    /**
     * Get the URN of the device type model this attribute comes from.
     *
     * @return {string} the URN of the device type model
     */
    _getDeviceModelUrn() {
        return this._deviceModelUrn;
    }

    /**
     * A human friendly description of the attribute. If the model does not contain a description, this method will
     * return an empty string.
     *
     * @return {string} the attribute description, or an empty string.
     */
    _getDescription() {
        return this._description;
    }
};
