/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const messageTypes = {
    'REGISTER': 'Register',
    'ERROR_MESSAGE': 'Error',
    'DISCONNECT': 'disconnect',
    'DISCOVERED': 'Discovered',
    'CONNECT_DEVICE': 'ConnectDevice',
    'DISCONNECT_DEVICE': 'DisconnectDevice',
    'DEVICE_CONNECTED': 'DeviceConnected',
    'DEVICE_DISCONNECTED': 'DeviceDisconnected',
    'DEVICE_STATUS': 'DeviceStatus',
    'DEVICE_DATA': 'DeviceData',
    'DEVICE_ACTION': 'DeviceAction',
    'HEART_BEAT': 'HeartBeat',
    'DEVICE_OUT_OF_RANGE': 'DeviceOutOfRange',
    'UPDATE_SETTINGS': 'UpdateSettings',
    'CLIENT_RESTART': 'ClientRestart',
    'CLIENT_REBOOT': 'ClientReboot',
    'CLIENT_POWEROFF': 'ClientPowerOff',
    'UPDATE_NODE_CONFIG': 'UpdateNodeConfig'
};

module.exports.MessageTypes = messageTypes;

module.exports.IdentityMessage = class IdentityMessage {
    constructor(nodeId) {
        this.type = messageTypes.IDENTITY_MESSAGE;
        this.nodeId = nodeId;
        this.configData = null;
    }
};

module.exports.ErrorMessage = class ErrorMessage {
    constructor(errorText, errorDesc, errorObj) {
        this.type = messageTypes.ERROR_MESSAGE;
        this.errorText = errorText;
        this.description = errorDesc;
        this.error = errorObj;
    }
};

module.exports.DiscoveredDeviceMessage = class DiscoveredDeviceMessage {
    constructor() {
        this.type = messageTypes.DISCOVERED;
        this.deviceAddress = '';
        this.distance = 0;
        this.timeStamp = '';
    }
};

module.exports.DeviceOutOfRange = class DeviceOutOfRange {
    constructor() {
        this.type = messageTypes.DEVICE_OUT_OF_RANGE;
        this.deviceAddress = '';
        this.timeStamp = '';
    }
};

module.exports.DeviceConnectionMessage = class DeviceConnectionMessage {
    constructor(connect, deviceAddress) {
        this.type = connect === true ? messageTypes.CONNECT_DEVICE : messageTypes.DISCONNECT_DEVICE;
        this.deviceAddress = deviceAddress;
    }
};

module.exports.DeviceConnectedMessage = class DeviceConnectedMessage {
    constructor(deviceAddress, timeStamp) {
        this.type = messageTypes.DEVICE_CONNECTED;
        this.deviceAddress = deviceAddress;
        this.timeStamp = timeStamp;
    }
};

module.exports.DeviceStatusMessage = class DeviceStatusMessage {
    constructor(deviceAddress, timeStamp, distance) {
        this.type = messageTypes.DEVICE_STATUS;
        this.deviceAddress = deviceAddress;
        this.timeStamp = timeStamp;
        this.distance = distance;
    }
};

module.exports.DeviceDataMessage = class DeviceDataMessage {
    constructor(deviceAddress) {
        this.type = messageTypes.DEVICE_DATA;
        this.deviceAddress = deviceAddress;
        this.attributes = [];
    }

    addAttribute(name, value) {
        this.attributes.push({
            attrName: name,
            attrValue: value
        });
    }
};

module.exports.DeviceActionMessage = class DeviceActionMessage {
    constructor(deviceAddress, action) {
        this.type = messageTypes.DEVICE_ACTION;
        this.action = action;
    }
};
