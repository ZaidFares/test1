/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
jest.mock('log4js');
const log4js = require('log4js');
log4js.getLogger.mockReturnValue({
    debug: () => {}
});

jest.mock('@cw-gw-backend/modules/common', () => {
    return {
        Constants: {
            CW_DEVICE_MESSAGES: {
                FALL_DOWN_DETECTED_URN: 'fall_down'
            }
        }
    }
});

const { CWFallDownMonitor } = require('@cw-gw-backend/modules/CWFallDownMonitor');

describe('CWFallDownMonitor', () => {
    const FALL_DOWN_DETECTED_URN = 'fall_down';
    const LATEST_FALL_DOWN_TIMESTAMP_FIRST = 1000;
    const LATEST_FALL_DOWN_TIMESTAMP_SECOND = 2000;
    const LATITUDE = 0.1;
    const LONGITUDE = 0.2;
    let alert = undefined;
    const DEVICE = {
        createAlert: jest.fn(() => {
            return alert;
        })
    }
    let monitor = undefined;
    beforeEach(() => {
        alert = {
            fields: {},
            raise: jest.fn()
        };
        monitor = new CWFallDownMonitor(DEVICE);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates an alert if it is the first fall down timestamp', () => {
        monitor.monitor({ latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_FIRST });
        expect(alert.raise).toBeCalled();
    });

    it('creates an alert if it is different from the first', () => {
        monitor.monitor({ latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_FIRST });
        monitor.monitor({ latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_SECOND });
        expect(alert.raise).toBeCalledTimes(2);
    });

    it('does not create an alert if the timestamp was not changed', () => {
        monitor.monitor({ latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_FIRST });
        monitor.monitor({ latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_FIRST });
        expect(alert.raise).toBeCalledTimes(1);
    });

    it('does not create an alert if the timestamp is undefined', () => {
        monitor.monitor({ latestFallDownTimestamp: undefined });
        expect(alert.raise).not.toBeCalled();
    });

    it('creates a correct alert', () => {
        monitor.monitor({
            latestFallDownTimestamp: LATEST_FALL_DOWN_TIMESTAMP_FIRST,
            latitude: LATITUDE,
            longitude: LONGITUDE
        });
        expect(DEVICE.createAlert).toBeCalledWith(FALL_DOWN_DETECTED_URN);
        expect(alert.fields.ora_latitude).toBe(LATITUDE);
        expect(alert.fields.ora_longitude).toBe(LONGITUDE);
        expect(alert.raise).toBeCalled();
    });
});