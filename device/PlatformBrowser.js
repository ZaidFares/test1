/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * device porting interface for browser.  This file contains device-specific functions when running
 * in a browser environment.  The classes are defined in shared/PlatformBrowser.js and additional
 * functions are added here for the device-browser environment.
 *
 * Since the JavaScript client library runs under both the web browser and NodeJS, we need a porting
 * layer for both.  Platform is defined in the shared namespace, hence the iotcs.impl namespace
 * instead of using iotcs.device.impl.
 */

if (typeof window === 'undefined') {
    iotcs.error('Invalid target platform.');
}

let _authWindow = null;

////////////////////////////////////////////////////////////////////////////////////////////////////
// device function additions to HTTP for browser
iotcs.impl.Platform.Https.prototype._req = (options, payload, callback) => {
        // If the device has been activated we send the ActivationID as the ClientID.  If the device
        // has not been activated, we send the DeviceID as the ClientID.
        if (options.tam &&
            (typeof options.tam.getTrustAnchorCertificates === 'function') &&
            Array.isArray(options.tam.getTrustAnchorCertificates()) &&
            (options.tam.getTrustAnchorCertificates().length > 0))
        {
            options.ca = options.tam.getTrustAnchorCertificates();
        }

        options.rejectUnauthorized = true;
        options.agent = false;

        if ((options.method === 'GET') && (payload)) {
            iotcs.log('There should be no payload when using GET method; use "path" for passing query.');
        }

        // // If this is the first attempt to access IoT-CS...
        // if ((oracleIoT) && (!iotcs.impl.Platform.Https.Csrf._token) &&
        //    (!iotcs.impl.Platform.Https.Csrf._inProgress))
        // {
        //     iotcs.impl.Platform.Https.Csrf._inProgress = true;
        //     iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, 1, callback);
        // } else {
        //     iotcs.impl.Platform.Https._request(options, payload, callback, oracleIoT);
        // }

        iotcs.impl.Platform.Https._request(options, payload, callback, true);
};

/**
 * This function performs the HTTP request to the IoT CS.
 *
 * @param options The HTTPS options.
 * @param payload The payload to send if any is to be sent.
 * @param callback The callback with the results or error.
 * @param oracleIoT
 */
iotcs.impl.Platform.Https.prototype._request = (options, payload, callback, oracleIoT) => {
    let baseUrl = (options.protocol || 'https') +
        '://' +
        (options.hostname || options.host || 'localhost') +
        (((options.port) && ((options.protocol === 'https' && options.port !== 443)) ||
          (options.protocol === 'http' && options.port !== 80)) ? (':' + options.port) : '');

    let url = baseUrl + (options.path || '/');
    let authUrl = baseUrl + iotcs.impl.Platform.Https.AuthRequest._path;

    if (options.tam
        && (typeof options.tam.getTrustAnchorCertificates === 'function')
        && Array.isArray(options.tam.getTrustAnchorCertificates())
        && (options.tam.getTrustAnchorCertificates().length > 0))
    {
        options.ca = options.tam.getTrustAnchorCertificates();
    }

    options.rejectUnauthorized = true;
    options.protocol = options.protocol + ':';
    options.agent = false;

    let _onNotAuth = () => {
        callback(null, new Error('{"statusCode": ' + iotcs.StatusCode.UNAUTHORIZED +
                                 ', "statusMessage": "Unauthorized", "body": ""}'));
    };

    let xhr = new XMLHttpRequest();

    /**
     * Function which is called when xhr events occur.
     *
     * @param req the request.
     */
    let _onready = req => {
        // req.readyState === 4 indicates the request is done.
        if (req.readyState === 4) {
            if ((req.status === iotcs.StatusCode.FOUND) || (req.status === 0) ||
                (req.responseUrl && req.responseUrl.length &&
                 (decodeURI(req.responseURL) !== url)))
            {
                _onNotAuth();
                return;
            }

            if ((req.status === iotcs.StatusCode.UNAUTHORIZED) ||
                (req.status === iotcs.StatusCode.FORBIDDEN))
            {
                _onNotAuth();
                return;
            }

            if ((req.status === iotcs.StatusCode.OK) || (req.status === iotcs.StatusCode.ACCEPTED)) {
                if (xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName) &&
                    xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName).length)
                {
                    iotcs.impl.Platform.Https.Csrf._token = xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName);
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
            xhr.setRequestHeader(iotcs.impl.Platform.Https.Csrf._tokenName, iotcs.impl.Platform.Https.Csrf._token);
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// device function additions to OS for browser
/**
 * Returns the line separator for this platform.
 *
 * @returns {string} The line separator for this platform.
 */
iotcs.impl.Platform.Os.prototype._lineSeparator = () => {
    if (navigator.appVersion.indexOf("Win") != -1) {
        return '\r\n';
    }

    return '\n';
};

