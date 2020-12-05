/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Parser for device models.
 *
 * @classdesc
 * @ignore
 * @private
 */
iotcs.impl.DeviceModelParser = class {
    // Static private functions
    /**
     * Returns a DeviceModel from a JSON string or object representation of a Device model.
     *
     * @param {(string|object)} deviceModelJson a device model as a JSON string or object.
     * @returns {(iotcs.impl.DeviceModel|null)} The DeviceModel, or <code>null</code>.
     */
    static _fromJson(deviceModelJson) {
        if (!deviceModelJson) {
            return null;
        }

        let deviceModelJsonObj;

        // Is this a device model JSON string or object?  We need an object.
        if (deviceModelJson.hasOwnProperty('urn')) {
            deviceModelJsonObj = deviceModelJson;
        } else {
            deviceModelJsonObj = JSON.parse(deviceModelJson);
        }

        iotcs.impl.DeviceModelParser._printDeviceActions(deviceModelJsonObj.actions);
        iotcs.impl.DeviceModelParser._printDeviceAttributes(deviceModelJsonObj.attributes);
        iotcs.impl.DeviceModelParser._printDeviceFormats(deviceModelJsonObj.formats);
        let deviceModelActions = [];
        let deviceModelAttributes = [];
        let deviceModelFormats = [];

        if (deviceModelJsonObj.actions) {
            deviceModelJsonObj.actions.forEach(action => {
                /** @type {Array<iotcs.impl.DeviceModelActionArgument>} */
                let args = [];

                if (action['arguments']) {
                    let self = this;
                    // New multiple args.
                    for (let i = 0; i < action.arguments.length; i++) {
                        let arg = action.arguments[i];

                        /** @type {iotcs.impl.DeviceModelAttribute.Type} */
                        let type = iotcs.impl.DeviceModelAttribute._getType(arg.type);
                        let range = arg.range;

                        /** @type {number} */
                        let min = null;
                        /** @type {number} */
                        let max = null;

                        if (range) {
                            /** @type {Array<string>} */
                            const strings = range.split(",");
                            min = strings[0];
                            max = strings[1];
                        }

                        /** @type {iotcs.impl.DeviceModelActionArgument} */
                        args.push(new iotcs.impl.DeviceModelActionArgument(arg.name,
                            arg.description, type, min, max, arg.defaultValue));
                    }
                } else if (action.argType) {
                    // Legacy single argument.
                    args.push(new iotcs.impl.DeviceModelActionArgument('value', null, action.argType,
                        null, null, null));
                }

                deviceModelActions.push(new iotcs.impl.DeviceModelAction(action.name, action.description,
                    args, action.alias));
            });
        }

        if (deviceModelJsonObj.attributes) {
            deviceModelJsonObj.attributes.forEach(attribute => {
                deviceModelAttributes.push(new iotcs.impl.DeviceModelAttribute(deviceModelJson.urn,
                    attribute.name, attribute.description, attribute.type, attribute.lowerBound,
                    attribute.upperBound, attribute.access, attribute.alias,
                    attribute.defaultValue));
            });
        }

        if (deviceModelJsonObj.formats) {
            deviceModelJsonObj.formats.forEach(format => {
                let fields = [];

                if (format.fields) {
                    //format.value.fields?
                    format.fields.forEach(field => {
                        fields.push(new iotcs.impl.DeviceModelFormatField(field.name, field.description,
                            field.type, field.optional));
                    });
                }

                deviceModelFormats.push(new iotcs.impl.DeviceModelFormat(format.urn, format.name,
                    format.description, format.type, fields));
            });
        }

        return new iotcs.impl.DeviceModel(deviceModelJsonObj.urn, deviceModelJsonObj.name,
            deviceModelJsonObj.description, deviceModelAttributes,
            deviceModelActions, deviceModelFormats);
    }

    static _printDeviceActions(actionsJson) {
        if (actionsJson) {
            for (let i = 0; i < actionsJson.length; i++) {
                let action = actionsJson[i];
            }
        }
    }

    static _printDeviceAttributes(attributesJson) {
        if (attributesJson) {
            for (let i = 0; i < attributesJson.length; i++) {
                let attribute = attributesJson[i];
            }
        }
    }

    static _printDeviceFormats(formatsJson) {
        if (formatsJson) {
            for (let i = 0; i < formatsJson.length; i++) {
                let format = formatsJson[i];
            }
        }
    }
};

