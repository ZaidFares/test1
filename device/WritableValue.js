/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * WritableValue is a wrapper around a value that can be read or written.
 */
iotcs.device.impl.WritableValue = class {
    constructor() {
        this._value = null;
    }

    // Private/protected functions
    /**
     * Get the value.
     *
     * @return {object} the value.
     */
    _getValue() {
        return this._value;
    }

    /**
     * Set the value
     *
     * @param {object} value the value.
     */
    _setValue(value) {
        this._value = value;
    }
};
