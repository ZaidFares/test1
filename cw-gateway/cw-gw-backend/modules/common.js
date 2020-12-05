/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const RELEASE_VERSION = '1.1';

const _FallDownAlertUrn = 'urn:com:oracle:iot:cw:motion:fall_detected';

const _ManDownDMUrn = 'urn:com:oracle:iot:cw:mandown';
const _ManDownAlertUrn = 'urn:com:oracle:iot:cw:mandown:man_down_detected';
const _ManDownDMName = 'ConnectedWorkerManDown';

const _ManDownDM = {
    urn: _ManDownDMUrn,
    name: _ManDownDMName,
    description: 'Device Model representing Man - down event',
    attributes: [],
    actions: [],
    formats: [
        {
            urn: _ManDownAlertUrn,
            name: 'ManDownAlert',
            description: 'Alert sent when a man-down condition is detected',
            type: 'ALERT',
            deviceModel: _ManDownDMUrn,
            value: {
                fields: [
                    {
                        name: 'ora_latitude',
                        optional: false,
                        type: 'NUMBER'
                    },
                    {
                        name: 'ora_longitude',
                        optional: false,
                        type: 'NUMBER'
                    },
                    {
                        name: 'ora_altitude',
                        optional: false,
                        type: 'NUMBER'
                    },
                    {
                        name: 'ora_uncertainty',
                        optional: false,
                        type: 'NUMBER'
                    },
                    {
                        name: 'motionlessDuration',
                        optional: false,
                        type: 'NUMBER'
                    }
                ]

            }
        }
    ]
};

const _AmbientTempDMUrn = 'urn:com:oracle:iot:cw:ambient_temp';
const _AmbientTempDMName = 'ConnectedWorkerAmbientTemperature';
const _AmbientTempDM = {
    urn: _AmbientTempDMUrn,
    name: _AmbientTempDMName,
    description: 'Device Model representing temperature sensor',
    attributes: [
        {
            description: 'Ambient Temperature',
            name: 'AmbientTemperature',
            type: 'NUMBER',
            writable: false
        },
        {
            name: 'Location',
            type: 'STRING',
            writable: true
        },
        {
            alias: 'ora_alt',
            name: 'ora_altitude',
            type: 'NUMBER',
            writable: false
        },
        {
            alias: 'ora_lat',
            name: 'ora_latitude',
            range: '-90.0,90.0',
            type: 'NUMBER',
            writable: false
        },
        {
            alias: 'ora_lon',
            name: 'ora_longitude',
            range: '-180.0,180.0',
            type: 'NUMBER',
            writable: false
        },
        {
            alias: 'ora_accuracy',
            name: 'ora_uncertainty',
            type: 'NUMBER',
            writable: false
        }
    ],
    actions: [],
    formats: []

};

const Constants = {
    CW_API_BASE_PATH: '/connectedWorker/privatewebapi/v2',
    CW_CREATE_DM_URI: '/iot/api/v2/apps/0-AF/deviceModels',
    DEVICE_LOGIN_PATH: '/employees/%s/loggedInDevices/%s',
    METAWEAR_SERVICE_ID: '326a900085cb9195d9dd464cfbbae75a',
    DEVICE_USER_LIST_FILENAME: `${global.appRootDir}/data/device-user-list.json`,
    CW_DEVICE_MESSAGES: {
        MAN_DOWN_DETECTED_URN: _ManDownAlertUrn,
        FALL_DOWN_DETECTED_URN: _FallDownAlertUrn
    },
    CW_DEVICE_MODELS: {
        LOCATION: {
            NAME: 'ConnectedWorkerLocation',
            URN: 'urn:com:oracle:iot:cw:location'
        },
        // Only available from 18.3.3 onwards.
        // Moved to Custom device models to support 18.3.1
        // AMBIENT_TEMPERATURE: {
        //     NAME: 'ConnectedWorkerAmbientTemperature',
        //     URN: 'urn:com:oracle:iot:cw:ambient_temp'
        // },
        AMBIENT_LIGHT: {
            NAME: 'ConnectedWorkerAmbientLight',
            URN: 'urn:com:oracle:iot:cw:ambient_light'
        },
        GPS: {
            NAME: 'ConnectedWorkerGPS',
            URN: 'urn:com:oracle:iot:cw:gps'
        },
        MOTION: {
            NAME: 'ConnectedWorkerMotion',
            URN: 'urn:com:oracle:iot:cw:motion'
        },
        PRESSURE: {
            NAME: 'ConnectedWorkerPressure',
            URN: 'urn:com:oracle:iot:cw:pressure'
        },
        MESSAGE_SINK: {
            NAME: 'ConnectedWorkerMessageSink',
            URN: 'urn:com:oracle:iot:cw:message_sink'
        }
    },
    CUSTOM_DEVICE_MODELS: {
        MAN_DOWN: {
            NAME: _ManDownDMName,
            URN: _ManDownDMUrn,
            DEVICE_MODEL: _ManDownDM
        },
        AMBIENT_TEMPERATURE: {
            NAME: _AmbientTempDMName,
            URN: _AmbientTempDMUrn,
            DEVICE_MODEL: _AmbientTempDM
        }
    }
};


module.exports.Constants = Constants;
module.exports.RELEASE_VERSION = RELEASE_VERSION;
