/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: can we have only one of these threads for all virtual devices?
iotcs.device.impl.TimedPolicyThread = class {
    constructor(virtualDevice) {
        this._virtualDevice = virtualDevice;
        this._canceled = false;
        // Timer interval.
        this._interval = 1000;
        /** @type {ScheduledPolicyData[]} */
        this._scheduledPolicyData = [];

        this._interval = 1000;
        this._i = 0;

        /**
         *
         */
        this.run = () => {
            iotcs.impl.Platform._debug('TimedPolicyThread.run called.');
            this._timer = null;

            /** @type {number} */
            const now = new Date().getTime();
            /** @type {Set<Pair<VirtualDeviceAttribute, object>>} */
            const updatedAttributes = new Set();
            iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData = ' +
                iotcs.impl.Platform._inspect(self.scheduledPolicyData));

            if (this._scheduledPolicyData) {
                const scheduledPolicyDataAry = Array.from(this._scheduledPolicyData);

                let requests = scheduledPolicyDataAry.map(policyData => {
                    iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData delay = ' +
                        policyData.getDelay(now));

                    // Run through all the timed function data
                    if (policyData.getDelay(now) <= 0) {
                        iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData calling processExpiredFunction, updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));

                        policyData._processExpiredFunction(this._virtualDevice, updatedAttributes,
                            now);

                        iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData after calling processExpiredFunction, updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));
                    }
                });

                this._start(now);

                return Promise.all(requests).then(() => {
                    iotcs.impl.Platform._debug('TimedPolicyThread.run after Promise.all, updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    if (updatedAttributes.size > 0) {
                        // Call updateFields to ensure the computed metrics get run,
                        // and will put all attributes into one data message.
                        this._virtualDevice._updateFields(updatedAttributes);
                    }
                });
            }
        };
    }

    /**
     *
     * @param {ScheduledPolicyData} data
     */
    _addTimedPolicyData(data) {
        iotcs.impl.Platform._debug('TimedPolicyThread.addTimedPolicyData called, data = ' + data._window);
        /** @type {number} */
        let index = this._scheduledPolicyData.findIndex(element => {
            return element.equals(data);
        });

        if (index === -1) {
            this._scheduledPolicyData.push(data);
        } else {
            this._scheduledPolicyData.splice(index, 0, data);
        }

        /** @type {number} */
        const now = new Date().getTime();

        // Sort the set by delay time.
        this._scheduledPolicyData.sort((o1, o2) => {
            /** @type {number} */
            const x = o1._getDelay(now);
            /** @type {number} */
            const y = o2._getDelay(now);
            return (x < y) ? -1 : ((x === y) ? 0 : 1);
        });

        // Is the one we're adding the first in the list?  If yes, cancel and re-start.
        /** @type {number} */
        index = this._scheduledPolicyData.findIndex(element => {
            return element.equals(data);
        });

        if (index === 0) {
            this._cancel();
            this._start(now);
        }
    }

    // TODO: never used. Do we need cancelled and cancel()?
    /**
     *
     */
    _cancel() {
        iotcs.impl.Platform._debug('TimedPolicyThread.cancel called.');
        this._cancelled = true;

        if (this._timer) {
            _clearInterval(this._timer.id);
        }
    }

    /**
     * @return {boolean} {@code true} if the timer is alive.
     */
    _isAlive() {
        if (this._timer) {
            return true;
        }

        return false;
    }

    /**
     *
     * @return {boolean}
     */
    _isCancelled() {
        return this._cancelled;
    }


    /**
     *
     * @param {ScheduledPolicyData} data
     */
    _removeTimedPolicyData(data) {
        iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData called, data = ' + data._window);

        // TODO: Optimize this.
        for (let i = 0; i < this._scheduledPolicyData.length; i++) {
            iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData checking item #' + i +
                            ' for removal.');
            if (data.toString() === this._scheduledPolicyData[i].toString()) {
                iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData removing item #' + i);
                this._scheduledPolicyData.splice(i, 1);
            }
        }

        this._cancel();
        this._start(new Date().getTime());
    }

    /**
     *
     * @param {number} now
     */
    _start(now) {
        iotcs.impl.Platform._debug('TimedPolicyThread.start called.');

        // Sort the timers by time.
        if (this._scheduledPolicyData.length > 0) {
            const interval = this._scheduledPolicyData[0]._getDelay(now);
            this._timer = _setTimeout(this.run, interval);
        }
    }
};

/** @type {number} */
iotcs.device.impl.TimedPolicyThread.timed_policy_thread_count = 0;
