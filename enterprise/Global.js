/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @namespace
 * @alias iotcs.enterprise
 * @memberof iotcs
 */
iotcs.enterprise = {};

//////////////////////////////////////////////////////////////////////////////
// Namespaces for internal enterprise implementation classes
iotcs.impl = iotcs.impl || {}; 
iotcs.enterprise.impl = iotcs.enterprise.impl || {}; 

//////////////////////////////////////////////////////////////////////////////
// Namespaces for public properties.

/** @ignore */
iotcs.oracle = iotcs.oracle || {};

/** @ignore */
iotcs.oracle.iot = iotcs.oracle.iot || {};

/** @ignore */
iotcs.oracle.iot.client = iotcs.oracle.iot.client || {};

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.oracle.iot.client.pageable = iotcs.oracle.iot.client.pageable || {};

/**
 * Default limit of items retrieved for each page when using
 * Pageable functionality
 *
 * @name iotcs․oracle․iot․client․pageable․defaultLimit
 * @global
 * @type {number}
 * @default 50
 */
iotcs.oracle.iot.client.pageable.defaultLimit = iotcs.oracle.iot.client.pageable.defaultLimit || 50;

//////////////////////////////////////////////////////////////////////////////

/**
 * Default timeout (in milliseconds) used when doing http/https requests.  This can be overridden in
 * certain contexts, like when using the long polling feature.
 *
 * @name iotcs․oracle․iot․client․httpConnectionTimeout
 * @global
 * @type {number}
 * @default 15000
 */
iotcs.oracle.iot.client.httpConnectionTimeout = iotcs.oracle.iot.client.httpConnectionTimeout || 15000;

/** @ignore */
iotcs.oracle.iot.client.monitor = iotcs.oracle.iot.client.monitor || {};

/**
 * The time interval (in milliseconds) used by the monitor (JS interval) as the global thread pool
 * of the iotcs client iotcs.ary.
 * <br>
 * In the enterprise client iotcs.ary, this is the actual polling interval used for virtual device
 * monitoring, message monitoring, and async request response monitoring.
 * <br>
 * In the device client iotcs.ary, this is the minimum polling interval used by the MessageDispatcher
 * for sending/receiving messages.
 *
 * @name iotcs․oracle․iot․client․monitor․pollingInterval
 * @global
 * @type {number}
 * @default device: 1000, enterprise: 3000
 */
iotcs.oracle.iot.client.monitor.pollingInterval = iotcs.oracle.iot.client.monitor.pollingInterval || 3000;

/**
 * The maximum number of alerts/custom formats retrieved
 * by the enterprise client when doing monitoring of
 * virtual devices.
 *
 * @name iotcs․oracle․iot․client․monitor․formatLimit
 * @global
 * @type {number}
 * @default 10
 */
iotcs.oracle.iot.client.monitor.formatLimit = iotcs.oracle.iot.client.monitor.formatLimit || 10;

/**
 * The StorageDispatcher queue size (in number of storage objects),
 * for store and forward functionality.
 *
 * @name iotcs․oracle․iot․client․maximumStorageObjectsToQueue
 * @global
 * @type {number}
 * @default 50
 */
iotcs.oracle.iot.client.maximumStorageObjectsToQueue = iotcs.oracle.iot.client.maximumStorageObjectsToQueue || 50;

/**
 * The Storage Cloud server hostname.
 *
 * @name iotcs․oracle․iot․client․storageCloudHost
 * @global
 * @type {string}
 * @default "storage.oraclecloud.com"
 */
iotcs.oracle.iot.client.storageCloudHost = iotcs.oracle.iot.client.storageCloudHost || "storage.oraclecloud.com";

/**
 * The Storage Cloud server port.
 *
 * @name iotcs․oracle․iot․client․storageCloudPort
 * @global
 * @type {number}
 * @default 443
 */
iotcs.oracle.iot.client.storageCloudPort = iotcs.oracle.iot.client.storageCloudPort || 443;

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.oracle.iot.client.controller = iotcs.oracle.iot.client.controller || {};

/**
 * The maximum time (in milliseconds) the enterprise client will wait for a response from any async
 * request made to a device via the cloud service.  These include virtual device attribute updates,
 * actions, and resource invocations.
 *
 * @name iotcs․oracle․iot․client․controller․asyncRequestTimeout
 * @global
 * @type {number}
 * @default 60000
 */
iotcs.oracle.iot.client.controller.asyncRequestTimeout = iotcs.oracle.iot.client.controller.asyncRequestTimeout || 60000;

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.oracle.iot.tam = iotcs.oracle.iot.tam || {};

/**
 * The trusted assets store file path, used as a global configuration, when initializing clients
 * without the trusted assets manager-specific parameters. This is required in a browser
 * environment.
 *
 * @name iotcs․oracle․iot․tam․store
 * @global
 * @type {string}
 * @default 'trustedAssetsStore.json'
 */
iotcs.oracle.iot.tam.store = iotcs.oracle.iot.tam.store || 'trustedAssetsStore.json';

/**
 * The trusted assets store password, used as a global configuration, when initializing clients
 * without the trusted assets manager-specific parameters.  This is required in a browser
 * environment.
 *
 * @name iotcs․oracle․iot․tam․storePassword
 * @global
 * @type {string}
 * @default null
 */
iotcs.oracle.iot.tam.storePassword = iotcs.oracle.iot.tam.storePassword || null;

/**
 * The configuration variable used by the enterprise iotcs.ary, only in a browser environment, to get
 * the iotcs server host and port instead of the trusted assets manager.  If this is not set, the
 * default trusted assets manager is used.
 *
 * @name iotcs․oracle․iot․client․serverUrl
 * @global
 * @type {string}
 * @default null
 */
iotcs.oracle.iot.client.serverUrl = iotcs.oracle.iot.client.serverUrl || null;

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.oracle.iot.client.test = iotcs.oracle.iot.client.test || {};

/** @ignore */
iotcs.oracle.iot.client.test.reqRoot = iotcs.oracle.iot.client.test.reqRoot || '/iot/webapi/v2';

/** @ignore */
iotcs.oracle.iot.client.test.auth = iotcs.oracle.iot.client.test.auth || {};

/** @ignore */
iotcs.oracle.iot.client.test.auth.activated = iotcs.oracle.iot.client.test.auth.activated || false;

/** @ignore */
iotcs.oracle.iot.client.test.auth.user = iotcs.oracle.iot.client.test.auth.user || 'iot';

/** @ignore */
iotcs.oracle.iot.client.test.auth.password = iotcs.oracle.iot.client.test.auth.password || 'welcome1';

/** @ignore */
iotcs.oracle.iot.client.test.auth.protocol = iotcs.oracle.iot.client.test.auth.protocol || 'https';

//////////////////////////////////////////////////////////////////////////////
