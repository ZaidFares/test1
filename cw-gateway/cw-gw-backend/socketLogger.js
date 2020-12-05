/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */


// const debug = require('debug')('log4js:file');
// const path = require('path');
const os = require('os');

const eol = os.EOL || '\n';

/* eslint valid-jsdoc: off, no-console: off */


const socketAppender = function(layout, config) {

    const app = function (loggingEvent) {
        if (global.loggerSocket) {
            global.loggerSocket.emit('log', loggingEvent);
        }

    };

    app.reopen = function () {
      //  writer.closeTheStream(writer.openTheStream.bind(writer));
    };

    app.shutdown = function (complete) {
        console.log(complete);
    };

    return app;
};

const configure = function(config, layouts) {
    let layout = layouts.basicLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    return socketAppender(layout, config);
};

exports.configure = configure;
