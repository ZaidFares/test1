/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * A convenience class to represent name-value pairs.
 */
iotcs.device.impl.Pair = class {
    /**
     * Creates a new pair
     *
     * @param {object} key The key for this pair.
     * @param {object} value The value to use for this pair.
     */
    constructor(key, value) {
        /**
         * Name of this Pair.
         */
        this._key = key;
        /**
         * Value of this this Pair.
         */
        this._value = value;
    }

    /**
     * Gets the key for this pair.
     *
     * @return {object} key for this pair
     */
    _getKey() {
        return this._key;
    }

    /**
     * Gets the value for this pair.
     *
     * @return {object} value for this pair
     */
    _getValue() {
        return this._value;
    }
};
