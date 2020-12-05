/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const log4js = require('log4js');
const { GenericBLEDevice } = require('./generic-ble-device');

class SimpleBLEDevice extends GenericBLEDevice {

    constructor(peripheral) {
        super(peripheral);
        this._logger = log4js.getLogger('SimpleBLEDevice');
        this._logger.addContext("id", `(${this.address})`);
    }

    connect() {
        this.status = 'connecting';
        this._logger.debug(`Connecting to BLE device ${this.name}`);
        let promise = new Promise((resolve) => {
            this.status = 'connected';

            this._logger.info(`BLE Device ${this.name} address(${this.address}) connected`);
            resolve(null);
        });

        return promise;
    }
}

module.exports.SimpleBLEDevice = SimpleBLEDevice;
