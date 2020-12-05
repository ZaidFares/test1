/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This object is used for store and forward messages to the cloud by using a priority queue and
 * handling the priority attribute of messages.  It is also used for monitoring received messages
 * and any errors that can arise when sending messages.
 * <p>
 * There can be only one MessageDispatcher instance per DirectlyConnectedDevice at a time and it is
 * created at first use. To close an instance of a MessageDispatcher the
 * DirectlyConnectedDevice.close method must be used.
 * <p>
 * The message dispatcher uses the RequestDispatcher for dispatching automatically request messages
 * that come from the server and generate response messages to the server.
 * <p>
 * The onDelivery and onError attributes can be used to set handlers that are called when messages
 * are successfully delivered or an error occurs:
 * <br>
 * <code>messageDispatcher.onDelivery = function (messages);</code><br>
 * <code>messageDispatcher.onError = function (messages, error);</code><br>
 * Where messages is an array of the iotcs.message.Message object representing the messages that
 * were sent or not and error is an Error object.
 * <p>
 * Also the MessageDispatcher implements the message dispatcher, diagnostics and connectivity test
 * capabilities.
 *
 * @param {iotcs.device.util.DirectlyConnectedDevice} dcdUtil - The directly connected device (Messaging
 *        API) associated with this message dispatcher.
 *
 * @alias iotcs.device.util.MessageDispatcher
 * @class iotcs.device.util.MessageDispatcher
 * @memberof iotcs.device.util
 * @public
 * @see {@link iotcs.message.Message}
 * @see {@link iotcs.message.Message.Priority}
 * @see {@link iotcs.device.util.RequestDispatcher}
 * @see {@link iotcs.device.util.DirectlyConnectedDevice#close}
 */
iotcs.device.util.MessageDispatcher = class {
    // Static private/protected functions
    static _getMethodForRequestMessage(requestMessage) {
        let method = null;

        if (requestMessage.payload && requestMessage.payload.method) {
            method = requestMessage.payload.method.toUpperCase();
        }

        if (requestMessage.payload.headers &&
            Array.isArray(requestMessage.payload.headers['x-http-method-override']) &&
            (requestMessage.payload.headers['x-http-method-override'].length > 0))
        {
            method = requestMessage.payload.headers['x-http-method-override'][0].toUpperCase();
        }

        return method;
    }

    constructor(dcdUtil) {
        _mandatoryArg(dcdUtil, iotcs.device.util.DirectlyConnectedDevice);

        if (dcdUtil._messageDispatcher) {
            return dcdUtil._messageDispatcher;
        }

        this._dcdUtil = dcdUtil;
        this._failMessageClientIdArray = [];

        this._storageDependencies = {
            keys: [],
            values: []
        };

        this._onDelivery = arg => {};
        this._onError = (arg1, arg2) => {};
        this._priorityQueue = new iotcs.impl.PriorityQueue(iotcs.oracle.iot.client.device.maximumMessagesToQueue);
        this._poolingInterval = iotcs.oracle.iot.client.device.defaultMessagePoolingInterval;
        this._startPooling = null;
        this._startTime = this._dcdUtil._dcdImpl._getCurrentServerTime();
        this._totalMessagesSent = 0;
        this._totalMessagesReceived = 0;
        this._totalMessagesRetried = 0;
        this._totalBytesSent = 0;
        this._totalBytesReceived = 0;
        this._totalProtocolErrors = 0;
        this._connectivityTestObj = new iotcs.device.impl.TestConnectivity(this);
        this._longPollingStarted = false;

        let handlers = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

                if (!method || method !== 'POST') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }

                let devicePolicyManager = iotcs.device.impl.DevicePolicyManager.getDevicePolicyManager(dcdUtil.getEndpointId());
                return devicePolicyManager.policyChanged(dcdUtil, requestMessage);
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || method !== 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                let counterObj = {
                    totalMessagesSent: this._totalMessagesSent,
                    totalMessagesReceived: this._totalMessagesReceived,
                    totalMessagesRetried: this._totalMessagesRetried,
                    totalBytesSent: this._totalBytesSent,
                    totalBytesReceived: this._totalBytesReceived,
                    totalProtocolErrors: this._totalProtocolErrors
                };
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(counterObj), '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || (method !== 'PUT')) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                this._totalMessagesSent = 0;
                this._totalMessagesReceived = 0;
                this._totalMessagesRetried = 0;
                this._totalBytesSent = 0;
                this._totalBytesReceived = 0;
                this._totalProtocolErrors = 0;
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || ((method !== 'PUT') && (method !== 'GET'))) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                if (method === 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify({pollingInterval: this._poolingInterval}), '');
                } else {
                    let data = null;
                    try {
                        data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                    }
                    if (!data || (typeof data.pollingInterval !== 'number') || (data.pollingInterval % 1 !== 0)) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                    }
                    this._poolingInterval = (data.pollingInterval < iotcs.oracle.iot.client.monitor.pollingInterval ? iotcs.oracle.iot.client.monitor.pollingInterval : data.pollingInterval);
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
                }
            },
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || method !== 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                let obj = {
                    freeDiskSpace: 'Unknown',
                    ipAddress: 'Unknown',
                    macAddress: 'Unknown',
                    totalDiskSpace: 'Unknown',
                    version: 'Unknown',
                    startTime: this._startTime
                };
                if (iotcs.impl.Platform.Util._diagnostics) {
                    obj = iotcs.impl.Platform.Util._diagnostics();
                }
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(obj), '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": requestMessage =>  {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                let data = null;
                try {
                    data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                }
                if (!data || ((method === 'PUT') && (typeof data.active !== 'boolean'))) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                }
                if (method === 'PUT') {
                    if (data.active) {
                        return this._connectivityTestObj.startHandler(requestMessage);
                    } else {
                        return this._connectivityTestObj.stopHandler(requestMessage);
                    }
                } else {
                    return this._connectivityTestObj.testHandler(requestMessage);
                }
            }
        };

        // Note: Any changes here must also be changed in
        // iotcs.device.impl.DirectlyConnectedDevice.registerDevicePolicyResource.
        let handlerMethods = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": "PUT",
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": 'PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": 'GET,PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": 'GET,PUT'
        };

        this._deliveryCallback = messages => {
            this._totalMessagesSent = this._totalMessagesSent + messages.length;

            messages.forEach(message => {
                this._totalBytesSent = this._totalBytesSent +
                    iotcs.device.impl.DirectlyConnectedDeviceImpl.getUtf8BytesLength(JSON.stringify(message));
            });

            this.onDelivery(messages);
        };

        this._errorCallback = (messages, error) => {
            this._totalProtocolErrors = this._totalProtocolErrors + 1;
            this.onError(messages, error);
        };

        this._sendMonitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (this._startPooling + this._poolingInterval)) {
                if (!dcdUtil.isActivated() ||
                    dcdUtil._dcdImpl._activating ||
                    dcdUtil._dcdImpl._refreshing)
                {
                    this._startPooling = currentTime;
                    return;
                } else if (!dcdUtil._dcdImpl._bearer) {
                    dcdUtil._dcdImpl._refreshBearer(false, error => {
                        this._sendMessages(currentTime);
                    });
                } else {
                    this._sendMessages(currentTime);
                }
            }
        });

        if (this._dcdUtil._receiver) {
            let oldReceiver = this._dcdUtil._receiver;

            this._dcdUtil._receiver = (messages, error) => {
                oldReceiver(messages, error);
                let message = this._dcdUtil._getReceivedMessage();

                while (message) {
                    this._totalMessagesReceived = this._totalMessagesReceived + 1;
                    this._totalBytesReceived = this._totalBytesReceived +
                        iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(message));

                    if (message.type === iotcs.message.Message.Type.REQUEST) {
                        let responseMessage = this.getRequestDispatcher().dispatch(message);

                        if (responseMessage) {
                            this.queue(responseMessage);
                        }
                    }

                    message = this._dcdUtil._getReceivedMessage();
                }
            };
        }

        let self = this; 
        this._resourceMessageMonitor = null;

        this._resourceMessageMonitor = new iotcs.impl.Monitor(() => {
            if (!self._dcdUtil.isActivated()) {
                return;
            }

            if (self._resourceMessageMonitor) {
                self._resourceMessageMonitor._stop();
            }

            for (let path in handlers) {
                self.getRequestDispatcher().registerRequestHandler(dcdUtil.getEndpointId(), path, handlers[path]);
            }
            let resources = [];

            for (let path1 in handlerMethods) {
                resources.push(iotcs.message.Message.ResourceMessage.Resource.buildResource(path1, path1, handlerMethods[path1], iotcs.message.Message.ResourceMessage.Resource.Status.ADDED));
            }

            let message = iotcs.message.Message.ResourceMessage.buildResourceMessage(resources, dcdUtil.getEndpointId(), iotcs.message.Message.ResourceMessage.Type.UPDATE, iotcs.message.Message.ResourceMessage.getMD5ofList(Object.keys(handlerMethods)))
                .source(dcdUtil.getEndpointId())
                .priority(iotcs.message.Message.Priority.HIGHEST);

            this.queue(message);
        });

        this._resourceMessageMonitor._start();
        this._startPooling = Date.now();
        this._sendMonitor._start();
        this._startTime = this._dcdUtil._dcdImpl._getCurrentServerTime();

        // Do this last after everything else is established.
        // Populate outgoing message queue from persisted messages, but leave the
        // messages in persistence. The messages are removed from persistence when
        // they are delivered successfully.
        /** @type {iotcs.device.impl.MessagePersistenceImpl} */
        const messagePersistenceImpl =
              iotcs.device.impl.MessagePersistenceImpl._getInstance();

        if (messagePersistenceImpl && (this._dcdUtil.isActivated() === true)) {
            messagePersistenceImpl._load(this._dcdUtil.getEndpointId()).then(messages => {
                if (messages && messages.size > 0) {
                    messages.forEach(message => {
                        this.queue(message);
                    });
                }
            }).catch(error => {
                //console.log('Error loading persistent messages: ' + error);
            });
        }

        /**
         * Callback handler for DirectlyConnectedDeviceUtil.sendReceiveMessages when messages are
         * successfully sent and when errors occur sending messages.  If error is supplied, any
         * specified error callback handlers are called.
         *
         * @ignore
         * @private
         *
         * @param {Message[]} messages - The messages to be sent.
         * @param {error} [error] - The error when sending messages, if there is one.
         */
        this._handleSentAndErrorMessages = (messages, error) => {
            try {
                if (error) {
                    this._errorCallback(messages, error);
                } else {
                    this._deliveryCallback(messages);
                }
            } catch (ignore) {
                // Do nothing 
            }

            let message = this._dcdUtil._getReceivedMessage();

            while (message) {
                this._totalMessagesReceived = this._totalMessagesReceived + 1;
                this._totalBytesReceived = this._totalBytesReceived +
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(message));

                if (message.type === iotcs.message.Message.Type.REQUEST) {
                    let responseMessage = this.getRequestDispatcher().dispatch(message);

                    if (responseMessage) {
                        this.queue(responseMessage);
                    }
                }

                message = this._dcdUtil._getReceivedMessage();
            }
        };

        /**
         * Pushes message into array if it isn't already there.
         *
         * @param {Message[]} array - An array of messages.
         * @param {Message} message - A message.
         *
         * @ignore
         */
        this._pushMessage = (msgAry, message) => {
            let inArray = false;

            inArray = msgAry.forEach(msg => {
                if (message._equals(msg)) {
                    return true;
                }
            });

            if (!inArray) {
                msgAry.push(message);   
            }
        };

        this._dcdUtil._messageDispatcher = this;
    }

    // Private/protected functions
    _addStorageDependency(storage, msgClientId) {
        let index = this._storageDependencies.keys.indexOf(storage);

        if (index == -1) {
            // add new KV in storageDependencies
            this._storageDependencies.keys.push(storage);
            this._storageDependencies.values.push([msgClientId]);
        } else {
            // add value for key
            this._storageDependencies.values[index].push(msgClientId);
        }
    }

    _isStorageDependent(clientId) {
        for (let i = 0; i < this._storageDependencies.values.length; ++i) {
            if (this._storageDependencies.values[i].indexOf(clientId) !== -1) {
                return true;
            }
        }

        return false;
    }

    _push(message) {
        this._priorityQueue._push(message);
    }

    _removeStorageDependency(storage) {
        let completed = (storage.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.IN_SYNC);
        let index = this._storageDependencies.keys.indexOf(storage);
        this._storageDependencies.keys.splice(index, 1);
        let msgClientIds = this._storageDependencies.values.splice(index, 1)[0];

        if (!completed && msgClientIds.length > 0) {
            // Save failed clientIds.
            this.msgClientIds.forEach(msgClientId => {
                if (this._failMessageClientIdArray.indexOf(msgClientId) === -1) {
                    this._failMessageClientIdArray.push(msgClientId);
                }
            });
        }
    }

    _sendMessages(currentTime) {
        let sent = false;
        let message;
        let waitMessageArray = [];
        let sendMessageArray = [];
        let errorMessageArray = [];
        let inProgressSources = [];

        // Go through the queue and add the messages to the send message or wait message arrays
        // depending on whether it's a request message, if it has a storage dependency, or if
        // messages to this source are in-progress (so we can group messages to the same source
        // together in the same connection).
        while ((message = this._priorityQueue._pop()) !== null) {
            let clientId = message._properties.clientId;
            let source = message._properties.source;

            if (this._failMessageClientIdArray.indexOf(clientId) > -1) {
                if (errorMessageArray.indexOf(message) === -1) {
                    errorMessageArray.push(message);
                }

                continue;
            }

            if ((message._properties.type === iotcs.message.Message.Type.REQUEST) ||
                !(inProgressSources.indexOf(source) !== -1 || this._isStorageDependent(clientId)))
            {
                message._properties.remainingRetries = message._properties.BASIC_NUMBER_OF_RETRIES;
                this._pushMessage(sendMessageArray, message);

                if (sendMessageArray.length === iotcs.oracle.iot.client.device.maximumMessagesPerConnection) {
                    break;
                }
            } else {
                if (inProgressSources.indexOf(source) === -1) {
                    inProgressSources.push(source);
                }

                this._pushMessage(waitMessageArray, message);
            }
        }

        sent = true;
        let messageArr = [];

        if (sendMessageArray.length > 0) {
            messageArr = sendMessageArray;
        }

        waitMessageArray.forEach(message => {
            this.queue(message);
        });

        this._dcdUtil._sendReceiveMessages(messageArr, this._handleSentAndErrorMessages,
                                         this._handleSentAndErrorMessages);

        if (errorMessageArray.length > 0) {
            this._errorCallback(errorMessageArray, new Error("Content sync failed."));
        }

        if (!sent && !this._dcdUtil._receiver && (iotcs.oracle.iot.client.device.disableLongPolling || this._dcdUtil._dcdImpl._mqttController)) {
            this._dcdUtil._sendReceiveMessages([], this._handleSentAndErrorMessages, this._handleSentAndErrorMessages);
        }

        if (!this._dcdUtil._receiver && !iotcs.oracle.iot.client.device.disableLongPolling && !this._dcdUtil._dcdImpl._mqttController) {
            let longPollCallback = null;

            longPollCallback = (messages, error) => {
                if (!error) {
                    this._dcdUtil._sendReceiveMessages([], longPollCallback, longPollCallback, true);
                } else {
                    this._longPollingStarted = false;
                }

                this._handleSentAndErrorMessages(messages, error);
            };

            if (!this._longPollingStarted) {
                this._dcdUtil._sendReceiveMessages([], longPollCallback, longPollCallback, true);
                this._longPollingStarted = true;
            }
        }

        this._startPooling = currentTime;
    }

    _stop() {
        this._sendMonitor._stop();

        if (this._resourceMessageMonitor) {
            this._resourceMessageMonitor._stop();
        }
    }

    // Public functions
    /**
     * (Optional)
     * Callback function called when messages are successfully delivered to the IoT CS.
     *
     * @name iotcs.device.util.MessageDispatcher#onDeliveryCallback
     * @public
     * @type {?iotcs.device.util.MessageDispatcher~onDeliveryCallback}
     */
    get onDelivery() {
        return this._onDelivery;
    }

    /**
     * (Optional)
     * Callback function called when there is an error sending the Alert.
     *
     * @name iotcs.device.Alert#onError
     * @public
     * @type {?iotcs.device.Alert~onErrorCallback}
     */
    get onError() {
        return this._onError;
    }

    set onDelivery(newFunction) {
        if (!newFunction|| (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onDelivery to something that is not a function.');
            return;
        }

        this._onDelivery = newFunction;
    }

    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onDelivery to something that is not a function.');
            return;
        }

        this._onError = newFunction;

    }
    /**
     * This method returns the RequestDispatcher used by this MessageDispatcher for dispatching
     * messages.
     *
     * @function getRequestDispatcher
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @returns {iotcs.device.util.RequestDispatcher} The RequestDispatcher instance.
     */
    getRequestDispatcher() {
        return new iotcs.device.util.RequestDispatcher();
    }

    /**
     * Offer a message to be queued. Depending on the policies, if any, the message will be queued
     * if it is possible to do so without violating capacity restrictions.
     *
     * @param {iotcs.message.Message} message - The message to be offered.
     * @throws Error if all the messages cannot be added to the queue.
     * @throws Error if <code>messages</code> is <code>null</code> or empty.
     *
     * @function offer
     * @memberof iotcs.device.util.MessageDispatcher
     * @public
     */
    offer(message) {
        _mandatoryArg(message, iotcs.message.Message);

        /** @type {PersistenceStore} */
        const persistenceStore =
              iotcs.device.impl.PersistenceStoreManager._get(this._dcdUtil.getEndpointId());

        /** @type {MessagingPolicyImpl} */
        const mpi = persistenceStore._getOpaque('MessagingPolicyImpl', null);
        /** @type {MessagingPolicyImpl} */
        let messagingPolicyImpl;

        if (mpi) {
            messagingPolicyImpl = mpi;
        } else {
            messagingPolicyImpl = new iotcs.device.impl.MessagingPolicyImpl(this._dcdUtil);

            persistenceStore
                ._openTransaction()
                ._putOpaque('MessagingPolicyImpl', messagingPolicyImpl)
                ._commit();

            /** @type {DevicePolicyManager} */
            const devicePolicyManager =
                  iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this._dcdUtil.getEndpointId());

            devicePolicyManager._addChangeListener(messagingPolicyImpl);
        }

        let messageDispatcher = this;

        messagingPolicyImpl._applyPolicies(message).then(messageAry => {
            if (messageAry) {
                messageAry.forEach(message => {
                    messageDispatcher._push(message);
                });
            }
        }).catch(error => {
            console.log('MessageDispatcher.offer error: ' + error);
        });
    }

    /**
     * This method adds a message to the queue of this MessageDispatcher to be sent to the cloud.
     *
     * @function queue
     * @ignore
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @param {iotcs.message.Message} message - The message to be sent.
     */
    queue(message) {
        _mandatoryArg(message, iotcs.message.Message);

        const messagePersistenceImpl =
              iotcs.device.impl.MessagePersistenceImpl._getInstance();

        if (messagePersistenceImpl && message._properties.reliability ===
            iotcs.message.Message.Reliability.GUARANTEED_DELIVERY)
        {
            const messages = new Set();
            messages.add(message);
            messagePersistenceImpl._save(messages, this._dcdUtil.getEndpointId());
        }

        this._push(message);
    }
};

// JSDocs Callback documentation.
/**
 * Callback function called when messages are successfully delivered to the IoT CS.
 *
 * @callback iotcs.device.util.MessageDispatcher~onDeliveryCallback
 *
 * @param {iotcs.message.Message[]} An array of the iotcs.message.Message's representing the
 *        messages that were sent.
 */

/**
 * Callback function called when there is an error sending messages to the IoT CS.
 *
 * @callback iotcs.device.Alert~onErrorCallback
 *
 * @param {iotcs.message.Message[]} An array of the iotcs.message.Message's representing all of the
 *        messages that were attempted to be sent.
 * @param {string} error - The error which occurred when sending the messages.
 */
