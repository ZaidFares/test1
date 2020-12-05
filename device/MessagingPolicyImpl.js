/*
 * Cpyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.MessagingPolicyImpl = class {
    /**
     *
     * @param {iotcs.device.impl.DirectlyConnectedDeviceImpl} directlyConnectedDevice
     */
    constructor(dcdImpl) {
        /**
         * Key is device model urn, value is attribute -> trigger attributes
         * (a trigger attribute is a referenced attribute in a computedMetric formula).
         *
         * @type {Map<string, Map<string, Set<string>>>}
         */
        this._computedMetricTriggers = new Map();
        /**
         * Map from deviceModelUrn -> iotcs.device.impl.DeviceAnalog
         * We need more than one DeviceAnalog because the DCD can have more than one device model.
         *
         * @type {Map<string, iotcs.device.impl.DeviceAnalog>}
         */
        this._deviceAnalogMap = new Map();
        this._dcdImpl = dcdImpl;
        /**
         * {Set<iotcs.message.Message>}
         */
        this._messagesFromExpiredPolicies = new Set();
        /**
         * Data pertaining to this virtual device and its attributes for computing policies. The key
         * is attribute name (or null for the device model policies), value is a list. Each element
         * in the list corresponds to a function in the pipeline for the attribute, and the map is
         * used by the function to hold data between calls.  Note that there is a 1:1 correspondence
         * between the pipeline configuration data for the attribute, and the pipeline data for the
         * attribute.
         *
         * @type {Map<string, Set<Map<string, object>>>}
         */
        this._pipelineDataCache = new Map();

        this._deviceFunctionHelper = null;
        let num = 100000;
        let a = 1, b = 0, temp;

        while (num >= 0) {
            temp = a;
            a = a + b;
            b = temp;
            num--;
        }
    }

    // Private/protected functions
    // Apply policies that are targeted to an attribute
    /**
     * @param {iotcs.message.Message} dataMessage a data message to apply attribute polices to.
     * @param {number} currentTimeMillis the current time in milliseconds, use for expiring policies.
     * @resolve iotcs.message.Message} an attribute-processed data message.
     * @return Promise
     */
    _applyAttributePolicies(dataMessage, currentTimeMillis) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('_applyAttributePolicies called.');
            // A data message format cannot be null or empty (enforced in DataMessage(Builder) constructor.
            let format = dataMessage._properties.payload.format;
            // A data message format cannot be null or empty.
            let deviceModelUrn = format.substring(0, format.length - ":attributes".length);
            // Use var so we can reference it from within the callbacks.
            var messagingPolicyImpl = this;
            let dataMessageVar = dataMessage;
            let self = this;

            this._dcdImpl.getDeviceModel(deviceModelUrn, (response, error) => {
                iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel response = ' + response +
                    ', error = ' + error);

                if (error) {
                    console.log('-------------Error getting humidity sensor device model-------------');
                    console.log(error.message);
                    console.log('--------------------------------------------------------------------');
                    return;
                }

                let deviceModelJson = JSON.stringify(response, null, 4);
                let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);
                iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel deviceModel = ' + deviceModel);

                if (!deviceModel) {
                    resolve(dataMessageVar);
                    return;
                }

                let endpointId = dataMessage._properties.source;

                let devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(
                    messagingPolicyImpl._dcdImpl.getEndpointId());

                if (!devicePolicyManager) {
                    devicePolicyManager =
                        new iotcs.device.impl.DevicePolicyManager(messagingPolicyImpl._dcdImpl);
                }

                devicePolicyManager._getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                    iotcs.impl.Platform._debug('_applyAttributePolicies.getPolicy devicePolicy = ' +
                                    devicePolicy);
                    let deviceAnalog;

                    if (messagingPolicyImpl._deviceAnalogMap.has(endpointId)) {
                        deviceAnalog = messagingPolicyImpl._deviceAnalogMap.get(endpointId);
                    } else {
                        deviceAnalog = new iotcs.device.impl.DeviceAnalog(messagingPolicyImpl._dcdImpl,
                            deviceModel, endpointId);

                        messagingPolicyImpl._deviceAnalogMap.set(endpointId, deviceAnalog);
                    }

                    let triggerMap;

                    if (!self._computedMetricTriggers.has(deviceModelUrn)) {
                        triggerMap = new Map();
                        self._computedMetricTriggers.set(deviceModelUrn, triggerMap);
                        /** @type {Map<string, iotcs.impl.DeviceModelAttribute>} */
                        let deviceModelAttributeMap = deviceModel.getDeviceModelAttributes();

                        deviceModelAttributeMap.forEach(deviceModelAttribute => {
                            let attributeName = deviceModelAttribute.name;

                            if (!devicePolicy) {
                                return; // continue
                            }

                            /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                            let pipeline = devicePolicy._getPipeline(attributeName);
                            iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel.getPolicy pipeline = '
                                + pipeline);

                            if (!pipeline || pipeline.size === 0) {
                                return; // continue
                            }

                            // If a computedMetric is the first function in the pipeline,
                            // then see if the formula refers to other attributes. If so,
                            // then try this pipeline after all others.
                            /** @type {iotcs.device.impl.DevicePolicy.Function} */
                            let devicePolicyFunction = pipeline.values().next().value;
                            let deviceFunctionId = devicePolicyFunction._getId();
                            /** @type {Map<string, ?>} */
                            let parameters = devicePolicyFunction._getParameters();

                            if ('computedMetric' === deviceFunctionId) {
                                let formula = parameters.get('formula');
                                /** @type {Set<string>} */
                                let triggerAttributes = new Set();
                                let pos = formula.indexOf('$(');

                                while (pos !== -1) {
                                    let end = formula.indexOf(')', pos + 1);

                                    if (pos === 0 || formula.charAt(pos - 1) !== '$$') {
                                        let attr = formula.substring(pos + '$('.length, end);

                                        if (attr !== attributeName) {
                                            triggerAttributes.add(attr);
                                        }
                                    }

                                    pos = formula.indexOf('$(', end + 1);
                                }

                                if (triggerAttributes.size > 0) {
                                    triggerMap.set(attributeName, triggerAttributes);
                                }
                            }
                        });

                        iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicies about to call applyAttributePolicies2.');

                        let message = messagingPolicyImpl._applyAttributePolicies2(dataMessage,
                            deviceModel, devicePolicy, deviceAnalog, triggerMap, format,
                            messagingPolicyImpl, currentTimeMillis);

                        iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicies message = ' +
                            message);

                        resolve(message);
                    } else {
                        triggerMap = self._computedMetricTriggers.get(deviceModelUrn);

                        let message = messagingPolicyImpl._applyAttributePolicies2(dataMessage,
                            deviceModel, devicePolicy, deviceAnalog, triggerMap, format,
                            messagingPolicyImpl, currentTimeMillis);

                        resolve(message);
                    }
                }).catch(error => {
                    console.log('Error getting device policy: ' + error);
                });
            });
        });
    }

    /**
     *
     * @param dataMessage
     * @param deviceModel
     * @param devicePolicy
     * @param deviceAnalog
     * @param triggerMap
     * @param messagingPolicyImpl
     * @param currentTimeMillis
     * @return {iotcs.message.Message} a message.
     */
    _applyAttributePolicies2(dataMessage, deviceModel, devicePolicy, deviceAnalog, triggerMap,
                            format, messagingPolicyImpl, currentTimeMillis)
    {
        iotcs.impl.Platform._debug('_applyAttributePolicies2 called.');
        /** @type {[key] -> value} */
        let dataMessageDataItemsKeys = Object.keys(dataMessage._properties.payload.data);

        // DataItems resulting from policies. {Set<DataItem<?>>}
        let policyDataItems = new Set();

        // DataItems that have no policies. {Set<DataItem<?>>}
        let skippedDataItems = new Set();

        // If no policies are found, we will return the original message.
        let noPoliciesFound = true;

        dataMessageDataItemsKeys.forEach(attributeName => {
            iotcs.impl.Platform._debug('_applyAttributePolicies2 attributeName = ' + attributeName);
            let attributeValue = dataMessage._properties.payload.data[attributeName];

            if (!attributeName) {
                skippedDataItems.add(attributeName);
                return; // continue
            }

            if (!devicePolicy) {
                deviceAnalog._setAttributeValue(attributeName, attributeValue);
                skippedDataItems.add(new iotcs.device.DataItem(attributeName, attributeValue));
                return; // continue
            }

            /** @type {List<iotcs.device.impl.DevicePolicy.Function>} */
            let pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('_applyAttributePolicies2 pipeline = ' + pipeline);

            // No policies for this attribute?  Retain the data item.
            if (!pipeline || pipeline.size === 0) {
                deviceAnalog._setAttributeValue(attributeName, attributeValue);
                skippedDataItems.add(new iotcs.device.DataItem(attributeName, attributeValue));
                return; // continue
            }

            noPoliciesFound = false;

            // If this is a computed metric, skip it for now.
            if (triggerMap.has(attributeValue)) {
                return; // continue
            }

            let policyDataItem = messagingPolicyImpl._applyAttributePolicy(deviceAnalog,
                attributeName, attributeValue, pipeline, currentTimeMillis);

            iotcs.impl.Platform._debug('_applyAttributePolicies2 policyDataItem from applyAttributePolicy = ' +
                iotcs.impl.Platform._inspect(policyDataItem));

            if (policyDataItem) {
                policyDataItems.add(policyDataItem);
            }
        });

        // If no policies were found, return the original message.
        if (noPoliciesFound) {
            return dataMessage;
        }

        // If policies were found, but there are no policyDataItem's and no skipped data items, then return null.
        if (policyDataItems.size === 0 && skippedDataItems.size === 0) {
            return null;
        }

        // This looks like a good place to check for computed metrics too.
        if (policyDataItems.size > 0) {
            messagingPolicyImpl._checkComputedMetrics(policyDataItems, deviceAnalog,
                triggerMap, currentTimeMillis);

                iotcs.impl.Platform._debug('_applyAttributePolicies2 after checkComputedMetrics, policyDataItems = ' +
                    iotcs.impl.Platform._inspect(policyDataItems));
        }

        let message = new iotcs.message.Message();

        message
               .format(format)
               .priority(dataMessage._properties.priority)
               .source(dataMessage._properties.source)
               .type(iotcs.message.Message.Type.DATA);

        policyDataItems.forEach(dataItem => {
            let dataItemKey = dataItem.getKey();
            let dataItemValue = dataItem.getValue();

            // For Set items, we need to get each value.
            if (dataItemValue instanceof Set) {
                dataItemValue.forEach(value => {
                    message.dataItem(dataItemKey, value);
                });
            } else {
                message.dataItem(dataItemKey, dataItemValue);
            }
        });

        skippedDataItems.forEach(dataItem => {
            let dataItemKey = dataItem.getKey();
            let dataItemValue = dataItem.getValue();

            // For Set items, we need to get each value.
            if (dataItemValue instanceof Set) {
                dataItemValue.forEach(value => {
                    message.dataItem(dataItemKey, value);
                });
            } else {
                message.dataItem(dataItemKey, dataItemValue);
            }
        });

        return message;
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {DataItem} dataItem
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {number} currentTimeMillis
     * @return {DataItem}
     */
    _applyAttributePolicy(deviceAnalog, attributeName, attributeValue, pipeline, currentTimeMillis) {
        iotcs.impl.Platform._debug('_applyAttributePolicy called, attributeName = ' + attributeName +
                        ', attributeValue = ' + attributeValue);
        let deviceModel = deviceAnalog._getDeviceModel();
        // Get or create the pipeline data for this attribute.
        /** @type {Set<Map<string, object>>} */
        let pipelineData = this._pipelineDataCache.get(attributeName);

        if (!pipelineData) {
            /** @type {List<Map<string, object>>} */
            pipelineData = new Set();
            this._pipelineDataCache.set(attributeName, pipelineData);
        }

        iotcs.device.impl.DeviceFunction._putInProcessValue(deviceAnalog._getEndpointId(),
            deviceModel.getUrn(), attributeName, attributeValue);

        // Convert the pipeline and pipeline data Sets to arrays so we can index from them.
        let pipelineDataAry = Array.from(pipelineData);
        let pipelineAry = Array.from(pipeline);

        // Process each pipeline "function".
        for (let index = 0; index < pipelineAry.length; index++) {
            /** @type {iotcs.device.impl.DevicePolicyFunction} */
            let pipelineFunction = pipelineAry[index];
            /** @type {Map<string, object>} */
             let functionData;

            if (index < pipelineDataAry.length) {
                functionData = pipelineDataAry[index];
            } else {
                functionData = new Map();
                pipelineData.add(functionData);
                pipelineDataAry.push(functionData);
            }

            /** @type {string} */
            let functionId = pipelineFunction._getId();
            /** @type {Map<string, ?>} */
            let parameters = pipelineFunction._getParameters();
            /** @type {iotcs.device.impl.DeviceFunction} */
            let deviceFunction =
                iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                continue;
            }

            /** @type {boolean} */
            let windowExpired;
            /** @type {number} */
            let window = iotcs.device.impl.DeviceFunction._getWindow(parameters);
            iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicy window = ' + window);

            if (window > 0) {
                // This could be more succinct, but it makes the key easy to read in the debugger.
                /** @type {string} */
                let k = deviceModel.getUrn() + ':' + attributeName + ':' + deviceFunction._getId();
                /** @type {number} */
                let t0 = iotcs.device.impl.MessagingPolicyImpl._windowMap.get(k);

                if (!t0) {
                    t0 = currentTimeMillis;
                    iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, t0);
                }

                windowExpired = (t0 + window) <= currentTimeMillis;

                if (windowExpired) {
                    iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k,
                        currentTimeMillis);
                }
            } else {
                windowExpired = false;
            }

            iotcs.impl.Platform._debug('_applyAttributePolicy applying device function: ' + deviceFunction);

            if (deviceFunction._apply(deviceAnalog, attributeName, parameters, functionData,
                    attributeValue) || windowExpired)
            {
                iotcs.impl.Platform._debug('_applyAttributePolicy windowExpired');
                const valueFromPolicy = deviceFunction._get(deviceAnalog, attributeName, parameters,
                    functionData);

                iotcs.impl.Platform._debug('_applyAttributePolicy valueFromPolicy = ' +
                                iotcs.impl.Platform._inspect(valueFromPolicy));

                if (valueFromPolicy) {
                    iotcs.impl.Platform._debug('_applyAttributePolicy in valueFromPolicy.');
                    attributeValue = valueFromPolicy;

                    iotcs.impl.Platform._debug('_applyAttributePolicy in valueFromPolicy attributeValue = ' +
                        attributeValue);

                    iotcs.device.impl.DeviceFunction._putInProcessValue(
                        deviceAnalog._getEndpointId(), deviceModel.getUrn(), attributeName,
                        attributeValue);
                } else {
                    console.log(attributeName + " got null value from policy" +
                        deviceFunction._getDetails(parameters));

                    break;
                }
            } else {
                // apply returned false.
                attributeValue = null;
                break;
            }
        }

        // After the policy loop, if the attributeValue is null, then the policy
        // either filtered out the attribute, or the policy parameters have not
        // been met (e.g., sampleQuality rate is not met). If it is not null,
        // then create a new DataItem to replace the old in the data message.
        /** @type {DataItem} */
        let policyDataItem;
        iotcs.impl.Platform._debug('_applyAttributePolicy attributeValue = ' + attributeValue);

        if (attributeValue) {
            deviceAnalog._setAttributeValue(attributeName, attributeValue);
            policyDataItem = new iotcs.device.DataItem(attributeName, attributeValue);
        } else {
            policyDataItem = null;
        }

        iotcs.device.impl.DeviceFunction._removeInProcessValue(deviceAnalog._getEndpointId(), deviceModel.getUrn(),
            attributeName);

        iotcs.impl.Platform._debug('_applyAttributePolicy attributeName = ' + attributeName);
        iotcs.impl.Platform._debug('_applyAttributePolicy attributeValue = ' + attributeValue);
        iotcs.impl.Platform._debug('_applyAttributePolicy returning policyDataItem = ' + policyDataItem);
        return policyDataItem;
    }

    /**
     * Apply policies that are targeted to a device model
     *
     * @param {iotcs.message.Message} message
     * @param {number} currentTimeMillis (long)
     * @return {Promise} resolves to iotcs.message.Message[]
     */
    _applyDevicePolicies(message, currentTimeMillis) {
        return new Promise((resolve, reject) => {
            // A data message or alert format cannot be null or empty
            // (enforced in Data/AlertMessage(Builder) constructor)
            /** @type {string} */
            let format;
            /** @type {string} */
            let deviceModelUrn;
            /** @type {string} */
            const endpointId = message._properties.source;

            if (message._properties.type === iotcs.message.Message.Type.DATA) {
                format = message._properties.payload.format;
                deviceModelUrn = format.substring(0, format.length - ":attributes".length);
            } else if (message._properties.type === iotcs.message.Message.Type.ALERT) {
                format = message._properties.payload.format;
                deviceModelUrn = format.substring(0, format.lastIndexOf(':'));
            } else {
                resolve([message]);
                return;
            }

            /** @type {iotcs.device.impl.DeviceAnalog} */
            let deviceAnalog = this._deviceAnalogMap.get(endpointId);

            if (!deviceAnalog) {
                this.dcdImpl._getDeviceModel(deviceModelUrn, deviceModelJson => {
                    if (deviceModelJson) {
                        let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);

                        if (deviceModel instanceof iotcs.device.impl.DeviceModel) {
                            deviceAnalog = new iotcs.device.impl.DeviceAnalog(this._dcdImpl,
                                                            deviceModel, endpointId);

                            this._deviceAnalogMap.set(endpointId, deviceAnalog);
                        }

                        // TODO: what to do if deviceAnalog is null?
                        if (!deviceAnalog) {
                            resolve([message]);
                        } else {
                            this._applyDevicePolicies2(message, deviceModelUrn, endpointId,
                                currentTimeMillis, deviceAnalog).then(messages =>
                            {
                                resolve(messages);
                            }).catch(error => {
                                console.log('Error applying device policies: ' + error);
                                reject();
                            });
                        }
                    } else {
                        // TODO: what to do if deviceModel is null?
                        resolve([message]);
                    }
                });
            } else {
                this._applyDevicePolicies2(message, deviceModelUrn, endpointId, currentTimeMillis,
                    deviceAnalog).then(messages =>
                {
                    resolve(messages);
                }).catch(error => {
                    console.log('Error applying device policies: ' + error);
                    reject();
                });
            }
        });
    }

    /**
     * @param {iotcs.message.Message} message
     * @param {string} deviceModelUrn
     * @param {string} endpointId
     * @param {number} currentTimeMillis
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Promise} (of iotcs.message.Message[])
     */
    _applyDevicePolicies2(message, deviceModelUrn, endpointId, currentTimeMillis, deviceAnalog) {
        return new Promise((resolve, reject) => {
            /** @type {iotcs.device.impl.DevicePolicyManager} */
            const devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(
                this._dcdImpl.getEndpointId());

            devicePolicyManager._getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                if (!devicePolicy) {
                    resolve([message]);
                    return;
                }

                /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                const pipeline = devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);

                // No policies for this device model, retain the data item.
                if (!pipeline || (pipeline.size === 0)) {
                    resolve([message]);
                    return;
                }

                // Create the pipeline data for this device model
                /** @type {Set<Map<string, object>>} */
                let pipelineData = this._pipelineDataCache.get(null);

                if (!pipelineData) {
                    pipelineData = new Set();
                    this._pipelineDataCache.set(null, pipelineData);
                }

                /** @type {iotcs.device.impl.DevicePolicyFunction[]} */
                let pipelineAry = Array.from(pipeline);
                let pipelineDataAry = Array.from(pipelineData);

                // Handle pipeline for device policy
                for (let index = 0, maxIndex = pipeline.size; index < maxIndex; index++) {
                    /** @type {iotcs.device.impl.DevicePolicyFunction} */
                    const devicePolicyFunction = pipelineAry[index];
                    /** @type {Map<string, object>} */
                    let functionData;

                    if (index < pipelineData.size) {
                        functionData = pipelineDataAry[index];
                    } else {
                        functionData = new Map();
                        pipelineData.add(functionData);
                    }

                    /** @type {string} */
                    const key = devicePolicyFunction._getId();
                    /** @type {Map<string, object>} */
                    const parameters = devicePolicyFunction._getParameters();
                    /** @type {iotcs.device.impl.DeviceFunction} */
                    const deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(key);

                    if (!deviceFunction) {
                        continue;
                    }

                    /** @type {boolean} */
                    let windowExpired;
                    /** @type {number} */
                    const window = iotcs.device.impl.DeviceFunction._getWindow(parameters);
                    iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyDevicePolicies2 window = ' + window);

                    if (window > 0) {
                        /** @type {string} */
                        const k = deviceModelUrn.concat("::".concat(deviceFunction._getId()));
                        /** @type {number} */
                        let t0 = iotcs.device.impl.MessagingPolicyImpl._windowMap.get(k);

                        if (!t0) {
                            t0 = currentTimeMillis;
                            iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, t0);
                        }

                        windowExpired = (t0 + window) <= currentTimeMillis;

                        if (windowExpired) {
                            iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, currentTimeMillis);
                        }
                    } else {
                        windowExpired = false;
                    }

                    /** @type {boolean} */
                    let alertOverridesPolicy;

                    if (message instanceof iotcs.message.Message &&
                        message._properties.type === iotcs.message.Message.Type.ALERT)
                    {
                        /** @type {iotcs.message.Message.AlertMessage} */
                        const alertMessage = message;
                        /** @type {iotcs.message.Message.AlertMessage.Severity} */
                        const alertMessageSeverity = alertMessage.payload.severity;
                        /** @type {iotcs.message.Message.AlertMessage.Severity} */
                        let configuredSeverity = iotcs.message.Message.AlertMessage.Severity.CRITICAL;
                        /** @type {string} */
                        const criterion = parameters.get("alertSeverity");

                        if (criterion) {
                            try {
                                configuredSeverity = criterion;
                            } catch (e) {
                                configuredSeverity =
                                    iotcs.message.Message.AlertMessage.Severity.CRITICAL;
                            }
                        }

                        // TODO: Fix this compareTo
                        alertOverridesPolicy = configuredSeverity.compareTo(alertMessageSeverity) <= 0;
                    } else {
                        alertOverridesPolicy = false;
                    }

                    if (deviceFunction._apply(deviceAnalog, null, parameters, functionData, message)
                        || windowExpired || alertOverridesPolicy) {
                        /** @type {object} */
                        const valueFromPolicy = deviceFunction._get(
                            deviceAnalog,
                            null,
                            parameters,
                            functionData
                        );

                        if (valueFromPolicy) {
                            /** @type {iotcs.message.Message[]} */
                            resolve(Array.from(valueFromPolicy));
                            return;
                        }
                    }

                    resolve([]);
                    return;
                }

                resolve([]);
            }).catch(error => {
                console.log('Error getting device policy. error=' + error);
                reject();
            });
        });
    }

    /**
     * This is the method that applies whatever policies there may be to the message. The
     * method returns zero or more messages, depending on the policies that have been
     * applied to the message. The caller is responsible for sending or queuing the
     * returned messages. The data items in the returned are messages are possibly modified
     * by some policy; for example, a message with a temperature value goes in, a copy of
     * the same message is returned with the temperature value replaced by the
     * average temperature. A returned message may also be one that is created by a
     * policy function (such as a computedMetric). Or the returned messages may be messages
     * that have been batched. If no policy applies to the message, the message itself
     * is returned.
     *
     * @param {iotcs.device.util.DirectlyConnectedDevice} dcd
     * @param {iotcs.message.Message} message a message of any kind.
     * @return {Promise} a Promise which will resolve with a {iotcs.message.Message[]} of {@link iotcs.message.Message}s to be
     *         delivered.
     */
    _applyPolicies(message) {
        return new Promise((resolve, reject) => {
            if (!message) {
                resolve(new iotcs.message.Message([]));
                return;
            }

            let currentTimeMillis = new Date().getTime();

            if (message._properties.type === iotcs.message.Message.Type.DATA) {
                this._applyAttributePolicies(message, currentTimeMillis).then(dataMessage => {
                    // Changes from here to the resolve method must also be made in the else
                    // statement below.
                    /** @type {Set<iotcs.message.Message>} */
                    const messageList = new Set();

                    if (this._messagesFromExpiredPolicies.size > 0) {
                        this._messagesFromExpiredPolicies.forEach(v => messageList.add(v));
                        this._messagesFromExpiredPolicies.clear();
                    }

                    if (dataMessage) {
                        this._applyDevicePolicies(dataMessage, currentTimeMillis).then(
                            messagesFromDevicePolicy =>
                       {
                            messagesFromDevicePolicy.forEach(v => messageList.add(v));
                            resolve(Array.from(messageList));
                        }).catch(error => {
                            console.log('Error applying device policies: ' + error);
                            reject();
                        });
                    }
                }).catch(error => {
                    console.log('Error applying attribute policies: ' + error);
                    reject();
                });
            } else {
                // Changes from here to the resolve method must also be made in the if
                // statement above.
                /** @type {Set<iotcs.message.Message>} */
                const messageList = new Set();

                if (this._messagesFromExpiredPolicies.size > 0) {
                    this._messagesFromExpiredPolicies.forEach(v => messageList.add(v));
                    this._messagesFromExpiredPolicies.clear();
                }

                /** @type {iotcs.message.Message[]} */
                this._applyDevicePolicies(message, currentTimeMillis).then(
                    messagesFromDevicePolicy =>
                {
                    resolve(messageList);
                }).catch(error => {
                    console.log('Error applying device policies: ' + error);
                    reject();
                });
            }
        }).catch(error => {
            console.log('Error applying policies: ' + error);
        });
    }

    //      * @return {Promise} which resolves to void.
    /**
     * @param {Set<DataItem<?>>} dataItems
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {Map<string, Set<string>>} triggerMap
     * @param {number} currentTimeMillis
     */
    _checkComputedMetrics(dataItems, deviceAnalog, triggerMap, currentTimeMillis) {
        iotcs.impl.Platform._debug('checkComputeMetrics called.');
        // TODO: This function should return a Promise and call devicePolicyManager.getPolicy.
        // return new Promise((resolve, reject) => {
            if (triggerMap.size === 0 || dataItems.size === 0) {
                // resolve();
                return;
            }

            /** @type {Set<string>} */
            let updatedAttributes = new Set();

            dataItems.forEach((value, key) => {
                updatedAttributes.add(key);
            });

            let endpointId = deviceAnalog._getEndpointId();
            let deviceModel = deviceAnalog._getDeviceModel();
            /** @type {Map<string, iotcs.impl.DeviceModelAttribute>} */
            let deviceModelAttributes = deviceModel.getDeviceModelAttributes();
            let deviceModelUrn = deviceModel.getUrn();

            /** @type {<string, Set<string>>}  */
            // Map from  attributeName -> triggerAttributes.
            // triggerAttributes is the set of attributes that the formula refers to.
            triggerMap.forEach((triggerAttributes, attributeName) => {
                let updatedAttributesAry = Array.from(updatedAttributes);
                let triggerAttributesAry = Array.from(triggerAttributes);
                // If the set of attributes that the formula refers to is a subset of the updated attributes, then compute
                // the value of the computedMetric.
                //if (updatedAttributes.containsAll(attributeName)) {
                if (updatedAttributesAry.some(r => r.size === triggerAttributesAry.length &&
                        r.every((value, index) => triggerAttributesAry[index] === value)))
                {
                    let deviceModelAttribute = deviceModelAttributes._get(attributeName);
                    let attributeValue = deviceAnalog._getAttributeValue(attributeName);

                    if (!attributeValue) {
                        attributeValue = deviceModelAttribute.defaultValue;
                    }

                    /** @type {DataItem} */
                    let dataItem;

                    switch (deviceModelAttribute.type) {
                        // TODO: We don't need all of these types in JavaScript.
                        case 'BOOLEAN':
                        case 'NUMBER':
                        case 'STRING':
                        case 'URI': {
                            let dataItem = new iotcs.device.DataItem(attribute, value);
                            break;
                        }
                        case 'DATETIME': {
                            let value;

                            if (typeof attributeValue === 'date') {
                                value = attributeValue.getTime();
                            } else {
                                value = attributeValue ? attributeValue : 0;
                            }

                            dataItem = new iotcs.device.DataItem(attribute, value);
                            break;
                        }
                        default:
                            console.log('Unknown device model attribute type: ' +
                                deviceModelAttribute.type);

                            return; // continue
                    }

                    let devicePolicyManager =
                        iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this._dcdImpl.getEndpointId());

                    // This asynchronous call should be used instead of
                    // devicePolicyManager.getPolicy2 below.
                    //
                    // devicePolicyManager.getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                    //     if (!devicePolicy) {
                    //         return // continue
                    //     }
                    //
                    //     /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                    //     let pipeline = devicePolicy.getPipeline(attribute);
                    //
                    //     if (!pipeline || pipeline.size === 0) {
                    //         return // continue
                    //     }
                    //
                    //     /** @type {DataItem} */
                    //     let policyDataItem = this._applyAttributePolicy(deviceAnalog, dataItem,
                    //         pipeline, currentTimeMillis);
                    //
                    //     if (policyDataItem) {
                    //         dataItems.add(policyDataItem);
                    //     }
                    //
                    //     resolve();
                    // }).catch(error => {
                    //     console.log('Error getting device policy: ' + error);
                    //     reject();
                    // });

                    let devicePolicy = devicePolicyManager._getPolicy(deviceModelUrn, endpointId);

                    if (!devicePolicy) {
                        return; // continue
                    }

                    /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                    let pipeline = devicePolicy._getPipeline(attribute);

                    if (!pipeline || pipeline.size === 0) {
                        return; // continue
                    }

                    /** @type {DataItem} */
                    let policyDataItem = this._applyAttributePolicy(deviceAnalog, dataItem,
                        pipeline, currentTimeMillis);

                    iotcs.impl.Platform._debug('checkComputedMetrics policyDataItem = ' + policyDataItem);

                    if (policyDataItem) {
                        dataItems.add(policyDataItem);
                    }

                    // resolve();
                }
            });
        // });
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy1(devicePolicy) {
        /** @type {Set<iotcs.message.Message>} */
        const messageList = new Set();

        this._deviceAnalogMap.forEach(deviceAnalog => {
            /** @type {Set<iotcs.message.Message>} */
            const messages = this._expirePolicy3(devicePolicy, deviceAnalog);

            if (messages && (messages.size > 0)) {
                messages.forEach(message => {
                    messageList.add(message);
               });
            }
        });

        return messageList;
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {number} currentTimeMillis
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy2(devicePolicy, currentTimeMillis) {
        /** @type {Set<iotcs.message.Message>} */
        const messageList = this._expirePolicy1(devicePolicy);
        /** @type {Set<iotcs.message.Message>} */
        const consolidatedMessageList = new Set();

        if (messageList.size > 0) {
            // Consolidate messages.
            /** @type {Map<string, Set<DataItem>>} */
            const dataItemMap = new Map();

            messageList.forEach(message => {
                if (message.type === iotcs.message.Message.Type.DATA) {
                    /** @type {string} */
                    const endpointId = message.getSource();
                    /** @type {Set<DataItem>} */
                    let dataItems = dataItemMap.get(endpointId);

                    if (!dataItems) {
                        dataItems = new Set();
                        dataItemMap.set(endpointId, dataItems);
                    }

                    message.getDataItems.forEach(dataItem => {
                        dataItems.add(dataItem);
                    });
                } else {
                    consolidatedMessageList.add(message);
                }
            });

            dataItemMap.forEach((value, key) => {
                /** @type {iotcs.device.impl.DeviceAnalog} */
                const deviceAnalog = this._deviceAnalogMap.get(key);

                if (!deviceAnalog) {
                    return; // continue
                }

                /** @type {Set<DataItem>} */
                const dataItems = entry.getValue();
                /** @type {string} */
                const format = deviceAnalog._getDeviceModel()._getUrn();

                if (this._computedMetricTriggers.size > 0) {
                    /** @type {Map<string, Set<string>>} */
                    let triggerMap = this._computedMetricTriggers.get(format);

                    if (triggerMap && triggerMap.size > 0) {
                        try {
                            this._checkComputedMetrics(dataItems, deviceAnalog, triggerMap,
                                currentTimeMillis);
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }

                let message = new iotcs.message.Message();

                message
                    .type(iotcs.message.Message.Type.DATA)
                    .source(deviceAnalog._getEndpointId())
                    .format(deviceAnalog._getDeviceModel().getUrn());

                    dataItems.forEach(dataItem => {
                        message.dataItem(dataItem.getKey(), dataItem.getValue());
                    });

                consolidatedMessageList.add(message);
            });
        }

        return consolidatedMessageList;
    }


    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy3(devicePolicy, deviceAnalog) {
        /** @type {Set<Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>>} */
        const entries = devicePolicy._getPipelines();
        /** @type {Set<iotcs.message.Message>} */
        const messageList = new Set();

        entries.forEach((v, k) => {
            /** @type {Set<iotcs.message.Message>} */
            const messages = this._expirePolicy4(k, v, deviceAnalog);

            if (messages) {
                messages.forEach(message => {
                    messageList.add(message);
                });
            }
        });

        return messageList;
    }

    /**
     * @param {string} attributeName
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy4(attributeName, pipeline, deviceAnalog) {
        if (!pipeline || pipeline.size === 0) {
            return null;
        }

        // attributeName may be null.
        // Note that we are _removing_ the pipeline data cache for this attribute (which may be
        // null).
        /** @type {Set<Map<string, object>>} */
        const pipelineData = this._pipelineDataCache.get(attributeName);
        this._pipelineDataCache.delete(attributeName);

        if (!pipelineData) {
            return null;
        }

        /** @type {iotcs.device.impl.DevicePolicyFunction[]} */
        let pipelineAry = Array.from(pipeline);
        /** @type {Map<string, object>[]} */
        let pipelineDataAry = Array.from(pipelineData);

        for (let index = 0, maxIndex = pipelineAry.length; index < maxIndex; index++) {
            /** @type {DevicePipelineFunction} */
            let devicePolicyFunction = pipelineAry[index];

            if (!devicePolicyFunction) {
                continue;
            }

            /** @type {iotcs.device.impl.DeviceFunction} */
            let deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(devicePolicyFunction._getId());

            if (!deviceFunction) {
                return null;
            }

            // Looking for the first policy function in the pipeline that has a "window".
            // If there isn't one, we'll drop out of the loop and return null.
            // If there is one, we process the remaining pipeline from there.
            /** @type {number} */
            const window = iotcs.device.impl.DeviceFunction._getWindow(devicePolicyFunction._getParameters());

            if (window === -1) {
                continue;
            }

            /** @type {Map<string, object>} */
            let functionData = index < pipelineDataAry.length ? pipelineDataAry[index] : null;

            if (!functionData) {
                // There is no data for this function, so return.
                return null;
            }

            /** @type {object} */
            let valueFromPolicy = deviceFunction._get(deviceAnalog, attributeName,
                devicePolicyFunction._getParameters(), functionData);

            if (!valueFromPolicy) {
                return null;
            }

            for (let next = index + 1; next < maxIndex; next++) {
                devicePolicyFunction = pipelineAry[next];

                if (!deviceFunction) {
                    return null;
                }

                deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(devicePolicyFunction._getId());

                if (!deviceFunction) {
                    return null;
                }

                functionData = next < pipelineDataAry.length ? pipelineDataAry[next] : null;

                if (deviceFunction._apply(deviceAnalog, attributeName,
                        devicePolicyFunction._getParameters(), functionData, valueFromPolicy))
                {
                    valueFromPolicy = deviceFunction._get(
                        deviceAnalog,
                        attributeName,
                        devicePolicyFunction._getParameters(),
                        functionData
                    );

                    if (!valueFromPolicy) {
                        return null;
                    }
                } else {
                    return null;
                }

            }

            // If we get here, valueFromPolicy is not null.
            if (valueFromPolicy instanceof Set) {
                return valueFromPolicy;
            }

            /** @type {iotcs.device.impl.DeviceModel} */
            const deviceModel = deviceAnalog._getDeviceModel();
            const message = new iotcs.message.Message();

            message
                .source(deviceAnalog._getEndpointId())
                .format(deviceModel.getUrn())
                .dataItem(attributeName, valueFromPolicy);

            /** @type {Set<iotcs.message.Message>} */
            let messages = new Set();
            messages.add(message);

            return messages;
        }

        return null;
    }

    /**
     * Get the DeviceModel for the device model URN. This method may return {@code null} if there is no device model for
     * the URN. {@code null} may also be returned if the device model is a &quot;draft&quot; and the property
     * {@code com.oracle.iot.client.device.allow_draft_device_models} is set to {@code false}, which is the default.
     *
     * @param {string} deviceModelUrn the URN of the device model.
     * @return {iotcs.device.impl.DeviceModel} a representation of the device model or {@code null} if it does not exist.
     */
    _getDeviceModel(deviceModelUrn) {
        /**
         * The high level DirectlyConnectedDevice class has no trusted
         * assets manager and this class gives no access to the one it has,
         * so this method is here.
         * TODO: Find a high level class for this method
         */
        // DJM: Where are secureConnection and deviceModel defined?
        return iotcs.device.impl.DeviceModelFactory._getDeviceModel(secureConnection, deviceModel);
    }


    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {Set<string>} assignedDevices
     */
    _policyAssigned(devicePolicy, assignedDevices) {
        // Do nothing.
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {Set<string>} unassignedDevices
     */
    _policyUnassigned(devicePolicy, unassignedDevices) {
        /** @type {number} */
        const currentTimeMillis = new Date().getTime();
        /** @type {Set<iotcs.message.Message>} */
        const messages = this._expirePolicy2(devicePolicy, currentTimeMillis);

        if (messages && messages.size > 0) {
            messages.forEach(message => {
                this.messagesFromExpiredPolicies.add(message);
            });
        }

        unassignedDevices.forEach(unassignedDevice => {
            let devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(unassignedDevice);

            if (devicePolicyManager) {
                devicePolicyManager._removePolicy(devicePolicy._deviceModelUrn,
                                                  devicePolicy._getId(), unassignedDevice);
            }
        });

        // TODO:  Need to figure out how to handle accumulated values.
        //        For now, just clear out the various maps, which
        //        effectively means "start from scratch"
        this._deviceAnalogMap.clear();
        this._pipelineDataCache.clear();
        this._computedMetricTriggers.clear();
        iotcs.device.impl.MessagingPolicyImpl._windowMap.clear();
    }
};

/**
 * deviceModelUrn:attribute:deviceFunctionId -> start time of last window For a window policy, this maps the
 * policy target plus the function to when the window started. When the attribute for a timed function is in
 * the message, we can compare this start time to the elapsed time to determine if the window has expired. If
 * the window has expired, the value computed by the function is passed to the remaining functions in the
 * pipeline.
 *
 * @type {Map<string, number>}
 */
iotcs.device.impl.MessagingPolicyImpl.windowMap = new Map();

