/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A class that implements a way of getting the custom resources registered by a device and the
 * possibility of invoking them (V1 implementation).
 *
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        application context of the device for which the resources need to be enumerated.
 * @param {string} deviceId - The ID for which the resources are to be enumerated/invoked.
 *
 * @alias iotcs.enterprise.ResourceEnumerator
 * @class iotcs.enterprise.ResourceEnumerator
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.ResourceEnumerator = class {
    constructor(client, deviceId) {
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);
        _mandatoryArg(deviceId, 'string');

        this._client = client;
        this._deviceId = deviceId;
        this._asyncReqMonitors = {};
    }

    // Public functions
    /**
     * Closes the enumerator and will stop any pending resource invocations.
     *
     * @function close
     * @memberof iotcs.enterprise.ResourceEnumerator
     */
    close() {
        for(let key in this._asyncReqMonitors) {
            this._asyncReqMonitors[key].stop();
        }

        this._asyncReqMonitors = {};
        this._deviceId = null;
    }

    /**
     * Return the list of resources that the device associated with the enumerator has registered in the
     * cloud.
     *
     * @memberof iotcs.enterprise.ResourceEnumerator
     * @function getResources
     *
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain resources as items.
     */
    getResources() {
        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path: iotcs.impl._reqRoot +
                '/apps/' + this._client._appid +
                '/devices/' + this._deviceId +
                '/resources'
        }, '', null, this._client);
    }

    /**
     * Invokes the specified resource with defined options, query and payload.
     * <p>
     * Resources can be retrieved by using the getResources method and from the items property of the
     * response the resource objects can be extracted.
     *
     * A resource object must have the following properties:<br>
     * - methods: An array of methods the resource accepts.<br>
     * - endpointId: The device ID.<br>
     * - the self link: This the link that the resource can be accessed with present in the links
     *   array property.
     *
     * @function invokeResource
     * @memberof iotcs.enterprise.ResourceEnumerator
     * @see {@link iotcs.enterprise.ResourceEnumerator#getResources}
     *
     * @param {object} resource -The resource to be invoked as described.
     * @param {{method:string, headers:object}} options - The request options.  The headers are
     *        optional and method is mandatory.
     * @param {object} [query] - The query for the request as JSON object.
     * @param {string} [body] - The payload for the request.
     * @param {function} callback - The callback function that is called when a response arrives.
     *        The *        whole HTTP response as JSON object is given as parameter to the callback
     *        function.  If an error occurs or the response is invalid the error object is passed as
     *        the second parameter in the callback with the reason in error.message:
     *        callback(response, error).
     */
    invokeResource(resource, options, query, body, callback) {
        if (query && (typeof query === 'function')) {
            callback = query;
            query = null;
        }

        if (body && (typeof body === 'function')) {
            callback = body;
            body = null;
        }

        _mandatoryArg(resource, 'object');
        _mandatoryArg(resource.methods, 'array');
        _mandatoryArg(resource.endpointId, 'string');
        _mandatoryArg(resource.links, 'array');
        _mandatoryArg(options, 'object');
        _mandatoryArg(options.method, 'string');
        _optionalArg(options.headers, 'object');
        _optionalArg(query, 'object');
        _optionalArg(body, 'string');
        _mandatoryArg(callback, 'function');

        if (resource.endpointId !== this.deviceId){
            iotcs.error('Invalid resource.');
            return;
        }

        let path = null;

        resource.links.forEach(link => {
            if (link.rel && link.href && (link.rel === 'self')){
                path = link.href;
            }
        });

        if (!path) {
            iotcs.error('Invalid resource.');
            return;
        }

        let method = null;

        resource.methods.forEach(m => {
            if (m === options.method){
                method = options.method;
            }
        });

        if (!method) {
            iotcs.error('Invalid options.');
            return;
        }

        path = decodeURI(path + (query ? ('?=' +
            iotcs.impl.Platform.Query._stringify(query)) : ''));
        let opt = {};
        opt.method = method;
        opt.path = path;

        if (options.headers) {
            opt.headers = options.headers;
        }

        let self = this;

        iotcs.impl.Https._bearerReq(opt, (body ? body : null), (response, error) => {
            if (!response || error || !(response.id)) {
                callback(null,
                    iotcs.createError('Invalid response on async request for resource invocation',
                                      error));
                return;
            }

            let reqId = response.id;

            try {
                self._asyncReqMonitors[reqId] = new iotcs.enterprise.impl.AsyncRequestMonitor(reqId,
                    (response, error)  =>
                    {

                    if (!response || error) {
                        callback(null, iotcs.createError('Invalid response on resource invocation.',
                                                         error));
                        return;
                    }

                    Object.freeze(response);
                    callback(response);
                        // DJM: Is this reference right?
                }, self._client._.internalClient);
                self._asyncReqMonitors[reqId]._start();
            } catch (e) {
                callback(null,
                         iotcs.createError('Invalid response on async request for resource invocation.',
                                           e));
            }
        }, () => {
            self._invokeResource(resource, options, query, body, callback);
            // DJM: Is this reference right?
        }, self._client._.internalClient);
    }
};

