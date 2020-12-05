/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

/* eslint max-lines: off */
const { RequestHandler } = require('./request-handler');
const { SettingsManager } = require('./settings-manager');
const log4js = require('log4js');
const util = require('util');

const { Constants } = require('./common');
const { CWDevice } = require('./cw-device');

class CWClient {
    constructor(serverUrl) {
        this._settings = SettingsManager.settings;
        this._requestHandler = new RequestHandler(
            serverUrl,
            this._settings.iotcs.username,
            this._settings.iotcs.password
        );
        this._loggedinDevices = {};
        this._logger = log4js.getLogger('CWClient');
    }

    newCWDevice(virtualDevices, deviceAddress, deviceId) {
        let cwDevice = new CWDevice(virtualDevices, deviceAddress, deviceId);
        cwDevice._cwClient = this;
        return cwDevice;
    }

    /**
     * Create a device model and associate with CW
     *
     * @param {Object} deviceModel  Device model to create
     * @returns {Promise} Promise
     * @memberof CWClient
     */
    createAppDeviceModel(deviceModel) {
        return this._requestHandler.doPOST(Constants.CW_CREATE_DM_URI, deviceModel);
    }


    /**
     * Get list of device models associated with CW
     *
     * @returns {Promise} List of device models
     * @memberof CWClient
     */
    getCWDeviceModels() {
        return this._requestHandler.doGET(Constants.CW_CREATE_DM_URI);
    }

    /**
     * Get users
     * @returns {Promise}   Promise resolving to list of employees
     */
    getUsers() {
        return this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/employees`);
    }

    /**
     * Get users assigned to a project
     * @param {int} projectId Project ID
     * @returns {Promise}   Promise resolving to list of employees
     */
    getProjectUsers(projectId) {
        return new Promise((resolve, reject) => {
            this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/projects/${projectId}/employees`).
            then((projectEmployees) => {
                let promises = [];
                projectEmployees.items.forEach((emp) => {
                    promises.push(this.getUser(emp.employeeId));
                });
                Promise.all(promises).
                then((result) => {
                    resolve(result);
                }).
                catch((err) => {
                    reject(err);
                });
            }).
            catch((_err) => {
                reject(_err);
            });
        });
    }

    /**
     *
     * @param {string} userId   Userid
     * @returns {Promise}       Promise resolving to a User object
     */
    getUser(userId) {
        return this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/employees/${userId}`);
    }

    /**
     * Get all projects
     *
     * @returns {Promise}   Promise resolving to a Project list
     * @memberof CWClient
     */
    getProjects() {
        return this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/projects`);
    }

    /**
     * Get a project
     *
     * @param {int} projectId Project ID
     * @returns {Promise}   Promise resolving to a Project
     * @memberof CWClient
     */
    getProject(projectId) {
        return this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/projects/${projectId}`);
    }


    /**
     * Get all locations in a project, as a flattened list
     *
     * @param {int}     projectId       Project ID
     * @returns {Promise} Heirarchical    list of location
     * @memberof CWClient
     */
    getProjectLocations(projectId) {
        return new Promise((resolve, reject) => {
            let flattenedLocations = [];
            // Get top level locations
            this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/projects/${projectId}/locations`).
            // Get children recursively for each top-level location
            then((locations) => Promise.all(locations.items.map((loc) => {
                loc.path = loc.name;
                flattenedLocations.push(loc);
                return this._getChildLocations(projectId, loc, flattenedLocations);
            }))).
            then(() => resolve(flattenedLocations)).
            catch((err) => reject(err));
        });
    }

    /**
     * Get child locations
     *
     * @param {any} projectId Project ID
     * @param {any} parentLocation  Parent location
     * @param {Array} flattenedLocations Flattened locations
     * @returns {Promise}   Location list
     * @memberof CWClient
     */
    _getChildLocations(projectId, parentLocation, flattenedLocations) {
        this._logger.debug(`Getting child locations for ${parentLocation.name}`);
        return new Promise((resolve, reject) => {
            this._requestHandler.doGET(`/${Constants.CW_API_BASE_PATH}/projects/${projectId}/locations/${parentLocation.id}/children`).
            then((locations) => Promise.all(locations.items.map((loc) => this._getChildLocations(projectId, loc, flattenedLocations)))).
            then((childLocations) => {
                childLocations.forEach((childLoc) => {
                    childLoc.path = `${parentLocation.path}/${childLoc.name}`;
                    childLoc.parent = {
                        id: parentLocation.id,
                        name: parentLocation.name
                    };
                    flattenedLocations.push(childLoc);
                });
                resolve(parentLocation);
            }).
            catch((err) => reject(err));
        });
    }


    /**
     * Return the hazard information for a location
     *
     * @param   {int}   locationId  Location ID
     * @returns {Promise}   Hazards
     * @memberof CWClient
     */
    getLocationHazard(locationId) {
        return new Promise((resolve, reject) => {
            let url = `${Constants.CW_API_BASE_PATH}/projects/${this._settings.iotcs.cwProjectId}/hazards`;
            let locationHazardMap = {};
            this._requestHandler.doGET(url).
            then((hazards) => Promise.all(hazards.items.map((hazard) => this._getHazardLocations(hazard, locationHazardMap)))).
            then(() => {
                let hazard = locationHazardMap[locationId];
                resolve(hazard === undefined ? {} : hazard);
            }).
            catch((err) => {
                this._logger.warn('Failed to get hazard details ');
                this._logger.error(err);
                reject(err);
            });
        });
    }

    _getHazardLocations(hazard, locationHazardMap) {
        this._logger.debug(`_getHazardLocations ${hazard.id}`);
        return new Promise((resolve, reject) => {
            let hazardObj = {
                id: hazard.id,
                severity: hazard.severity,
                subject: hazard.subject,
                action: hazard.action,
                status: hazard.status
            };
            let url = `${Constants.CW_API_BASE_PATH}/projects/${this._settings.iotcs.cwProjectId}/hazards/${hazard.id}/locations`;
            this._requestHandler.doGET(url).
            then((locations) => {
                locations.items.forEach((location) => {
                    locationHazardMap[location.locationId] = {
                        hazard: hazardObj
                    };
                });
                resolve(locationHazardMap);
            }).
            catch((err) => reject(err));
        });
    }


    /**
     * Login the user to the device and also checkin to a project
     * @param {string}  deviceAddress   Hardware device address
     * @param {string}  deviceId        Device ID of the device to login to
     * @returns {Promise}     Promise
     */
    login(deviceAddress, deviceId) {
        this._logger.debug(`Logging in device ${deviceAddress}`);
        /*return new Promise((resolve, reject) => {
                this._logger.debug(`Logging in User Id = ${userDevice.userId} using ${deviceAddress}`);
                let deviceLogin = util.format(Constants.DEVICE_LOGIN_PATH, userDevice.userId, deviceId);
                this._requestHandler.doPUT(`${Constants.CW_API_BASE_PATH}${deviceLogin}`, {
                    id: deviceId
                }).
                then(() => {
                    this._loggedinDevices[deviceId] = userDevice;
                    // Change state to checked-in
                    return this._setCheckedInState(userDevice.userId, this._settings.iotcs.cwProjectId, 'ON_DUTY_ON_SITE');
                }).
                then(() => resolve()).
                catch((err) => {
                    this._logger.debug(`Login failed`);
                    this._logger.error(err);
                    reject(err);
                });
        });*/
    }

    /*(getDeviceUser(deviceId) {
        return this._loggedinDevices[deviceId];
    }

    addDevice(deviceAddress) {
        this._deviceUserList.addDevice(deviceAddress);
    }*/

    _setCheckedInState(userId, projectId, state) {
        return new Promise((resolve, reject) => {
            this._requestHandler.doPUT(`${Constants.CW_API_BASE_PATH}/employees/${userId}/checkedState/`, {
                state,
                projectId
            }).
            then(() => {
                this._logger.debug('Device with user checked in');
                resolve(null);
            }).
            catch((err) => {
                this._logger.error(`Failed to change employee state for ${userId}`);
                this._logger.error(err);
                reject(err);
            });
        });
    }

    /**
     * Logout and remove the worker/device association
     * @param   {deviceId}  deviceId    Device ID
     * @returns {Promise}   Promise
     */
    logout(deviceId) {
        this._logger.debug(`Logging out device ${deviceId}`);
        /*return new Promise((resolve, reject) => {
            let userDevice = this._loggedinDevices[deviceId];
            if (userDevice === undefined) {
                resolve(null);
            } else {
                let deviceLogout = util.format(Constants.DEVICE_LOGIN_PATH, userDevice.userId, deviceId);
                this._requestHandler.doDELETE(`${Constants.CW_API_BASE_PATH}${deviceLogout}`).
                then(() => {
                    this._logger.debug(`Logged out ${userDevice.userId} from ${deviceId}`);
                    delete this._loggedinDevices[deviceId];
                    resolve(null);
                }).
                catch((err) => {
                    if (err.status === 404) {
                        resolve(null);
                    } else {
                        this._logger.error(`Failed to logout ${deviceId}`);
                        this._logger.error(err);
                        reject(err);
                    }
                });
            }
        });*/
    }
}


module.exports.CWClient = CWClient;
