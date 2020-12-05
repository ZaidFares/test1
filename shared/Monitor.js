/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: A little more JSDOC is needed; explain the (simple) state machine and e.g. when the monitor
//       thread is actually started, whether start and stop can be called multiple time; the default
//       frequency ...etc...

/**
 * @param {function()} callback - function associated to this monitor
 * @class
 */
/** @ignore */
iotcs.impl.Monitor = class {
    constructor(callback) {
        _mandatoryArg(callback, 'function');
        this._running = false;
        this._callback = callback;
    }

    // Private/protected functions
    /**
     * @memberof iotcs.util.Monitor
     * @function start
     */
    _start() {
        if (this._running) {
            return;
        }

        this._running = true;
        var self = this;
        this._monitorId = _register(this._callback);
    }

    /**
     * @memberof iotcs.util.Monitor
     * @function stop
     */
    _stop() {
        if (!this._running) {
            return;
        }

        this._running = false;
        _unregister(this._monitorId);
    }
};

//////////////////////////////////////////////////////////////////////////////
// Global monitor functions and fields.
/** @ignore */
let _index = 0;

/** @ignore */
let _monitors = {};

/** @ignore */
let _threadId = null;

/** @ignore */
function _carousel() {
    Object.keys(_monitors).forEach(id => {
        if (typeof _monitors[id] === 'function') {
            _monitors[id]();
        }
    });
}

/** @ignore */
function _register(callback) {
    _monitors[++_index] = callback;

    if (Object.keys(_monitors).length === 1) {
        // If at least one registered monitor, then start thread.
        if (_threadId) {
            iotcs.log('Inconsistent state: monitor thread already started!');
            return;
        }

        _threadId = setInterval(_carousel, iotcs.oracle.iot.client.monitor.pollingInterval);
    }

    return _index;
}

/** @ignore */
function _unregister(id) {
    if ((typeof id === 'undefined') || !_monitors[id]) {
        iotcs.log('Unknown monitor id.');
        return;
    }

    delete _monitors[id];

    if (Object.keys(_monitors).length === 0) {
        // If no registered monitor left, then stop thread.
        if (!_threadId) {
            iotcs.log('Inconsistent state: monitor thread already stopped!');
            return;
        }

        clearInterval(_threadId);
        _threadId = null;
    }
}
