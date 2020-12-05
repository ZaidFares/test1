/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
const MetaWear = require('metawear');
const ref = require('ref');
const func = require('./func');

/**
 * This class creates a data route (a chain of data processors) that can applied to a Metawear
 * data signal. For each data processor it's possible to subscribe one subscriber.
 *
 * @example
 * new MetaWearDataRoute()
 *      .rss()
 *      .threshold(1)
 *      .subscribe((context, dataPtr) => {
 *          console.log(dataPtr.deref().parseValue);
 *      })
 *      .applyTo(signal);
 *
 */
class MetaWearDataRoute {
    constructor() {
        this._chain = [];
        const processorPush = (createProcessor) => {
            return (...args) => {
                this._chain.push((context, dataSignal, ...subscribers) => {
                    createProcessor(...args)(context, dataSignal,
                        MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((context, signal) => {
                            subscribers.forEach((subscriber) => subscriber(context, signal));
                        }));
                });
                return this;
            }
        }

        this.rss = processorPush(this.rss);
        this.lowpass = processorPush(this.lowpass);
        this.threshold = processorPush(this.threshold);
    }

    /**
     * Adds an rss data processor to the chain as a subscriber the last added data processor or,
     * if the chain is empty, to the signal on which the route will be applied.
     *
     * This function pushes the create function for a data processor to the stack.
     *
     * @return {MetaWearDataRoute}
     * @memberof MetaWearDataRoute
     */
    rss() {
        return (context, dataSignal, callback) => {
            MetaWear.mbl_mw_dataprocessor_rss_create(dataSignal, context, callback)
        };
    }

    /**
     * Adds an lowpass data processor to the chain as a subscriber the last added data processor or,
     * if the chain is empty, to the signal on which the route will be applied.
     *
     * This function pushes the create function for a data processor to the stack.
     *
     * @param {Number} number number of samples
     * @return {MetaWearDataRoute}
     * @memberof MetaWearDataRoute
     */
    lowpass(number) {
        return (context, dataSignal, callback) => {
            MetaWear.mbl_mw_dataprocessor_lowpass_create(dataSignal, number, context, callback)
        };
    }

    /**
     * Adds an threshold data processor to the chain as a subscriber the last added data processor
     * or, if the chain is empty, to the signal on which the route will be applied.
     *
     * This function pushes the create function for a data processor to the stack.
     *
     * @param {Enum} mode MetaWear.ThresholdMode
     * @param {Number} value threshold value
     * @return {MetaWearDataRoute}
     * @memberof MetaWearDataRoute
     */
    threshold(mode, value) {
        return (context, dataSignal, callback) => {
            MetaWear.mbl_mw_dataprocessor_threshold_create(dataSignal, mode, value, 0, context,
                callback)
        };
    }

    /**
     * Subscribes a subscriber to the last added data processor
     *
     * This function adds subscribe function as a callback to the create function of the last added
     * data processor.
     *
     * @param {Function} subscriber
     * @return {MetaWearDataRoute}
     * @memberof MetaWearDataRoute
     */
    subscribe(subscriber) {
        this._chain[this._chain.length - 1] = func.appendAsCallback(
            this._chain[this._chain.length - 1], (context, datasignal) => {
                MetaWear.mbl_mw_datasignal_subscribe(datasignal, context,
                    MetaWear.FnVoid_VoidP_DataP.toPointer(subscriber));
            });
        return this;
    }

    /**
     * Applies a created chain of data processors to the data signal,
     *
     * @param {object} dataSignal data signal to apply the chain to
     * @return {undefined}
     * @memberof MetaWearDataRoute
     */
    applyTo(dataSignal) {
        let commit = () => {}
        for (let i = this._chain.length - 1; i >= 0; i--) {
            commit = func.appendAsCallback(this._chain[i], commit);
        }
        commit(ref.NULL, dataSignal);
    }
}

module.exports.MetaWearDataRoute = MetaWearDataRoute;