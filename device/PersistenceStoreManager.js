/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * PersistenceStoreManager
 */
iotcs.device.impl.PersistenceStoreManager = class {
    /**
     *
     * @param {string} name
     * @return {InMemoryPersistenceStore}
     */
    static _get(name) {
        if (!iotcs.device.impl.PersistenceStoreManager._persistentStores) {
            /**
             * Map from name to a PersistenceStore instance.
             *
             * @type {Map<string, PersistenceStore>}
             */
            iotcs.device.impl.PersistenceStoreManager._persistentStores = new Map();
        }

        let persistentStore =
            iotcs.device.impl.PersistenceStoreManager._persistentStores.get(name);

        if (!persistentStore) {
            persistentStore = new iotcs.device.impl.InMemoryPersistenceStore(name);

            iotcs.device.impl.PersistenceStoreManager._persistentStores.set(name,
                persistentStore);
        }

        return persistentStore;
    }

    static _has(name) {
        if (!iotcs.device.impl.PersistenceStoreManager._persistentStores) {
            /**
             * Map from name to a PersistenceStore instance.
             *
             * @type {Map<string, PersistenceStore>}
             */
            iotcs.device.impl.PersistenceStoreManager._persistentStores = new Map();
            return false;
        }

        return iotcs.device.impl.PersistenceStoreManager._persistentStores.has(name);
    }
};
