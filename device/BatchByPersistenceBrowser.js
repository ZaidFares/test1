/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * SQL database persistence for 'batchBy' policy data for the browser.   Contains empty
 * implementations of the required functions for the browser.
 */
iotcs.device.impl.BatchByPersistence = class {
    /**
     * Creates the message persistent storage table if it doesn't exist.
     */
    _createBatchByTableIfNotExists() {}

    /**
     * @param {Set<iotcs.Message>}
     * @return {boolean}
     */
    _delete(messages) {}

    /**
     * @param {string} endpointId
     * @return {Set<iotcs.message.Message>}
     */
    _get(endpointId) {
        return new Promise((resolve, reject) => {
            resolve(new Set());
        });
    }

    /**
     *
     * @param {Set<iotcs.message.Message>} messages
     * @param {string} endpointId
     */
    _save(messages, endpointId) {}
};
