/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
const KalmanFilter = require('kalmanjs').default;
const { SettingsManager } = require('./settings-manager');
const settings = SettingsManager.settings;
const log4js = require('log4js');

const { ConfigDataManager } = require('./configdata-manager');


/**
 * Generic BLE Device
 *
 * @class GenericBLEDevice
 */
class GenericBLEDevice {
    constructor(peripheral) {
        this._logger = log4js.getLogger('GenericBLEDevice');
        this._configData = ConfigDataManager.configData;
        this._updateRssi = this._updateRssi.bind(this);

        if (peripheral) {
            this.setPeripheral(peripheral);
        }

        this.rssiValues = [];
        this.lastRssiAt = 0;
        this.lastRssiCheck = Date.now();
        this.status = 'disconnected';
        this.name = 'Generic';
        this.serviceId = 'unknown';

        /* eslint id-length: 'off' */
        this.kalmanFilter = new KalmanFilter({
            R: 0.01,
            Q: 3
        });

        // Reset rssiValues if no rssi for a specified period -- device is out of range
        setInterval(() => {
            if (this.lastRssiCheck - this.lastRssiAt >= settings.client.outOfRangeTimeoutMsecs) {
                this.rssiValues.splice(0, this.rssiValues.length);
            }
            this.lastRssiCheck = Date.now();
        }, settings.client.outOfRangeTimeoutMsecs);
    }

    get address() {
        return this._peripheral.address;
    }

    /**
     * Add a new rssi reading
     *
     * @param {number} rssi rssi reading
     * @returns {undefined}
     * @memberof GenericBLEDevice
     */
    putRssi(rssi) {
        if (this.rssiValues.length === settings.client.rssiSampleSize) {
            this.rssiValues.shift();
        }
        this.rssiValues.push(rssi);
        this.lastRssiAt = Date.now();
    }


    /**
     * Returns true if device is in range.
     * Devices treated as out of range if no RSSI for a specified interval or device outside of configured distance
     *
     * @readonly
     * @memberof GenericBLEDevice
     */
    get inRange() {
        this._logger.debug(`rssiValues.length=${this.rssiValues.length}, distance = ${this.distance}`);
        return this.rssiValues.length > 0 && this.distance < settings.client.maxRange;
    }


    /**
     * Distance from the node in meters
     *
     * @readonly
     * @memberof GenericBLEDevice
     */
    get distance() {
        if (this.rssiValues.length === 0) {
            return 0;
        }

        let kdata = this.rssiValues.map((v) => this.kalmanFilter.filter(v));
        let kdataSum = kdata.reduce((a, v) => a + v);
        kdata.sort();
        // let med = Math.ceil(kdata.length / 2);
        let avg = Math.ceil(kdataSum / kdata.length);
        // let max = Math.ceil(kdata[kdata.length - 1]);
        // let min = Math.ceil(kdata[0]);

        let txPower = settings.client.txPower;
        // this._logger.debug(`${avg}      ${med}     ${max}    ${min}`);
        let ratio = Number(avg) / txPower;
        let dist = 1;
        if (ratio < 1.0) {
            // dist = Math.pow((txPower - avg) / 20, 10);
            // this._logger.debug('Ratio < 1 - ', ratio, dist);
        } else {
            /* eslint no-mixed-operators: 'off' */
            dist = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
            // Round to precision 2
            dist = Math.round(dist * 100) / 100;
            // 0.89976, 7.7095 and 0.111 are the three constants calculated
            // when solving for a best fit curve to our measured data points.
            // this._logger.debug('Distance = ', dist);
        }
        return dist;
    }

    /**
     * Connects to the BLE device -- Needs to be implemented by specific classes
     *
     * @returns {Promise}   Promise
     * @memberof GenericBLEDevice
     */
    connect() {
        let promise = new Promise((resolve, reject) => {
            this._logger.error('Not implemented');
            reject(new Error('Not implemented!'));
        });

        return promise;
    }

    startRSSIUpdates() {
        this._rssiUpdatesInterval = setInterval(() => this._peripheral.updateRssi(), settings.client.rssiUpdateInterval);
    }

    stopRSSIUpdates() {
        if (this._rssiUpdatesInterval) {
            clearInterval(this._rssiUpdatesInterval);
        }
    }

    setPeripheral(peripheral) {
        if (this._peripheral && this._peripheral !== null) {
            this._peripheral.removeListener('rssiUpdate', this._updateRssi);
        }
        this._peripheral = peripheral;
        this._peripheral.on('rssiUpdate', this._updateRssi);
    }

    getPeripheral() {
        return this._peripheral;
    }

    _updateRssi(rssi) {
        this._logger.debug(`Updating rssi ${rssi}`);
        this.putRssi(rssi);
    }

    /**
     * Disconnect the device
     *
     * @returns {undefined}
     * @memberof GenericBLEDevice
     */
    disconnect() {
        this.stopRSSIUpdates();
        this.status = 'disconnected';
        this.rssiValues.splice(0, this.rssiValues.length);
        if (this._peripheral && this._peripheral.state !== 'disconnected') {
            this._peripheral.disconnect();
        }
    }

    /**
     * Return true if device is connected
     *
     * @returns {undefined}
     * @memberof GenericBLEDevice
     */
    isConnected() {
        return this.status === 'connected';
    }

    isConnecting() {
        return this.status === 'connecting';
    }

    isDisconnected() {
        return this.status === 'disconnected';
    }

    get sensorData() {
        this._logger.debug('getSensorData()');
        return {};
    }

}

module.exports.GenericBLEDevice = GenericBLEDevice;
