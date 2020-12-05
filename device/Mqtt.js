/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 *
 */
iotcs.impl.Mqtt = class {
    // Static private/protected functions
    static _close(client, callback) {
        client.end(true, callback);
    }

    static _initAndReconnect(tam, callback, disconnectCallback, messageHandler) {
        let connectOptions = {};
        let id = (tam.isActivated() ? tam.getEndpointId() : tam.getClientId());

        connectOptions.host = tam.getServerHost();
        connectOptions.port = tam.getServerPort();
        connectOptions.protocol = 'mqtts';
        connectOptions.rejectUnauthorized = true;

        if ((typeof tam.getTrustAnchorCertificates === 'function') &&
            Array.isArray(tam.getTrustAnchorCertificates()) &&
            (tam.getTrustAnchorCertificates().length > 0))
        {
            connectOptions.ca = tam.getTrustAnchorCertificates();
        }

        connectOptions.clientId = id;
        connectOptions.username = id;
        connectOptions.password = tam.buildClientAssertion();

        if (!connectOptions.password) {
            callback(null, iotcs.createError('Error on generating oauth signature.'));
            return;
        }

        connectOptions.clean = true;
        connectOptions.connectTimeout = 30 * 1000;
        connectOptions.reconnectPeriod = 60 * 1000;

        let client = require('mqtt').connect(connectOptions);

        client.on('error', error => {
            callback(null, error);
        });

        client.on('connect', connCallback => {
            callback(connCallback);
        });

        client.on('close', () => {
            disconnectCallback();
        });

        client.on('message', (topic, message, packet) => {
            messageHandler(topic, message);
        });
    }

    static _publish(client, topic, message, waitForResponse, callback) {
        let qos = (waitForResponse ? 1 : 0);

        client.publish(topic, message, {qos: qos, retain: false}, err => {
            if (err && (err instanceof Error)) {
                callback(err);
                return;
            }

            callback();
        });
    }

    static _subscribe(client, topics, callback) {
        client.subscribe(topics, (err, granted) => {
            if (err && (err instanceof Error)) {
                callback(iotcs.createError('Error on topic subscription: ' + topics.toString(),
                                           err));
                return;
            }

            callback();
        });
    }

    static _unsubscribe(client, topics) {
        client.unsubscribe(topics);
    }
};

