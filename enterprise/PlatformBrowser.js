/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 */

/**
 * enterprise porting interface for browser.  This file contains enterprise-specific functions when
 * running in a browser environment.  The classes are defined in shared/PlatformBrowser.js and
 * additional functions are added here for the enterprise-browser environment.
 *
 * Since the JavaScript client library runs under both the web browser and NodeJS, we need a porting
 * layer for both.  Platform is defined in the shared namespace, hence the iotcs.impl namespace
 * instead of using iotcs.enterprise.impl.
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// enterprise Https for browser
iotcs.impl.Platform.Https._authWindow = null;

/** TODO: Trial should be used for testing only, not for real POD. */
iotcs.impl.Platform.Https._getTokenAndRequest = (options, payload, trial, callback) => {
    let csrfOptions = {
        // DJM: I think I can remove this.
//        headers: {
//            // DJM: Need to fix these dcd references.
//            'Authorization': dcd._.internalDev._.bearer,
//        },
        hostname: options.hostname,
        method: 'GET',
        port: options.port,
        path: (iotcs.oracle.iot.client.test.auth.activated ? iotcs.oracle.iot.client.test.reqroot :
               iotcs.impl._reqRoot) + '/private/server',
        protocol: options.protocol
    };

    try {
        if (options.headers && options.headers.Authorization) {
            csrfOptions.headers = {};
            csrfOptions.headers.Authorization = options.headers.Authorization;
        //. DJM: Where is client coming from?...test and fix.
        } else if (client) {
            csrfOptions.headers = {};
            csrfOptions.headers.Authorization = client._bearer;
        }
    } catch(doNothing) {
        // Catches "ReferenceError" for client.
    }

    iotcs.impl.Platform.Https._request(csrfOptions, payload, (response, error) => {
        iotcs.impl.Platform.Https.Csrf._inProgress = false;

        if (!response || error) {
            callback(response, error);
            return;
        }

        if ((!iotcs.impl.Platform.Https.Csrf._token) && (trial > 0)) {
            iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, --trial,
                                                      callback);
        } else {
            iotcs.impl.Platform.Https._request(options, payload, callback, true);
        }
    }, true);
};

/**
 * TODO: Validate with server implementation the user auth.
 */
iotcs.impl.Platform.Https._req = (options, payload, callback, oracleIoT) => {
    // DJM: Can remove this.
//    ['family', 'localAddress', 'socketPath', 'agent', 'pfx', 'key', 'passphrase', 'cert', 'ca',
//     'ciphers', 'rejectUnauthorized', 'secureProtocol' ].forEach(key =>
//        {
//            if (key in options) {
//                //iotcs.log('iotcs.impl.Platform.Https.req ignores "' + key + '" option');
//            }
//        });

    if ((options.method === 'GET') && (payload)) {
        iotcs.log('There should be no payload when using GET method; use "path" for passing query.');
    }

    // If this is the first attempt to access IoT-CS...
    if (oracleIoT &&
        !iotcs.impl.Platform.Https.Csrf._token &&
        !iotcs.impl.Platform.Https.Csrf._inProgress)
    {
        iotcs.impl.Platform.Https.Csrf._inProgress = true;
        iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, 1, callback);
    } else {
        iotcs.impl.Platform.Https._request(options, payload, callback, oracleIoT);
    }
};

iotcs.impl.Platform.Https._request = (options, payload, callback, oracleIoT) => {
        let baseUrl =
            (options.protocol || 'https') +
            '://' +
            (options.hostname || options.host || 'localhost') +
            (((options.port) && ((options.protocol === 'https' && options.port !== 443)) ||
              (options.protocol === 'http' && options.port !== 80)) ? (':' + options.port) : '');

        let url = baseUrl + (options.path || '/');
        let authUrl = baseUrl + iotcs.impl.Platform.Https.AuthRequest._path;

        let _onNotAuth = authWindowOpen => {
            if ((!iotcs.impl.Platform.Https._authWindow ||
                 iotcs.impl.Platform.Https._authWindow.closed) && authWindowOpen)
            {
                iotcs.impl.Platform.Https._authWindow = window.open(authUrl, 'auth');
            }

            let authMonitor = null;

            authMonitor = new iotcs.impl.Monitor(() => {
                if (authMonitor) {
                    authMonitor._stop();
                }

                authMonitor = null;
                iotcs.impl.Platform.Https._req(options, payload, callback, oracleIoT);
            });

            authMonitor._start();
        };

        let xhr = new XMLHttpRequest();

        let _onready = req => {
            if (req.readyState === 4) {
                if ((req.status === iotcs.StatusCode.FOUND) || (req.status === 0) ||
                    (req.responseUrl && req.responseUrl.length && (decodeURI(req.responseURL) !== url)))
                {
                    _onNotAuth(true);
                    return;
                } else {
                    if (iotcs.impl.Platform.Https._authWindow &&
                        (!iotcs.impl.Platform.Https._authWindow.closed))
                    {
                        iotcs.impl.Platform.Https._authWindow.close();
                    }
                }

                if (req.status === iotcs.StatusCode.UNAUTHORIZED) {
                    if (!iotcs.impl.Platform.Https.Csrf._inProgress) {
                        iotcs.impl.Platform.Https.Csrf._token = null;
                    }
                    _onNotAuth(false);
                    return;
                }

                if ((req.status === iotcs.StatusCode.OK) || (req.status === iotcs.StatusCode.ACCEPTED)) {
                    if (xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName) &&
                        xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName).length)
                    {
                        iotcs.impl.Platform.Https.Csrf._token =
                            xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName);
                    }
                    callback(req.responseText);
                } else {
                    callback(null, iotcs.createError(req.responseText));
                }
            }

        };

        xhr.open(options.method, url, true);

        if (oracleIoT) {
            xhr.withCredentials = true;

            if (iotcs.impl.Platform.Https.Csrf._token) {
                xhr.setRequestHeader(iotcs.impl.Platform.Https.Csrf._tokenName,
                                     iotcs.impl.Platform.Https.Csrf._token);
            }
        }

        xhr.onreadystatechange = () => {
            _onready(xhr);
        };

        if (options.headers) {
            Object.keys(options.headers).forEach((key, index) => {

                if ((!oracleIoT) && (key === 'Authorization') && (options.auth)) {
                    xhr.setRequestHeader(key, options.auth);
                } else {
                    xhr.setRequestHeader(key, options.headers[key]);
                }
            });
        }

        xhr.send(payload || null);
};

