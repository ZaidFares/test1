/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const convert = require('@cw-gw-backend/modules/convert');

describe('Convert', () => {
    const HEIGHT = 200;
    const TIME = 639;
    it('converts a height of a free fall in meters to a time of the fall in ms', () => {
        expect(convert.freeFallCmToMs(HEIGHT)).toBe(TIME);
    });
    it('converts a time of a free fall in ms to a height of the fall in meters', () => {
        expect(convert.freeFallMsToCm(TIME)).toBe(HEIGHT);
    });
});