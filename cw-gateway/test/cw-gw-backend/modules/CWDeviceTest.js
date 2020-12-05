/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
'use strict';

jest.mock('log4js');
const log4js = require('log4js');
log4js.getLogger.mockReturnValue({
    debug: () => {}
});

jest.mock('../../../cw-gw-backend/config/settings.json', () => ({
    client: {
        bleDeviceTypes: []
    }
}), { virtual: true });

jest.mock('../../../cw-gw-backend/modules/common', () => {
    return {
        Constants: {
            CW_DEVICE_MODELS: {
                GPS: {
                    NAME: 'gps'
                },
                AMBIENT_LIGHT: {
                    NAME: 'light'
                },
                MOTION: {
                    NAME: 'motion'
                }
            },
            CUSTOM_DEVICE_MODELS: {
                AMBIENT_TEMPERATURE: {
                    NAME: 'temp'
                },
            }
        }
    }
});

const { Constants } = require('../../../cw-gw-backend/modules/common');
const { CWDevice } = require('../../../cw-gw-backend/modules/cw-device');

describe('CW Device test', () => {
    const GPS_DATA_1 = {
        ora_latitude: 1,
        ora_longitude: 2,
        ora_altitude: 0
    };
    const GPS_DATA_2 = {
        ora_latitude: 2,
        ora_longitude: 3,
        ora_altitude: 0
    }
    const VIRTUAL_DEVICE = {
        deviceModel: {
            name: Constants.CW_DEVICE_MODELS.GPS.NAME
        },
        update: jest.fn()
    };
    const virtualDevices = new Map([[Constants.CW_DEVICE_MODELS.GPS.NAME, VIRTUAL_DEVICE]]);

    let cwDevice = undefined;
    beforeEach(() => {
        cwDevice = new CWDevice(virtualDevices);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("sends first received location", function() {
        cwDevice.setGeoLocation(GPS_DATA_1.ora_latitude, GPS_DATA_1.ora_longitude);
        cwDevice.send();
        expect(VIRTUAL_DEVICE.update).toBeCalledWith(GPS_DATA_1);
        expect(VIRTUAL_DEVICE.update).toBeCalledTimes(1);
    });

    it("does not send location if it did not change", function() {
        cwDevice.setGeoLocation(GPS_DATA_1.ora_latitude, GPS_DATA_1.ora_longitude);
        cwDevice.send();
        expect(VIRTUAL_DEVICE.update).toBeCalledWith(GPS_DATA_1);
        cwDevice.setGeoLocation(GPS_DATA_1.ora_latitude, GPS_DATA_1.ora_longitude);
        cwDevice.send();
        expect(VIRTUAL_DEVICE.update).toBeCalledTimes(1);
    });

    it("sends location if it changes", function() {
        cwDevice.setGeoLocation(GPS_DATA_1.ora_latitude, GPS_DATA_1.ora_longitude);
        cwDevice.send();
        expect(VIRTUAL_DEVICE.update).toBeCalledWith(GPS_DATA_1);
        cwDevice.setGeoLocation(GPS_DATA_2.ora_latitude, GPS_DATA_2.ora_longitude);
        cwDevice.send();
        expect(VIRTUAL_DEVICE.update).toBeCalledWith(GPS_DATA_2);
    });
});