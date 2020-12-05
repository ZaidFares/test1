/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

function MetaWearDataRoute() {
    this.rss = jest.fn().mockReturnThis();
    this.lowpass = jest.fn().mockReturnThis();
    this.threshold = jest.fn().mockReturnThis();
    this.subscribe = jest.fn().mockImplementation((subscriber) => {
        this.putData = subscriber;
        return this;
    });
    this.applyTo = jest.fn().mockReturnThis();
};

module.exports = MetaWearDataRoute;