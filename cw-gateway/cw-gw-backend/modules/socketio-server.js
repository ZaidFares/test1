
/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const log4js = require('log4js');
const socketio = require('socket.io');
const { MessageTypes } = require('./message-types');
const { IotGateway } = require('./iotcs-client');
const { SettingsManager } = require('./settings-manager');
const { MessageHandler } = require('./message-handler');

const settings = SettingsManager.settings;

class SocketIOServer {
    constructor(httpServer) {
        this._logger = log4js.getLogger('SocketIOServer');
        this._httpServer = httpServer;
        // Keep list of socket connection separate out of connectedNodes to avoid cyclic references
        this._sockets = {};
        this.connectedNodes = {};
        this.iotGateway = new IotGateway(
            settings.iotcs.provisioningFile,
            settings.iotcs.provisioningPassword
        );
        this.messageHandler = new MessageHandler(this);
        this.broadcastClientSettings = this.broadcastClientSettings.bind(this);
        SettingsManager.onUpdate(this.broadcastClientSettings);
    }

    /* eslint guard-for-in: off */
    get connectedNodesArray() {
        let connectedNodesArray = [];
        for (let node in this.connectedNodes) {
            connectedNodesArray.push(this.connectedNodes[node]);
        }
        return connectedNodesArray;
    }


    /**
     * Broadcast updated settings to all connected clients
     * @return {undefined}
     * @memberof SocketIOServer
     */
    broadcastClientSettings() {
        this._logger.debug('Broadcasting updated settings to clients');
        this._io.of('/client').emit(MessageTypes.UPDATE_SETTINGS, settings.client);
    }

    sendClientControlMessage(clientId, type) {
        const messageType = {
            'restart': MessageTypes.CLIENT_RESTART,
            'reboot': MessageTypes.CLIENT_REBOOT,
            'poweroff': MessageTypes.CLIENT_POWEROFF
        };
        //let nodeId = this.connectedNodes[clientId].identity.nodeId;
        this._logger.debug(`Sending control message of type ${type} to ${clientId}`);
        this._sockets[clientId].emit(messageType[type]);
    }

    sendClientConfigMessage(clientId, configData) {
        this._logger.debug(`Sending config data update message to ${clientId}`);
        Object.assign(this.connectedNodes[clientId].identity.configData, configData);
        this._sockets[clientId].emit(MessageTypes.UPDATE_NODE_CONFIG, this.connectedNodes[clientId].identity.configData);
    }

    stop() {
        if (this._io) {
            this._io.close();
            this._logger.info('Socket.io server stopped.');
        }
    }

    start() {
        this._logger.info('Initializing...');
        // Connect to IoT Cloud
        this.iotGateway.connect().
        then(() => {
            this._io = socketio(this._httpServer);
            this._logger.info('Socket Server now listening for events');
            //Create a socketio channel for log viewer
            this._io.of('/log').on('connection', (loggerSocket) => {
                this._logger.info('Log publisher connected on Socket.io');
                this._loggerSocket = loggerSocket;
                // Also set it as a global so that its available to the log4js appender
                global.loggerSocket = loggerSocket;
            });

            this._io.of('/client').on('connection', (client) => {
                this._logger.debug(`connectionHandler: Received new client connection: ${client.id}`);
                this._sockets[client.id] = client;

                // Node info - expecting and identity message
                client.on(MessageTypes.REGISTER, (mesg) => {
                    this.messageHandler.handleRegisterMessage(client, mesg);
                });
                client.on(MessageTypes.DISCONNECT, () => {
                    this.messageHandler.handleClientDisconnected(client);
                    delete this._sockets[client.id];
                });
                client.on(MessageTypes.DISCOVERED, (mesg) => {
                    this.messageHandler.handleDeviceDiscoveredMessage(
                        client,
                        mesg);
                });
                client.on(MessageTypes.DEVICE_DATA, (mesg) => {
                    this.messageHandler.handleDeviceDataMessage(
                        client,
                        mesg);
                });
                client.on(MessageTypes.DEVICE_OUT_OF_RANGE, (mesg) => {
                    this.messageHandler.handleDeviceOutOfRange(
                        client,
                        mesg);
                });
                client.on(MessageTypes.DEVICE_CONNECTED, (mesg) => {
                    this.messageHandler.handleDeviceConnectedMessage(
                        client,
                        mesg);
                });
                client.on(MessageTypes.DEVICE_DISCONNECTED, (mesg) => {
                    this.messageHandler.handleDeviceDisconnectedMessage(
                        client,
                        mesg);
                });
                client.on(MessageTypes.DEVICE_STATUS, (mesg) => {
                    this.messageHandler.handleDeviceStatusMessage(
                        client,
                        mesg);
                });
            });
        }).
        catch((err) => {
            this._logger.error('Failed to connect to IoT CS');
            this._logger.error(err);
        });
    }
}

module.exports.SocketIOServer = SocketIOServer;
