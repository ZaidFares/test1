/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @classdesc
 * A class that implements a way of getting device applications.
 *
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        application context for which the deviceApps need to be enumerated.
 *
 * @alias iotcs.enterprise.DeviceAppEnumerator
 * @class iotcs.enterprise.DeviceAppEnumerator
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.DeviceAppEnumerator = class {
    constructor(client) {
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);
        this._client = client;
    }

    /**
     * Return the list of deviceApps from the enterprise client context.
     *
     * @function getDeviceApps
     * @memberof iotcs.enterprise.DeviceAppEnumerator
     *
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain deviceApps as items.
     */
    getDeviceApps(filter) {
        _optionalArg(filter, iotcs.enterprise.Filter);

        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path: iotcs.impl._reqRoot +
                '/apps/' + this._client._appid +
                '/deviceApps'
                + (filter ? ('?q=' + filter.toString()) : '')
        }, '', null, this._client);
    }
};
