/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.ScheduledPolicyDataKey = class {
    /**
     *
     * @param {number} window
     * @param {number} slide
     */
    constructor(window, slide) {
        this._window = window;
        this._slide = slide;
    }

    // Private/protected functions
    _toString() {
        return 'ScheduledPolicyDataKey[{"window": ' + this._window + ', "slide": ' + this._slide +
            '}]';
    }
};
