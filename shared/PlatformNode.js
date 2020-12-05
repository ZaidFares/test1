/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * shared porting interface for NodeJS.  There may be additions to these classes in the device and
 * enterprise PlatformNode.js files, if they exist.
 */

/** @ignore */
iotcs.impl.Platform = iotcs.impl.Platform || {};

// DJM: This makes no sense to me.
//if (iotcs.debug) {
//    iotcs.impl.Platform = iotcs.impl.Platform;
//}

// Pre-requisites (Internal to the library).
let forge = require('node-forge');

// Pre-requisites (internal to iotcs.impl.Platform);
let fs = require('fs');
let http = require('http');
let https = require('https');
let os = require('os');
let querystring = require('querystring');
let spawn = require('child_process').spawnSync;
let sqlite3 = require('sqlite3');
let url = require('url');
let util = require('util');

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared debug output options for NodeJS
let debug = require ('debug')('debug');
////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared global function expressions for NodeJS
let _downloadStorageReq = (options, storageObject, isClassicStorageObject, deliveryCallback,
                           errorCallback, processCallback) =>
{
    let writableStream = storageObject.getOutputStream();

    if (writableStream) {
        let encoding = storageObject.getEncoding();
        let downloadBytes = 0;
        let protocol = options.protocol.indexOf("https") !== -1 ? https : http;

        let req = protocol.request(options, response => {
            debug();
            debug("Response: " + response.statusCode + ' ' + response.statusMessage);
            debug(response.headers);

            // Continuously update stream with data...
            let body = '';

            if (encoding) {
                writableStream.setDefaultEncoding(encoding);
            }

            writableStream.on('error', err => {
                errorCallback(err);
            });

            /** @type MessageDigest */
            let messageDigest = forge.md.md5.create();

            response.on('data', d => {
                if (storageObject._isCancelled()) {
                    req.abort();
                    return;
                }

                if (messageDigest) {
                    messageDigest.update(d);
                }

                body += d;
                downloadBytes += d.length;
                writableStream.write(d);

                if (processCallback) {
                    processCallback(storageObject, iotcs.StorageDispatcher.Progress.State.IN_PROGRESS,
                                    downloadBytes);
                }
            });

            response.on('end', () => {
                // TODO: Implement checksum
                //                // Should (can) this use request instead of response?
                //                const checksum = isClassicObjectStorage ?
                //                      response['ETag'] : response['opc-content-md5'];
                //
                //                if ((checksum !== null) && (contentChecksum !== null)) {
                //                    // Verify MD5 checksum (objects < 5GB)
                //                    /** @type {string} */
                //                    const messageDigestOut = isClassicObjectStorage ?
                //                          forge.util.bytesToHex(contentChecksum) :
                //                          forge.util.encode64(contentChecksum);
                //
                //                    if (!(checksum === messageDigestOut)) {
                //                        console.log('Storage Cloud Service: checksum mismatch');
                //                        return -1;
                //                    }
                //                }

                if (!req.aborted) {
                    if ((response.statusCode === iotcs.StatusCode.OK) ||
                        (response.statusCode === iotcs.StatusCode.PARTIAL))
                    {
                        writableStream.end();
                        let responseHeaders = response.headers;
                        const xObjMeta = 'X-Object-Meta-';

                        // TODO: May need to find out what the headers look like before parsing.
                        for (let key in responseHeaders) {
                            if (key.startsWith(xObjMeta)) {
                                storageObject._.setCustomMetadata(key.substring(xObjMeta.length), 
                                                                  responseHeaders[key]);
                            }
                        }

                        let lastModified = new Date(Date.parse(response.headers["last-modified"]));
                        storageObject._setAttributes(lastModified, downloadBytes);
                        deliveryCallback(storageObject, null, downloadBytes);
                    } else {
                        let error = new Error(JSON.stringify({
                            statusCode: response.statusCode,
                            statusMessage: (response.statusMessage ? response.statusMessage : null),
                            body: body
                        }));

                        errorCallback(error);
                    }
                }
            });
        });

        req.on('timeout', () => {
            errorCallback(new Error('Connection timeout.'));
        });

        req.on('error', error => {
            errorCallback(error);
        });

        req.on('abort', () => {
            if (processCallback) {
                processCallback(storageObject, iotcs.StorageDispatcher.Progress.State.CANCELLED,
                                downloadBytes);
            }
        });

        if (storageObject._isCancelled()) {
            req.abort();
            return;
        }

        req.end();
    } else {
        errorCallback(new Error("Writable stream is not set for storage object. Use setOutputStream."));
    }
};

/**
 * This method is used for retrieving disk space information. It uses OS specific
 * utility commands, so it is very OS specific implementation. Also because handling
 * of external processes executed with spawn is not good, the timeout and try/catch
 * is used and if any error occurs -1 value is returned for each info.
 *
 * @ignore
 */
let _getDiskSpace = () => {
    let diskSpace = {
        freeDiskSpace: -1,
        totalDiskSpace: -1
    };

    try {
        if (os.platform() === 'win32') {
            let prc1 = spawn('wmic',
                ['LogicalDisk', 'Where', 'DriveType="3"', 'Get', 'DeviceID,Size,FreeSpace'], 
                {timeout: 1000});
            
            let str1 = prc1.stdout.toString();
            let lines1 = str1.split(/(\r?\n)/g);

            lines1.forEach(line => {
                if (line.indexOf(__dirname.substring(0, 2)) > -1) {
                    let infos = line.match(/\d+/g);

                    if (Array.isArray(infos)) {
                        diskSpace.totalDiskSpace = infos[1];
                        diskSpace.freeDiskSpace = infos[0];
                    }
                }
            });
        } else if (os.platform() === 'linux' || os.platform() === "darwin") {
            let prc2 = spawn('df', [__dirname], {timeout: 1000});
            let str2 = prc2.stdout.toString();
            str2 = str2.replace(/\s/g,'  ');
            let infos = str2.match(/\s\d+\s/g);

            if (Array.isArray(infos)) {
                diskSpace.freeDiskSpace = parseInt(infos[2]);
                diskSpace.totalDiskSpace = (parseInt(infos[1]) + parseInt(infos[2]));
            }
        }
    } catch (e) {
        // Ignore
    }

    return diskSpace;
};

/**
 * @param options
 * @param {iotcs.StorageObject } storageObj
 * @param deliveryCallback
 * @param errorCallback
 * @param processCallback
 */
let _uploadStorageReq = (options, storageObject, isClassicStorageObject, deliveryCallback,
                         errorCallback, processCallback) =>
{
    let encoding = storageObject.getEncoding();
    let uploadBytes = 0;
    let protocol = options.protocol.indexOf("https") !== -1 ? https : http;
    /** @type {Uint8Array} */
    let contentChecksum = null;

    let req = protocol.request(options, response => {
        debug();
        debug("Response: " + response.statusCode + ' ' + response.statusMessage);
        debug(response.headers);

        // Continuously update stream with data...
        let body = '';

        response.on('data', d => {
            body += d;
        });

        response.on('end', () => {
            if (!req.aborted) {
                // TODO: Fix checksum
                //                // Should (can) this use request instead of response?
                //               const checksum = isClassicObjectStorage ?
                //                     response['ETag'] : response['opc-content-md5'];
                //
                //                if ((checksum !== null) && (contentChecksum !== null)) {
                //                    // Verify MD5 checksum (objects < 5GB)
                //                    /** @type {string} */
                //                    const messageDigestOut = isClassicObjectStorage ?
                //                          forge.util.bytesToHex(contentChecksum) :
                //                          forge.util.encode64(contentChecksum);
                //
                //                    if (!(checksum === messageDigestOut)) {
                //                        console.log('Storage Cloud Service: checksum mismatch');
                //                        return -1;
                //                    }
                //                }
                if ((response.statusCode === iotcs.StatusCode.CREATED) ||
                    (response.statusCode === iotcs.StatusCode.OK))
            {
                    let lastModified = new Date(Date.parse(response.headers["last-modified"]));
                    storageObject._setAttributes(lastModified, uploadBytes);
                    deliveryCallback(storageObject, null, uploadBytes);
                } else {
                    let error = new Error(JSON.stringify({
                        statusCode: response.statusCode,
                        statusMessage: (response.statusMessage ? response.statusMessage : null),
                        body: body
                    }));

                    errorCallback(error);
                }
            }
        });
    });

    req.on('timeout', () => {
        errorCallback(new Error('Connection timeout.'));
    });

    req.on('error', error => {
        errorCallback(error);
    });

    req.on('abort', () => {
        if (processCallback) {
            processCallback(storageObject, iotcs.StorageDispatcher.Progress.State.CANCELLED,
                            uploadBytes);
        }
    });

    let readableStream = storageObject.getInputStream();

    if (readableStream) {
        /** @type MessageDigest */
        let messageDigest = forge.md.md5.create();

        readableStream.on('data', chunk => {
            if (storageObject._isCancelled()) {
                req.abort();
                return;
            }

            if (messageDigest) {
                messageDigest.update(chunk);
            }

            req.write(chunk, encoding);
            uploadBytes += chunk.length;

            if (processCallback) {
                processCallback(storageObject, iotcs.StorageDispatcher.Progress.State.IN_PROGRESS,
                                uploadBytes);
            }
        }).on('end', () => {
            if (storageObject._isCancelled()) {
                req.abort();
                return;
            }

            contentChecksum = messageDigest.digest();

            req.end();
        }).on('error', error => {
            errorCallback(error);
        });
    } else {
        errorCallback(new Error("Readable stream is not set for storage object. Use setInputStream."));
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Platform for NodeJS 
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
        return require('url').parse(urlStr, true);
    }

    static _debug(message) {
        debug(message);
    }

    /**
     * Encodes a string to an Uint8Array using UTF-8 encoding.
     *
     * @param {string} str - The string to encode.
     * @returns {Uint8Array} The encoded string as a Uint8Array.
     */
    static _encode(str) {
        return Buffer.from(str, 'utf-8');
    }

    /**
     * Returns a string representation of the specified object. The returned string is typically
     * used for debugging.
     *
     * @param {object} obj the object to "debug".
     * @returns {string} a string representation of the object.
     */
    static _inspect(obj) {
        return util.inspect(obj);
    }

    static _userAuthNeeded() {
        return false;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared File for NodeJS
iotcs.impl.Platform.File = class {
    // Static private/protected functions
    static _append(path, data) {
        try {
            fs.appendFileSync(path, data);
        } catch (e) {
            iotcs.error('Could not append to file "' + path + '".');
        }
    }

    static _exists(path) {
        try {
            return fs.statSync(path).isFile();
        } catch (e) {
            return false;
        }
    }

    static _load(path) {
        let data = null;

        try {
            let tmp = fs.readFileSync(path, {encoding:'binary'});
            let len = tmp.length;
            data = '';

            for (let i = 0; i < len; i++) {
                data += tmp[i];
            }
        } catch (e) {
            iotcs.error('Could not load file "' + path + '".');
            return;
        }

        return data;
    }

    static _remove(path) {
        try {
            fs.unlinkSync(path);
        } catch (e) {
            iotcs.error('Could not remove file "' + path + '".');
        }
    }

    static _size(path) {
        try {
            return fs.statSync(path).size;
        } catch (e) {
            return -1;
        }
    }

    static _store(path, data) {
        try {
            fs.writeFileSync(path, data, {encoding:'binary'});
        } catch (e) {
            iotcs.error('Could not store file "' + path + '".');
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Https for NodeJS
iotcs.impl.Platform.Https = class {
    // Static private/protected functions
    static _req(options, payload, callback) {
        if (options.tam &&
            (typeof options.tam.getTrustAnchorCertificates === 'function') &&
            Array.isArray(options.tam.getTrustAnchorCertificates()) &&
            (options.tam.getTrustAnchorCertificates().length > 0))
        {
            options.ca = options.tam.getTrustAnchorCertificates();
        }

        options.rejectUnauthorized = true;
        options.protocol = options.protocol + ':';
        options.agent = false;

        if ((options.method !== 'GET') &&
            ((options.path.indexOf('attributes') > -1) || (options.path.indexOf('actions') > -1)))
        {
            if (options.headers['Transfer-Encoding'] !== "chunked") {
                options.headers['Content-Length'] = payload.length;
            }
        }

        let urlObj = url.parse(options.path, true);

        if (urlObj.query) {
            if (typeof urlObj.query === 'object') {
                urlObj.query = querystring.stringify(urlObj.query);
            }

            urlObj.query = querystring.escape(urlObj.query);
        }

        options.path = url.format(urlObj);

        debug();
        debug("Request: " + new Date().getTime());
        debug(options.path);
        debug(payload);

        let req = https.request(options, response => {
            debug();
            debug("Response: " + response.statusCode + ' ' + response.statusMessage);
            debug(response.headers);

            // Continuously update stream with data.
            let body = '';

            response.on('data', data => {
                body += data;
            });

            response.on('end', () => {
                // Data reception is done, do whatever with it!
                debug(body);

                if ((response.statusCode === iotcs.StatusCode.OK) ||
                    (response.statusCode === iotcs.StatusCode.CREATED) ||
                    (response.statusCode === iotcs.StatusCode.ACCEPTED))
                {
                    if (response.headers &&
                        (typeof response.headers['x-min-acceptbytes'] !== 'undefined') &&
                        (response.headers['x-min-acceptbytes'] !== '') &&
                        (response.headers['x-min-acceptbytes'] !== 0))
                    {
                        callback(JSON.stringify({'x-min-acceptbytes': response.headers['x-min-acceptbytes']}));
                    } else {
                        callback(body);
                    }
                } else {
                    let error = new Error(JSON.stringify({statusCode: response.statusCode, statusMessage: (response.statusMessage ? response.statusMessage : null), body: body}));
                    callback(body, error);
                }
            });
        });

        if (options.path.indexOf('iot.sync') < 0) {
            req.setTimeout(iotcs.oracle.iot.client.httpConnectionTimeout);
        } else if (options.path.indexOf('iot.timeout=') > -1) {
            let timeout = parseInt(options.path.substring(options.path.indexOf('iot.timeout=') +
                                                          12));
            req.setTimeout(timeout * 1000 + iotcs.oracle.iot.client.device.longPollingTimeoutOffset);
        }

        req.on('timeout', () => {
            callback(null, new Error('Connection timeout.'));
        });

        req.on('error', error => {
            callback(null, error);
        });

        req.write(payload);
        req.end();
    }

    static _storageReq(options, storageObject, isClassicObjectStorage, deliveryCallback,
                       errorCallback, processCallback)
    {
        options.protocol = options.protocol + ':';
        options.rejectUnauthorized = true;
        options.agent = false;

        let isUpload = false;

        if (options.method !== 'GET') {
            isUpload = true;

            if (options.headers['Transfer-Encoding'] === "chunked") {
                options.headers['Content-Length'] = -1;
            } else {
                options.headers['Content-Length'] = storageObject.getLength();
            }
        }

        let urlObj = url.parse(options.path, true);

        if (urlObj.query) {
            if (typeof urlObj.query === 'object') {
                urlObj.query = querystring.stringify(urlObj.query);
            }

            urlObj.query = querystring.escape(urlObj.query);
        }

        options.path = url.format(urlObj);

        debug();
        debug("Request: " + new Date().getTime());
        debug(options.path);
        debug(options);

        if (isUpload) {
            _uploadStorageReq(options, storageObject, isClassicObjectStorage, deliveryCallback,
                errorCallback, processCallback);
        } else {
            _downloadStorageReq(options, storageObject, isClassicObjectStorage, deliveryCallback,
                errorCallback, processCallback);
        }
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Os for NodeJS
iotcs.impl.Platform.Os = class {
    // Static private/protected functions.
    /**
     * Returns the line separator for this platform.
     *
     * @returns {string} The line separator for this platform.
     */
    static _lineSeparator() {
        return os.EOL;
    }

    static _release() {
        return os.release();
    }

    static _type() {
        return os.type();
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Query for NodeJS 
iotcs.impl.Platform.Query = class {
    // Static private/protected functions
    static _escape(str) {
        return querystring.escape(str);
    }

    static _parse(str, sep, eq, options) {
        return querystring.parse(str, sep, eq, options);
    }

    static _stringify(obj, sep, eq, options) {
        return querystring.stringify(obj, sep, eq, options);
    }
    static _unescape(str) {
        return querystring.unescape(str);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Util for NodeJS 
iotcs.impl.Platform.Util = class {
    // Static private/protected functions
    static _atob(str) {
        return new Buffer(str, 'base64').toString();
    }

    static _btoa(str) {
        return new Buffer(str).toString('base64');
    }

    static _diagnostics() {
        let obj = {};
        obj.version = (process.env['oracle.iot.client.version'] || 'Unknown');
        let net = os.networkInterfaces();
        let space = _getDiskSpace();
        obj.freeDiskSpace = space.freeDiskSpace;
        obj.totalDiskSpace = space.totalDiskSpace;
        obj.ipAddress = 'Unknown';
        obj.macAddress = 'Unknown';
        let netInt = null;

        for (let key in net) {
            if (!key.match(/^lo\d?$/) && (key.indexOf('Loopback') < 0) && (net[key].length > 0)) {
                netInt = net[key][0];
                break;
            }
        }

        if (netInt && netInt.address) {
            obj.ipAddress = netInt.address;
        }

        if (netInt && netInt.mac) {
            obj.macAddress = netInt.mac;
        }

        return obj;
    }

    static _rng(count) {
        let b = forge.random.getBytesSync(count);
        let a = new Array(count);

        for (let i = 0; i < count; i++) {
            a[i] = b[i].charCodeAt(0);
        }

        return a;
    }

    // TODO: This implementation is erroneous: leading '0's are sometime missing. => please use exact
    //       same implementation as $port-browser.js (it is anyway based on $port.util.rng()) +
    //       import _b2h.
    static _uuidv4() {
        let r16 = iotcs.impl.Platform.Util._rng(16);
        r16[6]  &= 0x0f;  // clear version
        r16[6]  |= 0x40;  // set to version 4
        r16[8]  &= 0x3f;  // clear variant
        r16[8]  |= 0x80;  // set to IETF variant
        var i = 0;

        return _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i]];
    }
};
