/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Implementation functions and classes for the device namespace.
 */

/** @ignore */
iotcs.impl._reqRoot = '/iot/api/v2';
iotcs.impl._privateRoot = '/iot/privateapi/v2';

////////////////////////////////////////////////////////////////////////////////////////////////////
// device global function expressions
function _mqttControllerInit (dcd) {
    if (!dcd._mqttController) {
        let getTopics = () => {
            let topics = [];
            let id = dcd._tam.getClientId();

            if (dcd.isActivated()) {
                id = dcd._tam.getEndpointId();

                topics.push({responseHandler: 'devices/' + id + '/deviceModels',
                             errorHandler: 'devices/' + id + '/deviceModels/error'});

                topics.push({responseHandler: 'devices/' + id + '/messages',
                             errorHandler: 'devices/' + id + '/messages/error'});

                topics.push({responseHandler: 'devices/' + id + '/messages/acceptBytes'});

                if (dcd._gateway) {
                    topics.push({responseHandler: 'devices/' + id + '/activation/indirect/device',
                                 errorHandler: 'devices/' + id + '/activation/indirect/device/error'});
                }
            } else {
                topics.push({responseHandler: 'devices/' + id + '/activation/policy',
                             errorHandler: 'devices/' + id + '/activation/policy/error'});

                topics.push({responseHandler: 'devices/' + id + '/deviceModels',
                             errorHandler: 'devices/' + id + '/deviceModels/error'});

                topics.push({responseHandler: 'devices/' + id + '/activation/direct',
                             errorHandler: 'devices/' + id + '/activation/direct/error'});
            }

            return topics;
        };

        //DJM: Fix
        Object.defineProperty(dcd._, 'mqttController', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: new iotcs.impl.Mqtt.MqttController(dcd._.tam, getTopics)
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// device global functions
/**
 * Performs a request with the specified parameters.  Creates a TrustedAssetsManager if one is not
 * specified in options.tam.  Performs an MQTT request if options.tam.getServerScheme returns
 * 'mqtt'.  Performs an HTTPS request for activation or token request.  Otherwise performs an HTTPS
 * request and may refresh the authorization token if required.
 *
 * @param {object!} options - The request options.
 * @param {object} payload - The request payload.
 * @param {function} callback - The function to call when the request is complete.
 * @param {functrion} retryCallback - The function to call to try the request again if it fails.
 * @param {DirectlyConnectedDevice} dcd
 * @param {DirectlyConnecteedDeviceUtil} dcdUtil
 *
 * @ignore
 */
iotcs.impl._protocolReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    if (!options.tam) {
        options.tam = new iotcs.device.TrustedAssetsManager();
    }

    if (options.tam.getServerScheme && (options.tam.getServerScheme().indexOf('mqtt') > -1)) {
        iotcs.impl.Mqtt._apiReq(options, payload, callback, retryCallback, dcd, dcdUtil);
    } else {
        if (options.path.startsWith(iotcs.impl._reqRoot+'/activation/policy') ||
            options.path.startsWith(iotcs.impl._reqRoot+'/activation/direct') ||
            options.path.startsWith(iotcs.impl._reqRoot+'/oauth2/token'))
        {
            iotcs.impl.Https._req(options, payload, callback);
        } else {
            iotcs.impl.Https._bearerReq(options, payload, callback, retryCallback, dcd, dcdUtil);
        }
    }
};

iotcs.impl._protocolRegister = (path, callback, dcd) => {
    if (dcd.isActivated() &&
        dcd._tam.getServerScheme &&
        (dcd._tam.getServerScheme().indexOf('mqtt') > -1))
    {
        _mqttControllerInit(dcd);

        if (path.startsWith(iotcs.impl._reqRoot + '/messages/acceptBytes')) {
            dcd._mqttController.register('devices/' + dcd.getEndpointId() + '/messages/acceptBytes',
                callback);
        } else if (path.startsWith(iotcs.impl._reqRoot + '/messages')) {
            dcd._mqttController.register('devices/' + dcd.getEndpointId() + '/messages', callback);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Https function additions for device.
iotcs.impl.Https._bearerReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    iotcs.impl.Https._req(options, payload, (responseBody, error) => {
        if (error) {
            let exception = null;

            try {
                exception = JSON.parse(error.message);

                if (exception.statusCode &&
                    (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                {
                    dcd._refreshBearer(false, error => {
                        if (error) {
                            callback(responseBody, error, dcdUtil);
                            return;
                        }

                        retryCallback();
                    });

                    return;
                }
            } catch (e) {
            }
        }

        callback(responseBody, error, dcdUtil);
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Mqtt function additions for device.
iotcs.impl.Mqtt._apiReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    let tempCallback = callback;

    let tempCallbackBearer = (responseBody, error) => {
        if (error) {
            let exception = null;

            try {
                exception = JSON.parse(error.message);
                if (exception.status && (exception.status === iotcs.StatusCode.UNAUTHORIZED)) {
                    dcd._mqttController.disconnect(retryCallback);
                    return;
                }
            } catch (e) {
            }
        }

        callback(responseBody, error, dcdUtil);
    };

    function callApi(controller) {
        let id = (dcd.isActivated() ? dcd._tam.getEndpointId() : dcd._tam.getClientId());
        let topic = null;
        let expect = null;

        if (options.method === 'GET') {
            if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/policy')) {
                topic = 'iotcs/' + id + '/activation/policy';
                expect = 'devices/' + id + '/activation/policy';
                payload = JSON.stringify({OSName: iotcs.impl.Platform.Os._type(), OSVersion: iotcs.impl.Platform.Os._release()});
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/deviceModels')) {
                topic = 'iotcs/' + id + '/deviceModels';
                expect = 'devices/' + id + '/deviceModels';
                tempCallback = tempCallbackBearer;
                payload = JSON.stringify({urn: options.path.substring(options.path.lastIndexOf('/') +
                    1)});
            }
        } else if (options.method === 'POST') {
            if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/direct')) {
                topic = 'iotcs/' + id + '/activation/direct';
                expect = 'devices/' + id + '/activation/direct';

                tempCallback = (responseBody, error) => {
                    if (error) {
                        dcd._tam.setEndpointCredentials(dcd._tam.getClientId(), null);
                    }

                    controller.disconnect(() => {
                        callback(responseBody, error);
                    });
                };
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/oauth2/token')) {
                callback({token_type: 'empty', access_token: 'empty'});
                return;
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/indirect/device')) {
                topic = 'iotcs/' + id + '/activation/indirect/device';
                expect = 'devices/' + id + '/activation/indirect/device';
                tempCallback = tempCallbackBearer;
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/messages')) {
                expect = 'devices/' + id + '/messages';
                topic = 'iotcs/' + id + '/messages';
                tempCallback = tempCallbackBearer;

                let acceptBytes =
                    parseInt(options.path.substring(options.path.indexOf('acceptBytes=') + 12));

                if (acceptBytes &&
                    ((typeof controller.acceptBytes === 'undefined') ||
                     (controller.acceptBytes !== acceptBytes)))
                {
                    topic = 'iotcs/' + id + '/messages/acceptBytes';
                    let buffer = forge.util.createBuffer();
                    buffer.putInt32(acceptBytes);

                    controller.req(topic, buffer.toString(), null, () => {
                        controller.acceptBytes = acceptBytes;
                        topic = 'iotcs/' + id + '/messages';
                        controller.req(topic, payload, expect, tempCallback);
                    });

                    return;
                }
            }
        }

        controller.req(topic, payload, expect, tempCallback);
    }

    _mqttControllerInit(dcd);
    callApi(dcd._mqttController);
};
