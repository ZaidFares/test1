/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Detailed information on a device model. A device model is a specification
 * of the attributes, formats, and resources available on the device.
 *
 * @classdesc
 */
iotcs.impl.DeviceModel = class {
    /**
     * Constructs a DeviceModel.
     *
     * @param {string} urn - The device model's URN.
     * @param {string} name - The name of the device model.
     * @param {string} description - The device model's description.
     * @param {DeviceModelAttribute[]} deviceModelAttributes - An array of attribute's for this
     *        device model.
     * @param {DeviceModelAction[]} deviceModelActions - An array of actions's for this device
     *        model.
     * @param {DeviceModelFormat[]} deviceModelFormats - An array of attribute's for this device
     *        model.
     *
     * @class
     */
    constructor(urn,
                name,
                description,
                deviceModelAttributes,
                deviceModelActions,
                deviceModelFormats)
    {
        /**
         * The URN of the device model.
         *
         * @type {string}
         */
        this._urn = urn;
        /**
         * The device model's name.
         *
         * @type {string}
         */
        this._name = name;
        /**
         * The device model's description.
         *
         * @type {string}
         */
        this._description = description;

        /**
         * Map of attribute names to DeviceModelAttribute's.
         * @type {Map<string, iotcs.impl.DeviceModelAttribute>}
         */
        this._deviceModelAttributes = new Map();
        /**
         * Map of action names to DeviceModelAction's.
         * @type {Map<string, iotcs.impl.DeviceModelAction>}
         */
        this._deviceModelActions = new Map();
        /**
         * Map of format names to DeviceModelFormat's.
         * @type Map<string, iotcs.impl.DeviceModelFormat>}
         */
        this._deviceModelFormats = new Map();

        if (deviceModelAttributes) {
            deviceModelAttributes.forEach(deviceModelAttribute => {
                let attributeName = deviceModelAttribute._name;

                if (!this._deviceModelAttributes.get(attributeName)) {
                    this._deviceModelAttributes.set(attributeName, deviceModelAttribute);
                }
            });
        }

        if (deviceModelActions) {
            for (let i = 0; i < deviceModelActions.length; i++) {
                let actName = deviceModelActions[i]._name;

                if (this._deviceModelActions.get(actName) == null) {
                    let deviceModelAction = new iotcs.impl.DeviceModelAction(actName,
                        deviceModelActions[i]._description, deviceModelActions[i]._args,
                        deviceModelActions[i]._alias);

                    this._deviceModelActions.set(actName, deviceModelAction);
                }
            }
        }

        if (deviceModelFormats) {
            for (let i = 0; i < deviceModelFormats.length; i++) {
                let formatUrn = deviceModelFormats[i]._urn;

                if (!this._deviceModelFormats.get(formatUrn)) {
                    let fields = [];

                    if (deviceModelFormats[i].value &&
                        deviceModelFormats[i].value.fields &&
                        deviceModelFormats[i].value.fields.length > 0)
                    {
                        let fs = deviceModelFormats[i].value.fields;

                        fs.forEach(v => {
                            fields.push(new iotcs.impl.DeviceModelFormatField(v._name,
                                v._description, v._type, v._optional));
                        });
                    }

                    let deviceModelFormat = new iotcs.impl.DeviceModelFormat(
                        deviceModelFormats[i]._urn, deviceModelFormats[i]._name,
                        deviceModelFormats[i]._description, deviceModelFormats[i]._type, fields);

                    this._deviceModelFormats.set(formatUrn, deviceModelFormat);
                }
            }
        }
    }

    /**
     * Returns the actions for this device model.
     *
     * @return {Map<string, iotcs.impl.DeviceModelAction>} the actions for this device model.
     */
    _getDeviceModelActions() {
        return this._deviceModelActions;
    }

    /**
     * Returns the attributes for this device model.
     *
     * @return {Map<string, iotcs.impl.DeviceModelAttribute>} the attributes for this device model.
     */
    _getDeviceModelAttributes() {
        return this._deviceModelAttributes;
    }

    /**
     * @return {Map<string, iotcs.impl.DeviceModelFormat>}
     */
    _getDeviceModelFormats() {
        return this._deviceModelFormats;
    }

    /**
     * Returns the device model's description.
     *
     * @return {string} the device model's description.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Returns the device model's name.
     *
     * @return {string} the device model's name.
     */
    _getName() {
        return this._name;
    }

    /**
     * Returns the device model's URN.
     *
     * @return {string} the device model's URN.
     */
    _getUrn() {
        return this._urn;
    }

    /**
     * Returns a string representation of this device model.
     *
     * @return {string}
     */
    _toString() {
        // let StringBuilder = require('stringbuilder');
        // let firstItem = true;
        // let b = new StringBuilder("urn = ");
        // b.append("\t");
        // b.append(urn);
        // b.append(",\n\tname = ");
        // b.append(name);
        // b.append(",\n\tdescription = ");
        // b.append(description);
        // b.append(",\n\tattributes = [");
        //
        // for (let attribute of this._deviceModelAttributes.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(attribute);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("],\n\tactions = [");
        // firstItem = true;
        //
        // for (let action of this._deviceModelActions.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(action);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("],\n\tformats = [");
        // firstItem = true;
        //
        // for (let format of this._deviceModelFormats.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(format);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("]");
        // return b.toString();
        return '';
     }
};

