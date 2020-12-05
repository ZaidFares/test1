/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

//TODO: jsdoc issue: MessageEnumerator appears in iotcs.* and not at index level (probably due to
//      missing class jsdoc on iotcs.enterprise.MessageEnumerator) @DONE
//TODO: move default value pageSize to iotcs.oracle.iot.... global @DONE
//TODO: move default value messageListenMaxSize to iotcs.oracle.iot.... global @DONE: changed name
//      also

/**
 * A class that implements a way of getting the history of all messages from the cloud and also
 * register listeners to the messages received.
 *
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        application context of the messages that need to be enumerated or listened to.
 *
 * @alias iotcs.enterprise.MessageEnumerator
 * @class iotcs.enterprise.MessageEnumerator
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.MessageEnumerator = class {
    // Static private/protected functions
    /**ignore*/
    static _addMessageMonitor(enumerator, messageType) {
        if (messageType === enumerator._message._allKey) {
            enumerator._message._types.forEach(type => {
                if (!enumerator._message._monitors[type]) {
                    enumerator._message._monitors[type] = new iotcs.impl.Monitor(() => {
                        iotcs.enterprise._messagesMonitor(enumerator, type);
                    });
                }
                if (enumerator._message._monitors[type] &&
                    !enumerator._message._monitors[type]._running)
                {
                    enumerator._message._lastTime[type] = Date.now();
                    enumerator._message._inProgress[type] = false;
                    enumerator._message._monitors[type]._start();
                }
            });
        } else {
            if (!enumerator._message._monitors[messageType]) {
                enumerator._message._monitors[messageType] = new iotcs.impl.Monitor(() => {
                    iotcs.enterprise._messagesMonitor(enumerator, messageType);
                });
            }
            if (enumerator._message._monitors[messageType] &&
                !enumerator._message._monitors[messageType]._running)
            {
                enumerator._message._lastTime[messageType] = Date.now();
                enumerator._message._inProgress[messageType] = false;
                enumerator._message._monitors[messageType]._start();
            }
        }
    }

    /**ignore*/
    static _handleMessagesResponse(enumerator, response, messageType) {
        if (response &&
            response.items &&
            Array.isArray(response.items) &&
            (response.items.length > 0))
        {
            for (var i = 0; i < response.items.length; i++ ){
                if (response.items[i].receivedTime &&
                    (response.items[i].receivedTime === enumerator._message._lastTime[messageType]))
                {
                    continue;
                }

                var key2 = response.items[i].source;
                var key1 = response.items[i].type;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = enumerator._message._allKey;
                key1 = response.items[i].type;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = response.items[i].source;
                key1 = enumerator._message.allKey;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = enumerator._message._allKey;
                key1 = enumerator._message._allKey;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }
            }

            if (!response.hasMore) {
                if ((response.items.length > 0) &&
                    response.items[response.items.length-1].receivedTime)
                {
                    enumerator._message._lastTime[messageType] =
                        response.items[response.items.length - 1].receivedTime;
                } else {
                    enumerator._message._lastTime[messageType] =
                        enumerator._message._lastTime[messageType] + 1;
                }
            }
        }
    }

    /**ignore*/
    static _messagesMonitor(enumerator, messageType) {
        if (enumerator._message._inProgress[messageType]) {
            return;
        }

        enumerator._message._inProgress[messageType] = true;

        var pageable = enumerator.getMessages(null, messageType, false,
                                              enumerator._message._lastTime[messageType], null);
        var hasMore = false;

        pageable.page('first', enumerator._message._maxLimit).then(response => {
            iotcs.enterprise.MessageEnumerator._handleMessagesResponse(enumerator, response,
                                                                       messageType);
            hasMore = response.hasMore;

            var nextCheck = () => {
                pageable.page('next').then(response => {
                    iotcs.enterprise.MessageEnumerator._handleMessagesResponse(enumerator, response,
                                                                               messageType);
                    hasMore = response.hasMore;

                    if (hasMore) {
                        nextCheck();
                    } else {
                        enumerator._message._inProgress[messageType] = false;
                    }
                }, error => {
                    iotcs.createError('Invalid response on message monitoring.');
                });
            };

            if (hasMore) {
                nextCheck();
            } else {
                enumerator._message._inProgress[messageType] = false;
            }
        }, error => {
            iotcs.createError('Invalid response on message monitoring.');
        });
    }

    /**ignore*/
    static _removeMessageMonitor(enumerator, messageType) {
        if (messageType === enumerator._message._allKey) {
            enumerator._message._types.forEach(type => {
                if (enumerator._message._monitors[type]
                    && enumerator._message._monitors[type]._running
                    && !(type in enumerator._message._callbacks)) {
                    enumerator._message._monitors[type]._stop();
                }
            });
        } else {
            if (enumerator._message._monitors[messageType]
                && enumerator._message._monitors[messageType]._running
                && !(messageType in enumerator._message._callbacks)) {
                enumerator._message._monitors[messageType]._stop();
            }
        }
    }

    constructor(client) {
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);

        this._client = client;

        this._message = {
            _allKey: 'ALL',
            _callbacks: {},
            _inProgress: {},
            _lastTime: {},
            _maxLimit: 1000,
            _monitors: {},
            _types: ['DATA', 'ALERT', 'REQUEST', 'RESPONSE', 'WAKEUP', 'UPDATE_BUNDLE',
                     'RESOURCES_REPORT']
        };
    }


    // Public functions
    //@TODO: (jy) check why model is param,paramValue
    /**
     * Return a list of messages according to the given parameters.  The method will generate a query
     * and make a request to the cloud and a list of messages will be returned based on the query in
     * descendant order of arrival of the messages to the cloud.
     * <p>
     * The query for messages must be made based on one of the following criteria or both:
     * <br>
     * - "device": messages from a specific device<br>
     * - "type": messages of a given type<br>
     *
     * @function getMessages
     * @memberof iotcs.enterprise.MessageEnumerator
     *
     * @param {?string} [deviceId] - The ID of the device as the source of the messages from the
     *        enumerator. If this is <code>null</code> the messages for all devices will be enumerated.
     * @param {?string} [messageType] - The type of the messages to be enumerated.  If this is
     *        <code>null</code> then messages of all types will be enumerated.  The only types are:
     *        ['DATA', 'ALERT', 'REQUEST', 'RESPONSE', 'WAKEUP', 'UPDATE_BUNDLE', 'RESOURCES_REPORT'].
     * @param {?boolean} [expand] - A flag that would say if the messages in the response contains
     *        expanded data. If this is not present the value is false.
     * @param {?number} [since] - The timestamp in milliseconds since EPOC that would represent that
     *        minimum time when the messages were received.
     * @param {?number} [until] - The timestamp in milliseconds since EPOC that would represent that
     *        maximum time when the messages were received.
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain messages as items.
     */
    getMessages(deviceId, messageType, expand, since, until) {
        _optionalArg(deviceId, 'string');
        _optionalArg(messageType, 'string');
        _optionalArg(expand, 'boolean');
        _optionalArg(since, 'number');
        _optionalArg(until, 'number');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        var separator = '&';
        var query = '?orderBy=eventTime:asc';

        if (deviceId) {
            query = query + separator + 'device=' + deviceId;
        }

        if (messageType) {
            query = query + separator + 'type=' + messageType;
        }

        if (expand) {
            query = query + separator + 'expand=true';
        }

        if (since) {
            query = query + separator + 'since=' + since;
        }

        if (until) {
            query = query + separator + 'until=' + until;
        }

        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path:   iotcs.impl._reqRoot +
                '/apps/' + this._client._appid +
                '/messages' +
                query
        }, '', null, this._client);
    }

    /**
     * Registers a callback method to be called when new messages of a given type and/or for a given
     * device are received.
     *
     * @function setListener
     * @memberof iotcs.enterprise.MessageEnumerator
     * @see {@link iotcs.enterprise.MessageEnumerator#getMessages}
     *
     * @param {string} [deviceId] - The ID of the device for which the callback is called when new
     *        messages arrives. If this is null the callback will be called when messages for any device
     *        arrives.
     * @param {string} [messageType] - The type of the messages that the listener listens to.  The types
     *        are described in the getMessages method. If this is <code>null</code> the callback will be
     *        called for all message types.
     * @param {function} callback - The callback function that will be called when a new message from
     *        the associated device is received.
     */
    setListener(deviceId, messageType, callback) {
        if (deviceId && (typeof deviceId === 'function')) {
            callback = deviceId;
            deviceId = null;
        } else if (messageType && (typeof messageType === 'function')) {
            callback = messageType;
            messageType = null;
        }

        _optionalArg(messageType, 'string');
        _optionalArg(deviceId, 'string');
        _mandatoryArg(callback, 'function');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        if (!deviceId) {
            deviceId = this._message._allKey;
        }

        if (!messageType) {
            messageType = this._message._allKey;
        }

        if (!this._message._callbacks[messageType]) {
            this._message._callbacks[messageType] = {};
        }
        this._message._callbacks[messageType][deviceId] = callback;
        this._addMessageMonitor(this, messageType);
    }

    /**
     * The library will no longer monitor messages for the specified device and/or message type.
     *
     * @function unsetListener
     * @memberof iotcs.enterprise.MessageEnumerator
     * @see {@link iotcs.enterprise.MessageEnumerator#getMessages}
     *
     * @param {string} [deviceId] - The ID of the device for which the monitoring of messages will be
     *        stopped.
     * @param {string} [messageType] - The type of messages for which the monitoring will be stopped.
     *        The types are described in the getMessages method.
     */
    unsetListener(deviceId, messageType) {
        _optionalArg(deviceId, 'string');
        _optionalArg(messageType, 'string');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        if (!deviceId) {
            deviceId = this._message._allKey;
        }

        if (!messageType) {
            messageType = this._message._allKey;
        }

        if (messageType in this._message._callbacks) {
            if (deviceId in this._message._callbacks[messageType]) {
                delete this._message._callbacks[messageType][deviceId];
            }
            if (Object.keys(this._message._callbacks[messageType]).length === 0) {
                delete this._message._callbacks[messageType];
                this._removeMessageMonitor(this, messageType);
            }
        }
    }
};
