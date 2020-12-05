/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * Enumeration of the standard properties that can be used in the metadata object given as parameter
 * on indirect registration.
 *
 * @alias DeviceMetadata
 * @class
 * @enum {string}
 * @memberOf iotcs.device.GatewayDevice
 * @readonly
 * @see {@link iotcs.device.GatewayDevice#registerDevice}
 * @static
 */
iotcs.device.GatewayDevice.DeviceMetadata = {
    MANUFACTURER: "manufacturer",
    MODEL_NUMBER: "modelNumber",
    SERIAL_NUMBER: "serialNumber",
    DEVICE_CLASS: "deviceClass",
    PROTOCOL: "protocol",
    PROTOCOL_DEVICE_CLASS: "protocolDeviceClass",
    PROTOCOL_DEVICE_ID: "protocolDeviceId",
};

Object.freeze(iotcs.device.GatewayDevice.DeviceMetadata);
