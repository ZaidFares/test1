/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the legal
 * directory for license terms. You may choose either license, or both.
 *
 */

'use strict';

/* eslint no-sync: off,  init-declarations: 'off' */
const os = require('os');
const log4js = require('log4js');
const io = require('socket.io-client');

global.appRootDir = __dirname;

const { SettingsManager } = require('./modules/settings-manager');
const { BleScanner } = require('./modules/ble-scanner');
const { MessageTypes } = require('./modules/message-types');
const { IdentityMessage } = require('./modules/message-types');
const { DiscoveredDeviceMessage } = require('./modules/message-types');
const { DeviceOutOfRange } = require('./modules/message-types');
const { DeviceConnectedMessage } = require('./modules/message-types');
const { DeviceStatusMessage } = require('./modules/message-types');
const { ConfigDataManager } = require('./modules/configdata-manager');
const { RELEASE_VERSION } = require('./modules/common');

let settings = SettingsManager.settings;
log4js.configure('./config/logger.json', { reloadSecs: 300 });
const logger = log4js.getLogger('client');
logger.info(`Starting Connected Worker BLE Reader Node, Version ${RELEASE_VERSION}`);
let bleScanner = new BleScanner();
let watchInterval;
let configData = ConfigDataManager.configData;

// Read client config and local info
try {
    let interfaces = os.networkInterfaces();
    let wlan = interfaces.wlan0;
    if (wlan) {
        global.ipAddress = wlan.find((elem) => elem.family === 'IPv4');
        if (global.ipAddress === undefined) {
            throw new Error('Interface wlan0 not available.');
        }
    } else if (interfaces.usb0) {
        global.ipAddress = interfaces.usb0.find((elem) => elem.family === 'IPv4');
        if (global.ipAddress === undefined) {
            throw new Error('Interface usb0 not available.');
        }
    } else if (interfaces.eth0) {
        global.ipAddress = interfaces.eth0.find((elem) => elem.family === 'IPv4');
        if (global.ipAddress === undefined) {
            throw new Error('Interface eth0 not available.');
        }
    }


} catch (err) {
    logger.error(err);
    process.exit(1);
}

// Connect to the gateway
let socketURL = `http://${settings.server.host}:${settings.server.listenPort}/client`;
logger.info(`Connecting to ${socketURL}`);
let socket = io(socketURL);

let watchDevices = function () {
    logger.info(`Checking for devices at ${settings.client.watchLoopInterval} msecs interval`);
    return setInterval(() => {
        Object.keys(bleScanner.discoveredDevices).forEach((addr) => {
            if (bleScanner.discoveredDevices[addr].inRange) {
                logger.debug(`Device ${bleScanner.discoveredDevices[addr].address} in range`);
                //logger.debug(`Device distance = ${bleScanner.discoveredDevices[addr].distance} meters`);
                bleScanner.discoveredDevices[addr].outOfRangeMessageCount = 0;
                // If this device is already connected, just send and update message. If not send a 'Discovered' message
                if (bleScanner.discoveredDevices[addr].isConnected()) {
                    logger.debug(`Device distance = ${bleScanner.discoveredDevices[addr].distance} meters`);
                    logger.debug('Sending status update');
                    let message = new DeviceStatusMessage();
                    message.deviceAddress = addr;
                    message.distance = bleScanner.discoveredDevices[addr].distance;
                    message.timeStamp = bleScanner.discoveredDevices[addr].lastRssiAt;
                    message.data = bleScanner.discoveredDevices[addr].sensorData;
                    message.data.latitude = configData.lat;
                    message.data.longitude = configData.lon;
                    message.data.locationId = configData.location.id;
                    message.data.hazardous = configData.location.hazardous;
                    socket.emit(message.type, message);
                } else if (bleScanner.discoveredDevices[addr].isDisconnected()) {
                    logger.debug(`Device distance = ${bleScanner.discoveredDevices[addr].distance} meters`);
                    logger.debug(`Sending discovered message`);
                    let message = new DiscoveredDeviceMessage();
                    message.deviceAddress = addr;
                    message.distance = bleScanner.discoveredDevices[addr].distance;
                    message.timeStamp = bleScanner.discoveredDevices[addr].lastRssiAt;
                    socket.emit(message.type, message);
                }
            } else if (bleScanner.discoveredDevices[addr].outOfRangeMessageCount < settings.client.maxOutOfRangeMessages && bleScanner.discoveredDevices[addr].isConnected()) {
                // Limit the number of out-of-range messages to the server
                let message = new DeviceOutOfRange();
                message.deviceAddress = addr;
                message.timeStamp = bleScanner.discoveredDevices[addr].lastRssiAt;
                socket.emit(message.type, message);
                logger.info(`Device ${bleScanner.discoveredDevices[addr].address} out of range, `);
                bleScanner.discoveredDevices[addr].outOfRangeMessageCount += 1;
            }
        });
    }, settings.client.watchLoopInterval);
};

let cleanUp = function () {
    logger.info('Cleaning up...');
    Object.keys(bleScanner.discoveredDevices).forEach((addr) => {
        bleScanner.discoveredDevices[addr].destroy();
        delete bleScanner.discoveredDevices[addr];
    });
    bleScanner.stop();
};

// Register Event handlers
socket.on('connect', () => {
    logger.info('Connected');
    logger.info(`Registering with gateway using id =  ${configData.id}`);
    let identity = new IdentityMessage(configData.id);
    identity.configData = configData;
    identity.type = MessageTypes.REGISTER;
    identity.ipAddress = global.ipAddress;
    socket.emit(MessageTypes.REGISTER, identity);
    // Start BLE scanning
    bleScanner.scan();
    watchInterval = watchDevices();
});

socket.on('reconnect', () => {
    logger.info(`Reconnected to ${socketURL}`);
    // Start BLE scanning
    bleScanner.scan();
    watchInterval = watchDevices();
});


socket.on(MessageTypes.DISCONNECT, () => {
    logger.info('Got disconnect message, disconnecting...');
    socket.close();
    // For now exit, should stay connected on socket but stop polling from BLE
    cleanUp();

    if (watchInterval !== undefined) {
        clearInterval(watchInterval);
    }
    // Reconnect
    //logger.info('Waiting to reconnect...');
    //socket.open();

    // Having issues reconnecting, for now exit and let the shell script restart this
    process.exit(10);
});

socket.on(MessageTypes.ERROR_MESSAGE, (errMesg) => {
    logger.error('Received error message from server');
    logger.error(errMesg);
});

socket.on(MessageTypes.CONNECT_DEVICE, (mesg) => {
    if (bleScanner.discoveredDevices[mesg.deviceAddress].isDisconnected() && bleScanner.discoveredDevices[mesg.deviceAddress].inRange) {
        bleScanner.pauseScan();
        logger.info(`Connecting to BLE device with address = ${mesg.deviceAddress} `);
        bleScanner.discoveredDevices[mesg.deviceAddress].connect().
        then(() => {
            let sendMesg = new DeviceConnectedMessage(mesg.deviceAddress, Date.now);
            socket.emit(sendMesg.type, sendMesg);
            bleScanner.restartScan();
        }).
        catch((error) => {
            logger.error('Failed to connect to the BLE device', error);
        });
    } else {
        logger.info(`Device is ${bleScanner.discoveredDevices[mesg.deviceAddress].status} or out of range. Ignoring ${MessageTypes.CONNECT_DEVICE} message`);
    }

});

socket.on(MessageTypes.DISCONNECT_DEVICE, (mesg) => {
    logger.info(`Disconnecting BLE device with address = ${mesg.deviceAddress} `);
    bleScanner.discoveredDevices[mesg.deviceAddress].disconnect();
    bleScanner.restartScan();
});

socket.on(MessageTypes.UPDATE_SETTINGS, (mesg) => {
    logger.debug('Got new settings');
    SettingsManager.UpdateClientSettings(mesg).catch((err) => logger.error('Failed to save settings', err));

});

socket.on(MessageTypes.UPDATE_NODE_CONFIG, (mesg) => {
    logger.debug('Got new node config');
    ConfigDataManager.updateConfigData(mesg).catch((err) => logger.error('Failed to save config data', err));

});

socket.on(MessageTypes.CLIENT_RESTART, () => {
    logger.info('Restart message recieved from gateway. Restarting ...');
    process.exit(0);
});

socket.on(MessageTypes.CLIENT_REBOOT, () => {
    logger.info('Reboot message received from gateway. Rebooting client device ...');
    process.exit(20);
});

socket.on(MessageTypes.CLIENT_POWEROFF, () => {
    logger.info('Poweroff message received from gateway. Powering off client device ...');
    process.exit(30);
});

process.on('metawear-disconnected', (deviceAddress) => {
    socket.emit(MessageTypes.DEVICE_DISCONNECTED, {
        deviceAddress
    });
    bleScanner.restartScan();
});

process.on('exit', () => cleanUp());
process.on('SIGINT', () => cleanUp());
process.on('SIGTERM', () => cleanUp());
