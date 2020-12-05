/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An Action specification, based on a JSON representation of the action specification.
 *
 * @param {string} actionSpec - A JSON string which represents the specification of this action.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.ActionSpec = class extends iotcs.impl.ActionSpecBase {
    /**
     *
     * @param {string} actionSpec - A JSON string which represents the specification of this action.
     */
    constructor(actionSpec) {
        super(actionSpec);
        this._onAction = null;
    }

    /**
     * Legacy argument verifier.  Verifies single-argument actions.
     * Verifies that the argument, based on the Action specification, is an argument for the Action.
     *
     * @param {string} argName - The name of the argument to check.
     * @param {*} argValue - The value of the argument to check.
     * @param {VirtualDevice} virtualDevice - The virtual device this argument is for.
     * @param {function({string}, {*}, {VirtualDevice}, {function})} callback - The function to call
     *        back with the results.
     * @returns {*} The original argument if it passes validation, the URI if it's an
     *          ExternalObject, or <code>null</code>.
     *
     * @ignore
     * @private
     */
    _validateArgument(argName, argValue, virtualDevice, callback) {
        let isUriCallback = false;

        if (!this._spec.argType) {
            if (typeof argValue !== 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return;
            }
        } else {
            if (typeof argValue === 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return;
            }

            if (this._spec.argType === 'URI') {
                if (argValue instanceof iotcs.ExternalObject) {
                    argValue = argValue.getURI();
                } else if (typeof argValue === 'string') {
                    // Get URI from server
                    if (_isStorageCloudURI(argValue)) {
                        isUriCallback = true;

                        //DJM: Not sure which createStorageObject should be called here.
                        virtualDevice._client._internalDev._createStorageObject(argValue,
                            (storage, error) => {
                                if (error) {
                                    iotcs.error('Error during creation storage object: ' + error);
                                    return;
                                }

                                let storageObject = new iotcs.device.StorageObject(storage.getURI(),
                                    storage.getName(), storage.getType(), storage.getEncoding(),
                                    storage.getDate(), storage.getLength());

                                storageObject._setDevice(virtualDevice._client._internalDev);
                                storageObject._setSyncEventInfo(this.spec.name, virtualDevice);

                                if (!iotcs.device.impl.Attribute._matchType(this._spec.argType, storageObject)) {
                                    iotcs.error('Type mismatch; action "' + this._spec.name +
                                        '" requires arg type [' + this._spec.argType + '].');

                                    return;
                                }

                                // TODO: DJM: Do we need to add the argName and virtualDevice here?
                                callback(storageObject);
                            });

                        return;
                    } else {
                        argValue = new iotcs.ExternalObject(argValue);
                    }
                } else {
                    iotcs.error('Invalid URI parameter.');
                    return;
                }
            }

            if (!iotcs.device.impl.Attribute._matchType(this._spec.argType, argValue)) {
                iotcs.error('Type mismatch; action "' + this._spec.name + '" requires arg type [' +
                    this._spec.argType + '].');
                return;
            }

            if (this._spec.range &&
                ((argValue < this._spec.range.low) || (argValue > this._spec.range.high)))
            {
                iotcs.error('Trying to use an argument which is out of range [' +
                    this._spec.range.low + ' - ' + this._spec.range.high + '].');
                return;
            }
        }

        if (!isUriCallback) {
            callback(argName, argValue, virtualDevice, true);
        }
    }

    /**
     * New argument verifier.  Verifies Multiple-argument actions.
     * Verifies that the arguments, based on the Action specification, are arguments for the Action.
     *
     * @param {object[]} args
     * @param {VirtualDevice} virtualDevice
     * @param {callback(object[], VirtualDevice, boolean)} callback
     *
     * @ignore
     * @private
     */
    _validateArguments(args, virtualDevice, callback) {
        let newArgs = null;
        let hasUriCallback = false;

        for (let arg of args) {
            let argName = arg.key;
            let argValue = arg.value;
            let argSpec = undefined;

            for (let arg of this._spec.args) {
                if (arg.name === argName) {
                    argSpec = arg;
                    break;
                }
            }

            if (argSpec.type === 'URI') {
                if (argValue instanceof iotcs.ExternalObject) {
                    argValue = argValue.getURI();
                } else if (typeof arg === 'string') {
                    if (_isStorageCloudURI(argValue)) {
                        hasUriCallback = true;

                        //DJM: Not sure which createStorageObject should be called here.
                        virtualDevice._client._internalDev.createStorageObject(arg,
                            (storage, error) => {
                                if (error) {
                                    iotcs.error('Error during creation storage object: ' + error);
                                    return;
                                }

                                let storageObject =
                                    new iotcs.device.StorageObject(storage.getURI(),
                                        storage.getName(), storage.getType(),
                                        storage.getEncoding(), storage.getDate(),
                                        storage.getLength());

                                storageObject._setDevice(virtualDevice._client._internalDev);
                                storageObject._setSyncEventInfo(argSpec.name, virtualDevice);

                                if (!iotcs.device.impl.Attribute._matchType(argSpec.type, storageObject)) {
                                    iotcs.error('Type mismatch for action "' + argSpec.name +
                                        '" requires arg type [' + argSpec.type + '].');

                                    return;
                                }

                                newArgs = newArgs ? newArgs : new {};
                                newArgs.push({'key': argName, 'value': argValue});
                            });
                    } else {
                        argValue = new iotcs.ExternalObject(argValue);
                    }
                } else {
                    iotcs.error('Invalid URI parameter.');
                    return;
                }
            }

            if (!iotcs.device.impl.Attribute._matchType(argSpec.type, argValue)) {
                iotcs.error('Type mismatch for action "' + argSpec.name + '," requires arg type [' +
                    argSpec.type + '].');
                return;
            }

            if (argSpec.range &&
                ((argValue < argSpec.range.low) || (argValue > argSpec.range.high)))
            {
                iotcs.error('Trying to use an argument which is out of range: [' + argSpec.range.low +
                    ' - ' + argSpec.range.high + '].');
                return;
            }

            newArgs = (newArgs !== null) ? newArgs : [];
            newArgs.push({'key': argName, 'value': argValue});
        }

        if (!hasUriCallback) {
            callback(args, virtualDevice, true);
        }
    }
};

