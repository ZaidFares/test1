/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const { Constants } = require('./common');
const log4js = require('log4js');

/**
 * This class monitors data and based on it, sends a fall down alert for a specific device.
 *
 * The device should be created by iotcs.device.GatewayDevice.createVirtualDevice method.
 *
 * @example
 * const monitor = new CWFallDownMonitor()
 * monitor.monitor(data);
 * monitor.monitor(newData);
 */
class CWFallDownMonitor {
    constructor(device) {
        this._logger = log4js.getLogger(`CWFallDownMonitor`);
        this._device = device;
        this._latestFallDownTimestamp = undefined;
    }

    /**
     * Monitors data and sends an alert if it is the first update or latest fall down timestamp
     * differs from last update.
     *
     * @example
     * // data should contain all the fields from the below code
     * monitor.monitor({
     * latestFallDownTimestamp: new Date.now,
     * latitude: 0.5,
     * longitude: 0.5
     * });
     *
     * @param {Object} data data to monitor
     * @return {undefined} undefined
     * @memberof CWFallDownMonitor
     */
    monitor(data) {
        const latestFallDownTimestamp = data.latestFallDownTimestamp;
        if ((latestFallDownTimestamp !== undefined)
                && (this._latestFallDownTimestamp !== latestFallDownTimestamp)) {
            this._latestFallDownTimestamp = latestFallDownTimestamp;
            this._logger.debug(`Fall down. Sending alert.`);
            let fallDownAlert = this._device.createAlert(
                Constants.CW_DEVICE_MESSAGES.FALL_DOWN_DETECTED_URN);
            fallDownAlert.fields.ora_latitude = data.latitude;
            fallDownAlert.fields.ora_longitude = data.longitude;
            // TODO: send the real values from sensor - see IOT-62277
            fallDownAlert.fields.ora_altitude = 1;
            fallDownAlert.fields.ora_uncertainty = 0.1;
            fallDownAlert.fields.AccelerometerX = 1;
            fallDownAlert.fields.AccelerometerY = 1;
            fallDownAlert.fields.AccelerometerZ = 1;
            fallDownAlert.fields.GyroX = 1;
            fallDownAlert.fields.GyroY = 1;
            fallDownAlert.fields.GyroZ = 1;
            fallDownAlert.onError = function() {};
            fallDownAlert.raise();
        }
    }
}

module.exports.CWFallDownMonitor = CWFallDownMonitor;