/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

/* eslint guard-for-in: off, no-loop-func: off, object-curly-spacing: off, prefer-promise-reject-errors: off */
const settings = require('../config/settings.json');
const iotcs = require('iotcs-csl-device')({debug: settings.iotcs.debug});
const log4js = require('log4js');

const fs = require('fs');
const util = require('util');
const process = require('process');

//const fileExists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const { CWClient } = require('./cw-client');
const { Constants } = require('./common');
const { SettingsManager } = require('./settings-manager');

/**
 * IoT Gateway implementation using IOTCS device client libraries
 *
 * @class IotGateway
 */
class IotGateway {
    constructor(provisioningFile, password) {
        this.provisioningFile = provisioningFile;
        this.provisioningPassword = password;
        this._settings = SettingsManager.settings;
        this._logger = log4js.getLogger('IotGateway');
        this._registeredDevices = {};
        this._cwClient = null;
        this.deviceModels = {};
        this._deviceModelUrns = [];
        iotcs.oracle.iot.client.device.requestBufferSize = 8384;
        for (let dm in Constants.CW_DEVICE_MODELS) {
            this.deviceModels[Constants.CW_DEVICE_MODELS[dm].NAME] = {
                deviceModel: null,
                urn: Constants.CW_DEVICE_MODELS[dm].URN
            };
            this._deviceModelUrns.push(Constants.CW_DEVICE_MODELS[dm].URN);
        }

        this._logger.debug('Created');
        process.on('cleanup', () => {
            this._logger.info('Cleaning up');
            Object.keys(this._registeredDevices).forEach((deviceAddress) => {
                this._registeredDevices[deviceAddress].cleanup();
            });
            if (this._gateway) {
                this._gateway.close();
            }
        });
    }

    get cwClient() {
        return this._cwClient;
    }

    /**
     * Connects the IoT Gateway to IoT Cloud
     * Activates the gateway if needed
     *
     * @returns {Promise}       Promise resolving to reference to the IoTGateway object
     * @memberof IotGateway
     */
    connect() {
        let promise = new Promise((resolve, reject) => {
            this._logger.info('Connecting IOT Gateway');

            // Read the provisioning file to get the serverUrl
            this._readProvisioningFile(this.provisioningFile).
            then((serverUrl) => {
                this._serverUrl = serverUrl;
                this._cwClient = new CWClient(this._serverUrl);

                return this._createCustomDeviceModels();
            }).
            then(() => this._getIoTGateway()).
            then(() => this._getDeviceModels()).
            then((deviceModels) => {
                //this._logger.debug('Device models', deviceModels);
                try {
                    deviceModels.forEach((deviceModel) => {
                        if (this.deviceModels[deviceModel.name]) {
                            this.deviceModels[deviceModel.name].deviceModel = deviceModel;
                        }
                    });
                    resolve(this);
                } catch (err) {
                    this._logger.error(err);
                    reject(err);
                }
            }).
            catch((err) => {
                this._logger.error(err);
                reject(err);
            });
        });
        return promise;
    }

    _readProvisioningFile(fileName) {
        return new Promise((resolve, reject) => {
            try {
                readFile(fileName).
                then((buf) => {
                    let data = buf.toString().split('\n');
                    let serverUriLine = data.find((ele) => ele.startsWith('#serverUri'));
                    if (serverUriLine) {
                        resolve(serverUriLine.substr(serverUriLine.indexOf(':') + 1));
                    } else {
                        reject(new Error('Invalid device provisioning file'));
                    }
                });
            } catch (err) {
                this._logger.error(`Failed to read ${fileName}`);
                reject(err);
            }
        });
    }


    /**
     * Register an indirectly connected device and log in to associated user
     *
     * @param       {string}    deviceAddress   Device hardware address
     * @returns     {Promise}   CWDevice    Promise resolving to the CWDevice object
     * @memberof    IotGateway
     */
    registerDevice(deviceAddress) {
        return new Promise((resolve, reject) => {
            let metaData = {
                manufacturer: 'MbientLabs Inc',
                modelNumber: 'MetamotionR'
            };
            if (this._registeredDevices[deviceAddress] === undefined) {
                this._logger.debug('Register device', deviceAddress);
                this._gateway.registerDevice(false, deviceAddress, metaData, this._deviceModelUrns, (deviceId, error) => {
                    if (error) {
                        this._logger.error(`Failed to register device ${deviceAddress}`);
                        this._logger.error(error);
                        reject(error);
                    } else {
                        let virtualDevices = new Map();
                        for (let dm in this.deviceModels) {
                            this._logger.debug('Creating virtual device ', dm);
                            virtualDevices.set(dm, this._gateway.createVirtualDevice(deviceId, this.deviceModels[dm].deviceModel));
                        }
                        let cwDevice = this._cwClient.newCWDevice(virtualDevices, deviceAddress, deviceId);
                        this._registeredDevices[deviceAddress] = cwDevice;
	                    resolve(cwDevice);
                    }
                });
            } else {
		        resolve(this._registeredDevices[deviceAddress]);
 	        }
        });
    }

    /**
     * Get the registered CW IoT device for the device address
     *
     * @param {string}           deviceAddress Device address of the device to get
     * @returns  {CWDevice}      CWDevice or undefined if device not yet registered
     * @memberof IotGateway
     */
    getCWDevice(deviceAddress) {
        return this._registeredDevices[deviceAddress];
    }


    _createCustomDeviceModels() {
        this._logger.debug('_createCustomDeviceModels()');
        return new Promise((resolve, reject) => {
            let promises = [];
            let customDeviceModels = [];
            // First check if any of them are already created
            this._cwClient.getCWDeviceModels().
            then((deviceModels) => {
                for (let dm in Constants.CUSTOM_DEVICE_MODELS) {
                    let exists = deviceModels.items.find((item) => item.urn === Constants.CUSTOM_DEVICE_MODELS[dm].DEVICE_MODEL.urn);
                    if (exists) {
                        this._deviceModelUrns.push(Constants.CUSTOM_DEVICE_MODELS[dm].DEVICE_MODEL.urn);
                        this.deviceModels[Constants.CUSTOM_DEVICE_MODELS[dm].NAME] = {
                            deviceModel: null,
                            urn: Constants.CUSTOM_DEVICE_MODELS[dm].URN
                        };
                        this._logger.info(`Custom device model ${Constants.CUSTOM_DEVICE_MODELS[dm].DEVICE_MODEL.name} already created.`);
                    } else {
                        customDeviceModels.push(Constants.CUSTOM_DEVICE_MODELS[dm].DEVICE_MODEL);
                    }
                }
                customDeviceModels.forEach((dm) => {
                    this._logger.info(`Creating custom device model ${dm.name}`);
                    promises.push(this._cwClient.createAppDeviceModel(dm));
                });
                return Promise.all(promises);
            }).
            then((deviceModels) => {
                deviceModels.forEach((dm) => {
                    this._logger.info(`Custom device model ${dm.name} created`);
                    // Add these URNs to the deviceModelUrns list for device activation
                    this._deviceModelUrns.push(dm.urn);
                    this.deviceModels[dm.name] = {
                        deviceModel: null,
                        urn: dm.urn
                    };
                });
                resolve();
            }).
            catch((err) => {
                this._logger.debug(`Failed to create custom device models`);
                this._logger.debug(err);
                reject(err);
            });
        });
    }

    _getDeviceModels() {
        this._logger.debug('_getDeviceModels()');
        let promises = [];

        for (let dm of this._deviceModelUrns) {
            this._logger.debug(dm);
            let promise = new Promise((resolve, reject) => {
                // Workaround to avoid choking iotcs API. For some reason submitting multiple getDeviceModel() in succession
                // causes it choke or takes a long time to return results.
                // Submitting request with a 2 second delay seems to work on a Pi 3
                setTimeout(() => {
                    this._gateway.getDeviceModel(dm, (deviceModel, error) => {
                        if (error) {
                            reject({
                                error: `Failed to get device model ${dm}`,
                                errorDetails: `Failed to get device model  ${dm}, error = ${error}`
                            });
                        } else {
                            this._logger.debug(`  Device model ${deviceModel.name}`);
                            resolve(deviceModel);
                        }
                    });
                }, 2000);

            });
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    // _getCWDeviceModel() {
    //     this._logger.debug(`Getting device model for ${Constants.CW_DEVICE_MODEL_URN}`);
    //     return new Promise((resolve, reject) => {
    //         this._gateway.getDeviceModel(Constants.CW_DEVICE_MODEL_URN, (response, error) => {
    //             if (error) {
    //                 this._logger.error(`Failed to get device model for ${Constants.CW_DEVICE_MODEL_URN}`);
    //                 this._logger.error(error);
    //                 reject(error);
    //             } else {
    //                 this._cwDeviceModel = response;
    //                 this._logger.debug('CW device model fetched successfully.');
    //                 resolve(response);
    //             }
    //         });
    //     });
    // }

    // _activate(reject, resolve) {
    //     this._logger.debug('Activating gatway');
    //     this._gateway.activate(Object.values(cwDeviceModels), (activatedGateway, error) => {
    //         if (activatedGateway === null) {
    //             this._logger.error('Failed to activate gateway');
    //             this._logger.error(error);
    //             reject(error);
    //         } else {
    //             this._logger.info('IoT Gateway activated');
    //             resolve();
    //         }
    //     });
    // }

    _getIoTGateway() {
        this._logger.debug('_getIoTGateway()');
        return new Promise((resolve, reject) => {
            this._gateway = new iotcs.device.GatewayDevice(this.provisioningFile, this.provisioningPassword);
            if (this._gateway.isActivated()) {
                resolve(this._gateway);
            } else {
                this._logger.debug('Activating gateway');
                this._gateway.activate(this._deviceModelUrns, (activatedGateway, error) => {
                    if (error) {
                        this._logger.error('Failed to activate gateway');
                        this._logger.error(error);
                        reject(error);
                    } else {
                        this._logger.info('IoT Gateway activated');
                        resolve(this._gateway);
                    }
                });
            }
        });
    }
}

module.exports.IotGateway = IotGateway;
