/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

 /*eslint no-negated-condition: off*/

const request = require('request');
const log4js = require('log4js');

class RequestHandler {
    constructor(serverUrl, userName, password) {
        this.serverUrl = serverUrl;
        this.username = userName;
        this.password = password;
        this._logger = log4js.getLogger('RequestHandler');
    }

    /**
     * Do an HTTP GET
     * @param {String} Uri  Uri
     * @returns {Promise}   Result
     */
    doGET(Uri) {
        let options = {
            auth: {
                user: this.username,
                pass: this.password
            },
            rejectUnauthorized: false,
            method: 'GET',
            json: true,
            uri: `${this.serverUrl}${Uri}`
        };
        this._logger.debug(options);
        let promise = new Promise((resolve, reject) => {
            request(
                options,
                (err, res, obj) => {
                    if (err) {
                        reject(err);
                    } else if (res.statusCode !== 200) {
                        let errm = {
                            error: `GET '${options.uri}' Failed`,
                            statusCode: res.statusCode
                        };
                        errm.details = obj;
                        reject(errm);
                    } else {
                        resolve(obj);
                    }
                }
            );
        });
        return promise;
    }


    /**
     * Do POST
     * @param {String} Uri  URI
     * @param {Object} data Data to post
     * @returns {Promise}   Result
     */
    doPOST(Uri, data) {
        let promise = new Promise((resolve, reject) => {

            let options = {
                auth: {
                    user: this.username,
                    pass: this.password
                },
                rejectUnauthorized: false,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: data,
                accept: '*/*',
                json: true,
                uri: `${this.serverUrl}${Uri}`
            };
            this._logger.debug(options);
            request(
                options,
                (err, res, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        let result = body;
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(result);
                        } else {
                            let errm = {
                                status: res.statusCode,
                                details: body
                            };
                            reject(errm);
                        }

                    }
                }
            );

        });
        return promise;
    }

    /**
     * HTTP PUT
     * @param {String} Uri      URI
     * @param {Object} data     Data to PUT
     * @returns {Promise}       Result
     */
    doPUT(Uri, data) {
        let promise = new Promise((resolve, reject) => {

            let options = {
                auth: {
                    user: this.username,
                    pass: this.password
                },
                rejectUnauthorized: false,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: data,
                accept: '*/*',
                json: true,
                uri: `${this.serverUrl}${Uri}`
            };
            this._logger.debug(options);
            request(options,
                (err, res, body) => {
                    if (err) {
                        reject(err);
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        let errm = {
                            status: res.statusCode,
                            text: body
                        };
                        reject(errm);
                    }
                }
            );
        });
        return promise;
    }

    /**
     * Do DELETE
     * @param {String} Uri      URI
     * @returns {Promise}       Result
     */
    doDELETE(Uri) {
        this._logger.debug(`doDELETE: ${Uri}`);
        let promise = new Promise((resolve, reject) => {

            let options = {
                auth: {
                    user: this.username,
                    pass: this.password
                },
                rejectUnauthorized: false,
                method: 'DELETE',
                accept: '*/*',
                json: true,
                uri: `${this.serverUrl}${Uri}`
            };
            this._logger.debug(options);
            request(
                options,
                (err, res, body) => {
                    if (err) {
                        reject(err);
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        let errm = {
                            status: res.statusCode,
                            text: body
                        };
                        reject(errm);
                    }
                }
            );

        });
        return promise;
    }
}

module.exports.RequestHandler = RequestHandler;
