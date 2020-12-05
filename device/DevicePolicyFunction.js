/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.DevicePolicyFunction = class {
    /**
     * Create a point.
     *
     * @param {string} id - The ID of the function.
     * @param {Map<string, object>} parameters - The parameters of the function.
     */
    constructor(id, parameters) {
        /** @type {string} */
        this._id = id;
        /** @type {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} */
        this._parameters = '';

        if (parameters && parameters.size !== 0) {
            this._parameters = parameters;
        } else {
            this._parameters = new Map();
        }
    }

    // Private/protected functions
    /**
     * Returns the function's ID.
     *
     * @return {string} the function's ID.
     */
    _getId() {
        return this._id;
    }

    /**
     * Returns the function's parameters.
     *
     * @return {Map<string, object>} the function's parameters.
     */
    _getParameters() {
        return this._parameters;
    }
};
