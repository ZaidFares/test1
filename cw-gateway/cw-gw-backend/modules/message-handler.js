/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

 /*eslint guard-for-in: 'off', max-lines: off */

const log4js = require('log4js');
const {MessageTypes} = require('./message-types');
const {ErrorMessage} = require('./message-types');
const {DeviceConnectionMessage} = require('./message-types');

class MessageHandler {
    constructor(server) {
        this._logger = log4js.getLogger('MessageHandler');
        this.server = server;

        // List of connected devices
        this.connectedDevices = {};
        this.discoveredDevices = {};
        this._cwDevices = {};

        this._iotGateway = server.iotGateway;
        this._registrationInProcess = false;
    }


    /**
     * Handle Node registration message
     *
     * @param {Object} client Node
     * @param {Object} message Message
     * @return {undefined}
     * @memberof MessageHandler
     */
    handleRegisterMessage(client, message) {
        if (message.type === MessageTypes.REGISTER) {
            this.server.connectedNodes[client.id] = {
                clientId: client.id
            };
            this.server.connectedNodes[client.id].identity = message;
            this.server.connectedNodes[client.id].devices = {};
            this._logger.info(`Registered node ${message.nodeId} at location ${message.configData.location.name}`);
            //this.server.sendUIUpdate(UI_UPDATE_NODELIST, this.server.connectedNodesArray);
        } else {
            this._logger.warn(`Expecting message type ${MessageTypes.REGISTER}, got ${message.type}`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage(
                    'Invalid message type',
                    `Expecting message type ${MessageTypes.ERROR_MESSAGE}, got ${message.type}`
                )
            );
        }
    }

    /**
     * Remove client registration when client disconnected
     * @param {Socket} client         Client socket
     * @return {undefined}
     */
    handleClientDisconnected(client) {
        let connectedNode = this.server.connectedNodes[client.id];
        if (connectedNode === undefined) {
            this._logger.warn(`Node ${client.id} was not registered. Ignoring client disconnect event`);
        } else {
            // If the node was connected to the device, remove the devices associated with this node from the connected list
            for (let deviceAddress in connectedNode.devices) {
                //let device = connectedNode.devices[deviceAddress];
                this._disconnectDevice(deviceAddress, connectedNode, client.id);
            }

            // Remove from discovered list too
            for (let deviceAddress in this.discoveredDdevices) {
                if (this.discoveredDevices[deviceAddress] === connectedNode.identity.nodeId) {
                    this._logger.debug(`Node ${connectedNode.identity.nodeId}: Disconnected, removing from ${deviceAddress} from discovered list.`);
                    delete this.discoveredDevices[deviceAddress];
                }
                //let device = connectedNode.devices[deviceAddress];
                this._disconnectDevice(deviceAddress, connectedNode, client.id);
            }

            delete this.server.connectedNodes[client.id];
            this._logger.info(`Node ${connectedNode.identity.nodeId}: Disconnected, removing from registered list.`);
        }
    }

    _disconnectDevice(deviceAddress, connectedNode, clientId) {
        this._logger.debug(`Node ${connectedNode.identity.nodeId}: Disconnecting device ${deviceAddress}`);
        if (
            this.connectedDevices[deviceAddress] !== undefined &&
            this.connectedDevices[deviceAddress].clientId === clientId
        ) {
            this._logger.info(`Node ${connectedNode.identity.nodeId}: Removing device connection for ${deviceAddress}`);
            if (this._cwDevices[deviceAddress]) {
                this._cwDevices[deviceAddress].cleanup();
                delete this._cwDevices[deviceAddress];
            }
            this.removeConnectedDevice(deviceAddress, connectedNode);
        }
    }


    removeConnectedDevice(deviceAddress, connectedNode) {
        delete this.connectedDevices[deviceAddress];
        delete connectedNode.devices[deviceAddress];
    }

    /**
     * Handle device status message
     *
     * @param {Object} client   Node
     * @param {Object} message  Message
     * @returns {undefined}
     * @memberof MessageHandler
     */
    handleDeviceStatusMessage(client, message) {
        let connectedNode = this.server.connectedNodes[client.id];
        if (connectedNode === undefined) {
            this._logger.warn(`Client ${client.id} was not registered. Ignoring client device status event`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage('Node not registered', 'Node not registered')
            );
        } else if (connectedNode.devices[message.deviceAddress] === undefined) {
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage(
                    'Device not registered',
                    `Device ${message.deviceAddress} not registered`
                )
            );
        } else {
            this._logger.debug(`Node ${connectedNode.identity.nodeId}: Status: ${JSON.stringify(message)}`);
            connectedNode.devices[message.deviceAddress].timeStamp =
                message.timeStamp;
            connectedNode.devices[message.deviceAddress].timeDistance =
                message.distance;
            connectedNode.devices[message.deviceAddress].inRange = true;
            connectedNode.devices[message.deviceAddress].address =
                message.deviceAddress;
            connectedNode.devices[message.deviceAddress].batteryLevel = message.data.batteryLevel ? message.data.batteryLevel : null;
            let cwDevice = this._cwDevices[message.deviceAddress];
            if (cwDevice !== undefined && cwDevice !== null) {
                cwDevice.setGeoLocation(message.data.latitude, message.data.longitude);
                if (message.data.ambientLightLux) {
                    cwDevice.setAmbientLight(message.data.ambientLightLux);
                }
                if (message.data.pressure) {
                    cwDevice.setPressure(message.data.pressure);
                }
                cwDevice.setProjectLocation(message.data.locationId, message.data.hazardous);
                if (message.data.temperature) {
                    cwDevice.setTemperature(message.data.temperature);
                }
                if (message.data.motionTimestamp) {
                    cwDevice.setMotionDetected(message.data.motionDetected, message.data.motionTimestamp);
                }
                if (message.data.batteryLevel) {
                    cwDevice.setBatteryLevel(message.data.batteryLevel);
                }
                cwDevice.receive(message.data);
                cwDevice.send();
            } else {
                this._logger.warn(`Node ${connectedNode.identity.nodeId}: Device ${message.deviceAddress} not logged in, data not sent to CW`);
            }
        }
    }


    /**
     * Device 'Discovered'
     *
     * @param {Object} client Client
     * @param {Object} message Message
     * @returns {undefined}
     * @memberof MessageHandler
     */
    handleDeviceDiscoveredMessage(client, message) {
        this._logger.debug(`handleDeviceDiscoveredMessage: ${JSON.stringify(message)}`);
        let connectedNode = this.server.connectedNodes[client.id];

        if (connectedNode === undefined) {
            this._logger.warn(`Client ${client.id} was not registered. Ignoring client device discovery event`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage('Node not registered', 'Node not registered')
            );
        } else if (this._registrationInProces) {
            // Ignore discovered message until device registration that is in process is complete
            this._logger.info(`Node ${connectedNode.identity.nodeId}: Device registration in process. Ignoring discovery of device ${message.deviceAddress}`);
        } else if (this.discoveredDevices[message.deviceAddress] === undefined ||
            this.discoveredDevices[message.deviceAddress] === connectedNode.identity.nodeId) {
            this._logger.info('Registering discovered device');
            this._registrationInProcess = true;
            this._registerDevice(connectedNode, message, client);
        } else {
            this._logger.debug(`Node ${connectedNode.identity.nodeId}:Ignoring discovery of device ${message.deviceAddress}, already discovered ${this.discoveredDevices[message.deviceAddress]}`);
        }
    }

    _registerDevice(connectedNode, message, client) {
        this._logger.info(`Node ${connectedNode.identity.nodeId}: Discovered device ${message.deviceAddress}`);
        if (connectedNode.devices[message.deviceAddress] === undefined) {
            connectedNode.devices[message.deviceAddress] = {};
        }
        // Add the device to the connected node
        connectedNode.devices[message.deviceAddress].timeStamp =
            message.timeStamp;
        connectedNode.devices[message.deviceAddress].timeDistance =
            message.distance;
        connectedNode.devices[message.deviceAddress].inRange = true;
        connectedNode.devices[message.deviceAddress].address =
            message.deviceAddress;
        connectedNode.devices[message.deviceAddress].connected = false;
        connectedNode.devices[message.deviceAddress].batteryLevel = null;

        // Check if this devices is associated with any node
        if (this.connectedDevices[message.deviceAddress] === undefined) {
            // Register this device with IoT
            this._iotGateway.
            registerDevice(message.deviceAddress).
            then((cwDevice) => {
                this._cwDevices[message.deviceAddress] = cwDevice;
                // send connect message
                // Need to add - check if this the closest node and then request to connect to the metawear sensors
                this._logger.info(`Node ${connectedNode.identity.nodeId}: Sending device connect message`);
                client.emit(
                    MessageTypes.CONNECT_DEVICE,
                    new DeviceConnectionMessage(true, message.deviceAddress)
                );
                // Client IDs change between conenctions. Use nodeId to track discovered devices
                this.discoveredDevices[message.deviceAddress] = connectedNode.identity.nodeId;

                //this.server.sendUIUpdate(UI_UPDATE_NODELIST, this.server.connectedNodesArray);
                this._registrationInProcess = false;
            }).
            catch((err) => {
                this._logger.error(`IoT registration of device ${message.deviceAddress} failed.`);
                this._logger.error(err);
                this._registrationInProcess = false;
            });
        } else if (this.connectedDevices[message.deviceAddress].clientId === client.id) {
            // Looks like the node disconnected but we didn't know and its now sending a discovered message.
            // fix our state to the same as the node and remove the connected status so that the next discovered message
            // is properly processed
            this._registrationInProcess = false;
            this._logger.debug(`Node ${connectedNode.identity.nodeId}: Device is connected but node sending discovered message. Setting device as disconnected`);
            this._disconnectDevice(
                message.deviceAddress,
                connectedNode,
                client.id
            );
        } else {
            let otherClientId = this.connectedDevices[message.deviceAddress].
            clientId;
            this._logger.debug(`Node ${connectedNode.identity.nodeId}: Ignoring discovery message. Device connected to ${this.server.connectedNodes[otherClientId].identity.nodeId
                }`);
            this._registrationInProcess = false;
        }
    }

    _deviceIsConnecting(deviceAddress, nodeId) {
        return this.discoveredDevices[deviceAddress] === nodeId;
    }

    handleDeviceConnectedMessage(client, message) {
        this._logger.debug(`handleDeviceConnectedMessage: ${JSON.stringify(message)}`);
        let connectedNode = this.server.connectedNodes[client.id];
        if (connectedNode === undefined) {
            this._logger.warn(`Client ${client.id} was not registered. Ignoring client device connection event`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage('Node not registered', 'Node not registered')
            );
        } else if (this._deviceIsConnecting(message.deviceAddress, connectedNode.identity.nodeId)) {
            this._logger.info(`Node ${connectedNode.identity.nodeId}: Device ${message.deviceAddress} connected`);
            if (this.connectedDevices[message.deviceAddress] === undefined) {
                this.connectedDevices[message.deviceAddress] = {};
            }
            this.connectedDevices[message.deviceAddress].clientId = client.id;
            this.connectedDevices[message.deviceAddress].timeStamp = message.timeStamp;
            this.connectedDevices[message.deviceAddress].address = message.deviceAddress;
            connectedNode.devices[message.deviceAddress].connected = true;

            // connectedNode.deviceAddress = message.deviceAddress;
            // remove from list of discovered devices now that this is connected
            delete this.discoveredDevices[message.deviceAddress];
        }
    }

    handleDeviceOutOfRange(client, message) {
        this._logger.debug(`handleDeviceOutOfRange: ${JSON.stringify(message)}`);

        let connectedNode = this.server.connectedNodes[client.id];
        this._logger.info(`Node ${connectedNode.identity.nodeId}: Out of range`);

        if (connectedNode === undefined) {
            this._logger.warn(`Client ${client.id} was not registered. Ignoring client device discovery event`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage('Node not registered', 'Node not registered')
            );
        } else {
            if (this.connectedDevices[message.deviceAddress] !== undefined) {
                connectedNode.devices[message.deviceAddress].inRange = false;
                connectedNode.devices[message.deviceAddress].timeStamp = message.timeStamp;
            }

            if (
                this.connectedDevices[message.deviceAddress] !== undefined &&
                this.connectedDevices[message.deviceAddress].clientId ===
                client.id
            ) {
                // send disconnect device message
                // Need to add - check if this the closest node and then request to connect
                this._logger.debug(`Sending ${MessageTypes.DISCONNECT_DEVICE} message to ${connectedNode.identity.nodeId}`);
                client.emit(
                    MessageTypes.DISCONNECT_DEVICE,
                    new DeviceConnectionMessage(true, message.deviceAddress)
                );
                this.removeConnectedDevice(message.deviceAddress, connectedNode);
            } else if (
                this.connectedDevices[message.deviceAddress] !== undefined
            ) {
                let device = this.connectedDevices[message.deviceAddress];
                let otherNode = this.server.connectedNodes[device.clientId].
                identity.nodeId;
                this._logger.debug(`Node ${connectedNode.identity.nodeId}: Ignoring Out of range message. Device is connected to ${otherNode}`);
            }
        }
        //this.server.sendUIUpdate(UI_UPDATE_NODELIST, this.server.connectedNodesArray);
    }

    handleDeviceDataMessage(client, message) {
        this._logger.debug('handleDeviceDataMessage: ');
        let connectedNode = this.server.connectedNodes[client.id];
        if (connectedNode === undefined) {
            this._logger.warn(`Client ${client.id} was not registered. Ignoring client device data event`);
            client.emit(
                MessageTypes.ERROR_MESSAGE,
                new ErrorMessage('Node not registered', 'Node not registered')
            );
        } else {
            this._logger.debug(`Device message received from ${connectedNode.nodeId}`);
            this._logger.debug(JSON.stringify(message));

            //Update the virtual device with the data
        }
    }

    handleDeviceDisconnectedMessage(client, message) {
        this._logger.debug('handleDeviceDisconnectedMessage:');
        let connectedNode = this.server.connectedNodes[client.id];
        this._disconnectDevice(message.deviceAddress, connectedNode, client.id);
        delete this.discoveredDevices[message.deviceAddress];
    }
}

module.exports.MessageHandler = MessageHandler;
