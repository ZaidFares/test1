/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.ScheduledPolicyData = class {
    /**
     *
     * @param {number} window
     * @param {number} slide
     * @param {number} timeZero
     */
    constructor(window, slide, timeZero) {
        // Initial expiry is window milliseconds past time zero.
        // Tenth of a millisecond resolution helps group
        // intersecting slide values (10 second and 20 second,
        // for example).
        this._expiry = ((window + timeZero) / 10) * 10;
        this._slide = slide;
        this._window = window;
        // { attributeName : pipelineIndex }
        /** @type {Map<string, number>} */
        this._pipelineIndices = new Map();
    }

    // Private/protected functions
    /**
     *
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _addAttribute(attributeName, pipelineIndex) {
        this._pipelineIndices.set(attributeName, pipelineIndex);
    }

    /**
     *
     * @param {object} o
     * @return {boolean}
     */
    _equals(o) {
        if (this === o) {return true;}
        if (!o) {return false;}
        return (this._window === o.window) && (this._slide === o.slide);
    }


    /**
     * @return {number}
     */
    _hashCode() {
        return ((this._window ^ (this._window >>> 32)) + (this._slide ^ (this._slide >>> 32)));
    }

    /**
     *
     * @param {number} now
     * @return {number}
     */
    _getDelay(now) {
        /** @type {number} */
        const delay = this._expiry - now;
        return (delay > 0) ? delay : 0;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} updatedAttributes
     */
    _handleExpiredFunction1(virtualDevice, updatedAttributes) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction1 called.');
            /** @type {DevicePolicy} */
            virtualDevice.devicePolicyManager._getPolicy(virtualDevice.deviceModel.urn,
                virtualDevice.endpointId).then(devicePolicy =>
            {
                iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction1 devicePolicy = ' +
                               devicePolicy);

                if (!devicePolicy) {
                    // TODO: better log message here
                    console.log('Could not find ' + virtualDevice.deviceModel.urn +
                        ' in policy configuration.');

                    return;
                }

                /** @type {Map<string, number} */
                const pipelineIndicesCopy = new Map(this._pipelineIndices);

                this._handleExpiredFunction2(virtualDevice, updatedAttributes, devicePolicy,
                    pipelineIndicesCopy).then(() => {
                        iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction1 updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));
                        resolve();
                    });
            });
        });
    }


    /**
     *
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {DevicePolicy} devicePolicy
     * @param {Map<string, number>} pipelineIndicesTmp
     */
    _handleExpiredFunction2(virtualDevice, updatedAttributes, devicePolicy, pipelineIndicesTmp) {
        iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction2 called, pipelineIndices = ' +
            iotcs.impl.Platform._inspect(pipelineIndicesTmp));

        let pipelineIndicesTmpAry = Array.from(pipelineIndicesTmp);

        let requests = pipelineIndicesTmpAry.map(entry => {
            iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction2 calling handleExpiredFunction3.');

            return new Promise((resolve, reject) => {
                this._handleExpiredFunction3(virtualDevice, updatedAttributes, devicePolicy,
                    entry[0], entry[1]).then(() =>
                {
                    iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction2 updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    resolve();
                });
            });
        });

        return Promise.all(requests).then(() => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction2 after Promise.all, updatedAttributes = ' +
                iotcs.impl.Platform._inspect(updatedAttributes));
        });
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {DevicePolicy} devicePolicy
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _handleExpiredFunction3(virtualDevice, updatedAttributes, devicePolicy, attributeName,
                           pipelineIndex)
    {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 called, attributeName = ' +
                attributeName);

            /** @type {Set<DevicePolicyFunction} */
            const pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 pipeline = ' +
                iotcs.impl.Platform._inspect(pipeline));

            if (!pipeline || pipeline.size === 0) {
                return;
            }

            if (pipeline.size <= pipelineIndex) {
                // TODO: better log message here
                console.log('Pipeline does not match configuration.');
                return;
            }

            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 calling virtualDevice.getPipelineData.');

            /** @type {Set<Map<string, object>>} */
            virtualDevice._getPipelineData(attributeName, pipelineData => {
                if (pipelineData.size <= pipelineIndex) {
                    // TODO: better log message here
                    console.log('Pipeline data does not match configuration.');
                    return;
                }

                /** @type {Set<DevicePolicyFunction} */
                const remainingPipelineConfigs =
                    new Set(Array.from(pipeline).slice(pipelineIndex, pipeline.size));

                /** @type {Set<Map<string, object>>} */
                const remainingPipelineData =
                    new Set(Array.from(pipelineData).slice(pipelineIndex, pipelineData.size));

                let isAllAttributes =
                    iotcs.device.impl.DevicePolicy._ALL_ATTRIBUTES === attributeName;

                if (!isAllAttributes) {
                    virtualDevice._processExpiredFunction2(updatedAttributes, attributeName,
                        remainingPipelineConfigs, remainingPipelineData);

                    iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    resolve();
                } else {
                    virtualDevice._processExpiredFunction1(remainingPipelineConfigs,
                            remainingPipelineData);

                    resolve();
                }
            });
        }).catch(error => {
            console.log('Error handling expired function: ' + error);
        });
    }

    /**
     *
     * @returns {boolean}
     */
    _isEmpty() {
        return this._pipelineIndices.size === 0;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {number} timeZero
     */
    _processExpiredFunction(virtualDevice, updatedAttributes, timeZero) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.processExpiredFunction called.');
            this._handleExpiredFunction1(virtualDevice, updatedAttributes).then(() => {
                iotcs.impl.Platform._debug('ScheduledPolicyData.processExpiredFunction updatedAttributes = ' +
                    iotcs.impl.Platform._inspect(updatedAttributes));

                // Ensure expiry is reset. 1/10th of a millisecond resolution.
                this._expiry = ((this._slide + timeZero) / 10) * 10;
                resolve();
            }).catch(error => {
                // Ensure expiry is reset. 1/10th of a millisecond resolution.
                this._expiry = ((this._slide + timeZero) / 10) * 10;
            });
        });
    }

    /**
     *
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _removeAttribute(attributeName, pipelineIndex) {
        this._pipelineIndices.delete(attributeName);
    }
};
