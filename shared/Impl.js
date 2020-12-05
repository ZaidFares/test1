/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Implementation functions and classes for the shared namespace.
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared global functions expressions
let _b2h = (() => {
    var r = [];

    for (var i = 0; i < 256; i++) {
        r[i] = (i + 0x100).toString(16).substr(1);
    }

    return r;
})();

function _initTam (callback) {
    if ((typeof window !== 'undefined') && iotcs.oracle.iot.client.serverUrl &&
        (typeof iotcs.oracle.iot.client.serverUrl === 'string') &&
        (typeof forge.util.parseUrl(iotcs.oracle.iot.client.serverUrl) === 'object'))
    {
        let parsed = forge.util.parseUrl(iotcs.oracle.iot.client.serverUrl);

        iotcs.impl._tam = {
            getServerHost: function () {
                return parsed.host;
            },
            getServerPort: function () {
                return parsed.port;
            }
        };

        callback();
    } else if (iotcs.oracle.iot.tam.store &&
               (typeof window !== 'undefined') &&
               location.hostname && location.protocol)
    {
        let i = location.protocol.indexOf(':');
        let protocol = (i<0) ? location.protocol : location.protocol.substring(0, i);

        iotcs.impl.Platform.Https._req({
            method: 'GET',
            path: iotcs.oracle.iot.tam.store,
            protocol: protocol,
            hostname: location.hostname,
            port: location.port
        }, '', response => {
            iotcs.impl.Port.File._store(iotcs.oracle.iot.tam.store, response);
            iotcs.impl._tam = new iotcs.enterprise.TrustedAssetsManager();
            callback();
        }, false);
    } else {
        iotcs.impl._tam = (iotcs.enterprise ?
                     new iotcs.enterprise.TrustedAssetsManager() :
                     new iotcs.device.TrustedAssetsManager());
        callback();
    }
}

/** @ignore */
function _httpsTamReq (options, payload, callback) {
    let basePath = null;
    let testPath = null;

    if (options.path.indexOf(iotcs.impl._reqRoot) > -1) {
        basePath = iotcs.impl._reqRoot;
        testPath = (iotcs.oracle.iot.client.test ? iotcs.oracle.iot.client.test.reqRoot : null);
    } else if (iotcs.oracle.iot.client.test &&
               (options.path.indexOf(iotcs.oracle.iot.client.test.reqRoot) > -1))
    {
        basePath = iotcs.oracle.iot.client.test.reqRoot;
    }

    // @TODO: Better way of handling links
    if(options.path &&
       ((options.path.indexOf('http:') === 0) || (options.path.indexOf('https:') === 0)))
    {
        options.path = options.path.substring(options.path.indexOf(basePath));
    }

    let opt = {};
    let oracleIoT = true;

    if (!(options.tam)) {
        options.tam = iotcs.impl._tam;
    }

    if (options.tam) {
        opt.protocol = 'https';
        opt.hostname = options.tam.getServerHost();
        opt.port = options.tam.getServerPort();
    } else if (typeof location !== 'undefined') {
        if (location.protocol) {
            var i = location.protocol.indexOf(':');
            opt.protocol = (i < 0) ? location.protocol : location.protocol.substring(0, i);
        }

        if (location.hostname) {
            opt.hostname = location.hostname;
        }

        if (location.port) {
            opt.port = location.port;
        }

        oracleIoT = false;
    }

    opt.headers = {};
    opt.headers.Accept = 'application/json';
    opt.headers['Content-Type'] = 'application/json';

    //@TODO: Remove basic auth; only for tests and test server
    //@TODO: (jy) use iotcs.debug if this configuration is really/always needed for tests ...
    if (iotcs.oracle.iot.client.test && iotcs.oracle.iot.client.test.auth.activated) {
        opt.protocol = iotcs.oracle.iot.client.test.auth.protocol;
        opt.headers.Authorization = 'Basic ' +
            iotcs.impl.Port.Util._btoa(iotcs.oracle.iot.client.test.auth.user +
                            ':' +
                            iotcs.oracle.iot.client.test.auth.password);

        if (testPath) {
            options.path = options.path.replace(basePath, testPath);
        }
    }

    for (var key in options) {
        if (key === 'headers') {
            for (var header in options.headers) {
                if (options.headers[header] === null) {
                    delete opt.headers[header];
                } else {
                    opt.headers[header] = options.headers[header];
                }
            }
        } else {
            opt[key] = options[key];
        }
    }

    iotcs.impl.Platform.Https._req(opt, payload, (responseBody, error) => {
        if (!responseBody || error) {
            callback(null, error);
            return;
        }
        var responseJson = null;
        try {
            responseJson = JSON.parse(responseBody);
        } catch (e) {

        }
        if (!responseJson || (typeof responseJson !== 'object')) {
            callback(null, iotcs.createError('response not JSON'));
            return;
        }
        callback(responseJson);
    }, oracleIoT);
}

/** @ignore */
function _mandatoryArg(arg, types) {
    if (!arg) {
        iotcs.error('missing argument');
        return;
    }
    __checkType(arg, types);
}

/** @ignore */
function _optionalArg(arg, types) {
    if (!arg) {
        return;
    }
    __checkType(arg, types);
}

/**
 * Determines if the argument is of the type listed in 'type'.
 *
 * @param {?} arg The argument to check.
 * @param type {string} A named type (e.g. 'string').
 * @returns {boolean} {@code true} if arg is of the type listed in 'type'.
 *
 * @ignore
 * @private
 */
function __isArgOfType(arg, type) {
    if ((type === 'array') ||
        (type === 'boolean') ||
        (type === 'function') ||
        (type === 'number') ||
        (type === 'object') ||
        (type === 'string') ||
        (type === 'symbol') ||
        (type === 'undefined'))
    {
        switch (type) {
            case 'array':
                return Array.isArray(arg);
            case 'boolean':
            case 'function':
            case 'number':
                return (typeof(arg) === type);
            case 'object':
                return (arg instanceof Object);
            case 'string':
                return (typeof(arg) === 'string') || (arg instanceof String);
            default:
        }
    } else {
        switch(typeof(type)) {
            case 'function':
            case 'object':
                return (arg instanceof type);
            case 'string':
                return (type==='array') ? Array.isArray(arg) : (typeof(arg) === type);
            default:
        }
    }

    return false;
}

/**
 * Determines if the argument is of a type listed in types.
 *
 * @ignore
 *
 * @param {?} arg The argument to check.
 * @param {string|Array} types Either a named type (e.g. 'string'), or an Array of named types (e.g.
 *         ['string', 'object'}.
 * @throws An Error if the argument is not one of the types listed in 'types'.
 */
function __checkType(arg, types) {
    var argType = typeof(arg);

    if (Array.isArray(types)) {
        var matches = types.some(type => {
            return __isArgOfType(arg, type);
        });

        if (!matches) {
            iotcs.log('Type mismatch: got ' + argType + ' but expecting any of ' + types.toString() +
                '.');
            iotcs.error('Illegal argument type.');
            return;
        }

        return;
    }

    if (!__isArgOfType(arg, types)) {
        iotcs.log('Type mismatch: got ' + argType + ' but expecting ' + types + '.');
        iotcs.error('Illegal argument type.');
    }
}

/**
 * @ignore
 */
function _isEmpty(obj) {
    if (obj === null || (typeof obj === 'undefined')) return true;
    return (Object.getOwnPropertyNames(obj).length === 0);
}

/**
 * Determines if the given URL is a valid storage cloud URI.  Note that this just tests the syntax
 * of the URI, not whether the URL points to a valid storage object web server.
 *
 * Oracle storage cloud host pattern matches URIs that start with
 * https://objectstorage.*.oraclecloud.com
 * or
 * https://*.storage.oraclecloud.com
 *
 * An object name in the storage cloud matches URIs that start with
 * https://objectstorage.*.oraclecloud.com/n/*&#47;/b/*&#47;/o/{object}
 * An object name in the classic storage could matches URIs that start with
 * https://*.storage.oraclecloud.com/v1/*&#47;/*&#47;/{object}
 *
 * Note that patterns make assumptions that the URI string being matched is valid.
 * Note that the port number on the URL is treated as optional.
 * Note that the 'localhost' optional match is for mock server.
 * Note that the use of [^/] is to match any character except the forward slash. This
 * ensures that the object name is correctly grouped for a classic storage URI
 * of the form https://*.storage.oraclecloud.com/v1/* /* /{endpoint-id}/{file-name}. If
 * the pattern was .+ (any character), the match would group just the {file-name}.
 * Alternatively, the pattern .+? (non-greedy match any) could have been used, but
 * 'match any character except forward slash' is easier to understand.
 *
 * Note: *&#47; is '* /' (without the space in the middle).  It's in the doc comment like this as
 *       the two characters together close the doc comment.
 *
 * @param {string} urlStr - A storage cloud URI as a string.
 * @returns {boolean} {@code true} if urlStr is a valid storage cloud URI.
 * @throws An Error if urlStr is not a valid storage cloud URI.
 *
 * @ignore
 */
function _isStorageCloudURI(urlStr) {
    try {
        let url = iotcs.impl.Platform._createUrl(urlStr);
        let pattern = new RegExp('https?://(?:(?:objectstorage\\..+|.+\\.storage)\\.oraclecloud\\.com|localhost).*');
        return pattern.test(url.href);
    } catch(error) {
        return false;
    }
}

// DJM: I don't think this is needed, it's been replaced by iotcs.impl.QueueNode.
//function _queueNode(data) {
//    this.data = data;
//
//    if (data.getJSONObject !== undefined) {
//        this.priority =
//            ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].indexOf(data.getJSONObject().priority);
//    } else {
//        this.priority = 'LOW';
//    }
//}

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Https
// TODO: Default Trusted Assets Manager (TAM) Integration
/**
 * @ignore
 */
iotcs.impl.Https = class {
    // Private/protected functions
    static _req(options, payload, callback) {
        if (!iotcs.impl._tam && !(options.tam)) {
            _initTam(() => {
                _httpsTamReq(options, payload, callback);
            });
        } else {
            _httpsTamReq(options, payload, callback);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared PriorityQueue 
/**
 * @param {array} maxQueue = An array of objects with {data, priority}.
 */
iotcs.impl.PriorityQueue = class {
    constructor(maxQueue) {
        /** @type {QueueNode[]} */
        this._heap = [null];
        this._maxQueue = maxQueue;
    }

    // Private/protected functions
    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    _bubble(i) {
        while (i > 1) {
            let parentIndex = i >> 1; // <=> floor(i/2)

            // If equal, no bubble (maintains insertion order).
            if (!this._isHigherPriority(i, parentIndex)) {
                break;
            }

            this._swap(i, parentIndex);
            i = parentIndex;
        }
    }

    // Returns true if node i is higher priority than j.
    _isHigherPriority(i,j) {
        var prioI = ((this._heap[i] && this._heap[i]._priority) ? this._heap[i]._priority : 0);
        var prioJ = ((this._heap[j] && this._heap[j]._priority) ? this._heap[j]._priority : 0);
        return prioI < prioJ;
    }

    // Removes and returns the data of highest priority
    _pop() {
        if (this._heap.length === 1) {
            return null;
        }

        if (this._heap.length === 2) {
            var ret = this._heap.pop();
            return ((ret && ret._data) ? ret._data : null);
        }

        var topVal = ((this._heap[1] && this._heap[1]._data) ? this._heap[1]._data : null);
        this._heap[1] = this._heap.pop();
        this._sink(1);

        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue._pop, returning: ' +
            iotcs.impl.Platform._inspect(topVal));

        return topVal;
    }

    /**
     * Pushes an item onto the queue if adding this item to the queue doesn't go over the max queue
     * size.
     *
     * @param data the item to add to the queue.
     */
    _push(data) {
        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue.push, pushing: ' +
                                                    data);

        if (this._heap.length === (this._maxQueue + 1)) {
            iotcs.error('Maximum queue number reached.');
            return;
        }

        let node = new iotcs.impl.QueueNode(data);
        this._bubble(this._heap.push(node) -1);
    }

    _remove(data) {
        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue.push, removing: ' +
                                                    data);

        if (this._heap.length === 1) {
            return null;
        }

        // DJM: Are these StorageObjects?
        let index = this._heap.findIndex((element, index) => {
            if (element && (element.data.name === data.name) && (element.data.type === data.type)) {
                if (element.data._.internal.inputStream && element.data._.internal.inputStream.path &&
                    element.data._.internal.inputStream.path === data._.internal.inputStream.path ) {
                    return index;
                } else if (element.data._.internal.outputStream && element.data._.internal.outputStream.path &&
                    element.data._.internal.outputStream.path === data._.internal.outputStream.path ) {
                    return index;
                }
            }
        }, data);

        return this._heap.splice(index, 1);
    }

    // Does the opposite of the bubble() function.
    _sink(i) {
        while (i * 2 < this._heap.length - 1) {
            // If equal, left bubbles (maintains insertion order).
            var leftHigher = !this._isHigherPriority(i*2 +1, i*2);
            var childIndex = leftHigher ? i*2 : i*2 +1;

            // If equal, sink happens (maintains insertion order).
            if (this._isHigherPriority(i,childIndex)) break;

            this._swap(i, childIndex);
            i = childIndex;
        }
    }

    // Swaps the addresses of 2 nodes.
    _swap(i,j) {
        var temp = this._heap[i];
        this._heap[i] = this._heap[j];
        this._heap[j] = temp;
    }
};

iotcs.impl.QueueNode = class {
    constructor(data) {
        this._data = data;

        if (data.getJSONObject !== undefined) {
            this._priority =
                ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].indexOf(data.getJSONObject().priority);
        } else {
            this._priority = 'LOW';
        }
    }
};
