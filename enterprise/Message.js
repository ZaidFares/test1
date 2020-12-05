/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * @ignore
 * @private
 */
iotcs.message = iotcs.message || {}; 
/**
 * @ignore
 * @private
 */
iotcs.message.Message = {};

/**
 * Enumeration of message types.
 *
 * @ignore
 * @private
 */
iotcs.message.Message.Type = {
    DATA: 'DATA',
    ALERT: 'ALERT',
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    RESOURCES_REPORT: 'RESOURCES_REPORT'
};

Object.freeze(iotcs.message.Message.Type);
