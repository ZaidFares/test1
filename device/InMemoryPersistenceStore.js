/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * InMemoryPersistenceStore
 */
iotcs.device.impl.InMemoryPersistenceStore = class {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        this._name = name;

        /**
         * Map of items.  Key is the item name.
         * @type {Map<string, object>}
         */
        this._items = new Map();
    }

    /**
     * Return true if this PersistenceStore contains the given key.
     *
     * @param key the key to search for.
     * @returns {boolean} true if this {PersistenceStore contains the given key.
     */
    _contains(key) {
        return iotcs.device.impl.PersistenceStoreManager._has(key);
    }

    /**
     * Return a map of all key/value pairs in this PersistenceStore.
     *
     * @return {Map<string, object>}
     */
    _getAll() {
        return new Map(this._items);
    }

    _getName() {
        return this._name;
    }

    /**
     * Return an object value for the given key.
     *
     * @param {string} key the key to search for.
     * @param {object} defaultValue the value to use if this PersistenceStore does not contain the
     *                 key.
     * @return {object} the value for the key.
     */
    _getOpaque(key, defaultValue) {
        let obj = this._items.get(key);
        return obj ? obj : defaultValue;
    }

    _openTransaction() {
        return new iotcs.device.impl.PersistenceStoreTransaction(this);
    }
};
