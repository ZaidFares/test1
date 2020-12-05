/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * ExternalObject represents the value of a URI type in a device model.  The application is
 * responsible for uploading/downloading the content referred to by the URI.
 *
 * @alias iotcs.ExternalObject
 * @class iotcs.ExternalObject
 * @memberof iotcs
 *
 * @param {string} uri - The URI.
 */
iotcs.ExternalObject = class {
    constructor(uri) {
        _optionalArg(uri, "string");
        this._uri = uri || null;
    }

    // Public functions
    /**
     * Get the URI value.
     *
     * @function getURI
     * @memberof iotcs.ExternalObject
     *
     * @returns {string} The external object's URI.
     */
    getURI() {
        return this._uri;
    }
};

