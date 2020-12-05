/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Class for modifying values in a PersistenceStore. The PersistenceStore itself is not updated
 * until commit() is called.
 */
iotcs.device.impl.PersistenceStoreTransaction = class {
    constructor(inMemoryPersistenceStore) {
        this._inMemoryPersistenceStore = inMemoryPersistenceStore;

        /**
         * @type {Map<string, object>}
         */
        this._transactions = new Map();
    }

    // Private/protected functions
    /**
     * Mark all values to be removed from the PersistenceStore object.  When commit is called,
     * values are removed before put methods are processed.
     *
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _clear() {
        this._transactions.clear();
        return this;
    }

    /**
     * Commit this transaction. This method persists the values to the backing store and
     * replaces the values in the {@code PersistenceStore} object.
     *
     * @return {boolean} true if the values were persisted.
     */
    _commit() {
        this._transactions.forEach((v, k) => {
            this._inMemoryPersistenceStore._items.set(k, v);
        });

        return true;
    }

    /**
     * Set an opaque value for the key, which is written back to the PersistenceStore object when
     * commit() is called.
     *
     * @param {string} key a key to be used to retrieve the value.
     * @param {object} value the value.
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _putOpaque(key, value) {
        this._transactions.set(key, value);
        return this;
    }

    /**
     * Mark all values to be removed from the PersistenceStore object.  When commit is called,
     * values are removed before put methods are processed.
     *
     * @param {string} key a key whose value is to be removed.
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _remove(key) {
        this._transactions.delete(key);
        return this;
    }
};
