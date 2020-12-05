/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.enterprise.impl.EnterpriseClientImpl = class {
    // Static private/protected functions
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

    constructor(taStoreFile, taStorePassword) {
        this._tam = new iotcs.enterprise.TrustedAssetsManager(taStoreFile, taStorePassword);
        this._bearer = "";
        this._refreshing = false;
        /**
         * The storage authentication REST URL.
         *
         * @type {string}
         */
        this._restStorageAuthentication = new RestApi('v2').getReqRoot() + "/provisioner/storage";
        this._storageAuthenticationData = null;
        this._storageObjectName = null;
        this._storageRefreshing = false;
    }

    // Private/protected functions
    _getCurrentServerTime() {
        if (typeof this._serverDelay === 'undefined') {
            return Date.now();
        } else {
            return (Date.now() + this._serverDelay);
        }
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
    _isPathClassicObjectStore (path) {
        if (path.startsWith("/v1/")) {
            return true;
        }

        if (!path.startsWith("/n/")) {
            throw new Error("path does not start with expected tokens.");
        }

        return false;
    }

    _refreshBearer(callback) {
        this._refreshing = true;
        let id = this._tam.getClientId();
        let exp = parseInt((this._getCurrentServerTime() + 900000)/1000);

        let header = {
            typ: 'JWT',
            alg: 'HS256'
        };

        let claims = {
            iss: id,
            sub: id,
            aud: 'oracle/iot/oauth2/token',
            exp: exp
        };

        let inputToSign =
            iotcs.impl.Platform.Util._btoa(JSON.stringify(header))
            + '.'
            + iotcs.impl.Platform.Util._btoa(JSON.stringify(claims));

        let signed;

        try {
            let digest = this._tam.signWithSharedSecret(inputToSign, "sha256");
            signed = forge.util.encode64(forge.util.hexToBytes(digest.toHex()));
        } catch (e) {
            this._refreshing = false;
            let error1 = iotcs.createError('Error on generating oauth signature: ', e);

            if (callback) {
                callback(error1);
            }

            return;
        }

        inputToSign = inputToSign + '.' + signed;
        inputToSign = inputToSign.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');

        let dataObject = {
            grant_type: 'client_credentials',
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: inputToSign,
            scope: ''
        };

        let payload = iotcs.impl.Platform.Query._stringify(dataObject, null, null,
            {encodeURIComponent: iotcs.impl.Platform.Query._unescape});

        payload = payload.replace(new RegExp(':', 'g'),'%3A');

        let options = {
            path: iotcs.impl._reqRoot.replace('webapi','api') + '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            tam: this._tam
        };

        let self = this;

        iotcs.impl.Https._req(options, payload, (responseBody, error) => {
            // DJM: Can this be used here?
            self._refreshing = false;

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
                            (exception.statusCode === iotcs.StatusCode.BAD_REQUEST) &&
                            (exception.body))
                        {
                            let body = JSON.parse(exception.body);

                            if ((body.currentTime) &&
                                (typeof self._serverDelay === 'undefined') &&
                                (now < parseInt(body.currentTime)))
                            {
                                self._serverDelay = (parseInt(body.currentTime) - now);
                                self._refreshBearer(callback);
                                return;
                            }
                        }
                    } catch (e) {
                        // Do nothing.
                    }
                }

                if (callback) {
                    callback(error);
                }

                return;
            }

            self._bearer = (responseBody.token_type + ' ' + responseBody.access_token);

            if (callback) {
                callback();
            }

        });
    }

    _refreshClassicStorageAuthToken(callback) {
        //TODO: If the storage auth token is not null and it's not expired, simply return.
        this._storageRefreshing = true;

        let options = {
            path: this._restStorageAuthentication,
            method: 'GET',
            headers: {
                'Authorization': this._bearer,
                'X-EndpointId': this._tam.getClientId()
            },
            tam: this._tam
        };

        let self = this;

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

            // DJM: Can this be used here instead of self?
            self._storageAuthToken = response.authToken;
            self._storageContainerUrl = response.storageContainerUrl;
            self._storageAuthTokenStartTime = Date.now();

            if (callback) {
                callback();
            }
        };

        iotcs.impl.Https._req(options, "", refreshFunction, () => {
            self._refreshClassicStorageAuthToken(callback);
        }, self);
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
        let url = iotcs.impl.Platform._createUrl(storageObject.getURI());

        if (this._isPathClassicObjectStore(url.path)) {
            this._refreshClassicStorageAuthToken(callback);
            return;
        } else {
            let payload =
                iotcs.enterprise.impl.EnterpriseClientImpl._createAuthenticationRequestBody(storageObject.getName(),
                                                                                            "PUT");

            let options = {
                agent: false,
                headers: {
                    'Authorization': this._bearer,
                    'X-EndpointId': this._tam.getClientId()
                },
                method: 'POST',
                path: this.restStorageAuthentication,
                rejectUnauthorized: true,
                tam: this._tam
            };

            let self = this;

            iotcs.impl.Platform.Https._req(options, payload, (response, error) => {
                iotcs.impl.Platform._debug();

                if (error) {
                    iotcs.impl.Platform._debug("Error: " + error);
                    let httpStatus = JSON.parse(error.message);

                    if ((httpStatus.statusCode === iotcs.StatusCode.PRECOND_FAILED) ||
                        (httpStatus.statusCode === iotcs.StatusCode.BAD_METHOD))
                    {
                        // These status codes indicate we're using classic storage, so switch to
                        // using classic.
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
    }
};
