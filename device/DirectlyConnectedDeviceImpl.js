/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This is the private, internal directly-connected device which supports the low-level API
 * iotcs.device.util.DirectlyConnectedDevice.
 */

/** @ignore */
iotcs.device.impl.DirectlyConnectedDeviceImpl = class {
    // Static private functions
    /**
     *
     * Generate the request body for POSTing to /iot/api/v2/provisioner/storage.
     * See https://docs.cloud.oracle.com/iaas/Content/API/Concepts/signingrequests.htm.
     *
     * @param {string} objectName - The name for object in storage cloud, not <code>null</code>.
     * @param {string} method - The method being requested in storage cloud API, GET, HEAD, or POST,
     *        not <code>null</code>.
     * @returns {Uint8Array} The request body for POSTing to /iot/api/v2/provisioner/storage.
     */
    static _createAuthenticationRequestBody(objectName, methodName) {
        _mandatoryArg(objectName, 'string');
        _mandatoryArg(methodName, 'string');

        // {
        //    "object":"object_name"
        //    "method":"PUT"
        // }
        let authRequestBody = {};
        authRequestBody.object = objectName;
        authRequestBody.method = methodName.toLocaleUpperCase();
        return iotcs.impl.Platform._encode(JSON.stringify(authRequestBody));
    }

    /**
     * @ignore
     */
    static _getUtf8BytesLength(string) {
        return forge.util.createBuffer(string, 'utf8').length();
    }

    /**
     * @ignore
     */
    static _optimizeOutgoingMessage(obj) {
        if (!__isArgOfType(obj, 'object')) {
            return null;
        }

        if (_isEmpty(obj.properties)) {
            delete obj.properties;
        }

        return obj;
    }

    /**
     * @ignore
     */
    static _updateURIinMessagePayload(payload) {
        if (payload.data) {
            Object.keys(payload.data).forEach(key => {
                if (payload.data[key] instanceof iotcs.ExternalObject) {
                    payload.data[key] = payload.data[key].getURI();
                }
            });
        }

        return payload;
    }

    constructor(taStoreFile, taStorePassword, dcd, gateway) {
        if (dcd) {
            // The "parent", low-level API DCD associated with this internal DCD.
            this._parentDcd = dcd;
        }

        if (gateway) {
            this._gateway = gateway;
        }

        this._activating = false;
        this._bearer = "";
        /**
         * Determines if this device is closed.
         *
         * @returns {@code true} if this device is closed.
         */
        this._isClosed = false;
        this._isRefreshingBearer = false;
        this._restStorageAuthentication = new RestApi('v2').getReqRoot() + "/provisioner/storage";
        this._storageAuthToken = "";
        this._storageAuthTokenStartTime = null;
        this._storageContainerUrl = "";
        this._storageObjectName = null;
        this._storageRefreshing = false;
        this._tam = new iotcs.device.TrustedAssetsManager(taStoreFile, taStorePassword);
        /** The current token expiration time in MS. */
        this._tokenExpirationMs8 = -1;

        if (this._isActivated()) {
            let persistenceStore =
                iotcs.device.impl.PersistenceStoreManager._get(this._tam.getEndpointId());
            let devicePolicyManager =
                new iotcs.device.impl.DevicePolicyManager(this);

            if (devicePolicyManager) {
                persistenceStore
                    ._openTransaction()
                    ._putOpaque('DevicePolicyManager', devicePolicyManager)
                    ._commit();
            }
        }
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _activate(deviceModelUrns, callback) {
        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        if (this._isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        let self = this;

        /**
         * Gets the activation policy for this device, generates the keys, and activates the device.
         *
         * @ignore
         *
         * @param {error} error If an error occurs during processing.
         */
        function _privateGetPolicy(error) {
            // The callback referenced is the one passed to the activate function.
            if (error) {
                callback(null, iotcs.createError('Error on get policy for activation.', error));
                return;
            }

            let options = {
                path: iotcs.impl._reqRoot + '/activation/policy?OSName=' + iotcs.impl.Platform.Os._type() +
                    '&OSVersion=' + iotcs.impl.Platform.Os._release(),
                method: 'GET',
                headers: {
                    'Authorization': self._bearer,
                    'X-ActivationId': self._tam.getClientId()
                },
                tam: self._tam
            };

            iotcs.impl._protocolReq(options, "", (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.keyType ||
                    !responseBody.hashAlgorithm ||
                    !responseBody.keySize)
                {
                    self._activating = false;
                    callback(null, iotcs.createError('Error on get policy for activation.', error));
                    return;
                }

                _privateKeyGenerationAndActivationAsync(responseBody);
            }, null, self);
        }

        /**
         *
         *
         * @ignore
         *
         * @param {object} activationPolicy The activation policy response from an activation policy
         *        request.
         */
        function _privateKeyGenerationAndActivationAsync(activationPolicy) {
            // The callback referenced is the one passed to the activate function.
            let algorithm = activationPolicy.keyType;
            let hashAlgorithm = activationPolicy.hashAlgorithm;
            let keySize = activationPolicy.keySize;

            self._tam._generateKeyPairNative(algorithm, keySize, (isGenKeys, error) => {
                if (error || !isGenKeys) {
                    self._activating = false;
                    callback(null, iotcs.createError('Keys generation failed on activation.',
                                                     error));
                }

                let content = self._tam.getClientId();
                let payload = {};

                try {
                    let clientSecret = self._tam.signWithSharedSecret(content, 'sha256', null);
                    let publicKey = self._tam.getPublicKey();

                    publicKey = publicKey.substring(publicKey.indexOf('----BEGIN PUBLIC KEY-----') +
                                                    '----BEGIN PUBLIC KEY-----'.length,
                                                    publicKey.indexOf('-----END PUBLIC KEY-----')).replace(/\r?\n|\r/g, "");

                    let toBeSigned =
                        forge.util.bytesToHex(forge.util.encodeUtf8(self._tam.getClientId() + '\n' +
                                                                    algorithm + '\nX.509\nHmacSHA256\n')) +
                        forge.util.bytesToHex(clientSecret) +
                        forge.util.bytesToHex(forge.util.decode64(publicKey));

                    toBeSigned = forge.util.hexToBytes(toBeSigned);

                    let signature =
                        forge.util.encode64(self._tam.signWithPrivateKey(toBeSigned, 'sha256'));

                    payload = {
                        certificationRequestInfo: {
                            subject: self._tam.getClientId(),
                            subjectPublicKeyInfo: {
                                algorithm: algorithm,
                                publicKey: publicKey,
                                format: 'X.509',
                                secretHashAlgorithm: 'HmacSHA256'
                            },
                            attributes: {}
                        },
                        signatureAlgorithm: hashAlgorithm,
                        signature: signature,
                        deviceModels: deviceModelUrns
                    };
                } catch (e) {
                    self._activating = false;
                    callback(null, iotcs.createError('Certificate generation failed on activation.',
                                                     e));
                }

                let options = {
                    path: iotcs.impl._reqRoot + '/activation/direct' +
                        (iotcs.oracle.iot.client.device.allowDraftDeviceModels ? '' :
                         '?createDraft=false'),
                    method: 'POST',
                    headers: {
                        'Authorization': self._bearer,
                        'X-ActivationId': self._tam.getClientId()
                    },
                    tam: self._tam
                };

                iotcs.impl._protocolReq(options, JSON.stringify(payload), (responseBody, error) => {
                    if (!responseBody ||
                        error ||
                        !responseBody.endpointState ||
                        !responseBody.endpointId)
                    {
                        self._activating = false;
                        callback(null, iotcs.createError('Invalid response on activation.', error));
                        return;
                    }

                    if (responseBody.endpointState !== 'ACTIVATED') {
                        self._activating = false;

                        callback(null, iotcs.createError('Endpoint not activated: ' +
                                                         JSON.stringify(responseBody)));
                        return;
                    }

                    try {
                        self._tam.setEndpointCredentials(responseBody.endpointId,
                                                          responseBody.certificate);

                        let persistenceStore =
                            iotcs.device.impl.PersistenceStoreManager._get(self._tam.getEndpointId());

                        persistenceStore
                            ._openTransaction()
                            ._putOpaque('DevicePolicyManager',
                                        new iotcs.device.impl.DevicePolicyManager(self))
                            ._commit();
                    } catch (e) {
                        self._activating = false;

                        callback(null, iotcs.createError('Error when setting credentials on activation.',
                                                       e));
                        return;
                    }

                    self._clearBearer();

                    self._refreshBearer(false, error => {
                        self._activating = false;

                        if (error) {
                            callback(null, iotcs.createError('Error on authorization after activation.',
                                                           error));
                            return;
                        }

                        try {
                            self._registerDevicePolicyResource();
                        } catch (error) {
                            console.log("Could not register device policy resource: " + error);
                        }

                        callback(self);
                    });
                }, null, self);
            });
        }

        /**
         *
         * @ignore
         *
         * @param {object} activationPolicy The activation policy response from an activation policy
         *        request.
         */
        function _privateKeyGenerationAndActivation(activationPolicy) {
            let algorithm = activationPolicy.keyType;
            let hashAlgorithm = activationPolicy.hashAlgorithm;
            let keySize = activationPolicy.keySize;
            let isGenKeys = null;

            try {
                isGenKeys = self._tam.generateKeyPair(algorithm, keySize);
            } catch (e) {
                self._activating = false;
                callback(null, iotcs.createError('Keys generation failed on activation.', e));
                return;
            }

            if (!isGenKeys) {
                self._activating = false;
                callback(null, iotcs.createError('Keys generation failed on activation.'));
                return;
            }

            let content = self._tam.getClientId();
            let payload = {};

            try {
                let clientSecret = self._tam.signWithSharedSecret(content, 'sha256', null);
                let publicKey = self._tam.getPublicKey();

                publicKey = publicKey.substring(publicKey.indexOf('----BEGIN PUBLIC KEY-----')
                                                + '----BEGIN PUBLIC KEY-----'.length,
                                                publicKey.indexOf('-----END PUBLIC KEY-----')).replace(/\r?\n|\r/g, "");

                let toBeSigned = forge.util.bytesToHex(forge.util.encodeUtf8(self._tam.getClientId() +
                                                                             '\n' + algorithm + '\nX.509\nHmacSHA256\n')) +
                    forge.util.bytesToHex(clientSecret) +
                    forge.util.bytesToHex(forge.util.decode64(publicKey));

                toBeSigned = forge.util.hexToBytes(toBeSigned);

                let signature = forge.util.encode64(self._tam.signWithPrivateKey(toBeSigned,
                                                                                  'sha256'));

                payload = {
                    certificationRequestInfo: {
                        subject: self._tam.getClientId(),
                        subjectPublicKeyInfo: {
                            algorithm: algorithm,
                            publicKey: publicKey,
                            format: 'X.509',
                            secretHashAlgorithm: 'HmacSHA256'
                        },
                        attributes: {}
                    },
                    signatureAlgorithm: hashAlgorithm,
                    signature: signature,
                    deviceModels: deviceModelUrns
                };
            } catch (e) {
                self._activating = false;
                callback(null, iotcs.createError('Certificate generation failed on activation.', e));
                return;
            }

            let options = {
                path : iotcs.impl._reqRoot + '/activation/direct' +
                    (iotcs.oracle.iot.client.device.allowDraftDeviceModels ? '' :
                     '?createDraft=false'),
                method : 'POST',
                headers : {
                    'Authorization' : self._bearer,
                    'X-ActivationId' : self._tam.getClientId()
                },
                tam: self._.tam
            };

            iotcs.impl._protocolReq(options, JSON.stringify(payload), (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.endpointState ||
                    !responseBody.endpointId)
                {
                    self._activating = false;
                    callback(null,iotcs.createError('Invalid response on activation.', error));
                    return;
                }

                if(responseBody.endpointState !== 'ACTIVATED') {
                    self._activating = false;
                    callback(null,iotcs.createError('Endpoint not activated: ' +
                                                    JSON.stringify(responseBody)));
                    return;
                }

                try {
                    self._tam.setEndpointCredentials(responseBody.endpointId,
                                                      responseBody.certificate);
                    let persistenceStore =
                        iotcs.device.impl.PersistenceStoreManager._get(self._tam.getEndpointId());

                    persistenceStore
                        ._openTransaction()
                        ._putOpaque('DevicePolicyManager',
                                    new iotcs.device.impl.DevicePolicyManager(self))
                        ._commit();
                } catch (e) {
                    self._activating = false;
                    callback(null,iotcs.createError('Error when setting credentials on activation.',
                                                    e));
                    return;
                }

                self._clearBearer();

                self._refreshBearer(false, error => {
                    self._activating = false;

                    if (error) {
                        callback(null,iotcs.createError('Error on authorization after activation.',
                                                        error));
                        return;
                    }

                    try {
                        self._registerDevicePolicyResource();
                    } catch (e) {
                        console.log("Could not register device policy resource: " + e);
                    }

                    callback(self);
                });
            }, null, self);
        }

        self._activating = true;
        self._refreshBearer(true, _privateGetPolicy);
    }

    _clearBearer() {
        this._tokenExpirationMs = -1;
        delete this._bearer;
        this._bearer = "";
    }

    /**
     * Closes this device.
     */
    _close() {
        this._isClosed = true;
    }

    _getCurrentServerTime() {
        if (typeof this._serverDelay === 'undefined') {
            return Date.now();
        } else {
            return (Date.now() + this._serverDelay);
        }
    }

    /**
     * @ignore
     */
    _getEndpointId() {
        return this._tam.getEndpointId();
    }

    /**
     * @ignore
     */
    _isActivated() {
        return this._tam.isActivated();
    }

    /**
     * The refreshBearer function will send a request to the IoT CS to get a new token (bearer).
     * Note: Tokens (bearers) are device-specific.  As such, the management of them must be done in
     *       this "class".
     *
     * @param {boolean} activation <code>true</code> if this is being called during activation.
     * @param {function} callback the function to call back with the results.
     */
    _refreshBearer(activation, callback) {
        if (this._isClosed) {
            return;
        }

        // If we already have a non-expired token, don't attempt to get another token.
        if ((this._isRefreshingBearer) ||
            ((this._bearer) && (Date.now() < this._tokenExpirationMs)))
        {
            if (callback) {
                callback();
            }
        } else {
            this._isRefreshingBearer = true;
            let inputToSign = this._tam._buildClientAssertion();

            if (!inputToSign) {
                this._isRefreshingBearer = false;
                let error1 = iotcs.createError('error on generating oauth signature');

                if (callback) {
                    callback(error1);
                }

                return;
            }

            let dataObject = {
                grant_type: 'client_credentials',
                client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                client_assertion: inputToSign,
                scope: (activation ? 'oracle/iot/activation' : '')
            };

            let payload = iotcs.impl.Platform.Query._stringify(dataObject, null, null,
                {encodeURIComponent: iotcs.impl.Platform.Query._unescape});

            payload = payload.replace(new RegExp(':', 'g'), '%3A');

            let options = {
                path: iotcs.impl._reqRoot + '/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                tam: this._tam
            };

            iotcs.impl._protocolReq(options, payload, (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.token_type ||
                    !responseBody.access_token)
                {
                    if (error) {
                        let exception = null;

                        try {
                            exception = JSON.parse(error.message);
                            let now = Date.now();

                            if (exception.statusCode &&
                                (exception.statusCode === iotcs.StatusCode.FORBIDDEN))
                                // Should this be iotcs.StatusCode.BAD_REQUEST?
                            {
                                if (exception.body) {
                                    try {
                                        let body = JSON.parse(exception.body);

                                        if ((body.currentTime) &&
                                            (typeof this._serverDelay === 'undefined') &&
                                            (now < parseInt(body.currentTime)))
                                        {
                                            this._serverDelay = (parseInt(body.currentTime) - now);

                                            this._tam._serverDelay =
                                                (parseInt(body.currentTime) - now);

                                            this._refreshBearer(activation, callback);
                                            return;
                                        }
                                    } catch (ignore) {
                                       // Do nothing. 
                                    }
                                }

                                if (activation) {
                                    this._tam.setEndpointCredentials(this._tam.getClientId(), null);

                                    this._refreshBearer(false, error => {
                                        this._activating = false;

                                        if (error) {
                                            callback(null, error);
                                            return;
                                        }

                                        callback(this);
                                    });

                                    return;
                                }
                            }
                        } catch (ignore) {
                            // Do nothing.
                        }

                        if (callback) {
                            callback(error);
                        }
                    } else {
                        if (callback) {
                            callback(iotcs.error(JSON.stringify(responseBody)));
                        }
                    }

                    return;
                }

                delete this._bearer;
                this._bearer = (responseBody.token_type + ' ' + responseBody.access_token);

                if (responseBody.expires_in && (responseBody.expires_in > 0)) {
                    this._tokenExpirationMs = Date.now() + responseBody.expires_in;
                } else {
                    this._tokenExpirationMs = -1;
                }

                if (callback) {
                    callback();
                }

                this._isRefreshingBearer = false;
            }, null, this);
        }
    }

    /**
     * Refreshes the classic storage authorization token if needed by making an HTTP request to the
     * IoT CS for a current authorization token.
     *
     * Note: The "new" storage server authentication token is storageObject-specific, so it is 
     *       stored with the storage object.  The "classic" storage server authentication token is 
     *       *not* storageObject-specific, so it is stored in the DirectlyConnectedDevice(Util).
     *
     * @param {iotcs.StorageObject} storageObject - The storage object being sync'd.
     * @param {function} callback - The function to call back when complete.
     *
     * @ignore
     */
    _refreshClassicStorageAuthToken(callback) {
        this._storageRefreshing = true;
        let self = this;

        let options = {
            path: self._restStorageAuthentication,
            method: 'GET',
            headers: {
                'Authorization': self._bearer,
                'X-EndpointId': self._tam.getEndpointId()
            },
            tam: self._tam
        };

        let refreshFunction = (response, error) => {
            self._storageRefreshing = false;

            if (!response || error || !response.storageContainerUrl || !response.authToken) {
                if (error) {
                    if (callback) {
                        callback(error);
                    }
                } else {
                    self._refreshClassicStorageAuthToken(callback);
                }
                return;
            }

            delete self._storageAuthToken;
            self._storageAuthToken = response.authToken;

            delete self._storageContainerUrl;
            self._storageContainerUrl = response.storageContainerUrl;

            delete self._storageAuthTokenStartTime;
            self._storageAuthTokenStartTime = Date.now();

            if (callback) {
                callback();
            }
        };

        iotcs.impl._protocolReq(options, "", refreshFunction, () => {
            this._refreshClassicStorageAuthToken(callback);
        }, this);
    }

   /**
    * Get the new storage authorization token by making an HTTP request to the IoT CS for a current 
    * authorization token.  We try with a "new" storage request first.  If it fails, we make a call 
    * to refreshClassicStorageAuthToken.  Once the token is retrieved, it is set in the storage
    * object.
    *
    * In order to create the StorageObject, we need to form the URI.  To form the URI, we need
    * to get the storage authentication data.  But we don't know whether the storage service
    * configured on IoT CS is for Object Storage or Object Storage Classic. We could look at
    * the current storage authentication data (if we have it), but there is a (slim) chance
    * that the storage service configuration on IoT CS has changed.  Therefore, we always get
    * the storage authentication data when creating the storage object since it will give the
    * correct URI.  Since we don't know which API to use, we assume Object Storage
    * (POST /api/v2/provisioner/storage) and fall back to Object Storage Classic
    * (GET /api/v2/provisioner/storage). This should be most often correct with post 19.1.1
    * versions of the IoT CS.
    *
    * Note: The "new" storage server authentication token is storageObject-specific, so it is stored
    *       with the storage object.  The "classic" storage server authentication token is *not*
    *       storageObject-specific, so it is stored in the DirectlyConnectedDevice(Util).
    *
    * @param {iotcs.StorageObject} storageObject - The storage object being sync'd.
    * @param {function} callback - The function to call back when complete.
    *
    * @ignore
    */
    _refreshNewStorageAuthToken(storageObject, callback) {
        let payload =
            iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(storageObject.getName(),
                                                                                           "PUT");
        let self = this;

        let options = {
            agent: false,
            headers: {
                'Authorization': self._bearer,
                'X-EndpointId': self._tam._endpointId
            },
            method: 'POST',
            path: self._restStorageAuthentication,
            rejectUnauthorized: true,
            tam: self._tam
        };

        iotcs.impl._protocolReq(options, payload, (response, error) => {
            iotcs.impl.Platform._debug();

            if (error) {
                iotcs.impl.Platform._debug("Error: " + error);
                let httpStatus = JSON.parse(error.message);

                if ((httpStatus.statusCode === iotcs.StatusCode.PRECOND_FAILED) ||
                    (httpStatus.statusCode === iotcs.StatusCode.METHOD_NOT_ALLOWED))
                {
                    // These status codes indicate we're using classic storage, so switch to usding
                    // classic.
                    self._refreshClassicStorageAuthToken(callback);
                } else {
                    throw error;
                }
            } else {
                iotcs.impl.Platform._debug("Response: " + response.statusCode + ' ' +
                                          response.statusMessage);
                iotcs.impl.Platform._debug(response.headers);

                if (response.storageUrl) {
                    storageObject._storageAuthenticationData = response;
                    callback();
                }
            }
        });
    }

    /**
     * @ignore
     */
    _registerDevicePolicyResource() {
        if (!this._isActivated()) {
            return;
        }

        // Note: Any changes here should also be made in MessageDispatcher.  This should really not be
        // here.  It should reference the handlerMethods in MessageDispatcher.
        let handlerMethods = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": "PUT",
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": 'PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": 'GET,PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": 'GET,PUT'
        };

        let resources = [];

        resources.push(iotcs.message.Message.ResourceMessage.Resource.buildResource(
            "urn:oracle:iot:dcd:capability:device_policy",
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged",
            'PUT',
            iotcs.message.Message.ResourceMessage.Resource.Status.ADDED,
            this._tam.getEndpointId()));

        let resourceMessage = iotcs.message.Message.ResourceMessage.buildResourceMessage(
            resources,
            this._parentDcd.getEndpointId(),
            iotcs.message.Message.ResourceMessage.Type.UPDATE,
            iotcs.message.Message.ResourceMessage.getMD5ofList(Object.keys(handlerMethods)))
            .source(this._parentDcd.getEndpointId())
            .priority(iotcs.message.Message.Priority.HIGHEST);

        this._parentDcd.send([resourceMessage], (messages, error) => {
            if (error) {
                console.log('Error registering device policy resources.  ' + error);
            }
        });
    }
};
