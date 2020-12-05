/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @alias iotcs.device.util
 * @memberof iotcs.device
 * @namespace
 */
iotcs.device.util = {};

/**
 * A directly-connected device is able to send messages to, and receive messages from, the IoT
 * server.  When the directly-connected device is activated on the server, the server assigns a
 * logical-endpoint identifier.  This logical-endpoint identifier is required for sending messages
 * to, and receiving messages from, the server.
 * <p>
 * The directly-connected device is able to activate itself using the direct activation capability.
 * The data required for activation and authentication is retrieved from a TrustedAssetsStore
 * generated using the TrustedAssetsProvisioner tool using the Default TrustedAssetsManager.
 * <p>
 * This object represents the low-level API for the directly-connected device and uses direct
 * methods for sending or receiving messages.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 * @param {boolean} [gateway] - <code>true</code> to indicate creation of a GatewayDevice
 *        representation.
 *
 * @alias iotcs.device.util.DirectlyConnectedDevice
 * @class iotcs.device.util.DirectlyConnectedDevice
 * @memberof iotcs.device.util
 */
iotcs.device.util.DirectlyConnectedDevice = class {
    // Static private functions
    /**
     * Returns the content length of the data in the input stream.
     *
     * @param {?} inputStream - An input stream pointing to data.
     * @returns {number} The content length of the data in the inputStream, or -1 if the content length
     *          could not be determined.
     * @throws Error If there was a problem determining the content length.
     *
     * @ignore
     */
    // TODO: Implement...not sure if this is needed, I implemented this another, better way.
    static _getContentLength(inputStream) {
        // if (inputStream.markSupported() || (inputStream instanceof FileInputStream)) {
        //     if (inputStream.markSupported()) {
        //         inputStream.mark(Integer.MAX_VALUE);
        //     }
        //
        //     long total = 0;
        //
        //     try {
        //         int len;
        //         final byte[] buf = new byte[4096];
        //
        //         while ((len = inputStream.read(buf)) != -1) {
        //             total += len;
        //         }
        //     }  finally {
        //         if (inputStream.markSupported()) {
        //             inputStream.reset();
        //         } else {
        //             ((FileInputStream)inputStream).getChannel().position(0);
        //         }
        //     }
        //
        //     if (total > Integer.MAX_VALUE) {
        //         // Later we cast to int, so check here.
        //         throw new IOException("file too large");
        //     }
        //
        //     return (int)total;
        // }
        //
        // // Cannot calculate length of input stream
        // return -1;
    }

    /**
     * Returns the name of the storage object from the given URL.
     *
     * @param {URL} storageCloudUrl - The storage cloud URL.
     * @returns {string} The name of the storage object from the given URL.
     * @throws {Error} If there was a problem obtaining the storage object name.
     *
     * @ignore
     */
    static _getObjectNameFromUrl(storageCloudUrl) {
        let objectStoragePattern = new RegExp('https?://(?:objectstorage\\..+\\.oraclecloud\\.com|localhost)(?::\\d+)?/n/[^/]+/b/[^/]+/o/(.+)');
        let match = storageCloudUrl.href.match(objectStoragePattern);

        if (match) {
            if (match.length > 0) {
                return match[1];
            }
        } else {
            let objectStorageClassicPattern = new RegExp('https?://(?:.+\\.storage\\.oraclecloud\\.com|localhost)(?::\\d+)?/v1/[^/]+/[^/]+/(.+)');
            match = storageCloudUrl.href.match(objectStorageClassicPattern);

            if (match) {
                if (match.length > 0) {
                    return match[1];
                }
            }
        }

        throw new Error("storageCloudUrl does not contain object name.");
    }

    /**
     * Determines if the path is to a classic object store and if not, if it's syntax is for the new
     * object store.
     *
     * @param {string} path - A URL path.
     * @returns {boolean} <code>true</code> if the path is to a classic object store.
     *
     * @ignore
     */
    static _isPathClassicObjectStore(path) {
        if (path.startsWith("/v1/")) {
            return true;
        }

        if (!path.startsWith("/n/")) {
            throw new Error("path does not start with expected tokens.");
        }

        return false;
    }

    constructor(taStoreFile, taStorePassword, gateway) {
        this._maxAcceptBytes = iotcs.oracle.iot.client.device.requestBufferSize;
        this._receiveMessageQueue = [];
        let sending = false;
        this._dcdImpl =
            new iotcs.device.impl.DirectlyConnectedDeviceImpl(taStoreFile, taStorePassword,
                                                                      this, gateway);

        if (this._dcdImpl._tam.getServerScheme &&
            (this._dcdImpl._tam.getServerScheme().indexOf('mqtt') > -1))
        {
            let messageRegisterMonitor = null;

            messageRegisterMonitor = new iotcs.impl.Monitor(() => {
                if (!this._dcdImpl._isActivated()) {
                    return;
                }

                if (messageRegisterMonitor) {
                    messageRegisterMonitor.stop();
                }

                iotcs.impl._protocolRegister(iotcs.impl._reqRoot + '/messages/acceptBytes', (message, error) => {
                    let acceptBytes1 = this._maxAcceptBytes -
                        iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));
                    let logMessage = (error ? error.message : JSON.stringify(message));
                    let buffer = forge.util.createBuffer(logMessage, 'utf8');
                    let bytes = buffer.getInt32();

                    if (bytes > this._maxAcceptBytes) {
                        iotcs.createError('The server has a request of ' + bytes +
                                        ' bytes for this client, which is too large for the ' +
                                        this._maxAcceptBytes +
                                        ' byte request buffer. Please restart the client with larger value for ' +
                                        'the iotcs.oracle.iot.client.device.requestBufferSize property.');
                    } else if (bytes > acceptBytes1) {
                        iotcs.createError('The server has a request of ' + bytes +
                                        ' which cannot be sent because the ' + this._maxAcceptBytes +
                                        ' byte request buffer is filled with ' +
                                        (this._maxAcceptBytes - acceptBytes1) +
                                        ' of unprocessed requests.');
                    }
                }, this._dcdImpl);
            });

            messageRegisterMonitor._start();
        }

        try {
            this._dcdImpl._registerDevicePolicyResource();
        } catch (error) {
            console.log("Could not register device policy resource: " + error);
        }
    }

    // Private/protected functions
    get _storageObjectName() {
        return this._dcdImpl._storageObjectName;
    }

    _getReceivedMessage() {
        if (this._receiveMessageQueue.length > 0) {
            return this._receiveMessageQueue.splice(0, 1)[0];
        } else {
            return null;
        }
    }

    _isClassicStorageAuthenticated() {
        return (this._dcdImpl._storageAuthenticationData != null);
    }

    _isClassicStorageTokenExpired() {
        // Period in minutes recalculated in milliseconds.
        return ((this._dcdImpl._storageAuthenticationData.authTokenStartTime +
                 iotcs.oracle.iot.client.storageTokenPeriod * 60000) < Date.now());
    }

    _isStorageAuthenticated() {
        return (this._dcdImpl._storageContainerUrl && this._dcdImpl._storageAuthToken);
    }

    _isStorageTokenExpired() {
        // period in minutes recalculated in milliseconds
        return ((this._dcdImpl._storageAuthTokenStartTime +
                 iotcs.oracle.iot.client.storageTokenPeriod * 60000) < Date.now());
    }

    /**
     * Sends the messages in 'messages' and receives incoming messages and calls sentMessagesCallback
     * or errorCallback.
     *
     * @param {message[]} messages
     * @param {function(message[])} sentMsgsCallback - Callback for successfully sent messages.
     * @param {function(message[], error)} sentMsgsErrCallback - Callback for errors for sent
     *        messages.
     * @param {function(message[])} receivedMsgsCallback - Callback for received messages.
     * @param {boolean} longPolling {@code true} to enable long polling.
     * @param {number} timeout the number of milliseconds to wait to hear a response from the
     *                 server before giving up.
     */
    _sendReceiveMessages(messages, deliveryCallback, errorCallback, longPolling, timeout) {
        if (!this._dcdImpl._isActivated()) {
            let error = iotcs.createError('Device not yet activated.');

            if (errorCallback) {
                errorCallback(messages, error);
            }

            return;
        }

        if (!this._dcdImpl._bearer) {
            this._dcdImpl._refreshBearer();
            return;
        }

        try {
            iotcs.message.Message._checkMessagesBoundaries(messages);
        } catch (e) {
            if (errorCallback) {
                errorCallback(messages, e);
            }

            return;
        }

        let bodyArray = [];
        let i;
        let len = messages.length;

        // Construct the messages to be sent.
        for (let i = 0; i < len; i++) {
            let messagePush = messages[i].getJSONObject();

            if (this._dcdImpl._serverDelay) {
                bodyArray.push(iotcs.device.impl.DirectlyConnectedDeviceImpl._optimizeOutgoingMessage({
                    clientId: messagePush.clientId,
                    source: messagePush.source,
                    destination: messagePush.destination,
                    sender: messagePush.sender,
                    priority: messagePush.priority,
                    reliability: messagePush.reliability,
                    eventTime: messagePush.eventTime + this._dcdImpl._serverDelay,
                    type: messagePush.type,
                    properties: messagePush.properties,
                    payload: iotcs.device.impl.DirectlyConnectedDeviceImpl._updateURIinMessagePayload(messagePush.payload)
                }));
            } else {
                messagePush.payload = iotcs.device.impl.DirectlyConnectedDeviceImpl._updateURIinMessagePayload(messagePush.payload);
                bodyArray.push(iotcs.device.impl.DirectlyConnectedDeviceImpl._optimizeOutgoingMessage(messagePush));
            }
        }

        let postBody = JSON.stringify(bodyArray);

        iotcs.impl.Platform._debug('DirectlyConnectedDevice.sendReceiveMessages postBody = ' +
                       postBody);

        let acceptBytes = this._maxAcceptBytes -
            iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));

        if ((typeof acceptBytes !== 'number') ||
            isNaN(acceptBytes) ||
            (acceptBytes < 0) ||
            (acceptBytes > this._maxAcceptBytes))
        {
            let error1 = iotcs.createError('Bad acceptBytes query parameter.');

            if (errorCallback) {
                errorCallback(messages, error1);
            }

            return;
        }

        let options = {
            path: iotcs.impl._reqRoot + '/messages?acceptBytes=' + acceptBytes +
                (longPolling ? '&iot.sync' : '') + (timeout ? ('&iot.timeout=' + timeout) : ''),
            method: 'POST',
            headers: {
                'Authorization': this._dcdImpl._bearer,
                'X-EndpointId': this._dcdImpl._tam.getEndpointId(),
                //'Content-Length': Buffer.byteLength(postBody, 'utf-8')
            },
            tam: this._dcdImpl._tam
        };

        // Send the messages.
        iotcs.impl._protocolReq(options, postBody, (responseBody, error, dcdUtil) => {
            if (!responseBody || error) {
                let err = error;

                if (messages.length > 0) {
                    err = iotcs.createError('Error on sending messages, will re-try some: ',
                                          error);

                    // Re-queue messages with retries remaining and which are
                    // GUARANTEED_DELIVERY.
                    messages.forEach(message => {
                        if ((message._properties.remainingRetries > 0) ||
                            (message._properties.reliability &&
                             (message._properties.reliability === 'GUARANTEED_DELIVERY')))
                        {
                            if (dcdUtil.dispatcher) {
                                message._properties.remainingRetries =
                                    message._properties.remainingRetries - 1;

                                dcdUtil.messageDispatcher.queue(message);
                            }
                        } else if (((message._properties.type === iotcs.message.Message.Type.ALERT) ||
                                    (message._properties._type === iotcs.message.Message.Type.DATA)) &&
                                   (message._properties.remainingRetries === 0) &&
                                   (message.onError))
                        {
                            message.onError(error);
                        }
                    });
                }

                if (errorCallback) {
                    errorCallback(messages, err);
                }

                return;
            }

            // Messages were successfully sent.
            let messagePersistenceImpl = iotcs.device.impl.MessagePersistenceImpl._getInstance();

            // Guaranteed delivery messages are the only ones persisted.  Now that they're
            // sent, we need delete them from message persistence.
            if (messagePersistenceImpl) {
                messages.forEach(message => {
                    if (message._properties.reliability ===
                        iotcs.message.Message.Reliability.GUARANTEED_DELIVERY)
                    {
                        messagePersistenceImpl._delete(messages);
                    }
                });
            }

            // Receive any messages coming in and add them to the receiveMessageQueue.
            if (Array.isArray(responseBody) && responseBody.length > 0) {
                let i;

                for (let i = 0; i < responseBody.length; i++) {
                    this._receiveMessageQueue.push(responseBody[i]);
                }
            } else if ((typeof responseBody === 'object') &&
                       (responseBody['x-min-acceptbytes'] !== 0))
            {
                let acceptBytes1 = this._maxAcceptBytes -
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));

                let bytes = parseInt(responseBody['x-min-acceptbytes']);

                if (bytes > this._maxAcceptBytes) {
                    iotcs.createError('The server has a request of ' + bytes +
                                    ' bytes for this client, which is too large for the ' +
                                    this._maxAcceptBytes +
                                    ' byte request buffer. Please restart the client with larger ' +
                                    'value for the ' +
                                    'iotcs.oracle.iot.client.device.requestBufferSize property.');
                } else if (bytes > acceptBytes1) {
                    iotcs.createError('The server has a request of ' + bytes +
                                    ' which cannot be sent because the ' + this._maxAcceptBytes +
                                    ' byte request buffer is filled with ' +
                                    (this._maxAcceptBytes - acceptBytes1) + ' of unprocessed requests.');
                }
            }

            if (deliveryCallback) {
                deliveryCallback(messages);
            }

        }, () => {
            this._sendReceiveMessages(messages, deliveryCallback, errorCallback, longPolling,
                                         timeout);
        }, this._dcdImpl, this);
    }

    set _storageObjectName(newName) {
        this._dcdImpl._storageObjectName = newName;
    }

    /**
     * Synchronizes the storage object by either uploading or downloading the object.
     *
     * @param {iotcs.StorageObject} storageObject - The storage object to sync.
     * @param {function} deliveryCallback - The function to call when
     * @param {function} errorCallback - The function to call when the sync fails.
     * @param {function} processCallback - The function to call when
     */
    _syncStorage(storageObject, deliveryCallback, errorCallback, processCallback, timeout) {
        if (!this._dcdImpl._isActivated()) {
            let error = iotcs.createError('Device not yet activated.');

            if (errorCallback) {
                errorCallback(storageObject, error);
            }

            return;
        }

        let self = this;

        this._dcdImpl._refreshNewStorageAuthToken(storageObject, () => {
            /** @type {string} */
            let storageUri = storageObject.getURI();

            if (storageObject._storageAuthenticationData) {
                storageUri = storageObject._storageAuthenticationData.storageUrl;
                storageObject._setURI(storageUri);
            } else if (!storageUri) {
                storageObject._setURI(this._dcdImpl._storageContainerUrl + "/" +
                                      storageObject.getName());
                /** @type {string} */
                storageUri = storageObject.getURI();
            }

            /** @type {URL} */
            let url = iotcs.impl.Platform._createUrl(storageUri);
            /** @type {string} */
            const name = iotcs.device.util.DirectlyConnectedDevice._getObjectNameFromUrl(url);
            /** @type {boolean} */
            const isClassicObjectStorage =
                  iotcs.device.util.DirectlyConnectedDevice._isPathClassicObjectStore(url.path);

            let options = {
                headers: {},
                host: url.host,
                hostname: url.hostname,
                path: url.path,
                port: url.port || iotcs.oracle.iot.client.storageCloudPort,
                protocol: url.protocol.slice(0, -1)
            };


            if (isClassicObjectStorage) {
                options.headers['X-Auth-Token'] = this._dcdImpl._storageAuthToken;
            } else {
                // Add OCI headers
                let headers = storageObject._storageAuthenticationData.headers;

                for (const key in headers) {
                    if ("(request-target)" !== key) {
                        options.headers[key] = headers[key];
                    }
                }
            }

            if (storageObject.getInputStream()) {
                // Upload file
                /** @type {Uint8Array} */
                storageObject._storageAuthenticationData = isClassicObjectStorage ?  null :
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                                   "PUT");

                // Upload file
                options.method = "PUT";

                if (storageObject.getLength() == -1) {
                    options.headers['Transfer-Encoding'] = "chunked";
                }

                options.headers['Content-Type'] = storageObject.getType();
                let encoding = storageObject.getEncoding();

                if (encoding) {
                    options.headers['Content-Encoding'] = encoding;
                }

                /** @type {object} */
                let metadata = storageObject.getCustomMetadata();

                if (metadata) {
                    for(const key in metadata) {
                        if (isClassicObjectStorage) {
                            options.headers['X-Object-Meta-' + key] = metadata[key];
                        } else {
                            options.headers['opc-meta-' + key] = metadata[key];
                        }
                    }
                }
            } else {
                // Download file
                /** @type {Uint8Array} */
                storageObject._storageAuthenticationData = isClassicObjectStorage ?  null : 
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                                   "GET");

                options.method = "GET";
            }

            iotcs.impl.Platform.Https._storageReq(options, storageObject, isClassicObjectStorage,
                                                  deliveryCallback, error =>
           {
               if (error) {
                   let exception = null;

                   try {
                       exception = JSON.parse(error.message);

                       if (exception.statusCode &&
                           (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                       {
                           this._dcdImpl._refreshClassicStorageAuthToken(() => {
                               this._syncStorage(storageObject, deliveryCallback, errorCallback,
                                                 processCallback, timeout);
                           });

                           return;
                       }
                   } catch (ignore) {
                       // Do nothing.
                   }

                   errorCallback(storageObject, error, -1);
               }
           }, processCallback);
        });
    }

    // Public functions
    /**
     * Activate the device.  The device will be activated on the server if necessary. When the device
     * is activated on the server.  The activation would tell the server the models that the device
     * implements.  Also the activation can generate additional authorization information that will
     * be stored in the TrustedAssetsStore and used for future authentication requests.  This can be
     * a time/resource consuming operation for some platforms.
     * <p>
     * If the device is already activated, this method will throw an exception.  The user should call
     * the isActivated() method prior to calling activate.
     *
     * @param {string[]} deviceModelUrns - An array of deviceModel URNs implemented by this directly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with this object
     *        but in the activated state.  If the activation is not successful then the object will
     *        be <code>null</code> and an error object is passed in the form callback(device, error)
     *        and the reason can be taken from error.message.
     *
     * @function activate
     * @ignore
     * @memberof DirectlyConnectedDevice
     */
    activate(deviceModelUrns, callback) {
        if (this.isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => {
            _mandatoryArg(urn, 'string');
        });

        let deviceModels = deviceModelUrns;
        deviceModels.push('urn:oracle:iot:dcd:capability:direct_activation');
        deviceModels.push('urn:oracle:iot:dcd:capability:device_policy');

        this._dcdImpl._activate(deviceModels, (activeDev, error) => {
            if (!activeDev || error) {
                callback(null, error);
                return;
            }

            callback(this);
        });
    }

    /**
     * This method will close this directly connected device (client) and all it's resources.  All
     * monitors required by the message dispatcher associated with this client will be stopped, if
     * there is one.
     *
     * @function close
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @see {@link iotcs.device.util.MessageDispatcher}
     */
    close() {
        this._dcdImpl._close();

        if (this._messageDispatcher) {
            this._messageDispatcher._stop();
        }

        if (this._storageDispatcher) {
            this._storageDispatcher._stop();
        }
    }

    //DJM: This shows up in the public docs under iotcs.device.util.DirectlyConnectedDevice, which I
    //     don't this is right.  I think it should be on the DCD, not a DCDUtil.
    /**
     * Create a new {@link iotcs.enterprise.StorageObject}.
     *
     * <p>
     * The createStorageObject method works in two modes:
     * </p><p>
     * </p><pre>
     * 1. client.createStorageObject(name, type) - Creates a new {@link iotcs.StorageObject} with
     *    the given object name and mime&ndash;type.
     *
     *    Parameters:
     *       {string} name - The unique name to be used to reference the content in storage.
     *       {?string} [type] - The mime-type of the content. If <code>type</code> is
     *                          <code>null</code> or <code>undefined</code>, the mime&ndash;type
     *                          defaults to {@link iotcs.StorageObject.MIME_TYPE}.
     *
     *    Returns:
     *       {iotcs.StorageObject} A StorageObject.
     *
     * 2. client.createStorageObject(uri, callback) - Creates a new {@link iotcs.StorageObject} from
     *    the URL for a named object in storage and returns it in a callback. Creates a new
     *    {@link iotcs.ExternalObject} if using an external URI.
     *
     * </p><pre>
     *    Parameters:
     *       {string} url - The URL of the object in the storage cloud.
     *       {function(storage, error)} callback - The callback called once getting storage data
     *                                             completes.
     * </pre>
     *
     * @param {string} arg1 - The first argument.
     * @param {string | function} arg2 - The second argument.
     * @returns {?iotcs.StorageObject} a {@link iotcs.StorageObject}, or <code>null</code>.
     *
     * @function createStorageObject
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     */
    createStorageObject(arg1, arg2) {
        _mandatoryArg(arg1, "string");

        if ((typeof arg2 === "string") || (arg2 === undefined) || arg2 === null) {
            // createStorageObject(name, type)

            let useVirtualStorageDirectories =
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);

            if (useVirtualStorageDirectories && (this._dcdImpl._tam.getEndpointId() !== null)) {
                this._storageObjectName = this._dcdImpl._tam.getEndpointId() + "/" + arg1;
            } else {
                this._storageObjectName = arg1;
            }

            let storage = new iotcs.StorageObject(null, this._storageObjectName, arg2, undefined, 
                                                undefined, undefined);

            storage._setDevice(this);
            return storage;
        } else {
            // createStorageObject(uri, callback)
            _mandatoryArg(arg2, "function");

            if (!this.isActivated()) {
                iotcs.error('Device not activated yet.');
                return null;
            }

            let storageUrlStr = arg1;
            let callback = arg2;
            let urlObj;

            try {
                /** @type {URL} */
                urlObj = iotcs.impl.Platform._createUrl(storageUrlStr);
            } catch(error) {
                throw new Error('Storage Cloud URL is an invalid URL.');
            }

            /** @type {string} */
            let name = iotcs.device.util.DirectlyConnectedDevice._getObjectNameFromUrl(urlObj);
            /** @type {boolean} */
            let isClassicObjectStorage =
                iotcs.device.util.DirectlyConnectedDevice._isPathClassicObjectStore(urlObj.path);
            /** @type {Uint8Array} */
            let authenticationRequestBody = isClassicObjectStorage ? null :
                iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                               'HEAD');

            if (!storageUrlStr.startsWith(this._dcdImpl._storageAuthenticationData.storageContainerUrl)) {
                callback(null, new new Error('Storage container URL does not match.'));
                return null;
            }

            var options = {
                agent: false,
                headers: {},
                host: urlObj.host,
                hostname: urlObj.hostname,
                method: "HEAD",
                path: urlObj.path,
                port: urlObj.port || iotcs.oracle.iot.client.storageCloudPort,
                protocol: urlObj.protocol,
                rejectUnauthorized: true
            };

            if (isClassicObjectStorage) {
                options.headers['X-Auth-Token'] =
                    this._dcdImpl._storageAuthenticationData.authToken;
            } else {
                /** @type {object} */
                let headers = this._dcdImpl._storageAuthenticationData.headers;

                for(let key in headers) {
                    options.headers[key] = headers[key];
                }
            }

            iotcs.impl.Platform._debug("Request: " + new Date().getTime());
            iotcs.impl.Platform._debug(options.path);
            iotcs.impl.Platform._debug(options);

            let protocol = options.protocol.indexOf("https") !== -1 ?
                require('https') : require('http');

            let self = this;

            let req = protocol.request(options, function (response) {
                iotcs.impl.Platform._debug();
                iotcs.impl.Platform._debug("Response: " + response.statusCode + ' ' +
                                           response.statusMessage);
                iotcs.impl.Platform._debug(response.headers);

                let body = '';

                response.on('data', function (d) {
                    body += d;
                });

                response.on('end', function () {
                    if (response.statusCode === iotcs.StatusCode.OK) {
                        let type = response.headers["content-type"];
                        let encoding = response.headers["content-encoding"];
                        let date = new Date(Date.parse(response.headers["last-modified"]));
                        let len = parseInt(response.headers["content-length"]);
                        let storage = new iotcs.StorageObject(storageUrlStr, name, type, encoding,
                                                              date, len);
                        storage._setDevice(self);
                        callback(storage);
                    } else if (response.statusCode === iotcs.StatusCode.UNAUTHORIZED) {
                        this._dcdImpl._refreshNewStorageAuthToken(function () {
                            self._createStorageObject(storageUrlStr, callback);
                        });
                    } else {
                        let e = new Error(JSON.stringify({
                            statusCode: response.statusCode,
                            statusMessage: (response.statusMessage ? response.statusMessage : null),
                            body: body
                        }));

                        callback(null, e);
                    }
                });
            });

            req.on('abort', function (error) {
                callback(null, error);
            });

            req.on('error', function (error) {
                callback(null, error);
            });

            req.on('timeout', function () {
                callback(null, new Error('Connection timeout.'));
            });

            req.end();
        }
    }

    /**
     * Get the device model for the specified device model URN.
     *
     * @function getDeviceModel
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @param {string} deviceModelUrn - The URN of the device model.
     * @param {function} callback - The callback function.  This function is called with the
     *        following argument: a deviceModel object holding full description e.g. <code>{ name:"",
     *        description:"", fields:[...], created:date, isProtected:boolean, lastModified:date
     *        ... }</code>.  If an error occurs the deviceModel object is <code>null</code> and an
     *        error object is passed: callback(deviceModel, error) and the reason can be taken from
     *        the error.message.
     */
    getDeviceModel(deviceModelUrn, callback) {
        new iotcs.device.impl.DeviceModelFactory()._getDeviceModel(this, deviceModelUrn,
                                                                           callback);
    }

    /**
     * Return the logical-endpoint identifier of this directly-connected device.  The logical-endpoint
     * identifier is assigned by the server as part of the activation process.
     *
     * @function getEndpointId
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @returns {string} The logical-endpoint identifier of this directly-connected device.
     */
    getEndpointId() {
        return this._dcdImpl._getEndpointId();
    }

    /**
     * This will return the directly connected device state.
     *
     * @function isActivated
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        return this._dcdImpl._isActivated();
    }

    /**
     * Offer a message to be queued. Depending on the policies, if any, the message will be queued if it
     * is possible to do so without violating capacity restrictions.
     *
     * @function offer
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @param {iotcs.message.Message[]} messages - The message to be offered.
     * @throws Error - If all the messages cannot be added to the queue.
     * @throws Error - If <code>messages</code> is <code>null</code> or empty.
     */
    offer(messages) {
        if (this.isActivated()) {
            // We need to distinguish between an empty list of messages
            // that has been passed in versus an empty list of message
            // that has resulted from policies being applied.
            // So if the list we receive is empty, let send handle it.
            if (!messages || (messages.size === 0)) {
                this.send(messages, (messages, error) => {
                    if (error) {
                        console.log('Error sending offered messages: ' + error);
                    }
                });
            }

            /** @type {PersistenceStore} */
            const persistenceStore = iotcs.device.impl.PersistenceStoreManager._get(this.getEndpointId());
            /** @type {MessagePolicyImpl} */
            let messagingPolicyImpl;
            /** @type {object} */
            const mpiObj = persistenceStore._getOpaque('MessagingPolicyImpl', null);

            if (!mpiObj) {
                messagingPolicyImpl = new iotcs.device.impl.MessagingPolicyImpl(this);

                persistenceStore
                    ._openTransaction()
                    ._putOpaque('MessagingPolicyImpl', messagingPolicyImpl)
                    ._commit();

                /** @type {DevicePolicyManager} */
                const devicePolicyManager =
                      iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this.getEndpointId());
                devicePolicyManager._addChangeListener(messagingPolicyImpl);
            } else {
                messagingPolicyImpl = mpiObj;
            }

            let self = this;

            // Now we know here that messages list is not empty.
            // If the message list is not empty after applying policies,
            // then send the messages. If it is empty after applying the
            // policies, then there is nothing to send because messages
            // were filtered, or are aggregating values (e.g., mean policy).
            /** @type {Set<Message>} */
            messages.forEach(message => {
                /** @type {Message[]} */
                messagingPolicyImpl._applyPolicies(message).then(messagesFromPolicies => {
                    if (messagesFromPolicies) {
                        self.send(messagesFromPolicies, (messages, error) => {
                            if (error) {
                                console.log('Error sending offered messages: ' + error);
                            }
                        });
                    }
                });
            });
        } else {
            throw new Error("Device not activated.");
        }
    }

    /**
     * This method is used for retrieving messages.  The DirectlyConnectedDevice uses an internal buffer
     * for the messages received that has a size of 4192 bytes.  When this method is called and there is
     * at least one message in the buffer, the first message from the buffer is retrieved.  If no
     * message is in the buffer, a force send of an empty message is tried so to see if any messages are
     * pending on the server side for the device and if there are, the buffer will be filled with them
     * and the first message retrieved.
     *
     * @function receive
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @param {number} [timeout] - The forcing for retrieving the pending messages will be done this
     *        amount of time.
     * @param {function} callback - The callback function.  This function is called with the first
     *        message received or null is no message is received in the timeout period.
     */
    receive(timeout, callback) {
        if (!this.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        if (typeof  timeout === 'function') {
            callback = timeout;
        } else {
            _optionalArg(timeout, 'number');
        }

        _mandatoryArg(callback, 'function');

        let message = this._getReceivedMessage();

        if (message) {
            callback(message);
        } else {
            let self = this;
            let startTime = Date.now();
            let monitor = null;
            let handleReceivedMessages = () => {
                message = this._getReceivedMessage();

                if (message || (timeout && (Date.now() > (startTime + timeout)))) {
                    if (monitor) {
                        monitor.stop();
                    }

                    callback(message);
                }
            };

            let handleSendReceiveMessages = () => {
                if (this._dcdImpl._refreshing) {
                    return;
                }

                this._sendReceiveMessages([], handleReceivedMessages, handleReceivedMessages);
            };

            if (this._receiver) {
                monitor = new iotcs.impl.Monitor(handleReceivedMessages);
                monitor.start();
            } else if (iotcs.oracle.iot.client.device.disableLongPolling ||
                       self._dcdImpl._mqttController)
            {
                monitor = new iotcs.impl.Monitor(handleSendReceiveMessages);
                monitor.start();
            } else {
                this._sendReceiveMessages([], handleReceivedMessages, handleReceivedMessages, true,
                    (typeof timeout === 'number' ? Math.floor(timeout/1000) : null));
            }
        }
    }

    /**
     * This method is used for sending messages to the server.  If the directly connected device is
     * not activated an exception will be thrown. If the device is not yet authenticated the method
     * will try first to authenticate the device and then send the messages.
     *
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @function send
     *
     * @param {iotcs.message.Message[]} messages - An array of the messages to be sent.
     * @param {function} callback - The callback function. This function is called with the messages
     *        that have been sent and in case of error the actual error from sending as the second
     *        parameter.
     */
    send(messages, callback) {
        if (!this.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        _mandatoryArg(messages, 'array');
        _mandatoryArg(callback, 'function');

        messages.forEach(message => {
            _mandatoryArg(message, iotcs.message.Message);
        });

        this._sendReceiveMessages(messages, callback, callback);
    }
};
