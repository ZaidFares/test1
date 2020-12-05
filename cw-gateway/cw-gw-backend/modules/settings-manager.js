/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */


let _settings = require('../config/settings.json');
const log4js = require('log4js');
const _logger = log4js.getLogger('Settings');
let _callbacks = [];
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

class SettingsManager {

    static get settings() {
        return _settings;
    }

    static get settingsFileName() {
        return `${global.appRootDir}/config/settings.json`;
    }

    static _writeSettings() {
        return new Promise((resolve, reject) => {
            writeFile(SettingsManager.settingsFileName, JSON.stringify(_settings, null, 4)).
            then(() => {
                _logger.info('Settings saved to file');
                _callbacks.forEach((func) => {
                    func();
                });
                resolve();
            }).
            catch((err) => {
                _logger.error(`Failed to write settings file`, err);
                reject(err);
            });
        });
    }

    static UpdateClientSettings(newClientSettings) {
        Object.assign(_settings.client, newClientSettings);

        return SettingsManager._writeSettings();
    }

    static updateSettings(newSettings) {
        _logger.info('Settings updated, writing back to file');
        Object.assign(_settings, newSettings);

        return SettingsManager._writeSettings(newSettings);
    }

    static onUpdate(fn) {
        _callbacks.push(fn);
    }


}

module.exports.SettingsManager = SettingsManager;
