/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

function _addArrayCallback(array, callback) {
    if (Array.isArray(array)
        && (typeof callback === 'function')) {
        array.push(callback);
    }
}

function _callArrayCallback(array, messages, error) {
    if (Array.isArray(array)
        && (array.length > 0)
        && (typeof array[0] === 'function')) {
        array.splice(0, 1)[0](messages, error);
    }
}

/**
 *
 */
iotcs.impl.Mqtt.MqttController = class {
    constructor(tam, topicsGenerator) {
        this._apiHandlers = {};
        this._callbacks = [];
        this._connected = false;
        this._errorHandlers = {};
        this._staticApiHandlers = {};
        this._tam = tam;
        this._topicsGenerator = topicsGenerator;

        let self = this;

        this._disconnectHandler = () => {
            this._client = null;
            this._connected = false;
        };

        this._messageHandler = (topic, message) => {
            let responseJson = null;

            try {
                responseJson = JSON.parse(message);
            } catch (e) {
               // Do nothing. 
            }

            if (!responseJson || (typeof responseJson !== 'object')) {
                if (this._staticApiHandlers[topic]) {
                    this._staticApiHandlers[topic](null, new Error(message));
                }

                if (this._apiHandlers[topic]) {
                    _callArrayCallback(this._apiHandlers[topic], null, new Error(message));
                } else if (this._errorHandlers[topic] &&
                           this._apiHandlers[self.errorHandlers[topic]])
                {
                    _callArrayCallback(this._apiHandlers[this._errorHandlers[topic]], null,
                                       new Error(message));
                }

                return;
            }

            if (this._staticApiHandlers[topic]) {
                this._staticApiHandlers[topic](responseJson);
            }

            if (this._apiHandlers[topic]) {
                _callArrayCallback(this._apiHandlers[topic], responseJson);
            } else if (this._errorHandlers[topic] &&
                       this._apiHandlers[this._errorHandlers[topic]])
            {
                _callArrayCallback(this._apiHandlers[this._errorHandlers[topic]], null,
                                   new Error(message));
            }
        };

        this.connectHandler = (client, error) => {
            if (!client || error) {
                for (let topic in this._apiHandlers) {
                    _callArrayCallback(this._apiHandlers[topic], null, error);
                }

                _callArrayCallback(this._callbacks, null, error);
                return;
            }

            let topicObjects = this._topicsGenerator();

            if (Array.isArray(topicObjects) && (topicObjects.length > 0)) {
                let topics = [];

                topicObjects.forEach(topicObject => {
                    if (topicObject.responseHandler) {
                        topics.push(topicObject.responseHandler);
                    }

                    if (topicObject.errorHandler) {
                        this._errorHandlers[topicObject.errorHandler] = topicObject.responseHandler;
                        topics.push(topicObject.errorHandler);
                    }
                });

                iotcs.impl.Platform.Mqtt._subscribe(client, topics, error => {
                    if (error) {
                        let err = iotcs.createError('Unable to subscribe: ', error);
                        
                        for (let topic in this._apiHandlers) {
                            _callArrayCallback(this._apiHandlers[topic], null, err);
                        }
                        
                        for (let topic1 in this._staticApiHandlers) {
                            this._staticApiHandlers[topic1](null, err);
                        }
                        
                        _callArrayCallback(this._callbacks, null, err);
                        return;
                    }

                    this._client = client;
                    this._connected = true;
                    _callArrayCallback(this._callbacks, self);
                });
            } else {
                this._client = client;
                this._connected = true;
                _callArrayCallback(this._callbacks, self);
            }
        };
    }

    // Private/protected functions
    _connect(callback) {
        if (callback) {
            _addArrayCallback(this._callbacks, callback);
        }

        iotcs.impl.Platform.Mqtt._initAndReconnect(this._tam, this._connectHandler,
                                               this._disconnectHandler, this._messageHandler);
    }

    _disconnect(callback) {
        iotcs.impl.Platform.Mqtt._close(this._client, callback);
    }

    _isConnected() {
        if (!this._client) {
            return false;
        }

        return this._connected;
    }

    _register(topic, callback) {
        if (callback) {
            this._staticApiHandlers[topic] = callback;
        }
    }

    _req(topic, payload, expect, callback) {
        let request = (controller, error) => {
            if (!controller || error) {
                callback(null, error);
                return;
            }

            if (expect && callback && (typeof callback === 'function')) {
                let tempCallback = (message, error) => {
                    if (!message || error) {
                        callback(null, error);
                        return;
                    }

                    callback(message);
                };

                if (!this.apiHandlers[expect]) {
                    this._apiHandlers[expect] = [];
                }

                _addArrayCallback(this._apiHandlers[expect], tempCallback);
            }

            iotcs.impl.Platform.Mqtt._publish(this._client, topic, payload, (callback ? true : false),
                                          error =>
            {
                if (error && callback) {
                    callback(null, error);
                    return;
                }

                if (!expect && callback) {
                    callback(payload);
                }
            });
        };

        if (!this._isConnected()) {
            this._connect(request);
        } else {
            request(this);
        }
    }
};

