/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This object is used for request messages dispatch.  You can register handlers to an instance of
 * this object that will handle request messages that come from the cloud and will return a response
 * message associated for that request message.
 * <p>
 * There can be only one instance of this object (singleton) generated at first use.
 *
 * @alias iotcs.device.util.RequestDispatcher
 * @class iotcs.device.util.RequestDispatcher
 * @memberof iotcs.device.util
 */
iotcs.device.util.RequestDispatcher = class {
    constructor() {
        if (iotcs.device.util.RequestDispatcher._instanceRequestDispatcher) {
            return iotcs.device.util.RequestDispatcher._instanceRequestDispatcher;
        }

        this._requestHandlers = {};
        iotcs.device.util.RequestDispatcher._instanceRequestDispatcher = this;
    }

    // Private/protected functions
    _defaultHandler(requestMessage) {
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND,
                                                          {}, iotcs.StatusCode.NOT_FOUND_MESSAGE, '');
    }

    // Public functions
    /**
     * This is main function of the RequestDispatcher that dispatches a request message to the
     * appropriate handler, if one is found and the handler is called so the appropriate response
     * message is returned. If no handler is found, the RequestDispatcher implements a default
     * request message dispatcher that would just return a 404 (Not Found) response message. This
     * method will never return <code>null</code>.
     *
     * @function dispatch
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {object} requestMessage - The request message to dispatch.
     * @returns {iotcs.message.Message} The response message associated with the request.
     */
    dispatch(requestMessage) {
        if (!requestMessage ||
            !requestMessage.type ||
            (requestMessage.type !== iotcs.message.Message.Type.REQUEST) ||
            !requestMessage.destination ||
            !requestMessage.payload ||
            !requestMessage.payload.url ||
            !this._requestHandlers[requestMessage.destination] ||
            !this._requestHandlers[requestMessage.destination][requestMessage.payload.url])
        {
            return this._defaultHandler(requestMessage);
        }

        let message = this._requestHandlers[requestMessage.destination][requestMessage.payload.url](requestMessage);

        if (message &&
            (message instanceof iotcs.message.Message) &&
            (message.getJSONObject().type === "RESPONSE_WAIT"))
        {
            return null;
        }

        if (!message ||
            !(message instanceof iotcs.message.Message) ||
            (message.getJSONObject().type !== iotcs.message.Message.Type.RESPONSE))
        {
            return this._defaultHandler(requestMessage);
        }

        return message;
    }

    /**
     * Returns a registered request handler, if it is registered, otherwise <code>null</code>.
     *
     * @function getRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {string} endpointId - The endpoint ID that the handler was registered with.
     * @param {string} path - The path that the handler was registered with.
     * @returns {function} The actual handler or <code>null</code>.
     */
    getRequestHandler(endpointId, path) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(path, 'string');

        if (!this._requestHandlers[endpointId] || !this._requestHandlers[endpointId][path]) {
            return null;
        }

        return this._requestHandlers[endpointId][path];
    }

    /**
     * This method registers a handler to the RequestDispatcher.  The handler is a function that
     * must have the form:
     * <br> <code>handler = function (requestMessage) { ... return responseMessage};
     * </code><br>.  Where requestMessage if a JSON representing the exact message received from
     * the cloud that has the type REQUEST and responseMessage is an instance of
     * iotcs.message.Message that has type RESPONSE.  If neither of the conditions are satisfied the
     * RequestDispatcher will use the default handler.
     * <p>
     * It is advisable to use the iotcs.message.Message.buildResponseMessage method for generating
     * response messages.
     *
     * @function registerRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     * @see {@link iotcs.message.Message.Type}
     * @see {@link iotcs.message.Message.buildResponseMessage}
     *
     * @param {string} endpointId - The endpoint IDthat is the destination of the request message.
     * @param {string} path - The path that is the "address" (resource definition) of the request
     *        message.
     * @param {function} handler - The actual handler to be registered.
     */
    registerRequestHandler(endpointId, path, handler) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(path, 'string');
        _mandatoryArg(handler, 'function');

        if (!this._requestHandlers[endpointId]) {
            this._requestHandlers[endpointId] = {};
        }

        this._requestHandlers[endpointId][path] = handler;
    }

    /**
     * This method removed a handler from the registered handlers list of the RequestDispatcher.  If
     * handler is present as parameter, then endpointId and path parameters are ignored.
     *
     * @function unregisterRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {function} handler - The reference to the handler to be removed.
     * @param {string} endpointId - The endpoint id that the handler was registered with.
     * @param {string} path - The path that the handler was registered with.
     */
    unregisterRequestHandler(handler, endpointId, path) {
        if (handler && (typeof handler === 'string')) {
            endpointId = handler;
            path = endpointId;
            handler = null;
        }

        if (handler && (typeof handler === 'function')) {
            Object.keys(this._requestHandlers).forEach(endpointId => {
                Object.keys(this._requestHandlers[endpointId]).forEach(path => {
                    delete this._requestHandlers[endpointId][path];

                    if (Object.keys(this._requestHandlers[endpointId]).length === 0) {
                        delete this._requestHandlers[endpointId];
                    }
                });
            });

            return;
        } else {
            _mandatoryArg(endpointId, 'string');
            _mandatoryArg(path, 'string');
        }

        if (!this._requestHandlers[endpointId] || !this._requestHandlers[endpointId][path]) {
            return;
        }
        delete this._requestHandlers[endpointId][path];
        if (Object.keys(this._requestHandlers[endpointId]).length === 0) {
            delete this._requestHandlers[endpointId];
        }
    }
};

