/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

//@TODO: missing JSDOC

/**
 * @class
 */
/** @ignore */
iotcs.enterprise.impl.Data = class {
    constructor(dataSpec) {
        _mandatoryArg(dataSpec, 'object');

        if (!dataSpec.urn) {
            iotcs.error('The data specification in the device model is incomplete.');
            return;
        }

        this._spec = {
            _description: (dataSpec.description || ''),
            _fields: (dataSpec.value && dataSpec.value.fields)? dataSpec.value.fields : null,
            _name: (dataSpec.name || null),
            _urn: dataSpec.name
        };

        this.__onData = arg => {};
    }

    /** @private */
    _formatsLocalUpdate(formats, virtualDevice, callback) {
        if (this.spec._fields) {
            let index = 0;

            this._spec._fields.forEach(field => {
                if (field.type === "URI") {
                    let url = formats[0].fields[field.name];

                    if (_isStorageCloudURI(url)) {
                        virtualDevice._client._createStorageObject(url, (storage, error) => {
                            if (error) {
                                iotcs.error('Error during creation storage object: ' + error);
                                return;
                            }

                            let storageObject = new iotcs.enterprise.StorageObject(storage.getURI(),
                                storage.getName(), storage.getType(), storage.getEncoding(),
                                storage.getDate(), storage.getLength());

                            storageObject._setDevice(virtualDevice);
                            storageObject._setSyncEventInfo(field.name, virtualDevice);

                            formats[0].fields[field.name] = storageObject;
                            ++index;

                            if (callback && index === this._spec.fields.length) {
                                callback();
                            }
                        });
                    } else {
                        formats[0].fields[field.name] = new iotcs.ExternalObject(url);
                        ++index;
                    }
                } else {
                    ++index;
                }
            });

            if (callback && index === this._spec._fields.length) {
                callback();
            }
        }
    }

    // Private/protected members 
    get _description() {
        return this._spec._description;
    }

    get _name() {
        return this._spec._name;
    }

    get _onData() {
        return this.__onData;
    }

    get _urn() {
        return this._spec._urn;
    }

    set _onData(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onData that is not a function!');
            return;
        }

        this.__onData = newFunction;
    }
};
