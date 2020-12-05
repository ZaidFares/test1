/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

 /* global __dirname */

const express = require('express');
const path = require('path');
const http = require('http');
const process = require('process');
const bodyParser = require('body-parser');
const log4js = require('log4js');

/**
 *
 * @param {Object} server Server
 * @param {Object} error Error
 * @returns {undefined}
 */
let onError = function (server, error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let port = server.httpServer.address().port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            this._logger.error(`${port} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            this._logger.error(`${port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

/**
 *
 * @param {Object} httpServer Server
 * @returns {void}
 */
let onListening = function (httpServer) {
    let addr = httpServer.address();
    let bind = typeof addr === 'string' ?
        `pipe ${addr}` :
        `port ${addr.port}`;
    this._logger.info(`Listening on ${bind}`);
};

class Server {
    constructor() {
        this._logger = log4js.getLogger('Server');
        onListening = onListening.bind(this);
        this._app = express();
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({
            extended: false
        }));
        this._app.use('/console', express.static(path.join(global.appRootDir, '../cw-gw-console/web')));

        this.httpServer = http.createServer(this._app);
        this.httpServer.on('error', (error) => {
            onError(this, error);
        });

        this.httpServer.on('listening', () => {
            onListening(this.httpServer);
        });
    }

    attachRouter(routePath, router) {
        this._app.use(routePath, router);
        return this;
    }

    listen(port) {
        let listenPort = port;
        if (port === undefined) {
            listenPort = 8080;
        }
        this.httpServer.listen(listenPort);
    }

    use(appPath, router) {
        this._app.use(appPath, router);
    }
}


module.exports.Server = Server;
