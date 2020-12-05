/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
const log4js = require('log4js');
const MetaWear = require('metawear');
const ref = require('ref');
const { GenericBLEDevice } = require('./generic-ble-device');
const { SettingsManager } = require('../modules/settings-manager');
const { MetaWearFallDownMonitor } = require('./MetaWearFallDownMonitor');

const LED_COLORS = {
    'red': MetaWear.LedColor.RED,
    'green': MetaWear.LedColor.GREEN,
    'blue': MetaWear.LedColor.BLUE
};

const BOARD_TIME_FOR_RESPONSE = 4000;

/* eslint camelcase: 'off', guard-for-in: off */

/**
 * BLE device implementing the MetaWear SDK
 *
 * @class MetawearDevice
 */
class MetawearDevice extends GenericBLEDevice {
    constructor(peripheral) {
        super(peripheral);
        this._logger = log4js.getLogger(`MetawearDevice`);
        this._logger.addContext('id', `(${this.address})`);
        this._handleDisconnect = this._handleDisconnect.bind(this);
        this._lastBatteryLevel = 0;
        this._lastTemperature = undefined;
        this._lastMotionStatus = undefined;
        this._latestFallDownTimestamp = undefined;
        this._metawearSettings = SettingsManager.settings.client.bleDeviceTypes.metawear;
        this._temperatureUpdateFreq = 1000 * (this._metawearSettings.temperatureUpdateFreq ? this._metawearSettings.temperatureUpdateFreq : 60);
        this._batteryUpdateFreq = 1000 * (this._metawearSettings.batteryUpdateFreq ? this._metawearSettings.batteryUpdateFreq : 600);
        this._motionDetectionFreq = 1000 * (this._metawearSettings.motionDetectionFreq ? this._metawearSettings.motionDetectionFreq : 30);
        this.mwDevice = new MetaWear(peripheral);
        this._fallDownMonitor = new MetaWearFallDownMonitor(this.mwDevice);
        MetaWear.mbl_mw_metawearboard_set_time_for_response(this.mwDevice.board, BOARD_TIME_FOR_RESPONSE);
        this._logger.debug('Created');
    }

    destroy() {
        this._disconnect();
        MetaWear.mbl_mw_metawearboard_free(this.mwDevice.board);
    }

    get sensorData() {
        return {
            ambientLightLux: this.ambientLightLux,
            batteryLevel: this._lastBatteryLevel,
            temperature: this._lastTemperature,
            motionDetected: this._lastMotionStatus,
            motionTimestamp: this._lastMotionTimestamp,
            latestFallDownTimestamp: this._latestFallDownTimestamp
        };
    }

    /**
     * Return the last captured ambient light reading in LUX
     *
     * @readonly
     * @memberof MetawearDevice
     */
    get ambientLightLux() {
        return this._lastLuxReading;
    }

    /**
     * Return the last captured barometric pressure reading in LUX
     *
     * @readonly
     * @memberof MetawearDevice
     */
    get barometricPressure() {
        return this._lastPressureReading;
    }

    _disconnect() {
        this._logger.info(`Disconnecting ${this.name} address(${this.address})`);
        this._cleanup();
        super.disconnect();
        process.emit('metawear-disconnected', this.address);
    }

    /**
     * Connects to the MetaWear sensor board
     *
     * @returns {Promise}   Promise
     * @memberof MetawearDevice
     */
    connect() {
        this.status = 'connecting';
        this._logger.debug('Connecting to MetaWear sensor');
        let promise = new Promise((resolve, reject) => {
            this.mwDevice.connectAndSetUp((error) => {
                if (error) {
                    this._disconnect();
                    this._logger.error(error);
                    reject(error);
                } else {
                    this._logger.debug(`MetaWear device ${this.address} connected`);
                    this.status = 'connected';
                    //this.peripheral = this.mwDevice._peripheral;
                    this.mwDevice.once('disconnect', this._handleDisconnect);
                    let pattern = new MetaWear.LedPattern();
                    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
                    MetaWear.mbl_mw_led_write_pattern(this.mwDevice.board, pattern.ref(), LED_COLORS[this._configData.ledColor]);
                    MetaWear.mbl_mw_led_play(this.mwDevice.board);

                    // Start sampling ambient light
                    this._startAmbientLightSensor();
                    // Start sampling pressure
                    this._startPressureSensor();

                    // Get the battery state
                    this._observeBatteryState(this.mwDevice);

                    // Start the barometer sensor -- required fo ambient temperature
                    MetaWear.mbl_mw_baro_bosch_start(this.mwDevice.board);
                    this._observeAmbientTemperature(this.mwDevice);

                    this._startMotionDetection(this.mwDevice);

                    this._fallDownMonitor.setup(this._metawearSettings)
                        .subscribe((height) => {
                            this._latestFallDownTimestamp = new Date().getTime();
                        })
                        .start();
                    this.startRSSIUpdates();
                    this._registerDisconnectionHandler().then(resolve);
                }
            });
        });

        return promise;
    }

    _registerDisconnectionHandler() {
        return new Promise((resolve) => {
            const board = this.mwDevice.board;
            let disconnectEvent = MetaWear.mbl_mw_settings_get_disconnect_event(board);
            MetaWear.mbl_mw_event_record_commands(disconnectEvent);
            MetaWear.mbl_mw_debug_reset(board);
            MetaWear.mbl_mw_event_end_record(disconnectEvent, ref.NULL, MetaWear.FnVoid_VoidP_Int.toPointer(resolve))
        });
    }

    _observeAmbientTemperature(mwDevice) {
        let tempDataSignal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(mwDevice.board, MetaWear.TemperatureSource.BPM280);
        MetaWear.mbl_mw_datasignal_subscribe(tempDataSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, dataPtr) => {
            this._lastTemperature = dataPtr.deref().parseValue();
        }));
        MetaWear.mbl_mw_datasignal_read(tempDataSignal);

        this._temperatureObserverInterval = setInterval(() => {
            MetaWear.mbl_mw_datasignal_read(tempDataSignal);
        }, this._temperatureUpdateFreq);
    }

    _observeBatteryState(mwDevice) {
        this._batteryDataSignal = MetaWear.mbl_mw_settings_get_battery_state_data_signal(mwDevice.board);
        MetaWear.mbl_mw_datasignal_subscribe(this._batteryDataSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, dataPtr) => {
            let battery = dataPtr.deref().parseValue();
            this._lastBatteryLevel = battery.charge;
        }));
        MetaWear.mbl_mw_datasignal_read(this._batteryDataSignal);

        this._batteryObserverInterval = setInterval(() => {
            MetaWear.mbl_mw_datasignal_read(this._batteryDataSignal);
        }, 1000 * 60);
    }

    _startMotionDetection(mwDevice) {
        // configure any motion detection
        // difference > 0.25g for 4 consecutive samples
        if (!this._motionDataSignal) {
            let sampleSize = this._metawearSettings.motionSampleSize ? this._metawearSettings.motionSampleSize : 4;
            let threshold = this._metawearSettings.motionThreshold ? this._metawearSettings.motionThreshold : 0.25;
            this._logger.debug(`Motion detection sensor configured with sample size of ${sampleSize} and threshold set to ${threshold}g`);
            MetaWear.mbl_mw_acc_bosch_set_any_motion_count(mwDevice.board, sampleSize);
            MetaWear.mbl_mw_acc_bosch_set_any_motion_threshold(mwDevice.board, threshold);
            MetaWear.mbl_mw_acc_bosch_write_motion_config(mwDevice.board);
            this._motionDataSignal = MetaWear.mbl_mw_acc_bosch_get_motion_data_signal(mwDevice.board);
            MetaWear.mbl_mw_datasignal_subscribe(this._motionDataSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, dataPtr) => {
                if (this._motionDetectionTimeout) {
                    clearTimeout(this._motionDetectionTimeout);
                    this._motionDetectionTimeout = null;
                    // this._logger.debug('Clearing motion timeout');
                }
                let motion = dataPtr.deref().parseValue();
                this._logger.debug('Motion detecion = ', motion);
                this._lastMotionStatus = motion.x_axis_active === 1 || motion.y_axis_active === 1 || motion.z_axis_active === 1;
                if (this._lastMotionStatus) {
                    this._lastMotionTimestamp = new Date().getTime();
                    // Start timer to reset the motionDetected to false if no motion detected for configured interval
                    this._motionDetectionTimeout = setTimeout(() => {
                        this._lastMotionStatus = false;
                        //this._logger.debug('resetting motion detected status');
                    }, this._motionDetectionFreq);
                }

            }));
        }
        // Enable motion detection and start accelerometer
        MetaWear.mbl_mw_acc_bosch_enable_motion_detection(mwDevice.board);
        MetaWear.mbl_mw_acc_bosch_start(mwDevice.board);
        this._logger.debug('Motion sensor started');


    }

    _startAmbientLightSensor() {
        this._logger.debug('startAmbientLightSensor()');
        if (this.mwDevice === undefined) {
            return;
        }
        if (this._ambientLightDataSignal === undefined) {
            MetaWear.mbl_mw_als_ltr329_set_gain(this.mwDevice.board, MetaWear.AlsLtr329Gain._96X);
            MetaWear.mbl_mw_als_ltr329_set_integration_time(this.mwDevice.board, MetaWear.AlsLtr329IntegrationTime._400ms);
            MetaWear.mbl_mw_als_ltr329_set_measurement_rate(this.mwDevice.board, MetaWear.AlsLtr329MeasurementRate._2000ms);
            MetaWear.mbl_mw_als_ltr329_write_config(this.mwDevice.board);
            this._ambientLightDataSignal = MetaWear.mbl_mw_als_ltr329_get_illuminance_data_signal(this.mwDevice.board);
            MetaWear.mbl_mw_datasignal_subscribe(this._ambientLightDataSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, dataPtr) => {
                this._lastLuxReading = dataPtr.deref().parseValue() / 1000;
            }));
        }
        MetaWear.mbl_mw_als_ltr329_start(this.mwDevice.board);
    }

    _startPressureSensor() {
        if (this.mwDevice === undefined) {
            return;
        }
        if (this._pressureDataSignal === undefined) {
            MetaWear.mbl_mw_baro_bosch_set_iir_filter(this.mwDevice.board, MetaWear.BaroBoschIirFilter.AVG_16);
            MetaWear.mbl_mw_baro_bosch_set_oversampling(this.mwDevice.board, MetaWear.BaroBoschOversampling.ULTRA_HIGH);
            MetaWear.mbl_mw_baro_bosch_set_standby_time(this.mwDevice.board, 500.0);
            MetaWear.mbl_mw_baro_bosch_write_config(this.mwDevice.board);
            this._pressureDataSignal = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(this.mwDevice.board);
            MetaWear.mbl_mw_datasignal_subscribe(this._pressureDataSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, dataPtr) => {
		        this._lastPressureReading = dataPtr.deref().parseValue();
	        }));
        }
        MetaWear.mbl_mw_baro_bosch_start(this.mwDevice.board);
    }

    _stopAmbientLightSensor() {
        if (this.mwDevice === undefined) {
            return;
        }
        if (this._ambientLightDataSignal) {
            MetaWear.mbl_mw_datasignal_unsubscribe(this._ambientLightDataSignal);
            MetaWear.mbl_mw_als_ltr329_write_config(this.mwDevice.board);
            MetaWear.mbl_mw_als_ltr329_stop(this.mwDevice.board);
        }
    }

    _stopPressureSensor() {
        if (this.mwDevice === undefined) {
            return;
        }
        if (this._pressureDataSignal) {
            MetaWear.mbl_mw_datasignal_unsubscribe(this._pressureDataSignal);
            MetaWear.mbl_mw_baro_bosch_write_config(this.mwDevice.board);
            MetaWear.mbl_mw_baro_bosch_stop(this.mwDevice.board);
        }
    }

    _handleDisconnect(reason) {
        this._logger.info(`Unexpected disconnection with reason: ${reason}.`);
        this._disconnect();
    }

    _cleanup() {
        this._logger.debug('_cleanup()');
        if (this._batteryObserverInterval) {
            clearInterval(this._batteryObserverInterval);
        }

        if (this._temperatureObserverInterval) {
            clearInterval(this._temperatureObserverInterval);
        }
        if (this._motionDataSignal) {
            this._motionDataSignal = null;
        }
        if (this._motionDetectionTimeout) {
            clearInterval(this._motionDetectionTimeout);
            this._motionDetectionTimeout = null;
        }
        this._fallDownMonitor.stop();
        this._logger.debug('cleanup() done');
    }
}

module.exports.MetawearDevice = MetawearDevice;
