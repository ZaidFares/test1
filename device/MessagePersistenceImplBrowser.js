/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Provides for storing and retrieving messages to a persistent store for the browser.  The browser
 * doesn't support persistence, so this implementation is empty.
 */
iotcs.oracle.iot.client.device.MessagePersistenceImpl = class {
    static _getInstance() {
        // There is no message persistence in the browser.
        iotcs.oracle.iot.client.device.persistenceEnabled = false;
        return null;
    }
};
