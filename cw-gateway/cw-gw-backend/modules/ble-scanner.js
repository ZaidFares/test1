/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

 /* eslint no-warning-comments: off, no-underscore-dangle: ['off'], guard-for-in: off  */

const log4js = require('log4js');
const noble = require('noble');
const { MetawearDevice } = require('./metawear-device');

const { SettingsManager } = require('./settings-manager');
const { SimpleBLEDevice } = require('./simple-ble-device');
const { IBeaconBLEDevice } = require('./ibeacon-ble-device');

class BleScanner {
    constructor() {
        this._logger = log4js.getLogger('BleScanner');
        let bleDeviceTypes = SettingsManager.settings.client.bleDeviceTypes;
        this._setupBLEDeviceTypes(bleDeviceTypes);
        this.discoveredDevices = {};
        this._scanning = false;
        this._handleDiscover = this._handleDiscover.bind(this);
        noble.on('scanStart', () => {
            this._scanning = true;
        });
        noble.on('scanStop', () => {
            this._scanning = false;
        });
    }

    _setupBLEDeviceTypes(bleDeviceTypes) {
        this._deviceServiceIDMap = {};
        if (bleDeviceTypes.metawear && bleDeviceTypes.metawear.mode !== 'off') {
            let device = {};
            device.class = bleDeviceTypes.metawear.mode === 'full' ? MetawearDevice : SimpleBLEDevice;
            device.name = bleDeviceTypes.metawear.name;
            device.mode = bleDeviceTypes.metawear.mode;
            device.serviceId = bleDeviceTypes.metawear.serviceId;
            this._deviceServiceIDMap[device.serviceId] = device;
        }
        if (bleDeviceTypes.generic && bleDeviceTypes.generic.mode !== 'off') {
            let device = {};
            device.class = SimpleBLEDevice;
            device.name = bleDeviceTypes.generic.name;
            device.serviceId = bleDeviceTypes.generic.serviceId;
            device.mode = bleDeviceTypes.generic.mode;
            this._deviceServiceIDMap[device.serviceId] = device;
        }
        if (bleDeviceTypes.ibeacon && bleDeviceTypes.ibeacon.mode !== 'off') {
            let device = {};
            device.class = IBeaconBLEDevice;
            device.name = bleDeviceTypes.ibeacon.name;
            device.mode = bleDeviceTypes.ibeacon.mode;
            device.serviceId = bleDeviceTypes.ibeacon.serviceId;
            this._deviceServiceIDMap[device.serviceId] = device;
        }
        for (let id in this._deviceServiceIDMap) {
            let dev = this._deviceServiceIDMap[id];
            this._logger.info(`Registered BLE device type '${dev.name}' with service ID ${dev.serviceId}, mode=${dev.mode}`);
        }
    }

    state() {
        this._logger.debug(`BLE state = ${noble._state}`);
    }

    isScanning() {
        return this._scanning;
    }

    restartScan() {
        noble.stopScanning();
        noble.startScanning(Object.keys(this._deviceServiceIDMap), true);
    }

    scan() {
        this._logger.info('Start scanning BLE sensors');
        let serviceIDs = Object.keys(this._deviceServiceIDMap);
        if (noble._state === 'poweredOn') {
            noble.startScanning(serviceIDs, true);
        } else {
            noble.on('stateChange', (state) => {
                this._logger.debug(`Stat changed to ${state}`);
                if (state === 'poweredOn') {
                    noble.startScanning(serviceIDs, true);
                } else {
                    noble.stopScanning();
                }

            });
        }
        noble.on('discover', this._handleDiscover);
    }

    _handleDiscover(peripheral) {
        let bleDevice = this.discoveredDevices[peripheral.address];
        if (bleDevice === undefined) {
            this._logger.debug(`Discovered: ${peripheral.address}, ${peripheral.advertisement.localName}, RSSI = ${peripheral.rssi}`);
            let discoveredDevice = this._deviceServiceIDMap[peripheral.advertisement.serviceUuids[0]];
            if (discoveredDevice) {
                let device = new discoveredDevice.class(peripheral);
                device.name = discoveredDevice.name;
                device.mode = discoveredDevice.mode;
                this.discoveredDevices[peripheral.address] = device;
                this._logger.debug(`Added new device to the list with address  = ${peripheral.address}`);

                // DEBUG
                // bleDevice.connect().
                //     then(() => {
                //         setInterval(() => {
                //             this._logger.debug('Sensor data =', bleDevice.sensorData);
                //         }, 1000);

                //     }).
                //     catch((err) => {
                //         this._logger.errir(err);
                //     });
                // END DEBUG

            } else {
                this._logger.warn(`No device handler found for service UUID ${peripheral.advertisement.serviceUuids[0]}`);
            }
        }
        if (bleDevice) {
            this._logger.debug(`RSSI ${peripheral.address} - ${peripheral.rssi}`);
            bleDevice.putRssi(peripheral.rssi);
        }
    }

    /* eslint class-methods-use-this: 'off' */
    stop() {
        noble.removeListener('discover', this._handleDiscover);
        noble.stopScanning();
        this._logger.info('Stopped scanning');
    }

    pauseScan() {
        noble.stopScanning();
    }
}

module.exports.BleScanner = BleScanner;
