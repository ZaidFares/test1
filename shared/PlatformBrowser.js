/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Shared porting interface for browser.  There may be additions to these classes in the device and
 * enterprise PlatformBrowser.js files, if they exist.
 */

iotcs.impl.Platform = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Platform class

/**
 * @ignore
 */
iotcs.impl.Platform = class {
    // Static private/protected functions
    /**
     * Takes a URL as a string and returns an URL object.
     *
     * @param {string} urlStr - A URL.
     * @returns {URL} {@code true} if the URL is a valid URL.
     * @throws Error if the URL string is not a valid URL.
     */
    static _createUrl(urlStr) {
        return new URL(urlStr);
    }

    static _debug(message) {
        //console.log(message);
    }

    /**
     * Returns a string representation of the specified object. The returned string is typically
     * used for debugging.
     *
     * @param {object} obj the object to "debug".
     * @returns {string} a string representation of the object.
     */
    static _inspect(obj) {
        // DJM: Is this correct?
        return String(obj);
    }

    // Static private/protected functions
    static _userAuthNeeded() {
        return true;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// File
iotcs.impl.Platform.File = class {
    // Static private/protected functions
    static _append(path, data) {
        let originalData = localStorage.getItem(path);

        if (!originalData) {
            iotcs.error('Could not load file: "' + path + '".');
            return;
        }

        localStorage.setItem(path, originalData + data);
    }

    /**
     * Returns {@code true} if the specified file exists in local storage.
     *
     * @param {string} pathFileName the path and name of the file to check if exists.
     * @returns {boolean} {@code true} if the specified file exists in local storage.
     */
    static _exists(pathFileName) {
        return (localStorage.getItem(pathFileName) !== null);
    }

    /**
     * Opens the file with the given path/filename and returns it's contents.
     *
     * @param {string} pathFileName - The path and name of the file to load.
     * @returns {string} the contents of the file, or <code>null</code> if there was a problem opening
     *          the file.
     */
    static _load(pathFileName) {
        let fileContents = localStorage.getItem(pathFileName);

        if (!fileContents) {
            iotcs.error('Could not load file: "' + pathFileName + '"');
            return null;
        }

        return fileContents;
    }

    /**
     * Removes the file with the given path/filename from local storage.
     *
     * @param {string} pathFileName the path and name of the file to remove.
     */
    static _remove(pathFileName) {
        localStorage.removeItem(pathFileName);
    }

    /**
     * Stores the file with the given path/filename in local storage with the data.
     *
     * @param {string} pathFileName the path and name of the file to remove.
     * @param {string} data the data to store in the file.
     */
    static _store(pathFileName, data) {
        localStorage.setItem(pathFileName, data);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared AuthRequest for browser
iotcs.impl.Platform.Https = {};
iotcs.impl.Platform.Https.AuthRequest = {};
iotcs.impl.Platform.Https.AuthRequest._path = '/iot/webapi/v2/private/server';
Object.freeze(iotcs.impl.Platform.Https.AuthRequest);

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared CSRF for browser
iotcs.impl.Platform.Https.Csrf = {};
iotcs.impl.Platform.Https.Csrf._inProgress = false;
iotcs.impl.Platform.Https.Csrf._token = null;
iotcs.impl.Platform.Https.Csrf._tokenName = 'X-CSRF-TOKEN';


////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Os for browser 
iotcs.impl.Platform.Os = class {
    // Static private/protected functions
    static _release() {
        return '0';
    }

    static _type() {
        return window.navigator.platform;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Util for browser
iotcs.impl.Platform.Util = class {
    // Static private/protected functions
    static _atob(str) {
        return atob(str);
    }

    static _btoa(str) {
        return btoa(str);
    }

    static _rng(count) {
        let a = new Array(count);

        for (let i = 0; i < count; i++) {
            a[i] = Math.floor(Math.random()*256);
        }

        return a;
    }

    static _uuidv4() {
        let r16 = iotcs.impl.Platform.Util._rng(16);
        r16[6]  &= 0x0f;  // clear version
        r16[6]  |= 0x40;  // set to version 4
        r16[8]  &= 0x3f;  // clear variant
        r16[8]  |= 0x80;  // set to IETF variant
        let i = 0;

        return _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i]];
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Query for browser
iotcs.impl.Platform.Query = class {
    // Static private/protected functions
    static _escape(str) {
        return escape(str);
    }

    static _parse(str, sep, eq, options) {
        let _sep = sep || '&';
        let _eq  = eq  || '=';
        let decodeURIComponent = iotcs.impl.Platform.Query._unescape;
        let obj = {};
        let args = str.split(_sep);
        
        for (let i = 0; i < args.length; i++) {
            let pair = args[i].split(_eq);
            let field = decodeURIComponent(pair[0]);
            let value = decodeURIComponent(pair[1]);

            if (obj[field]) {
                if (!Array.isArray(obj[field])) {
                    let current = obj[field];
                    obj[field] = new Array(current);
                }

                obj[field].push(value);
            } else {
                obj[field] = value;
            }
        }

        return obj;
    }

    static _stringify(obj, sep, eq, options) {
        let _sep = sep || '&';
        let _eq  = eq  || '=';
        let encodeURIComponent = iotcs.impl.Platform.Query._escape;
        let str = '';

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') {
                obj[key].forEach(e => {
                    str += _sep + key + _eq + encodeURIComponent(e);
                });
            } else {
                str += _sep + key + _eq + encodeURIComponent(obj[key]);
            }
        });

        return str.substring(1);
    }

    static _unescape(str) {
        return unescape(str);
    }
};
