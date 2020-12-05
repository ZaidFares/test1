/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */


const log4js = require('log4js');
log4js.configure('./config/logger.json', {reloadSecs: 300});

const {BleScanner} = require('./modules/ble-scanner');
const logger = log4js.getLogger('tester');
const bleSCanner = new BleScanner();

var cleanUp = function () {
    logger.info('cleaning up...');
    for (let device in bleSCanner.devices) {
        bleSCanner.devices[device].disconnect();
    }
    bleSCanner.stop();
};
process.on('SIGINT', () => cleanUp());
process.on('SIGTERM', () => cleanUp());

bleSCanner.scan();

//setTimeout(()=>bleSCanner.stop(), 20000);
