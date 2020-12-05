/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const func = require('@cw-gw-backend/modules/func');

describe('Func', () => {

    it('appends one function to another as a callback', () => {
        let flag = false;
        const fun1 = jest.fn((callback) => { callback(true); });
        const fun2 = jest.fn((val) => { flag = val; });
        func.appendAsCallback(fun1, fun2)();
        expect(fun1).toBeCalledTimes(1);
        expect(fun2).toBeCalledTimes(1);
        expect(flag).toBeTruthy();
    });
});