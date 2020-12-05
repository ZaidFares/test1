/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.enterprise.impl.AsyncRequestMonitor = class {
    /**
     * @param {String} requestId - The request ID.
     * @param {function} callback - A callback function.
     * @param {iotcs.enterprise.impl.EnterpriseClientImpl} eClientImpl - An EnterpriseClientImpl.
     *
     * @ignore
     */
    constructor(requestId, callback, eClientImpl) {
        _mandatoryArg(requestId, ['string','number']);
        _mandatoryArg(callback, 'function');

        this._callback = callback;
        this._eClientImpl = eClientImpl;
        this._monitor = null;
        this._requestId = requestId;
        this._startTime = null;
    }

    // Private/protected functions
    /** @ignore */
    _requestMonitor(asyncReqMonitor) {
        if (asyncReqMonitor._startTime &&
            (Date.now() > (asyncReqMonitor._startTime +
                           iotcs.oracle.iot.client.controller.asyncRequestTimeout)))
        {
            asyncReqMonitor._stop();

            let response = {
                complete: true,
                id: asyncReqMonitor._requestId,
                status: 'TIMEOUT'
            };

            asyncReqMonitor._callback(response);
            return;
        }

        iotcs.impl.Https._bearerReq({
            'method': 'GET',
            'path': iotcs.impl._reqRoot + '/requests/' + asyncReqMonitor._requestId
        }, '', (response, error) => {
            try {
                if (!response || error) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response, iotcs.createError('Invalid response: ',error));
                    return;
                }

                if (!(response.status) || (typeof response.complete === 'undefined')) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response, iotcs.createError('Invalid response type: ',
                                                                        error));
                    return;
                }

                if (response.complete) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response);
                }
            } catch(e) {
                asyncReqMonitor._stop();
                asyncReqMonitor._callback(response, iotcs.createError('Error on response: ', e));
            }
        }, () => {
            this._requestMonitor(asyncReqMonitor);
        }, asyncReqMonitor._eClientImpl);
    }

    /** @ignore */
    _start () {
        let self = this;

        if (!this._monitor) {
            this._monitor = new iotcs.impl.Monitor(() => {
                this._requestMonitor(this);
            });
        }

        if (!this._monitor.running) {
            this._monitor._start();
            this._startTime = Date.now();
        }
    }

    /** @ignore */
    _stop() {
        if (this._monitor) {
            this._monitor._stop();
        }

        this._startTime = null;
    }
};

