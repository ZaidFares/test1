#!/usr/bin/env node

/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the legal
 * directory for license terms. You may choose either license, or both.
 *
 */
global.appRootDir = __dirname;

const settings = require('./config/settings.json');
const log4js = require('log4js');
const {APIHandler} = require('./modules/api-handler');

const {RELEASE_VERSION} = require('./modules/common');

// Configure logger
log4js.configure('./config/logger.json', {reloadSecs: 300});
const logger = log4js.getLogger('server');


const {Server} = require('./modules/web-server');
const {SocketIOServer} = require('./modules/socketio-server');

let server = new Server();
let socketServer = new SocketIOServer(server.httpServer);
logger.info(`Starting Connected Worker BLE Gateway, version ${RELEASE_VERSION}`);

server.attachRouter('/api', new APIHandler(socketServer).router);

let exit = function(exitCode) {
    socketServer.stop();
    // Give other components chance to cleanup
    process.emit('cleanup');
    //Give some time for cleanups to complete
    logger.info('Waiting for cleanup to complete.');
    setTimeout(() => {
        logger.info('Done.');
        process.exit(exitCode);
    }, 10000);
};

// Exit with appropriate status code  to let the shell script take OS level actions
process.on('restart', () => exit(0));
process.on('reboot', () => exit(20));
process.on('stopserver', () => exit(10));
process.on('poweroff', () => exit(30));

// Exit handlers for clean shutdown
process.on('SIGINT', () => exit(0));
process.on('SIGTERM', () => exit(0));


server.listen(settings.server.listenPort);
socketServer.start();


