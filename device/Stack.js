/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.Stack = class {
    constructor() {
        this._count = 0;
        this._items = [];
    }

    _get(idx) {
        return this._items[idx];
    }

    _getLength() {
        return this._count;
    }

    _peek() {
        return this._items.slice(-1) [0];
    }

    _push(item) {
        this._items.push(item);
        this._count++;
    }

    _pop() {
        if (this._count > 0) {
            this._count--;
        }

        return this._items.pop();
    }
};
