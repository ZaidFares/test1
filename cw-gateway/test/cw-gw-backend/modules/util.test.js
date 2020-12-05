/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const util = require('../../../cw-gw-backend/modules/util');

describe('Util', () => {
    it('correctly compares for equality two float numbers', () => {
        expect(util.float_equals(0.1 + 0.2, 0.3)).toBeTruthy();
    });
    it('correctly compares for equality two different float numbers', () => {
        expect(util.float_equals(0.0000000001, 0.00000000011)).toBeFalsy();
    });
});