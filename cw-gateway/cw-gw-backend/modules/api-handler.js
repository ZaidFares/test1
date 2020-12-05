/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const { Router } = require('express');
const { SettingsManager } = require('./settings-manager');
const log4js = require('log4js');

const settings = SettingsManager.settings;

class APIHandler {
    constructor(server) {
        this._router = new Router();
        this._server = server;
        this._logger = log4js.getLogger('APIHandler');

        this._getConnectedNodes = this._getConnectedNodes.bind(this);
        this._getSettings = this._getSettings.bind(this);
        this._getUser = this._getUser.bind(this);
        this._getUsers = this._getUsers.bind(this);
        this._updateSettings = this._updateSettings.bind(this);
        this._manageGateway = this._manageGateway.bind(this);
        this._getProjects = this._getProjects.bind(this);
        this._manageNode = this._manageNode.bind(this);
        this._getLocations = this._getLocations.bind(this);
        this._updateConfigData = this._updateConfigData.bind(this);
        this._getLocationHazard = this._getLocationHazard.bind(this);

        this._router.get('/nodes', this._getConnectedNodes);
        this._router.put('/nodes/:clientId/config', this._updateConfigData);
        this._router.get('/settings', this._getSettings);
        this._router.put('/settings', this._updateSettings);
        this._router.get('/users', this._getUsers);
        this._router.get('/projects', this._getProjects);
        this._router.get('/locations', this._getLocations);
        this._router.get('/locations/:locationId/hazard', this._getLocationHazard);
        this._router.get('/users/:userId', this._getUser);
        this._router.post('/control/gw', this._manageGateway);
        this._router.post('/control/node/:clientId', this._manageNode);
    }

    get router() {
        return this._router;
    }

    _getConnectedNodes(request, response) {
        response.status(200).json(this._server.connectedNodesArray);
    }

    /* eslint class-methods-use-this: off */
    _getSettings(request, response) {
        response.status(200).json(settings);
    }

    _getProjects(request, response) {
        this._server.iotGateway.cwClient.getProjects().
        then((projects) => response.status(200).json(projects)).
        catch((error) => response.status(500).json(error));
    }

    _getLocations(request, response) {
        this._server.iotGateway.cwClient.getProjectLocations(settings.iotcs.cwProjectId).
        then((locations) => {
            response.status(200).json(locations);
        }).
        catch((err) => {
            response.status(500).json(err);
        });
    }

    _getLocationHazard(request, response) {
        this._server.iotGateway.cwClient.getLocationHazard(request.params.locationId).
        then((hazard) => response.status(200).json(hazard)).
        catch((err) => response.status(500).json(err));
    }

    _getUsers(request, response) {
        if (settings.iotcs.cwProjectId) {
            this._server.iotGateway.cwClient.getProjectUsers(settings.iotcs.cwProjectId).
            then((users) => {
                response.status(200).json(users);
            }).
            catch((error) => {
                response.status(500).json(error);
            });
        } else {
            response.status(200).json([]);
        }

    }

    _getUser(request, response) {
        this._server.iotGateway.cwClient.getUser(request.params.userId).
        then((user) => {
            response.status(200).json(user);
        }).
        catch((error) => {
            response.status(error.statusCode).json(error);
        });
    }

    _updateSettings(request, response) {
        try {
            SettingsManager.updateSettings(request.body).
            then(() => {
                response.status(201).json({
                    status: 'OK'
                });
            }).
            catch((err) => {
                response.status(500).json(err);
            });

        } catch (exc) {
            this._logger.error(`Failed to udpate settings - ${exc.message}`, exc);
            response.status(500).json(exc);
        }
    }

    _updateConfigData(request, response) {
        try {
            this._server.sendClientConfigMessage(request.params.clientId, request.body.configData);
            response.status(201).json({
                status: 'OK'
            });
        } catch (exc) {
            this._logger.error(`Failed to udpate settings - ${exc.message}`, exc);
            response.status(500).json(exc);
        }
    }

    _manageGateway(request, response) {
        let action = request.query.action;
        if (!action) {
            response.status(400).json({
                status: 'ERROR',
                description: 'Missing query parameter - action'
            });
            return;
        }
        switch (action) {
            case 'restart':
                {
                    this._logger.info('Restarting server');
                    process.emit('restart');
                    response.status(201).json({
                        status: 'OK'
                    });
                    break;
                }
            case 'reboot':
                {
                    this._logger.info('Rebooting gateway');
                    process.emit('reboot');
                    response.status(201).json({
                        status: 'OK'
                    });
                    break;
                }
            case 'poweroff':
                {
                    this._logger.info('Powering off gateway');
                    process.emit('poweroff');
                    response.status(201).json({
                        status: 'OK'
                    });
                    break;
                }
            case 'stop':
                {
                    this._logger.info('Stopping server');
                    process.emit('stopserver');
                    response.status(201).json({
                        status: 'OK'
                    });
                    break;
                }
            default:
                {
                    response.status(400).json({
                        status: 'ERROR',
                        description: 'Invalid action. Valid actions are restart, stop, reboot, poweroff'
                    });
                }
        }
    }

    _manageNode(request, response) {
        const validActions = ['restart', 'reboot', 'poweroff'];

        let action = request.query.action;
        if (!action) {
            response.status(400).json({
                status: 'ERROR',
                description: 'Missing query parameter - action'
            });
            return;
        }
        let validAction = validActions.find((ele) => ele === action);
        if (validAction === undefined) {
            response.status(400).json({
                status: 'ERROR',
                description: `Invalid action. Valid actions are ${validActions}`
            });
            return;
        }

        this._server.sendClientControlMessage(decodeURIComponent(request.params.clientId), action);
        response.status(201).json({
            status: 'OK'
        });
    }
}

module.exports.APIHandler = APIHandler;
