/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * SQL database persistence for 'batchBy' policy data. The data consists of the message and storage
 * object, if the message is related to a storage object.
 */
iotcs.device.impl.BatchByPersistence = class {
    /**
     *
     */
    constructor() {
        /**
         * The database for persisting messages.
         *
         * @ignore
         */
        this._db = new sqlite3.Database(iotcs.device.impl.BatchByPersistence._DB_NAME,
            error =>
        {
            if (error) {
                iotcs.error(error.message);
            } else {
                this.createBatchByTableIfNotExists();
            }
        });
    }

    /**
     * Creates the message persistent storage table if it doesn't exist.
     */
    _createBatchByTableIfNotExists() {
        let tableExistsSql = "SELECT name FROM sqlite_master WHERE type='table' AND name=?";

        this._db.get(tableExistsSql, [iotcs.device.impl.BatchByPersistence._TABLE_NAME],
            (error, row) =>
        {
            if (error || !row) {
                let maxUuidLength = 40;

                let createTableSql =
                    'CREATE TABLE ' + iotcs.device.impl.BatchByPersistence._TABLE_NAME +
                    ' (' +
                    'TIMESTAMP BIGINT NOT NULL, ' +
                    'ENDPOINT_ID VARCHAR(' + maxUuidLength + ') NOT NULL, ' +
                    'MESSAGE_ID VARCHAR(' + maxUuidLength + ') NOT NULL, ' +
                    'MESSAGE BLOB, ' +
                    'PRIMARY KEY (MESSAGE_ID))';

                    let createTableIndex = 'CREATE INDEX endpoint_id ON ' +
                        iotcs.device.impl.BatchByPersistence._TABLE_NAME +
                        '(ENDPOINT_ID)';

                this._db.run(createTableSql, error => {
                    if (error) {
                        iotcs.error('Error creating table: ' + error);
                    }
                });
            }
        });
    }

    /**
     * @param {Set<Message>}
     * @return {boolean}
     */
    _delete(messages) {
        let stmt = null;

        // Construct multiple delete statements into one for better performance.
        messages.forEach(message => {
            stmt += iotcs.device.impl.BatchByPersistence._DELETE + "'" +
                message._internalObject.clientId + "'";
        });

        if (stmt && (stmt.length > 0)) {
            this._db.exec(stmt);
        }
    }

    /**
     * @param {string} endpointId
     * @return {Set<Message>}
     */
    _get(endpointId) {
        return new Promise((resolve, reject) => {
            let messages = new Set();

            this._db.all(iotcs.device.impl.BatchByPersistence._GET, endpointId,
                (error, rows) =>
            {
                if (error) {
                    iotcs.error('Table does not exist: ' +
                              iotcs.device.impl.BatchByPersistence._TABLE_NAME + '.');
                    reject();
                } else {
                    rows.forEach(row => {
                        let message = new iotcs.message.Message();
                        message._internalObject.clientId = row.MESSAGE_ID;
                        message._internalObject.eventTime = row.TIMESTAMP;
                        message._internalObject.source = row.ENDPOINT_ID;
                        let messageJson = JSON.parse(row.MESSAGE);

                        if (messageJson) {
                            message._internalObject.BASIC_NUMBER_OF_RETRIES =
                                messageJson.BASIC_NUMBER_OF_RETRIES;
                            message._internalObject.destination = messageJson.destination;
                            message._internalObject.payload = messageJson.payload;
                            message._internalObject.priority = messageJson.priority;
                            message._internalObject.reliability = messageJson.reliability;
                            message._internalObject.remainingRetries = messageJson.remainingRetries;
                            message._internalObject.sender = messageJson.sender;
                            message._internalObject.type = messageJson.type;
                            messages.add(message);
                        }
                    });

                    resolve(messages);
                }
            });
        });
    }

    /**
     *
     * @param {Set<Message>} messages
     * @param {string} endpointId
     */
    _save(messages, endpointId) {
        messages.forEach(message => {
            this._db.serialize(() => {
                let stmt = this.prepare(iotcs.device.impl.BatchByPersistence._SAVE);

                stmt.run(message._internalObject.eventTime, endpointId,
                    message._internalObject.clientId, JSON.stringify(message.getJSONObject()),
                        error => {
                            if (error) {
                                if (error.message &&
                                    !error.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
                                {
                                    iotcs.error('Error persisting message: ' + error);
                                }
                            }

                            stmt.finalize();
                });
            });
        });
    }
};

iotcs.device.impl.BatchByPersistence._DB_NAME = 'batch_by.sqlite';
iotcs.device.impl.BatchByPersistence._TABLE_NAME = "BATCH_BY";
iotcs.device.impl.BatchByPersistence._DELETE = 'DELETE FROM ' +
    iotcs.device.impl.BatchByPersistence._TABLE_NAME + ' WHERE MESSAGE_ID = ';
iotcs.device.impl.BatchByPersistence._GET = "SELECT * FROM " +
    iotcs.device.impl.BatchByPersistence._TABLE_NAME +
    " WHERE ENDPOINT_ID = ? ORDER BY TIMESTAMP";
iotcs.device.impl.BatchByPersistence._SAVE = 'INSERT INTO ' +
    iotcs.device.impl.BatchByPersistence._TABLE_NAME + ' VALUES (?, ?, ?, ?)';

iotcs.device.impl.BatchByPersistence._TIMESTAMP_COLUMN_INDEX = 1;
iotcs.device.impl.BatchByPersistence._ENDPOINT_ID_COLUMN_INDEX = 2;
iotcs.device.impl.BatchByPersistence._MESSAGE_ID_COLUMN_INDEX = 3;
iotcs.device.impl.BatchByPersistence._MESSAGE_BLOB_COLUMN_INDEX = 4;

