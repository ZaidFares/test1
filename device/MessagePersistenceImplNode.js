/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Provides for storing and retrieving messages to a persistent store.
 */
iotcs.device.impl.MessagePersistenceImpl = class {
    static _getInstance() {
        if (iotcs.oracle.iot.client.device.persistenceEnabled) {
            if (!iotcs.device.impl.MessagePersistenceImpl._instanceMessagePersistenceImpl) {
                iotcs.device.impl.MessagePersistenceImpl._instanceMessagePersistenceImpl =
                    new iotcs.device.impl.MessagePersistenceImpl();
            }

            return iotcs.device.impl.MessagePersistenceImpl._instanceMessagePersistenceImpl;
        } else {
            return null;
        }
    }

    constructor() {
        if (iotcs.oracle.iot.client.device.persistenceEnabled) {
            this._TABLE_NAME = 'MESSAGE_PERSISTENT_STORE';
            this._SAVE = 'INSERT INTO ' + this._TABLE_NAME + ' VALUES (?, ?, ?, ?)';
            // This statement is not parameterized.
            this._DELETE = 'DELETE FROM ' + this._TABLE_NAME + ' WHERE uuid = ';
            this._LOAD = 'SELECT * FROM ' + this._TABLE_NAME + ' WHERE ENDPOINT_ID = ? ORDER BY timestamp';
            this._ENDPOINT_ID_INDEX = 'CREATE INDEX endpoint_id ON ' + this._TABLE_NAME + '(ENDPOINT_ID)';

            this._db = new sqlite3.Database(iotcs.oracle.iot.client.device.persistenceDbName, error => {
                if (error) {
                    return console.error(error.message);
                } else {
                    this._createMspsTableIfNotExists();
                }
            });
        }
    }

    /**
     * Creates the message persistent storage table if it doesn't exist.
     */
    _createMspsTableIfNotExists() {
        let tableExistsSql = "SELECT name FROM sqlite_master WHERE type='table' AND name=?";

        this._db.get(tableExistsSql, [this._TABLE_NAME], (error, row) => {
            if (error || !row) {
                let maxEndpointIdLength = 100;
                let maxUuidLength = 40;

                let createTableSql =
                    "CREATE TABLE " + this._TABLE_NAME +
                    "(TIMESTAMP BIGINT NOT NULL," +
                    "UUID VARCHAR(" + maxUuidLength + ") NOT NULL," +
                    "ENDPOINT_ID VARCHAR(" + maxEndpointIdLength + ") NOT NULL," +
                    "MESSAGE BLOB," +
                    " PRIMARY KEY (UUID))";

                this._db.run(createTableSql, error => {
                    if (error) {
                        console.log('Error creating table: ' + error);
                    }
                });
            }
        });
    }

    /**
     *
     * @param {Set<Message>} messages
     */
    _delete(messages) {
        if (!iotcs.oracle.iot.client.device.persistenceEnabled) {
            return;
        }

        let stmt = '';

        // Construct multiple delete statements into one for better performance.
        messages.forEach(message => {
            stmt += this._DELETE + "'" + message._properties.clientId + "';";
        });

        if (stmt && (stmt.length > 0)) {
            this._db.exec(stmt);
        }
    }

    /**
     * @param {string} endpointId
     * @return {Promise} - a Set<Message> a set of loaded messages.  May be an empty set if there
     *         are no messages to load.
     */
    _load(endpointId) {
        return new Promise((resolve, reject) => {
            let messages = new Set();

            if (!iotcs.oracle.iot.client.device.persistenceEnabled) {
                resolve(messages);
                return;
            }

            this._db.all(this._LOAD, endpointId, (error, rows) => {
                if (error) {
                    let errorMsg = 'Table does not exist: ' + this._TABLE_NAME + '.';
                    reject(errorMsg);
                } else {
                    rows.forEach(row => {
                        let message = new iotcs.message.Message();
                        message._properties.clientId = row.UUID;
                        message._properties.eventTime = row.TIMESTAMP;
                        message._properties.source = row.ENDPOINT_ID;
                        let messageJson = JSON.parse(row.MESSAGE);

                        if (messageJson) {
                            message._properties.BASIC_NUMBER_OF_RETRIES =
                                messageJson.BASIC_NUMBER_OF_RETRIES;
                            message._properties.destination = messageJson.destination;
                            message._properties.payload = messageJson.payload;
                            message._properties.priority = messageJson.priority;
                            message._properties.reliability = messageJson.reliability;
                            message._properties.remainingRetries = messageJson.remainingRetries;
                            message._properties.sender = messageJson.sender;
                            message._properties.type = messageJson.type;
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
        if (!iotcs.oracle.iot.client.device.persistenceEnabled) {
            return;
        }

        let self = this;

        messages.forEach(message => {
            this._db.serialize(() => {
                let stmt = this._db.prepare(self._SAVE);

                stmt.run(message._properties.eventTime, message._properties.clientId,
                    endpointId, JSON.stringify(message.getJSONObject()), error => {
                        if (error) {
                            if (error.message &&
                                !error.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
                            {
                                console.log('Error persisting message: ' + error);
                            }
                        }

                        stmt.finalize();
                    });
            });
        });
    }
};
