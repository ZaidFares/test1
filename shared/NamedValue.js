/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A name-value pair in an event.  Typically, the name is the name of an attribute, and value is the
 * attribute's value.  But a name-value pair could also be the name of a field in a format, or the
 * name of an action.
 *
 * @classdesc
 * @ignore
 */
iotcs.impl.NamedValue = class {
    /**
     * Constructs a NamedValue.
     *
     * @param {!string} name - The name of the value.
     * @param {*} value - The value.
     *
     * @class
     */
    constructor(name, value) {
        /**
         * The name of the value.
         *
         * @type {string}
         */
        this._name = name;

        /**
         * The value.
         *
         * @type {*}
         */
        this._value = value;

        /**
         * The next value in the chain.
         *
         * @type {NamedValue}
         */
        this._nextNamedValue = undefined;
    }

    /**
     * Get the name.
     *
     * @return {string} The name.
     */
    getName() {
        return this._name;
    }

    /**
     * Get the value.
     *
     * @return {*} The value.
     */
    getValue() {
        return this._value;
    }

    /**
     * Get the next name-value pair in the event.  This method returns <code>null</code> if there
     * are no more name-value pairs.
     *
     * @return {NamedValue} The next name-value pair, or <code>null</code>.
     */
    next() {
        return this._nextNamedValue;
    }

    /**
     * Sets the next name-value pair.
     *
     * @param {NamedValue} next - The next name-value pair.
     */
    setNext(next) {
        this._nextNamedValue = next;
    }
};

