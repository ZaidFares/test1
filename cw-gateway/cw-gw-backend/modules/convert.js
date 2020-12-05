/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const convert = {

    /**
     * Converts height of a free fall in centimeters to time of the fall in ms
     *
     * @param {Number} centimeters centimeters to convert
     * @return {Number}
     */
    freeFallCmToMs: (centimeters) => {
        return Math.round(Math.sqrt((centimeters * 2) / 981) * 1000);
    },

    /**
     * Converts time of a free fall in ms to the height of the fall in centimeters
     *
     * @param {Number} milliseconds milliseconds to convert
     * @return {Number}
     */
    freeFallMsToCm: (milliseconds) => {
        return Math.round((Math.pow(milliseconds / 1000, 2) * 981) / 2);
    }
}

module.exports = convert;