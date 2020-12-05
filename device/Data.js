/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The Data is an object that represents a set of custom data fields (key/value pairs)
 * defined in the formats section of the device model. Data can be used
 * to send these fields to the server.
 * <p>
 * The Data API is specific to the device client iotcsrary and the data fields
 * can be created by the VirtualDevice objects or using them.
 * For setting the fields of the data object as defined in the model, the fields
 * property of the data object will be used e.g.:<br>
 * <code>data.fields.temp = 50;</code>
 * <p>
 * The constructor of the Data object should not be used directly but the
 * {@link iotcs.device.VirtualDevice#createData} method should be used
 * for creating data objects.
 *
 * @param {iotcs.device.VirtualDevice} virtualDevice - The virtual device that has in it's device
 *        model the custom format specification.
 * @param {string} formatUrn - The urn format of the custom data fields spec.
 *
 * @alias iotcs.device.Data
 * @class iotcs.device.Data
 * @memberof iotcs.device
 * @see {@link iotcs.device.VirtualDevice#createData}
 */
iotcs.device.Data = class {
    constructor(virtualDevice, formatUrn) {
        _mandatoryArg(virtualDevice, iotcs.device.VirtualDevice);
        _mandatoryArg(formatUrn, 'string');

        let dataSpec = virtualDevice[formatUrn];

        if (!dataSpec.urn || (dataSpec.type !== 'DATA')) {
            iotcs.error('Data specification in device model is invalid.');
            return;
        }

        /**
         * @type {iotcs.device.VirtualDevice}
         *
         * @ignore
         * @private
         */
        this._virtualDevice = virtualDevice;

        let spec = {
            urn: dataSpec.urn,
            description: (dataSpec.description || ''),
            name: (dataSpec.name || null)
        };

        if (dataSpec.value && dataSpec.value.fields && Array.isArray(dataSpec.value.fields)) {
            /**
             * The fields object for this Data.  Specific fields can be referenced by referencing
             * the field name from the fields object.  For example, to reference a field named
             * 'myName', use 'dataName.fields.myName'.
             *
             * @name iotcs.device.Data#fields
             * @public
             * @readonly
             * @type {object}
             */
            this.fields = {};
            let self = this;

            dataSpec.value.fields.forEach(field => {
                self['_' + field.name] = {};
                self['_' + field.name].type = field.type.toUpperCase();
                self['_' + field.name].optional = field.optional;
                self['_' + field.name].name = field.name;
                self['_' + field.name].value = null;

                Object.defineProperty(self.fields, field.name, {
                    enumerable: false,
                    configurable: false,
                    get: () => {
                        return self['_' + field.name].value;
                    },
                    set: newValue => {
                        if (!self['_' + field.name].optional &&
                            ((typeof newValue === 'undefined') || (newValue === null))) {
                            iotcs.error('Trying to unset a mandatory field in the data object.');
                            return;
                        }

                        newValue = iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                            self['_' + field.name]);

                        if (typeof newValue === 'undefined') {
                            iotcs.error('Trying to set an invalid type of field in the data object.');
                            return;
                        }

                        self['_' + field.name].value = newValue;
                    }
                });
            });
        }

        /**
         * The URN of this Data.  This is the Data's device model URN.
         *
         * @name iotcs.device.Data#urn
         * @public
         * @readonly
         * @type {string}
         */
        this.urn = spec.urn;

        /**
         * The name of this Data.
         *
         * @name iotcs.device.Data#name
         * @public
         * @readonly
         * @type {string}
         */
        this.name = spec.name;

        /**
         * The description of this Data.
         *
         * @name iotcs.device.Data#description
         * @public
         * @readonly
         * @type {string}
         */
        this.description = spec.description;

        this._onError = null;
    }

    // Private/protected functions
    /**
     * (Optional)
     * Callback function called when there is an error sending the Data.  May be set to
     * <code>null</code> to un-set the callback.
     *
     * @name iotcs.device.Data#onError
     * @public
     * @type {?iotcs.device.Data~onErrorCallback}
     * @return {?iotcs.device.Data~onErrorCallback} The onError function, or <code>undefined</code>
     *         if it isn't set.
     */
    get onError() {
        return this._onError;
    }

    set onError(newFunction) {
        if (newFunction && (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onError to something that is not a function.');
            return;
        }

        this._onError = newFunction;
    }

    // Public functions
    /**
     * This method is used to actually send the custom data fields to the server.  All mandatory
     * fields (according to the device model definition) must be set before sending, otherwise an
     * error will be thrown.  Any error that can arise while sending will be handled by the Data.
     * onError handler, if set.
     * <p>
     * After a successful send all the values are reset so to send again the values must be first
     * set.
     *
     * @function submit
     * @memberof iotcs.device.Data
     * @public
     * @see {@link iotcs.device.VirtualDevice}
     */
    submit() {
        let message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(this._virtualDevice.getEndpointId())
            .format(this.urn);

        message.onError = this.onError;

        let messageDispatcher =
            new iotcs.device.util.MessageDispatcher(this._virtualDevice._dcd._internalDev);
        let storageObjects = [];
        let toClear = [];

        for (const key in this) {
            if ((key !== 'onError')  && key.startsWith('_')) {
                let field = this[key];

                // Check if it's a data field.
                if (field.hasOwnProperty('optional') && field.hasOwnProperty('type')) {
                    if (!field.optional &&
                        ((typeof field.value === 'undefined') || (field.value === null)))
                    {
                        toClear = [];
                        iotcs.error('Some mandatory fields are not set.');
                        return;
                    }

                    if ((typeof field.value !== 'undefined') && (field.value !== null)) {
                        if ((field.type === "URI") && (field.value instanceof iotcs.StorageObject)) {
                            let syncStatus = field.value.getSyncStatus();

                            if (syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC ||
                                syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING)
                            {
                                storageObjects.push(field.value);
                            }

                            field.value._setSyncEventInfo(key, this._virtualDevice);

                            let syncEvent = new iotcs.device.StorageObject.SyncEvent(field.value,
                                field.value.name, this._virtualDevice);

                            field.value.sync();
                        }

                        message.dataItem(key.substring(1), field.value);
                    }
                }
            }
        }

        storageObjects.forEach(storageObject => {
            messageDispatcher._addStorageDependency(storageObject, message._properties.clientId);
        });

        messageDispatcher.queue(message);

        toClear.forEach(item => {
            item.value = null;
        });
    }
};

// Callback JSDocs.
/**
 * Callback function called when there is an error sending the Data.
 *
 * @callback iotcs.device.Data~onErrorCallback
 *
 * @param {string} error - The error which occurred when sending this Data.
 */
