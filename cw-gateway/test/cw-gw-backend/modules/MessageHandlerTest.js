/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
'use strict';

jest.mock('log4js');
const log4js = require('log4js');
log4js.getLogger.mockReturnValue({
    debug: () => {},
    info: () => {}
});

jest.mock('@cw-gw-backend/modules/message-types');

const { MessageHandler } = require('@cw-gw-backend/modules/message-handler');

describe('Message handler', () => {
    const CLIENT = {
        id: '/client#1',
        emit: jest.fn()
    }
    const NODE = {
        devices: {},
        identity: {
            nodeId: '1'
        }
    }
    const SERVER = {
        iotGateway: {
            registerDevice: jest.fn().mockReturnValue({
                then: (callback) => {
                    callback({});
                    return {
                        catch: () => {}
                    }
                }
            })
        },
        connectedNodes: {
            '/client#1': NODE
        }
    };
    const MESSAGE = {
        deviceAddress: 'mac'
    }

    let messageHandler = undefined;

    beforeEach(() => {
        messageHandler = new MessageHandler(SERVER);
    });

    it("tries to register a discovered device", () => {
        messageHandler.handleDeviceDiscoveredMessage(CLIENT, MESSAGE);
        expect(SERVER.iotGateway.registerDevice).toBeCalledWith(MESSAGE.deviceAddress);
    });

    it("connects to a device after it was discovered", () => {
        messageHandler.handleDeviceDiscoveredMessage(CLIENT, MESSAGE);
        messageHandler.handleDeviceConnectedMessage(CLIENT, MESSAGE);
        expect(SERVER.connectedNodes[CLIENT.id].devices[MESSAGE.deviceAddress].connected)
            .toBeTruthy();
    });

    it("does not connect to just disconnected device", () => {
        messageHandler.handleDeviceDiscoveredMessage(CLIENT, MESSAGE);
        messageHandler.handleDeviceDisconnectedMessage(CLIENT, MESSAGE);
        messageHandler.handleDeviceConnectedMessage(CLIENT, MESSAGE);
        expect(SERVER.connectedNodes[CLIENT.id].devices[MESSAGE.deviceAddress].connected)
            .toBeFalsy();
    });
});
