/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The Pageable is a utility class used by the implementation of some operations of this library
 * that retrieve requested data page by page. This processor is typically returned on
 * {@link iotcs.enterprise.EnterpriseClient#getApplications} or
 * {@link iotcs.enterprise.EnterpriseClient#getDevices}.
 * <p>
 * In the usage of the Pageable object the application has to take into account the state of the
 * object. The state of the object can be changed by using the
 * {@link iotcs.enterprise.Pageable#page} method.
 * <p>
 * The object can have 3 states:<br>
 * a. In the first state the Pageable object is created and this can be
 * done generally indirectly by using the {@link iotcs.enterprise.EnterpriseClient}
 * methods as stated above.<br>
 * b. From the first state the Pageable object can enter only the second state and
 * only by calling the page with the following parameters:<br>
 * - page('first');<br>
 * - page('first', x);<br>
 * - page(0);<br>
 * - page(0, x);<br>
 * Where x is the actual size of the page requested or if none is given
 * a default size is defined.<br>
 * c. From the second state the Pageable object can enter only the third state
 * by calling page with any parameters defined for the method. Then the object
 * will stay only in the third state.<br>
 * Each transition to a state will return a Promise object that can be used
 * for handling the response/error received for the page request.<br>
 *
 * @example <caption>Pageable Quick Start</caption>
 *
 * // Create the enterprise client.
 * iotcs.enterprise.EnterpriseClient.newClient(entClient => {
 *
 *      // Create the Pageable object.
 *      let pageable = entClient.getActiveDevices('urn:com:oracle:iot:device:humidity_sensor');
 *
 *      let recursivePrevious;
 *      let recursiveNext;
 *
 *      // Function that iterates previous page until start.
 *      recursivePrevious = function () {
 *          pageable.page('prev').then( function (response) {
 *              if (Array.isArray(response.items)) {
 *                  // Handle items.
 *              }
 *              if (pageable.prev) {
 *                  // If there is a prev link present...
 *                  recursivePrevious();
 *              } else {
 *                  // Handle stop.
 *                  entClient.close();
 *              }
 *          }
 *      }
 *
 *      // Function that iterates next page until end.
 *      recursiveNext = function () {
 *          pageable.page('next').then( function (response) {
 *              if (Array.isArray(response.items)) {
 *                  // Handle items.
 *              }
 *              if (response.hasMore) {
 *                  // If there are more items then go next page...
 *                  recursiveNext();
 *              } else if (pageable.prev) {
 *                  // If there are no more items and there is a prev link present, then we have
 *                  // reached the end and can go backwards.
 *                  recursivePrevious();
 *              } else {
 *                  // Handle stop.
 *                  entClient.close();
 *              }
 *          }
 *      }
 *
 *      // Retrieve first page.
 *      pageable.page('first').then( function (response) {
 *          if (Array.isArray(response.items)) {
 *              // Handle items.
 *          }
 *          if (response.hasMore) {
 *              // If there are more items, then there are more pages.
 *              recursiveNext();
 *          } else {
 *              // Handle stop.
 *              entClient.close();
 *          }
 *      }
 * });
 * @param {object} options - The options that are given to the XMLHttpRequest object for making the
 *        initial request without the paging parameters (without offset or limit).
 * @param {string} [payload] - The payload used in the initial and subsequent requests made for
 *        generating the pages.
 * @param {?number} [limit] - The initial limit used for generating the pages requested; optional as
 *        if none is given the default is 50.
 * @param {iotcs.enterprise.EnterpriseClient} [client] - The enterprise client used by this Pageable
 *        object for requests. This is optional and is used only in context of endpoint authentication.
 *
 * @alias iotcs.enterprise.Pageable
 * @class iotcs.enterprise.Pageable
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.Pageable = class {
    // Static private/protected functions
    /** @ignore */
    static _getBasePath(options) {
        if (!options.path || (typeof options.path !== 'string')) {
            iotcs.error('Invalid path for request.');
            return null;
        }

        let index = options.path.indexOf('?');

        if (index < 0) {
            return options.path;
        }

        let query = iotcs.impl.Platform.Query._parse(options.path.substr(index + 1));
        delete query.offset;
        delete query.limit;
        let result = options.path.substr(0, (index + 1)) +
            iotcs.impl.Platform.Query._stringify(query);
        // TODO: Need to understand this; decodeURI is usually applied only on query-parameter
        //       values ... not whole query
        // Added this line because of strange behaviour in browser without it (open a new window then
        // close it).
        result = decodeURI(result);
        return result;
    }

    constructor(options, payload, limit, client) {
        _mandatoryArg(options, 'object');
        _optionalArg(payload, 'string');
        _optionalArg(limit, 'number');
        _optionalArg(client, iotcs.enterprise.EnterpriseClient);

        this._basepath = iotcs.enterprise.Pageable._getBasePath(options);
        this._first = null;
        this._last = null;
        this._limit = limit || iotcs.oracle.iot.client.pageable.defaultLimit;
        this._next = null;
        this._options = options;
        this._payload = payload || '';
        this._prev = null;

        this._enterpriseClientImpl = (client ? client._activeEnterpriseClientImpl: null);
    }

    // Public functions
    /**
     * This method requests a specific page based on the parameters given to it. The method returns a
     * Promise with the parameter given to the handlers (response) in the form of a JSON object
     * representing the actual page requested.
     * <p>
     * A standard page response would have the following useful properties:<br>
     * - items: The array of items representing content of the page.<br>
     * - hasMore: A boolean value that would tell if a 'next' call can be made.<br>
     * - count: The count of all the items that satisfy the request query.
     *
     * @function page
     * @memberof iotcs.enterprise.Pageable
     *
     * @param {(number|string)} offset - This parameter will set where the initial element of the page
     *        to be set; if the parameter is a number then the exact number is the position of the first
     *        element of the page, if the parameter is string then the values can be: 'first', 'last',
     *        'next' and 'prev' and the page requested will be according to link associated to each
     *        setting: 'first page', 'next page' etc.
     * @param {number} [limit] - If the offset is a number, then this parameter will be used to set a
     *        new limit for pages.  If the parameter is not set, the limit used in the constructor
     *        will be used.
     * @returns {Promise} A promise of the response to the requested page.  The promise can be used in
     *          the standard way with .then(resolve, reject) or .catch(resolve) resolve and reject
     *          functions are defined as resolve(response) and reject(error).
     */
    page(offset, limit) {
        _mandatoryArg(offset, ['string', 'number' ]);
        _optionalArg(limit, 'number');

        let _limit = limit || this._limit;

        switch (typeof(offset)) {
        case 'number':
            if (this._basepath) {
                this._options.path = this._basepath +
                    // TODO: Look for cleaner solution than "((this.basepath.indexOf('?') > -1)".
                    ((this._basepath.indexOf('?') > -1) ? '&' : '?') +
                    'offset=' + offset +
                    '&limit=' + _limit;
            }

            break;
        case 'string':
            if ((offset === 'first') && (!this._first)) {
                this._options.path = this._basepath +
                    // TODO: Look for cleaner solution than "((this.basepath.indexOf('?') > -1)".
                    ((this._basepath.indexOf('?') > -1) ? '&' : '?') +
                    'offset=0&limit=' + _limit;
            } else if (['first', 'last', 'next', 'prev'].indexOf(offset) !== -1) {
                if (this[offset]) {
                    this._options.path = this[offset];
                } else {
                    iotcs.error('Invalid request.');
                    return;
                }
            } else {
                iotcs.error('Invalid request.');
                return;
            }
        }

        let self = this;

        let parseLinks = response => {
            this._first = null;
            this._last = null;
            this._next = null;
            this._prev = null;

            if (response.links && Array.isArray(response.links)) {
                let links = response.links;

                links.forEach(link => {
                    if (!link.rel || !link.href){
                        return;
                    }

                    self[link.rel] = link.href;
                });
            }
        };

        let rejectHandle = error => {
            iotcs.createError('Invalid response on pageable request: ', error);
            return;
        };

        let promise = new Promise((resolve, reject) => {
            let request = null;

            request = () => {
                iotcs.impl.Https._bearerReq(self._options, self._payload,
                                                       (response, error) =>
                {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!response || !response.links || !Array.isArray(response.links)) {
                        reject(new Error('Invalid format for Pageable response.'));
                        return;
                    }

                    Object.freeze(response);
                    resolve(response);
                }, request, self._enterpriseClientImpl);
            };
            request();
        });

        promise.then(parseLinks, rejectHandle);
        return promise;
    }
};

