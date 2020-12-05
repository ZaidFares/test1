/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const util = {

    /**
     * Compares for equality two numbers with machine epsilon precision
     *
     * @param {Number} one
     * @param {Number} two
     * @return {Number}
     */
    float_equals: (one, two) => {
        return Math.abs(one - two) < Number.EPSILON;
    }
}

module.exports = util;