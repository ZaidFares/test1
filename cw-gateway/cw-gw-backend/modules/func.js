/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const func = {

    /**
     * Creates a new function with all except last one arguments of a first function.
     * The last argument is assumed to be a callback argument and is substituted by a second
     * function.
     *
     * @param {Function} fun1 first function to append a callback to
     * @param {Function} fun2 second function to append as a callback
     * @return {Function}
     */
    appendAsCallback: (fun1, fun2) => {
        return (...args) => {
            fun1(...args, fun2);
        }
    }
}

module.exports = func;