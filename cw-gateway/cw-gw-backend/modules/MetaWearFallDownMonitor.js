/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
const log4js = require('log4js');
const MetaWear = require('metawear');
const convert = require('./convert');

const { MetaWearDataRoute } = require('./MetaWearDataRoute');

/**
 * This class monitors a fall down on a metawear device by creating a MateWearDataRoute instance
 * and applying it to the device's accelerometer.
 *
 * Height, number of samples in data route, threshold parameters could be configured using setup
 * method.
 *
 * Subscriber that could be subscribed by a subscribe method is called whenever the fall down
 * height exceeds a predefined limit. Method called once the fall is ended and the final height
 * in meters is provided as a parameter to the subscriber.
 *
 * @example
 * new MetaWearFallDownMonitor()
 *      .setup(settings)
 *      .subscribe((height) => {
 *          console.log(height);
 *      })
 *      .start()
 *
 */
class MetaWearFallDownMonitor {
    constructor(metawearDevice) {
        this._logger = log4js.getLogger(`MetaWearFallDownMonitor`);
        this._device = metawearDevice;
        this._fallDownCountDown = undefined;
        this._subscriber = () => {};
        this._fallDownHeight = MetaWearFallDownMonitor.DEFAULT_HEIGHT;
        this._fallDownSampleSize = MetaWearFallDownMonitor.DEFAULT_SAMPLES_NUM;
        this._fallDownThreshold = MetaWearFallDownMonitor.DEFAULT_THRESHOLD;
        this._fallStart = undefined;
    }

    _onFallEnd() {
        if (this._fallStart !== undefined) {
            const fallEnd = Date.now();
            const height = convert.freeFallMsToCm(fallEnd - this._fallStart);
            this._fallStart = undefined;
            this._logger.debug(`Fall from height of ${height} centimeters ended.`);
            if (height >= this._fallDownHeight) {
                this._subscriber(height / 100);
            }
        }
    }

    /**
     * Setups the monitor with the provided values for fall down height, data processor sample size
     * and threshold.
     *
     * Parameter of the function should be an object that could contain one of the field in the
     * example below.
     *
     * If some value is missing (is undefined in the object), the default value is used.
     *
     * @example
     * monitor.setup({
     * fallDownHeight: 1,
     * fallDownSampleSize: 5,
     * fallDownThreshold: 0.75
     * });
     *
     * @param {Object} settings values for height, sample size and threshold
     * @return {MetaWearFallDownMonitor}
     * @memberof MetaWearFallDownMonitor
     */
    setup(settings) {
        if (settings) {
            if (settings.fallDownHeight !== undefined) {
                this._fallDownHeight = settings.fallDownHeight * 100;
            }
            if (settings.fallDownSampleSize !== undefined) {
                this._fallDownSampleSize = settings.fallDownSampleSize
            }
            if (settings.fallDownThreshold !== undefined) {
                this._fallDownThreshold = settings.fallDownThreshold
            }
        }
        return this;
    }

    /**
     * Sets the subscriber function to be called when the fall down exceeds the predefined
     * height.
     *
     * @param {Function} subscriber
     * @return {MetaWearFallDownMonitor}
     * @memberof MetaWearFallDownMonitor
     */
    subscribe(subscriber) {
        this._subscriber = subscriber;
        return this;
    }

    /**
     * Creates the data route on the accelerator data signal, configures the device's accelerator
     * and starts it.
     *
     * @return {MetaWearFallDownMonitor}
     * @memberof MetaWearFallDownMonitor
     */
    start() {
        new MetaWearDataRoute()
            .rss()
            .lowpass(this._fallDownSampleSize)
            .threshold(MetaWear.ThresholdMode.BINARY, this._fallDownThreshold)
            .subscribe((context, dataPtr) => {
                const isFallingDown = (dataPtr.deref().parseValue() === -1);
                if (isFallingDown && !this._fallStart) {
                    this._fallStart = Date.now();
                    this._logger.debug('Fall started');
                } else if (!isFallingDown) {
                    this._onFallEnd()
                }
            })
            .applyTo(MetaWear.mbl_mw_acc_get_acceleration_data_signal(this._device.board));

        MetaWear.mbl_mw_acc_set_range(this._device.board,
            MetaWearFallDownMonitor.ACCELERATION_RANGE);
        MetaWear.mbl_mw_acc_write_acceleration_config(this._device.board);
        MetaWear.mbl_mw_acc_enable_acceleration_sampling(this._device.board);
        MetaWear.mbl_mw_acc_start(this._device.board);
        return this;
    }

    stop() {
        this._onFallEnd();
    }
}

MetaWearFallDownMonitor.DEFAULT_SAMPLES_NUM = 4;
MetaWearFallDownMonitor.DEFAULT_THRESHOLD = 0.5;
MetaWearFallDownMonitor.DEFAULT_HEIGHT = 200;
MetaWearFallDownMonitor.ACCELERATION_RANGE = 4;

module.exports.MetaWearFallDownMonitor = MetaWearFallDownMonitor;