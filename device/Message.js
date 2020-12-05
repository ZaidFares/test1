/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @alias iotcs.message
 * @memberof iotcs
 * @namespace
 */
iotcs.message = {};

/**
 * This object helps in the construction of a general type message to be sent to the server.  This
 * object and it's components are used as utilities by the Messaging API clients, like the
 * DirectlyConnectedDevice or GatewayDevice or indirectly by the MessageDispatcher.
 *
 * @alias iotcs.message.Message
 * @class iotcs.message.Message
 * @memberof iotcs.message
 * @public
 */
iotcs.message.Message = class {
    // Static private functions
    /**
     * This is a helper method for checking if an array of created messages pass the boundaries on
     * key/value length test.  If the test does not pass an error is thrown.
     *
     * @function checkMessagesBoundaries
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.message.Message.MAX_KEY_LENGTH}
     * @see {@link iotcs.message.Message.MAX_STRING_VALUE_LENGTH}
     *
     * @param {iotcs.message.Message[]} messages - The array of messages that need to be tested.
     */
    static _checkMessagesBoundaries(messages) {
        _mandatoryArg(messages, 'array');

        messages.forEach(message => {
            _mandatoryArg(message, iotcs.message.Message);

            this._recursiveSearchInMessageObject(message.getJSONObject(), (key, value) => {
                if (iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(key) > iotcs.message.Message.MAX_KEY_LENGTH) {
                    iotcs.error('Max length for key in message item exceeded.');
                }
                if ((typeof value === 'string') &&
                    (iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(value) >
                     iotcs.message.Message.MAX_STRING_VALUE_LENGTH))
                {
                    iotcs.error('Max length for value in message item exceeded.');
                }
            });
        });
    }

    /**
     * @ignore
     * @private
     */
    static _recursiveSearchInMessageObject(obj, callback) {
        if (obj) {
            let arrKeys = Object.keys(obj);

            for (let i = 0; i < arrKeys.length; i++) {
                callback(arrKeys[i], obj[arrKeys[i]]);

                if ((typeof obj[arrKeys[i]] === 'object') &&
                    (!(obj[arrKeys[i]] instanceof iotcs.StorageObject)))
                {
                    this._recursiveSearchInMessageObject(obj[arrKeys[i]], callback);
                }
            }
        }
    }

    // Static public functions
    /**
     * Constant which defines the number of times sending of a message should be retried.  The
     * minimum is 3.
     *
     * @constant BASIC_NUMBER_OF_RETRIES
     * @default 3
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get BASIC_NUMBER_OF_RETRIES() {
        let maxRetries = iotcs.oracle.iot.client.device.messageDispatcherBaseNumberOfRetries;
        return maxRetries > 3 ? maxRetries : 3;
    }

    /**
     * @constant MAX_KEY_LENGTH
     * @default 2048
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get MAX_KEY_LENGTH() {
        return 2048;
    }

    /**
     * @constant MAX_STRING_VALUE_LENGTH
     * @default 65536
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get MAX_STRING_VALUE_LENGTH() {
        return 64 * 1024;
    }

    // Static public functions
    /**
     * This is a helper method for building a response message to be sent to the server as response to a
     * request message sent from the server.  This is mostly used by handlers registered with the
     * RequestDispatcher.  If no requestMessage is given the id for the response message will be a
     * random UUID.
     *
     * @function buildResponseMessage
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.RequestDispatcher}
     *
     * @param {object} [requestMessage] - The message received from the server as JSON.
     * @param {number} statusCode - The status code to be added in the payload of the response message.
     * @param {object} [headers] - The headers to be added in the payload of the response message.
     * @param {string} [body] - The body to be added in the payload of the response message.
     * @param {string} [url] - The URL to be added in the payload of the response message.
     *
     * @returns {iotcs.message.Message} The response message instance built on the given parameters.
     */
    static buildResponseMessage(requestMessage, statusCode, headers, body, url) {
        _optionalArg(requestMessage, 'object');
        _mandatoryArg(statusCode, 'number');
        _optionalArg(headers, 'object');
        _optionalArg(body, 'string');
        _optionalArg(url, 'string');

        let payload = {
            statusCode: statusCode,
            url: (url ? url : ''),
            requestId: ((requestMessage && requestMessage.id) ? requestMessage.id : iotcs.impl.Platform.Util._uuidv4()),
            headers: (headers ? headers : {}),
            body: (body ? iotcs.impl.Platform.Util._btoa(body) : '')
        };

        let message = new iotcs.message.Message();

        message.type(iotcs.message.Message.Type.RESPONSE)
            .source((requestMessage && requestMessage.destination) ? requestMessage.destination : '')
            .destination((requestMessage && requestMessage.source) ? requestMessage.source : '')
            .payload(payload);

        return message;
    }

    /**
     * This is a helper method for building a response wait message to notify RequestDispatcher that
     * response for server will be sent to the server later.  RequestDispatcher doesn't send these kind
     * of messages to the server.  This is mostly used by handlers registered with the
     * RequestDispatcher in asynchronous cases, for example, when device creates storage object by URI.
     *
     * @function buildResponseWaitMessage
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.RequestDispatcher}
     * @see {@link iotcs.device.util.DirectlyConnectedDevice#createStorageObject}
     *
     * @returns {iotcs.message.Message} The response message that notified about waiting final response.
     */
    static buildResponseWaitMessage() {
        let message = new iotcs.message.Message();
        message._properties.type = "RESPONSE_WAIT";
        return message;
    }

    constructor() {
        // Private fields 
        /**
         * Internal implementation object which contains properties and functions internal to the
         * implementation of Message.
         *
         * @ignore
         * @private
         */
        this._properties = {
            clientId: iotcs.impl.Platform.Util._uuidv4(),
            source: null,
            destination: '',
            sender: '',
            priority: 'LOW',
            reliability: 'BEST_EFFORT',
            eventTime: new Date().getTime(),
            type: null,
            properties: {},
            payload: {},
            remainingRetries: iotcs.message.Message.BASIC_NUMBER_OF_RETRIES
        };

        // Public fields
        this.onError = null;
    }

    // Private/protected functions
    _equals(message) {
        if (this === message) {return true;}
        if (!message || !(message instanceof iotcs.message.Message)) {return false;}
        if (this._properties.clientId != message._properties.clientId) {return false;}
        if (this._properties.destination != message._properties.destination) {return false;}
        if (this._properties.eventTime!== message._properties.eventTime) {return false;}
        if (this._properties.priority != message._properties.priority) {return false;}
        if (this._properties.reliability != message._properties.reliability) {return false;}
        if (this._properties.sender != message._properties.sender)  {return false;}
        if (this._properties.source !== message._properties.source) {return false;}
        if (this._properties.type !== message._properties.source) {return false;}
        if (this._properties.properties != message._properties.properties) {return false;}

        // DJM: Do we need any of these for _equals?
        /**
        if (id == null ? (message.id != null) : (!id.equals(message.id))) return false;
        if (diagnostics == null ? (message.diagnostics != null) : (!diagnostics.equals(message.diagnostics))) return false;
        if (direction == null ? (message.direction != null) : (!direction.equals(message.direction))) return false;
        if (receivedTime == null ? (message.receivedTime != null) : (!receivedTime.equals(message.receivedTime))) return false;
        if (gateway == null ? (message.gateway != null) : (!gateway.equals(message.gateway))) return false;
        if (sentTime == null ? (message.sentTime != null) : (!sentTime.equals(message.sentTime))) return false;
        // Do we need to equals payload?
        */
        return true;
    }

    // Public functions
    /**
     * This sets a key/value pair in the data property of the payload of the message.  This is
     * specific to DATA or ALERT type messages.
     *
     * @function dataItem
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} dataKey - The key.
     * @param {object} [dataValue] - The value associated with the key.
     * @returns {iotcs.message.Message} This object.
     */
    dataItem(dataKey, dataValue) {
        _mandatoryArg(dataKey, 'string');

        if (!('data' in this._properties.payload)) {
            this._properties.payload.data = {};
        }

        this._properties.payload.data[dataKey] = dataValue;
        return this;
    }

    /**
     * Sets the destination of the message.
     *
     * @function destination
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} destination - The destination.
     * @returns {iotcs.message.Message} This object.
     */
    destination(destination) {
        _mandatoryArg(destination, 'string');

        this._properties.destination = destination;
        return this;
    }

    /**
     * This sets the format URN in the payload of the message.  This is mostly specific for the DATA or
     * ALERT type * of messages.
     *
     * @function format
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} format - The format to set.
     * @returns {iotcs.message.Message} This object.
     */
    format(format) {
        _mandatoryArg(format, 'string');
        this._properties.payload.format = format;
        return this;
    }

    /**
     * This returns the built message as JSON to be sent to the server as it is.
     *
     * @function getJSONObject
     * @memberof iotcs.message.Message
     * @public
     *
     * @returns {object} A JSON representation of the message to be sent.
     */
    getJSONObject() {
        return this._properties;
    }

    /**
     * Gets the number of remaining retries for this message.  Not intended for general use.  Used
     * internally by the message dispatcher implementation.
     *
     * @function getRemainingRetries
     * @memberof iotcs.message.Message
     * @public
     *
     * @returns {integer} remainingRetries - The new number of remaining retries.
     */
    getRemainingRetries() {
        return this._properties.remainingRetries;
    }

    /**
     * Sets the payload of the message as object.
     *
     * @function payload
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {object} payload - The payload to set.
     * @returns {iotcs.message.Message} This object
     */
    payload(payload) {
        _mandatoryArg(payload, 'object');

        this._properties.payload = payload;
        return this;
    }

    /**
     * This sets the priority of the message. Priorities are defined in the Message.Priority
     * enumeration. If an invalid type is given an exception is thrown. The MessageDispatcher implements
     * a priority queue and it will use this parameter.
     *
     * @function priority
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.MessageDispatcher}
     * @see {@link iotcs.message.Message.Priority}
     *
     * @param {string} priority - The priority to set.
     * @returns {iotcs.message.Message} This object.
     */
    priority(priority) {
        _mandatoryArg(priority, 'string');

        if (Object.keys(iotcs.message.Message.Priority).indexOf(priority) < 0) {
            iotcs.error('Invalid priority given.');
            return this;
        }

        this._properties.priority = priority;
        return this;
    }

    /**
     * This sets the reliability of the message. Reliabilities are defined in the Message.Reliability
     * enumeration. If an invalid type is given, an exception is thrown.
     *
     * @function reliability
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.MessageDispatcher}
     * @see {@link iotcs.message.Message.Reliability}
     *
     * @param {string} priority - The reliability to set.
     * @returns {iotcs.message.Message} This object.
     */
    reliability(reliability) {
        _mandatoryArg(reliability, 'string');

        if (Object.keys(iotcs.message.Message.Reliability).indexOf(reliability) < 0) {
            iotcs.error('Invalid reliability given.');
            return this;
        }

        this._properties.reliability = reliability;
        return this;
    }

    /**
     * Sets the number of remaining retries for this message.  Not intended for general use.  Used
     * internally by the message dispatcher implementation.
     *
     * @function setRemainingRetries
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {integer} remainingRetries - The new number of remaining retries.
     * @returns {iotcs.message.Message} This object.
     */
    setRemainingRetries(remainingRetries) {
        _mandatoryArg(remainingRetries, 'integer');
        this._properties.remainingRetries = remainingRetries;
        return this;
    }

    /**
     * Sets the source of the message.
     *
     * @function source
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} source - The source to set.
     * @returns {iotcs.message.Message} This object.
     */
    source(source) {
        _mandatoryArg(source, 'string');

        if (this._properties.source === null) {
            this._properties.source = source;
        }

        return this;
    }

    /**
     * This sets the type of the message. Types are defined in the
     * Message.Type enumeration. If an invalid type is given an
     * exception is thrown.
     *
     * @function type
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.message.Message.Type}
     *
     * @param {string} type - The type to set.
     * @returns {iotcs.message.Message} This object.
     */
    type(type) {
        _mandatoryArg(type, 'string');

        if (Object.keys(iotcs.message.Message.Type).indexOf(type) < 0) {
            iotcs.error('Invalid message type given.');
            return this;
        }

        if (type === iotcs.message.Message.Type.RESOURCES_REPORT) {
            this._properties.id = iotcs.impl.Platform.Util._uuidv4();
        }

        this._properties.type = type;
        return this;
    }
};

/**
 * Enumeration of message types.
 *
 * @alias iotcs.message.Message.Type
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Type = {
    DATA: 'DATA',
    ALERT: 'ALERT',
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    RESOURCES_REPORT: 'RESOURCES_REPORT'
};

Object.freeze(iotcs.message.Message.Type);

/**
 * Enumeration of message priorities.
 *
 * @alias iotcs.message.Message.Priority
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Priority = {
    LOWEST: 'LOWEST',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    HIGHEST: 'HIGHEST'
};

Object.freeze(iotcs.message.Message.Priority);

/**
 * Enumeration of message reliability options.
 *
 * @alias iotcs.message.Message.Reliability
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Reliability = {
    BEST_EFFORT: 'BEST_EFFORT',
    GUARANTEED_DELIVERY: 'GUARANTEED_DELIVERY',
    NO_GUARANTEE: 'NO_GUARANTEE'
};

Object.freeze(iotcs.message.Message.Reliability);
