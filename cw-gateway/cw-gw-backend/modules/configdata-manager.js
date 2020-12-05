/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const log4js = require('log4js');
const _logger = log4js.getLogger('ConfigDataManager');
let _callbacks = [];
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

let _configData = require('../data/client_config.json');

class ConfigDataManager {

    static get configData() {
        return _configData;
    }

    static _writeconfigData() {
        return new Promise((resolve, reject) => {
            writeFile(`${global.appRootDir}/data/client_config.json`, JSON.stringify(_configData, 4)).
            then(() => {
                _logger.info('Configuration data saved to file');
                _callbacks.forEach((func) => {
                    func();
                });
                resolve();
            }).
            catch((err) => {
                _logger.error(`Failed to write configuration to  file`, err);
                reject(err);
            });
        });
    }

    static updateConfigData(newconfigData) {
        _logger.info('Configuration updated, writing back to file');
        Object.assign(_configData, newconfigData);
        return ConfigDataManager._writeconfigData(newconfigData);
    }

    static onUpdate(fn) {
        _callbacks.push(fn);
    }
}

module.exports.ConfigDataManager = ConfigDataManager;
