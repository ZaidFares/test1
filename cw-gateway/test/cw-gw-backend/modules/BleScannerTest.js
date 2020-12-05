/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
'use strict';

jest.mock('log4js');
jest.mock('noble');
jest.mock('kalmanjs');
jest.mock('../../../cw-gw-backend/config/settings.json', () => ({
    client: {
        bleDeviceTypes: []
    }
}), { virtual: true });
jest.mock('../../../cw-gw-backend/data/client_config.json', () => ({

}), { virtual: true });

const { BleScanner } = require('@cw-gw-backend/modules/ble-scanner');

describe('ble scanner', () => {
    const bleScanner = new BleScanner();

    it("initially is not scanning when created", function() {
        expect(bleScanner.isScanning()).toBeFalsy();
    });
});
