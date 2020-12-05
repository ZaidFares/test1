/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const { Constants } = require('./common');
const log4js = require('log4js');
const { SettingsManager } = require('./settings-manager');
const util = require('./util');
const { CWFallDownMonitor } = require('./CWFallDownMonitor');

/* eslint camelcase: 'off', guard-for-in: off */

/**
 * Wrapper class for IOT Device with CW Device model
 *
 * @class CWDevice
 */
class CWDevice {
    constructor(virtualDevices, deviceAddress, deviceId) {
        this._logger = log4js.getLogger('CWDevice');
        this._settings = SettingsManager.settings;
        this._logger.debug(`CWDevice Created (${deviceAddress}, ${deviceId})`);
        this._virtualDevices = virtualDevices;
        this._lastMandownAlertTimestamp = 0;

        for (let vd of this._virtualDevices) {
            vd[1].onError = function (errorTuple) {
                this._logger.error(`Virtual device ${vd[0]} operation failed -- ${JSON.stringify(errorTuple)}`);
            };
        }

        this._deviceAddress = deviceAddress;
        this._lastPosition = {
            _lat: 0,
            _lon: 0,
            changed(lat, lon) {
                return !(util.float_equals(this._lat, lat) && util.float_equals(this._lon, lon));
            },
            update(lat, lon) {
                this._lat = lat;
                this._lon = lon;
            }
        };

        this._lastMotionTimestamp = 0;
        this._virtualDeviceData = {};

        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME] = {
            ora_latitude: 0,
            ora_longitude: 0,
            ora_altitude: 0
        };

        this._virtualDeviceData[Constants.CUSTOM_DEVICE_MODELS.AMBIENT_TEMPERATURE.NAME] = {
            AmbientTemperature: 0,
            Location: ''
        };

        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.AMBIENT_LIGHT.NAME] = {
            AmbientLight: 0
        };

        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.MOTION.NAME] = {
            AccelerometerX: 0,
            AccelerometerY: 0,
            AccelerometerZ: 0,
            GyroX: 0,
            GyroY: 0,
            GyroZ: 0
        };

        this._deviceId = deviceId;

        this._fallDownMonitor = new CWFallDownMonitor(
            this._virtualDevices.get(Constants.CW_DEVICE_MODELS.MOTION.NAME));
    }

    setGeoLocation(lat, lon) {
        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME].ora_latitude = lat;
        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME].ora_longitude = lon;
    }

    setAmbientLight(ambientLight) {
        this._virtualDeviceData[Constants.CW_DEVICE_MODELS.AMBIENT_LIGHT.NAME].AmbientLight = ambientLight === undefined ? 0 : ambientLight;
    }

    setProjectLocation(locationId, hazardous) {
        this._locationId = locationId;
        this._hazardous = hazardous;
    }

    setTemperature(temperature) {
        this._virtualDeviceData[Constants.CUSTOM_DEVICE_MODELS.AMBIENT_TEMPERATURE.NAME].AmbientTemperature = temperature === undefined ? 0 : temperature;
    }

    setBatteryLevel(batteryLevel) {
        this._batteryLevel = batteryLevel;
    }

    setMotionDetected(detected, lastMotionTimestamp) {
        this._logger.debug(`Motion detected = ${detected}`);
        if (detected) {
            this._lastMotionTimestamp = lastMotionTimestamp;
            if (this._motionDetectionInterval) {
                // Reset timer
                clearInterval(this._motionDetectionInterval);
                this._motionDetectionInterval = null;
                this._lastMandownAlertTimestamp = 0;
                this._logger.debug('Man-down detection timer cleared.');
            }
        } else if (!this._motionDetectionInterval) {
            this._logger.debug(`Starting timer for ${this._settings.iotcs.cwManDownWhen.noMotionMinutes} minutes to detect man-down condition`);
            this._motionDetectionInterval = setInterval(() => {
                this._logger.debug(`Man-down condition detected for ${this._deviceId}, last motion detected at ${new Date(this._lastMotionTimestamp)}`);

                let now = new Date().getTime();
                let elapsedMinutes = Math.round((now - this._lastMandownAlertTimestamp) / 1000 / 60);
                if (elapsedMinutes >= this._settings.iotcs.cwManDownWhen.alertFrequency) {
                    this._logger.debug(`Creating man-down alert for ${this._deviceId}`);

                    let virtualDevice = this._virtualDevices.get(Constants.CUSTOM_DEVICE_MODELS.MAN_DOWN.NAME);
                    let gps = this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME];

                    let mandDownAlert = virtualDevice.createAlert(Constants.CW_DEVICE_MESSAGES.MAN_DOWN_DETECTED_URN);
                    mandDownAlert.fields.ora_latitude = gps.ora_latitude;
                    mandDownAlert.fields.ora_longitude = gps.ora_longitude;
                    // TODO: send the real values from sensor - see IOT-62277
                    mandDownAlert.fields.ora_altitude = 1;
                    mandDownAlert.fields.ora_uncertainty = 0.1;
                    mandDownAlert.fields.motionlessDuration = elapsedMinutes;
                    mandDownAlert.onError = function() {};
                    mandDownAlert.raise();

                    this._lastMandownAlertTimestamp = now;
                }
            }, this._settings.iotcs.cwManDownWhen.noMotionMinutes * 60000);
        }

    }

    receive(data) {
        this._fallDownMonitor.monitor(data);
    }

    send() {
        this._logger.debug(`Sending data - ${JSON.stringify(this._virtualDeviceData)}`);
        this._virtualDevices.forEach((vd) => {
            if (vd.deviceModel.name !== Constants.CW_DEVICE_MODELS.GPS.NAME) {
                let data = this._virtualDeviceData[vd.deviceModel.name];
                if (data) {
                    vd.update(data);
                }
            }
        });

        // Send a location entered event if position changed.
        // If this location has a hazard associated with it, send a hazard entered alert
        let gps = this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME];
        if (this._lastPosition.changed(gps.ora_latitude, gps.ora_longitude)) {
            this._sendGps();
        }
        this._lastPosition.update(gps.ora_latitude, gps.ora_longitude);
    }

    _sendGps() {
        let virtualDevice = this._virtualDevices.get(Constants.CW_DEVICE_MODELS.GPS.NAME);
        virtualDevice.update(this._virtualDeviceData[Constants.CW_DEVICE_MODELS.GPS.NAME]);
    }

    _sendGpsPosition() {
        this._logger.debug('Sending GPS position');
        this.hazardEnteredMessage = this._compositeVirtualDevice
            .getVirtualDevice(Constants.CW_DEVICE_GPS_URN)
            .update(this._data);
    }

    _sendAmbientLight() {
        this._logger.debug('Sending ambient light');
        this.hazardEnteredMessage = this._compositeVirtualDevice
            .getVirtualDevice(Constants.CW_DEVICE_AMBIENT_LIGHT_URN)
            .update(this._ambientLightData);
    }

    _sendPressure() {
        this._logger.debug('Sending pressure');
        this.hazardEnteredMessage = this._compositeVirtualDevice
            .getVirtualDevice(Constants.CW_DEVICE_PRESSURE_URN)
            .update(this._pressureData);
    }

    cleanup() {
        this._logger.debug(`Cleanup motion detection interval for device address ${this._deviceAddress}`);
        if (this._motionDetectionInterval) {
            clearInterval(this._motionDetectionInterval);
            this._motionDetectionInterval = null;
        }
    }
}

module.exports.CWDevice = CWDevice;
