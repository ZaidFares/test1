/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Helper method used to build a resource object. The status parameter must be given from the
 * Resource.Status enumeration. If an invalid value is given the method will throw an exception.
 * Also the methods array must be an array of valid HTTP methods, otherwise an exception will be
 * thrown.
 *
 * @function buildResource
 * @memberof iotcs.message.Message.ResourceMessage.Resource
 * @public
 * @see {@link iotcs.message.Message.ResourceMessage.Resource.Status}
 *
 * @param {string} name - The name of the resource.
 * @param {string} path - The path of the resource.
 * @param {string} methods - A comma-separated string of the methods that the resource implements.
 * @param {string} status - The status of the resource.  Must be one of
 *        iotcs.message.Message.ResourceMessage.Resource.Status.
 * @param {string} [endpointName] - The endpoint associated with the resource.
 * @returns {object} The instance of the object representing a resource.
 */
iotcs.message.Message.ResourceMessage.Resource = class {
    // Static public functions
    static buildResource(name, path, methods, status, endpointName) {
        _mandatoryArg(name, 'string');
        _mandatoryArg(path, 'string');
        _mandatoryArg(methods, 'string');

        methods.split(',').forEach(method => {
            if (['GET', 'PUT', 'POST', 'HEAD', 'OPTIONS', 'CONNECT', 'DELETE', 'TRACE'].indexOf(method) < 0) {
                iotcs.error('invalid method in resource message');
                return;
            }
        });

        _mandatoryArg(status, 'string');
        _optionalArg(endpointName, 'string');

        if (Object.keys(iotcs.message.Message.ResourceMessage.Resource.Status).indexOf(status) < 0) {
            iotcs.error('invalid status given');
            return;
        }

        let obj = {};
        obj.name = name;
        obj.path = path;
        obj.status = status;
        obj.methods = methods.toString();

        if (endpointName) {
            obj.endpointName = endpointName;
        }

        return obj;
    }

    constructor() {
        // Nothing to do here.
    }
};

/**
 * Enumeration of possible statuses of the resources.
 *
 * @alias Status
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message.ResourceMessage.Resource
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.ResourceMessage.Resource.Status = {
    ADDED: 'ADDED',
    REMOVED: 'REMOVED'
};

Object.freeze(iotcs.message.Message.ResourceMessage.Resource.Status);
