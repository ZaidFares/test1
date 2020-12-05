/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Helpers for building alert messages.
 *
 * @alias iotcs.message.Message.AlertMessage
 * @class
 * @memberof iotcs.message.Message
 * @public
 */
iotcs.message.Message.AlertMessage = class {
    /**
     * Helper method used for building alert messages to be sent to the server.  The severity is defined
     * in the AlertMessage.Severity enumeration.  If an invalid value is given an exception is thrown.
     *
     * @function buildAlertMessage
     * @memberOf iotcs.message.Message.AlertMessage
     * @public
     * @see {@link iotcs.message.Message.AlertMessage.Severity}
     *
     * @param {string} format - The format added in the payload of the generated message.
     * @param {string} description - The description added in the payload of the generated message.
     * @param {string} severity - The severity added in the payload of the generated message.
     * @returns {iotcs.message.Message} The instance of the alert message built based on the given
     *          parameters, or <code>null</code> if the message could not be built.
     */
    static buildAlertMessage(format, description, severity) {
        _mandatoryArg(format, 'string');
        _mandatoryArg(description, 'string');
        _mandatoryArg(severity, 'string');

        if (Object.keys(iotcs.message.Message.AlertMessage.Severity).indexOf(severity) < 0) {
            iotcs.error('Invalid severity given.');
            return nulll;
        }

        let payload = {
            format: format,
            severity: severity,
            description: description,
            data: {}
        };

        let message = new iotcs.message.Message();

        message.type(iotcs.message.Message.Type.ALERT)
            .priority(iotcs.message.Message.Priority.HIGHEST)
            .payload(payload);

        return message;
    }
};

/**
 * Enumeration of severities for alert messages
 *
 * @alias Severity
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message.AlertMessage
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.AlertMessage.Severity = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    SIGNIFICANT: 'SIGNIFICANT',
    CRITICAL: 'CRITICAL'
};

