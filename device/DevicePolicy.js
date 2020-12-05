/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Detailed information on a device policy.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DevicePolicy = class {
    /**
     * Converts a JSON representation of a device policy to a DevicePolicy object.
     *
     * @param {string} deviceModelUrn
     * @param {string} devicePolicyJson
     * @return {DevicePolicy} a device policy from a JSON representation of a device policy.
     */
    static _fromJson(deviceModelUrn, devicePolicyJson) {
        // This *should* be a JSON representation of a device policy, but it might also be an array
        // of items of device policies.
        let devicePolicyJsonTmp = JSON.parse(devicePolicyJson);
        let devicePolicyJsonObj;

        if (devicePolicyJsonTmp && devicePolicyJsonTmp.items && (devicePolicyJsonTmp.count > 0)) {
            devicePolicyJsonObj = devicePolicyJsonTmp.items[0];
        } else if (devicePolicyJsonTmp && devicePolicyJsonTmp.pipelines) {
            devicePolicyJsonObj = devicePolicyJsonTmp;
        } else {
            return null;
        }

        /** @type {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} */
        let pipelines = new Map();
        let pipelinesAry = devicePolicyJsonObj.pipelines;

        for (let i = 0; i < devicePolicyJsonObj.pipelines.length; i++) {
            /** @type {string} */
            let attributeName = devicePolicyJsonObj.pipelines[i].attributeName;
            /** @type {pipeline[]} */
            let pipelineAry = devicePolicyJsonObj.pipelines[i].pipeline;
            /** @type {Set<iotcs.device.impl.DevicePolicyFunction>} */
            let functions = new Set();

            for (let j = 0; j < pipelineAry.length; j++) {
                let functionObj = pipelineAry[j];
                /** @type {string} */
                let functionId = functionObj.id;
                /** @type {Map<string, object>} */
                let parameterMap = new Map();
                let parameters = functionObj.parameters;

                for (let parameterName of Object.keys(parameters)) {
                    let parameterValue = parameters[parameterName];

                    if ("action" === parameterName) {
                        parameterMap.set("name", parameterValue.name);
                        let args = parameterValue.arguments;

                        if (args && args.length > 0) {
                            /** @type {Set<object>} */
                            let argumentList = new Set();

                            for (let a = 0; a < args.length; a++) {
                                /** @type {object} */
                                let argTmp = args[a];
                                argumentList.add(argTmp);
                            }

                            parameterMap.set("arguments", argumentList);
                        }
                    } else if ("alert" === parameterName) {
                        let urn = parameterValue.urn;
                        parameterMap.set("urn", urn);
                        let fields = parameterValue.fields;
                        /** @type {Map<string, object>} */
                        let fieldMap = new Map();

                        for (let fieldName of Object.keys(fields)) {
                            let fieldValue = fields[fieldName];
                            fieldMap.set(fieldName, fieldValue);
                        }

                        parameterMap.set("fields", fieldMap);

                        if (parameterValue.severity) {
                            parameterMap.set("severity", parameterValue.severity);
                        }
                    } else {
                        parameterMap.set(parameterName, parameterValue);
                    }
                }

                functions.add(new iotcs.device.impl.DevicePolicyFunction(functionId,
                                                                                   parameterMap));
            }

            pipelines.set(attributeName, functions);
        }

        return new iotcs.device.impl.DevicePolicy(devicePolicyJsonObj.id, deviceModelUrn,
            devicePolicyJsonObj.description, pipelines, devicePolicyJsonObj.enabled,
            devicePolicyJsonObj.lastModified);
    }

    /**
     * Constructs a DevicePolicy.
     *
     * @param {string} id - The device policy ID.
     * @param {string} deviceModelUrn - The device model URN.
     * @param {string} description - The description of the device policy.
     * @param {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} pipelines - The
     *        functions of this policy.
     * @param {boolean} enabled - <code>true</code> if this device policy is enabled.
     * @param {Date} lastModified - The date/time the policy was last modified.
     */
    constructor(id, deviceModelUrn, description, pipelines, enabled, lastModified) {
        this._id = id;
        this._deviceModelUrn = deviceModelUrn;
        this._description = description;
        this._pipelines = pipelines;
        this._enabled = enabled;
        this._lastModified = lastModified;
    }

    /**
     * Get the free form description of the device policy.
     *
     * @return {string} the description of the model.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Get the target device model URN.
     *
     * @return {string} the URN of the target device model
     */
    _getDeviceModelUrn() {
        return this._deviceModelUrn;
    }

    /**
     * Returns the policy ID.
     *
     * @return {string} the policy ID.
     */
    _getId() {
        return this._id;
    }

    /**
     * Get the date of last modification.
     *
     * @return {number} the date of last modification.
     */
    _getLastModified() {
        return this._lastModified;
    }

    /**
     * Get the function pipeline of this policy for an attribute.
     *
     * @param {string} attributeName the name of the attribute to retrieve the pipeline for.
     * @return {Set} a read-only Set of {@link DevicePolicyFunction}.
     */
    _getPipeline(attributeName) {
        if (attributeName) {
            return this._pipelines.get(attributeName);
        } else {
            return this._pipelines.get(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);
        }
    }

    /**
     * Get all the pipelines of this policy. The map key is an attribute name, the value is the
     * pipeline for that attribute.
     *
     * @return {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} the pipelines of
     *         this policy.
     */
    _getPipelines() {
        return this._pipelines;
    }

    /**
     * Get the {@code enabled} state of the device policy.
     *
     * @return {boolean} {@code true} if the policy is enabled.
     */
    _isEnabled() {
        return this._enabled;
    }
};

iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES = '*';
