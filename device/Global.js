/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// The iotcs namespace is defined in the shared area.
/**
 * Namespace for public classes.
 * 
 * @namespace
 * @alias iotcs.device
 * @memberof iotcs
 */
iotcs.device = {};

//////////////////////////////////////////////////////////////////////////////
// Namespaces for internal device implementation classes.
iotcs.device.impl = iotcs.device.impl || {};

//////////////////////////////////////////////////////////////////////////////
// Namespaces for public properties.
/** @ignore */
iotcs.oracle = iotcs.oracle || {};

/** @ignore */
iotcs.oracle.iot = iotcs.oracle.iot || {};

/** @ignore */
iotcs.oracle.iot.client = iotcs.oracle.iot.client || {};

/** @ignore */
iotcs.oracle.iot.client.device = iotcs.oracle.iot.client.device || {};

/** @ignore */
iotcs.oracle.iot.client.httpConnectionTimeout =
    iotcs.oracle.iot.client.httpConnectionTimeout || 15000;

/** @ignore */
iotcs.oracle.iot.client.monitor = iotcs.oracle.iot.client.monitor || {};

/** @ignore */
iotcs.oracle.iot.client.monitor.pollingInterval =
    iotcs.oracle.iot.client.monitor.pollingInterval || 1000;

/** @ignore */
iotcs.oracle.iot.client.use_webapi = iotcs.oracle.iot.client.use_webapi || false;

/** @ignore */
iotcs.oracle.iot.tam = iotcs.oracle.iot.tam || {};

/** @ignore */
iotcs.oracle.iot.tam.store = iotcs.oracle.iot.tam.store || './trustedAssetsStore.json';

/** @ignore */
iotcs.oracle.iot.tam.storePassword = iotcs.oracle.iot.tam.storePassword || null;

//////////////////////////////////////////////////////////////////////////////
/**
 * Disable prefixing the storage object's name with the device's client ID and a directory
 * separator.
 *
 * @default false
 * @global
 * @name iotcs․oracle․iot․client․disableStorageObjectPrefix
 * @type {boolean}
 */
iotcs.oracle.iot.client.disableStorageObjectPrefix =
    iotcs.oracle.iot.client.disableStorageObjectPrefix || true;

/**
 * If this is set, the long polling feature is disabled and the global monitor is used for receiving
 * messages by the device client library.
 *
 * @name iotcs․oracle․iot․client․device․disableLongPolling
 * @global
 * @type {boolean}
 * @default false
 */
iotcs.oracle.iot.client.device.disableLongPolling =
    iotcs.oracle.iot.client.device.disableLongPolling || false;

/**
 * Offset time (in milliseconds) added by the framework when using the device client receive method
 * with the timeout parameter set.
 *
 * @name iotcs․oracle․iot․client․device․longPollingTimeoutOffset
 * @global
 * @type {number}
 * @default 100
 */
iotcs.oracle.iot.client.device.longPollingTimeoutOffset =
    iotcs.oracle.iot.client.device.longPollingTimeoutOffset || 100;

/**
 * If this is set, the device client library is allowed to use draft device models when retrieving
 * the models and when activating clients. If this is not set and getDeviceModel method returns a
 * draft devices model, an error will be thrown.
 *
 * @name iotcs․oracle․iot․client․device․allowDraftDeviceModels
 * @global
 * @type {boolean}
 * @default false
 */
iotcs.oracle.iot.client.device.allowDraftDeviceModels =
    iotcs.oracle.iot.client.device.allowDraftDeviceModels || false;

/**
 * The size of the buffer (in bytes) used to store received
 * messages by each device client.
 *
 * @name iotcs․oracle․iot․client․device․requestBufferSize
 * @global
 * @type {number}
 * @default 4192
 */
iotcs.oracle.iot.client.device.requestBufferSize =
    iotcs.oracle.iot.client.device.requestBufferSize || 10000;

/**
 * The MessageDispatcher queue size (in number of messages),
 * for store and forward functionality.
 *
 * @name iotcs․oracle․iot․client․device․maximumMessagesToQueue
 * @global
 * @type {number}
 * @default 1000
 */
iotcs.oracle.iot.client.device.maximumMessagesToQueue =
    iotcs.oracle.iot.client.device.maximumMessagesToQueue || 1000;

/**
 * The StorageDispatcher queue size (in number of storage objects),
 * for store and forward functionality.
 *
 * @name iotcs․oracle․iot․client․maximumStorageObjectsToQueue
 * @global
 * @type {number}
 * @default 50
 */
iotcs.oracle.iot.client.maximumStorageObjectsToQueue =
    iotcs.oracle.iot.client.maximumStorageObjectsToQueue || 50;

/**
 * The Storage Cloud server token validity period in minutes.
 *
 * @name iotcs․oracle․iot․client․storageTokenPeriod
 * @global
 * @type {number}
 * @default 30
 */
iotcs.oracle.iot.client.storageTokenPeriod = iotcs.oracle.iot.client.storageTokenPeriod || 30;

/**
 * The Storage Cloud server hostname.
 *
 * @name iotcs․oracle․iot․client․storageCloudHost
 * @global
 * @type {string}
 * @default "storage.oraclecloud.com"
 */
iotcs.oracle.iot.client.storageCloudHost =
    iotcs.oracle.iot.client.storageCloudHost || "storage.oraclecloud.com";

/**
 * The Storage Cloud server port.
 *
 * @name iotcs․oracle․iot․client․storageCloudPort
 * @global
 * @type {number}
 * @default 443
 */
iotcs.oracle.iot.client.storageCloudPort = iotcs.oracle.iot.client.storageCloudPort || 443;

/**
 * The maximum number of messages sent by the MessagesDispatcher
 * in one request.
 *
 * @name iotcs․oracle․iot․client․device․maximumMessagesPerConnection
 * @global
 * @type {number}
 * @default 100
 */
iotcs.oracle.iot.client.device.maximumMessagesPerConnection =
    iotcs.oracle.iot.client.device.maximumMessagesPerConnection || 100;

/**
 * The actual polling interval (in milliseconds) used by the MessageDispatcher for sending/receiving
 * messages.  If this is lower than iotcs․oracle․iot․client․monitor․pollingInterval, then that
 * variable will be used as polling interval.
 * <br>
 * This is not used for receiving messages when iotcs․oracle․iot․client․device․disableLongPolling is
 * set to <code>false</code>.
 *
 * @default 3000
 * @global
 * @name iotcs․oracle․iot․client․device․defaultMessagePoolingInterval
 * @type {number}
 */
iotcs.oracle.iot.client.device.defaultMessagePoolingInterval =
    iotcs.oracle.iot.client.device.defaultMessagePoolingInterval || 3000;

/**
 * Controls the number of times a message is retried if the message cannot be sent.  A message with
 * a reliability of no-guarantee is retried this number of times.  A message with a reliability of
 * best-effort is retried twice this number of times.  A message with a reliability of
 * guaranteed-delivery is retried an unlimited number of times.  The value must be greater than
 * zero.
 *
 * @default 3
 * @global
 * @name iotcs․oracle․iot․client․device․messageDispatcherBaseNumberOfRetries
 * @type {number}
 */
iotcs.oracle.iot.client.device.messageDispatcherBaseNumberOfRetries =
    iotcs.oracle.iot.client.device.messageDispatcherBaseNumberOfRetries || 3;

/**
 * Default name of the database used for persisting data.
 *
 * @default msps.sqlite
 * @global
 * @name iotcs․oracle․iot․client․device․persistenceDbName
 * @type {string}
 */
iotcs.oracle.iot.client.device.persistenceDbName =
    iotcs.oracle.iot.client.device.persistenceDbName || 'msps.sqlite';

/**
 * If <code>true</code>, the client library will persist data.
 *
 * @default true
 * @global
 * @name iotcs․oracle․iot․client․device․persistenceEnabled
 * @type {boolean}
 */
iotcs.oracle.iot.client.device.persistenceEnabled =
    iotcs.oracle.iot.client.device.persistenceEnabled || true;

