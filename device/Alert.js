/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The Alert is an object that represents an alert type message format defined in the formats
 * section of the device model. Alerts can be used to send alert messages to the server.
 * <p>
 * The Alert API is specific to the device client library and the alerts can be created by the
 * VirtualDevice objects or using them.  For setting the fields of the alert as defined in the
 * model, the fields property of the alert will be used e.g.:<br>
 * <code>alert.fields.temp = 50;</code>
 * <p>
 * The constructor of the Alert should not be used directly but the
 * {@link iotcs.device.VirtualDevice#createAlert} method should be used for creating alert objects.
 *
 * @alias iotcs.device.Alert
 * @class iotcs.device.Alert
 * @memberof iotcs.device
 * @see {@link iotcs.device.VirtualDevice#createAlert}
 *
 * @param {iotcs.device.VirtualDevice} virtualDevice - The virtual device that has in it's device
 *        model the alert specification.
 * @param {string} formatUrn - The URN format of the alert spec.
 */
iotcs.device.Alert = class {
    constructor(virtualDevice, formatUrn) {
        _mandatoryArg(virtualDevice, iotcs.device.VirtualDevice);
        _mandatoryArg(formatUrn, 'string');

        let alertSpec = virtualDevice[formatUrn];

        if (!alertSpec.urn || (alertSpec.type !== 'ALERT')) {
            iotcs.error('Alert specification in device model is invalid.');
            return;
        }

        /**
         * The virtual device that has in it's device model the alert specification.
         *
         * @type {iotcs.device.VirtualDevice}
         * @ignore
         */
        this._virtualDevice = virtualDevice;
        this._onError = null;

        this._spec = Object.freeze({
            urn: alertSpec.urn,
            description: (alertSpec.description || ''),
            name: (alertSpec.name || null)
        });

        if (alertSpec.value && alertSpec.value.fields && Array.isArray(alertSpec.value.fields)) {
            let tmpFields = {};

            // Add each field as a private property (with a leading underscore) on this.
            alertSpec.value.fields.forEach(field => {
                let fieldName = field.name;

                this[fieldName] = {};
                this[fieldName].type = field.type.toUpperCase();
                this[fieldName].optional = field.optional;
                this[fieldName].name = field.name;
                this[fieldName].value = null;

                // TODO: Update to ES6
                Object.defineProperty(tmpFields, fieldName, {
                    enumerable: false,
                    configurable: false,
                    get: () => {
                        return this[fieldName].value;
                    },
                    set: newValue => {
                        if (!this[fieldName].optional &&
                            ((typeof newValue === 'undefined') || (newValue === null)))
                        {
                            iotcs.error('Trying to unset a mandatory field in the alert.');
                            return;
                        }

                        newValue =
                            iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                                this[fieldName]);

                        if (typeof newValue === 'undefined') {
                            iotcs.error('Trying to set an invalid type of field in the alert.');
                            return;
                        }

                        this[fieldName].value = newValue;
                    }
                });
            });

            /**
             * The fields object for this Alert.  Specific fields can be referenced by referencing
             * the field name from the fields object.  For example, to reference a field named
             * 'myName', use 'alertName.fields.myName'.
             *
             * @name iotcs.device.Alert#fields
             * @public
             * @readonly
             * @type {object}
             */
            this.fields = Object.freeze(tmpFields);
        }
    }

    // Public functions
    /**
     * The description of this Alert.
     *
     * @name iotcs.device.Alert#description
     * @public
     * @readonly
     * @type {string}
     */
    get description() {
        return this._spec.description;
    }

    /**
     * The name of this Alert.
     *
     * @name iotcs.device.Alert#name
     * @public
     * @readonly
     * @type {string}
     */
    get name() {
        return this._spec.name;
    }

    /**
     * (Optional)
     * Callback function called when there is an error sending the Alert.  May be set to null to
     * un-set the callback.
     *
     * @name iotcs.device.Alert#onError
     * @public
     * @type {?iotcs.device.Alert~onErrorCallback}
     * @return {?iotcs.device.Alert~onErrorCallback} - The onError function, or
     *         <code>undefined</code>. if it isn't set.
     */
    get onError() {
        return this._onError;
    }

    /**
     * The URN of this Alert.  This is the Alert's device model URN.
     *
     * @name iotcs.device.Alert#urn
     * @public
     * @readonly
     * @type {string}
     */
    get urn() {
        return this._spec.urn;
    }

    /**
     * This method is used to actually send the alert message to the server.  The default severity for
     * the alert sent is SIGNIFICANT. All mandatory fields (according to the device model definition)
     * must be set before sending, otherwise an error will be thrown.  Any error that can arise while
     * sending will be handled by the VirtualDevice.onError handler, if set.
     * <p>
     * After a successful raise all the values are reset so to raise again the values must be first set.
     *
     * @function raise
     * @memberof iotcs.device.Alert
     * @public
     * @see {@link iotcs.device.VirtualDevice}
     */
    raise() {
        let message = iotcs.message.Message.AlertMessage.buildAlertMessage(this.urn, this.description,
            iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

        message.reliability('GUARANTEED_DELIVERY');
        message.source(this._virtualDevice.getEndpointId());
        message.onError = this.onError;

        let messageDispatcher =
            new iotcs.device.util.MessageDispatcher(this._virtualDevice._dcd._internalDev);
        let storageObjects = [];

        for (let key in this) {
            if ((key !== 'onError') && (key != 'fields') && !key.startsWith('_')) {
                let field = this[key];

                if (!field.optional && (!field.value || (typeof field.value === 'undefined'))) {
                    iotcs.error('Some mandatory fields are not set.');
                    return;
                }

                if (field.value && (typeof field.value !== 'undefined')) {
                    if ((field.type === "URI") && (field.value instanceof iotcs.StorageObject)) {
                        let syncStatus = field.value.getSyncStatus();

                        if (syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC ||
                            syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
                            storageObjects.push(field.value);
                        }

                        field.value._setSyncEventInfo(key, this.virtualDevice);
                        field.value.sync();
                    }

                    message.dataItem(key, field.value);
                }
            }
        }

        storageObjects.forEach(storageObject => {
            messageDispatcher._addStorageDependency(storageObject, message._internalObject.clientId);
        });

        messageDispatcher.queue(message);

        for (let key in this) {
            if ((key !== 'onError') && (key != 'fields') && !key.startsWith('_')) {
                if (this[key] && this[key].value) {
                    this[key].value = null;
                }
            }
        }
    }

    set onError(newFunction) {
        if (newFunction && (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onError to something that is not a function.');
            return;
        }

        this._onError = newFunction;
    }
};


// Callback JSDocs.
/**
 * Callback function called when there is an error sending the Alert.
 *
 * @callback iotcs.device.Alert~onErrorCallback
 *
 * @param {string} error - The error which occurred when sending this Alert.
 */
