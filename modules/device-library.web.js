/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

(function () {
var name = 'iotcs';
function init(iotcs) {
'use strict';
////////////////////////////////////////////////////////////////////////////////////////////////////
// START

    /**
     * @global
     * @alias iotcs
     * @namespace
     */
    iotcs = iotcs || {};
    iotcs.impl = iotcs.impl || {};

    /**
     * @property {string} iotcs.name - The short name of this library.
     */
    try {
        iotcs.name = iotcs.name || "iotcs";
    } catch(e) {}

    /**
     * @property {string} iotcs.description - The description of this library.
     */
    iotcs.description = "Oracle IoT Cloud Service JavaScript Device Client Software Library";

    /**
     * @property {string} iotcs.version - The version of this library.
     */
    iotcs.version = "19.3.2.0.0-7";

    /**
     * Log an info message
     * @function
     */
    iotcs.log = function (msg) {
        if (iotcs.debug) {
            _log('info', msg);
        }
    };

    /**
     * Throw and log an error message
     * @function
     */
    iotcs.error = function (msg) {
        if (iotcs.debug && console.trace) {
            console.trace(msg);
        }
        _log('error', msg);
        throw '[iotcs:error] ' + msg;
    };

    /**
     * Log and return an error message.
     *
     * @function
     */
    iotcs.createError = function (msg, error) {
        if (iotcs.debug && console.trace) {
            console.trace(msg);
        }
        _log('error', msg);
        if (!error) {
            return new Error('[iotcs:error] ' + msg);
        }
        return error;
    };

    /** @ignore */
    function _log(level, msg) {
        var msgstr = '[iotcs:'+level+'] ' + msg;
        var logDOM = document.getElementById('iotcs-log');
        if (logDOM) {
            logDOM.innerHTML += '<span class="log-'+level+'">' + msgstr + '</span></br>';
        } else {
            console.log(msgstr);
        }
    }

////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Overview.js
//////////////////////////////////////////////////////////////////////////////
/**
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 *
 * @overview
 *
 * The device and enterprise client libraries simplify working with the Oracle IoT Cloud Service.
 * These client libraries are a low–level abstraction over top of messages and REST APIs.
 * Device clients are primarily concerned with sending data and alert messages to the cloud service,
 * and acting upon requests from the cloud service. Enterprise clients are primarily concerned
 * with monitor and control of device endpoints.
 *
 * <h2>Configuration</h2>
 *
 * The client must have a configuration in order to communicate with the cloud service.
 * This configuration includes the IoT Cloud Service host, the identifier of the device
 * or enterprise integration the client represents, and the shared secret of the device
 * or enterprise integration.
 * <p>
 * The configuration is created by using the provisioner tool: provisioner.js. This tool
 * creates a file that is used when running the client application. Usage is available
 * by running the tool with the -h argument.
 *
 * <h2>Device and Enterprise Clients</h2>
 *
 * Prerequisites:<br>
 * - Register your device and/or enterprise application with the Cloud Service.<br>
 * - Provision the device with the credentials obtained from above.<br>
 * - Optionally provision the device model.<br>
 *
 * @example <caption>Device Client Quick Start</caption>
 *
 * //The following steps must be taken to run a device-client application.
 * //The example shows a GatewayDevice. A DirectlyConnectedDevice is identical,
 * //except for registering indirectly-connected devices.
 *
 * // 1. Initialize device client
 *
 *      let gateway = new iotcs.device.util.GatewayDevice(configurationFilePath, password);
 *
 * // 2. Activate the device
 *
 *      if (!gateway.isActivated()) {
 *          gateway.activate([], (device, error) => {
 *              if (!device || error) {
 *                  //handle activation error
 *              }
 *          });
 *
 * // 3. Register indirectly-connected devices
 *
 *      gateway.registerDevice(hardwareId,
 *          {serialNumber: 'someNumber',
 *          manufacturer: 'someManufacturer',
 *          modelNumber: 'someModel'}, ['urn:myModel'],
 *          (response, error) => {
 *              if (!response || error) {
 *                  //handle enroll error
 *              }
 *              indirectDeviceId = response;
 *          });
 *
 * // 4. Register handler for attributes and actions
 *
 *      let messageDispatcher = new iotcs.device.util.MessageDispatcher(gateway);
 *      messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
 *          'deviceModels/urn:com:oracle:iot:device:humidity_sensor/attributes/maxThreshold',
 *          requestMessage => {
 *              //handle attribute update and validation
 *              return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, '');
 *          });
 *
 * // 5. Send data from the indirectly-connected device
 *
 *      let message = new iotcs.message.Message();
 *      message
 *          .type(iotcs.message.Message.Type.DATA)
 *          .source(indirectDeviceId)
 *          .format('urn:com:oracle:iot:device:humidity_sensor' + ":attributes");
 *      message.dataItem('humidity', sensor.humidity);
 *      message.dataItem('maxThreshold', sensor.maxThreshold);
 *      messageDispatcher.queue(message);
 *
 * // 6. Dispose the device client
 *
 *      gateway.close();
 *
 * @example <caption>Enterprise Client Quick Start</caption>
 *
 * //The following steps must be taken to run an enterprise-client application.
 *
 * // 1. Initialize enterprise client
 *
 *      iotcs.enterprise.EnterpriseClient.newClient(applicationName, (client, error) => {
 *          if (!client || error) {
 *              //handle client creation error
 *          }
 *          ec = client;
 *      });
 *
 * // 2. Select a device
 *
 *      ec.getActiveDevices('urn:myModelUrn').page('first').then((response, error) => {
 *          if (!response || error) {
 *              //handle get device model error
 *          }
 *          if(response.items){
 *              response.items.forEach(item => {
 *                  //handle select of an item as a device
 *                  device = item;
 *              });
 *          }
 *      });
 *
 * // 3. Monitor a device
 *
 *      messageEnumerator = new iotcs.enterprise.MessageEnumerator(ec);
 *      messageEnumerator.setListener(device.id, 'ALERT', items => {
 *          items.forEach(item => {
 *              //handle each item as a message received from the device
 *          });
 *      });
 *
 * // 4. List the resources of a device
 *
 *      resourceEnumerator = new iotcs.enterprise.ResourceEnumerator(ec, device.id);
 *      resourceEnumerator.getResources().page('first').then(response => {
 *              response.items.forEach(item => {
 *                  //handle each item as a resource
 *              });
 *      }, error => {
 *          //handle error on enumeration
 *      });
 *
 * // 5. Dispose the enterprise client
 *
 *      ec.close();
 *
 * @example <caption>Storage Cloud Quick Start</caption>
 *
 * // This shows how to use the messaging API to upload content to,
 * // or download content from, the Oracle Storage Cloud Service.
 * // To upload or download content, there must be an attribute, field,
 * // or action in the device model with type URI.
 * // When creating a DataItem for an attribute, field, or action of type URI,
 * // the value is set to the URI of the content in cloud storage.
 *
 * //
 * // Uploading/downloading content without Storage Dispatcher
 * //
 *
 *     let storageObjectUpload = gateway.createStorageObject("uploadFileName", "image/jpg");
 *     storageObjectUpload.setInputStream(fs.createReadStream("upload.jpg"));
 *     storageObjectUpload.sync(uploadCallback);
 *
 *
 *     let messageDispatcher = new iotcs.device.util.MessageDispatcher(gateway);
 *     messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
 *         'deviceModels/urn:com:oracle:iot:device:motion_activated_camera/attributes/image',
 *         requestMessage => {
 *             //handle URI attribute validation, get URI from request message
 *             gateway.createStorageObject(URI, (storageObjectDownload, error) => {
 *                  if (error) {
 *                      // error handling
 *                  }
 *                  // only download if image is less than 4M
 *                  if (storageObjectDownload.getLength() <  4 * 1024 * 1024) {
 *                      storageObjectDownload.setOutputStream(fs.createWriteStream("download.jpg"));
 *                      // downloadCallback have to send response massage
 *                      // using messageDispatcher.queue method
 *                      storageObjectDownload.sync(downloadCallback);
 *                  }
 *             });
 *             return iotcs.message.Message.buildResponseWaitMessage();
 *         });
 *
 * //
 * // Uploading/downloading content with Storage Dispatcher
 * //
 *
 *     let storageDispatcher = new iotcs.device.util.StorageDispatcher(gateway);
 *     storageDispatcher.onProgress = (progress, error) => {
 *          if (error) {
 *              // error handling
 *          }
 *          let storageObject = progress.getStorageObject();
 *          if (progress.getState() === iotcs.StorageDispatcher.Progress.State.COMPLETED) {
 *              // image was uploaded
 *              // Send message with the storage object name
 *              let message = new iotcs.message.Message();
 *              message
 *                   .type(iotcs.message.Message.Type.DATA)
 *                   .source(id)
 *                   .format('CONTENT_MODEL_URN' + ":attributes");
 *              message.dataItem('CONTENT_ATTRIBUTE', storageObject.getURI());
 *
 *          } else if (progress.getState() === iotcs.StorageDispatcher.Progress.State.IN_PROGRESS) {
 *              // if taking too long time, cancel
 *              storageDispatcher.cancel(storageObject);
 *          }
 *     };
 *
 *     let storageObjectUpload = gateway.createStorageObject("uploadFileName", "image/jpg");
 *     storageObjectUpload.setInputStream(fs.createReadStream("upload.jpg"));
 *     storageDispatcher.queue(storageObjectUpload);
 *
 */


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Global.js
//////////////////////////////////////////////////////////////////////////////
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



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/StatusCode.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * List of HTTP status codes and messages.
 *
 * @alias iotcs.StatusCode
 * @class
 */
iotcs.StatusCode = {
    /**
     * Indicates HTTP status code 200 - OK
     */
    OK: 200,
    OK_MESSAGE: 'OK',
    /**
     * Indicates HTTP status code 201 - Created
     */
    CREATED: 201,
    CREATED_MESSAGE: 'Created',
    /**
     * Indicates HTTP status code 202 - Accepted
     */
    ACCEPTED: 202,
    ACCEPTED_MESSAGE: 'Accepted',
    /**
     * Indicates HTTP status code 204 - No Content
     */
    NO_CONTENT: 204,
    NO_CONTENT_MESSAGE: 'No Content',
    /**
     * Indicates HTTP status code 205 - Finished
     */
    FINISHED: 205,
    FINISHED_MESSAGE: 'Finished',
    /**
     * Indicates HTTP status code 206 - Data Finished
     */
    DATA_FINISHED: 206,
    DATA_FINISHED_MESSAGE: 'Data Finished',
    /**
     * Indicates HTTP status code 302 - Found
     */
    FOUND: 302,
    FOUND_MESSAGE: 'Found',
    /**
     * Indicates HTTP status code 400 - Bad Request
     */
    BAD_REQUEST: 400,
    BAD_REQUEST_MESSAGE: 'Bad Request',
    /**
     * Indicates HTTP status code 401 - Unauthorized
     */
    UNAUTHORIZED: 401,
    UNAUTHORIZED_MESSAGE: 'Unauthorized',
    /**
     * Indicates HTTP status code 402 - Payment Required
     */
    PAYMENT_REQUIRED: 402,
    PAYMENT_REQUIRED_MESSAGE: 'Payment Required',
    /**
     * Indicates HTTP status code 403 - Forbidden
     */
    FORBIDDEN: 403,
    FORBIDDEN_MESSAGE: 'Forbidden',
    /**
     * Indicates HTTP status code 404 - Not Found
     */
    NOT_FOUND: 404,
    NOT_FOUND_MESSAGE: 'Not Found',
    /**
     * Indicates HTTP status code 405 - OK
     */
    METHOD_NOT_ALLOWED: 405,
    METHOD_NOT_ALLOWED_MESSAGE: 'Method Not Allowed',
    /**
     * Indicates HTTP status code 406 - Not Acceptable
     */
    NOT_ACCEPTABLE: 406,
    NOT_ACCEPTABLE_MESSAGE: 'Not Acceptable',
    /**
     * Indicates HTTP status code 408 - Request Timeout
     */
    REQUEST_TIMEOUT: 408,
    REQUEST_TIMEOUT_MESSAGE: 'Request Timeout',
    /**
     * Indicates HTTP status code 409 - Conflict
     */
    CONFLICT: 409,
    CONFLICT_MESSAGE: 'Conflict',
    /**
     * Indicates HTTP status code 412 - Precondition Failed
     */
    PRECOND_FAILED: 412,
    PRECOND_FAILED_MESSAGE: 'Precondition Failed',
    /**
     * Indicates HTTP status code 500 - Internal Server Error
     */
    INTERNAL_SERVER_ERROR: 500,
    INTERNAL_SERVER_ERROR_MESSAGE: 'Internal Server Error',
    /**
     * Indicates HTTP status code 501 - Not implemented
     */
    NOT_IMPLEMENTED: 501,
    NOT_IMPLEMENTED_MESSAGE: 'Not Implemented',
    /**
     * Indicates HTTP status code 502 - Bad Gateway
     */
    BAD_GATEWAY: 502,
    BAD_GATEWAY_MESSAGE: 'Bad Gateway',
    /**
     * Indicates HTTP status code 503 - Service Unavailabl
     */
    SERVICE_UNAVAILABLE: 503,
    SERVICE_UNAVAILABLE_MESSAGE: 'Service Unavailable',
    /**
     * Indicates HTTP status code -1 - Other
     */
    OTHER: -1,
    OTHER_MESSAGE: 'Other',
};

Object.freeze(iotcs.StatusCode);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/PlatformBrowser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Shared porting interface for browser.  There may be additions to these classes in the device and
 * enterprise PlatformBrowser.js files, if they exist.
 */

iotcs.impl.Platform = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Platform class

/**
 * @ignore
 */
iotcs.impl.Platform = class {
    // Static private/protected functions
    /**
     * Takes a URL as a string and returns an URL object.
     *
     * @param {string} urlStr - A URL.
     * @returns {URL} {@code true} if the URL is a valid URL.
     * @throws Error if the URL string is not a valid URL.
     */
    static _createUrl(urlStr) {
        return new URL(urlStr);
    }

    static _debug(message) {
        //console.log(message);
    }

    /**
     * Returns a string representation of the specified object. The returned string is typically
     * used for debugging.
     *
     * @param {object} obj the object to "debug".
     * @returns {string} a string representation of the object.
     */
    static _inspect(obj) {
        // DJM: Is this correct?
        return String(obj);
    }

    // Static private/protected functions
    static _userAuthNeeded() {
        return true;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// File
iotcs.impl.Platform.File = class {
    // Static private/protected functions
    static _append(path, data) {
        let originalData = localStorage.getItem(path);

        if (!originalData) {
            iotcs.error('Could not load file: "' + path + '".');
            return;
        }

        localStorage.setItem(path, originalData + data);
    }

    /**
     * Returns {@code true} if the specified file exists in local storage.
     *
     * @param {string} pathFileName the path and name of the file to check if exists.
     * @returns {boolean} {@code true} if the specified file exists in local storage.
     */
    static _exists(pathFileName) {
        return (localStorage.getItem(pathFileName) !== null);
    }

    /**
     * Opens the file with the given path/filename and returns it's contents.
     *
     * @param {string} pathFileName - The path and name of the file to load.
     * @returns {string} the contents of the file, or <code>null</code> if there was a problem opening
     *          the file.
     */
    static _load(pathFileName) {
        let fileContents = localStorage.getItem(pathFileName);

        if (!fileContents) {
            iotcs.error('Could not load file: "' + pathFileName + '"');
            return null;
        }

        return fileContents;
    }

    /**
     * Removes the file with the given path/filename from local storage.
     *
     * @param {string} pathFileName the path and name of the file to remove.
     */
    static _remove(pathFileName) {
        localStorage.removeItem(pathFileName);
    }

    /**
     * Stores the file with the given path/filename in local storage with the data.
     *
     * @param {string} pathFileName the path and name of the file to remove.
     * @param {string} data the data to store in the file.
     */
    static _store(pathFileName, data) {
        localStorage.setItem(pathFileName, data);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared AuthRequest for browser
iotcs.impl.Platform.Https = {};
iotcs.impl.Platform.Https.AuthRequest = {};
iotcs.impl.Platform.Https.AuthRequest._path = '/iot/webapi/v2/private/server';
Object.freeze(iotcs.impl.Platform.Https.AuthRequest);

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared CSRF for browser
iotcs.impl.Platform.Https.Csrf = {};
iotcs.impl.Platform.Https.Csrf._inProgress = false;
iotcs.impl.Platform.Https.Csrf._token = null;
iotcs.impl.Platform.Https.Csrf._tokenName = 'X-CSRF-TOKEN';


////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Os for browser 
iotcs.impl.Platform.Os = class {
    // Static private/protected functions
    static _release() {
        return '0';
    }

    static _type() {
        return window.navigator.platform;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Util for browser
iotcs.impl.Platform.Util = class {
    // Static private/protected functions
    static _atob(str) {
        return atob(str);
    }

    static _btoa(str) {
        return btoa(str);
    }

    static _rng(count) {
        let a = new Array(count);

        for (let i = 0; i < count; i++) {
            a[i] = Math.floor(Math.random()*256);
        }

        return a;
    }

    static _uuidv4() {
        let r16 = iotcs.impl.Platform.Util._rng(16);
        r16[6]  &= 0x0f;  // clear version
        r16[6]  |= 0x40;  // set to version 4
        r16[8]  &= 0x3f;  // clear variant
        r16[8]  |= 0x80;  // set to IETF variant
        let i = 0;

        return _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + '-' +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i++]] +
            _b2h[r16[i++]] + _b2h[r16[i++]] + _b2h[r16[i]];
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Query for browser
iotcs.impl.Platform.Query = class {
    // Static private/protected functions
    static _escape(str) {
        return escape(str);
    }

    static _parse(str, sep, eq, options) {
        let _sep = sep || '&';
        let _eq  = eq  || '=';
        let decodeURIComponent = iotcs.impl.Platform.Query._unescape;
        let obj = {};
        let args = str.split(_sep);
        
        for (let i = 0; i < args.length; i++) {
            let pair = args[i].split(_eq);
            let field = decodeURIComponent(pair[0]);
            let value = decodeURIComponent(pair[1]);

            if (obj[field]) {
                if (!Array.isArray(obj[field])) {
                    let current = obj[field];
                    obj[field] = new Array(current);
                }

                obj[field].push(value);
            } else {
                obj[field] = value;
            }
        }

        return obj;
    }

    static _stringify(obj, sep, eq, options) {
        let _sep = sep || '&';
        let _eq  = eq  || '=';
        let encodeURIComponent = iotcs.impl.Platform.Query._escape;
        let str = '';

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') {
                obj[key].forEach(e => {
                    str += _sep + key + _eq + encodeURIComponent(e);
                });
            } else {
                str += _sep + key + _eq + encodeURIComponent(obj[key]);
            }
        });

        return str.substring(1);
    }

    static _unescape(str) {
        return unescape(str);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/PlatformBrowser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * device porting interface for browser.  This file contains device-specific functions when running
 * in a browser environment.  The classes are defined in shared/PlatformBrowser.js and additional
 * functions are added here for the device-browser environment.
 *
 * Since the JavaScript client library runs under both the web browser and NodeJS, we need a porting
 * layer for both.  Platform is defined in the shared namespace, hence the iotcs.impl namespace
 * instead of using iotcs.device.impl.
 */

if (typeof window === 'undefined') {
    iotcs.error('Invalid target platform.');
}

let _authWindow = null;

////////////////////////////////////////////////////////////////////////////////////////////////////
// device function additions to HTTP for browser
iotcs.impl.Platform.Https.prototype._req = (options, payload, callback) => {
        // If the device has been activated we send the ActivationID as the ClientID.  If the device
        // has not been activated, we send the DeviceID as the ClientID.
        if (options.tam &&
            (typeof options.tam.getTrustAnchorCertificates === 'function') &&
            Array.isArray(options.tam.getTrustAnchorCertificates()) &&
            (options.tam.getTrustAnchorCertificates().length > 0))
        {
            options.ca = options.tam.getTrustAnchorCertificates();
        }

        options.rejectUnauthorized = true;
        options.agent = false;

        if ((options.method === 'GET') && (payload)) {
            iotcs.log('There should be no payload when using GET method; use "path" for passing query.');
        }

        // // If this is the first attempt to access IoT-CS...
        // if ((oracleIoT) && (!iotcs.impl.Platform.Https.Csrf._token) &&
        //    (!iotcs.impl.Platform.Https.Csrf._inProgress))
        // {
        //     iotcs.impl.Platform.Https.Csrf._inProgress = true;
        //     iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, 1, callback);
        // } else {
        //     iotcs.impl.Platform.Https._request(options, payload, callback, oracleIoT);
        // }

        iotcs.impl.Platform.Https._request(options, payload, callback, true);
};

/**
 * This function performs the HTTP request to the IoT CS.
 *
 * @param options The HTTPS options.
 * @param payload The payload to send if any is to be sent.
 * @param callback The callback with the results or error.
 * @param oracleIoT
 */
iotcs.impl.Platform.Https.prototype._request = (options, payload, callback, oracleIoT) => {
    let baseUrl = (options.protocol || 'https') +
        '://' +
        (options.hostname || options.host || 'localhost') +
        (((options.port) && ((options.protocol === 'https' && options.port !== 443)) ||
          (options.protocol === 'http' && options.port !== 80)) ? (':' + options.port) : '');

    let url = baseUrl + (options.path || '/');
    let authUrl = baseUrl + iotcs.impl.Platform.Https.AuthRequest._path;

    if (options.tam
        && (typeof options.tam.getTrustAnchorCertificates === 'function')
        && Array.isArray(options.tam.getTrustAnchorCertificates())
        && (options.tam.getTrustAnchorCertificates().length > 0))
    {
        options.ca = options.tam.getTrustAnchorCertificates();
    }

    options.rejectUnauthorized = true;
    options.protocol = options.protocol + ':';
    options.agent = false;

    let _onNotAuth = () => {
        callback(null, new Error('{"statusCode": ' + iotcs.StatusCode.UNAUTHORIZED +
                                 ', "statusMessage": "Unauthorized", "body": ""}'));
    };

    let xhr = new XMLHttpRequest();

    /**
     * Function which is called when xhr events occur.
     *
     * @param req the request.
     */
    let _onready = req => {
        // req.readyState === 4 indicates the request is done.
        if (req.readyState === 4) {
            if ((req.status === iotcs.StatusCode.FOUND) || (req.status === 0) ||
                (req.responseUrl && req.responseUrl.length &&
                 (decodeURI(req.responseURL) !== url)))
            {
                _onNotAuth();
                return;
            }

            if ((req.status === iotcs.StatusCode.UNAUTHORIZED) ||
                (req.status === iotcs.StatusCode.FORBIDDEN))
            {
                _onNotAuth();
                return;
            }

            if ((req.status === iotcs.StatusCode.OK) || (req.status === iotcs.StatusCode.ACCEPTED)) {
                if (xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName) &&
                    xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName).length)
                {
                    iotcs.impl.Platform.Https.Csrf._token = xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName);
                }

                callback(req.responseText);
            } else {
                callback(null, iotcs.createError(req.responseText));
            }
        }
    };

    xhr.open(options.method, url, true);

    if (oracleIoT) {
        xhr.withCredentials = true;

        if (iotcs.impl.Platform.Https.Csrf._token) {
            xhr.setRequestHeader(iotcs.impl.Platform.Https.Csrf._tokenName, iotcs.impl.Platform.Https.Csrf._token);
        }
    }

    xhr.onreadystatechange = () => {
        _onready(xhr);
    };

    if (options.headers) {
        Object.keys(options.headers).forEach((key, index) => {
            if ((!oracleIoT) && (key === 'Authorization') && (options.auth)) {
                xhr.setRequestHeader(key, options.auth);
            } else {
                xhr.setRequestHeader(key, options.headers[key]);
            }
        });
    }

    xhr.send(payload || null);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// device function additions to OS for browser
/**
 * Returns the line separator for this platform.
 *
 * @returns {string} The line separator for this platform.
 */
iotcs.impl.Platform.Os.prototype._lineSeparator = () => {
    if (navigator.appVersion.indexOf("Win") != -1) {
        return '\r\n';
    }

    return '\n';
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/RestApi.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 */

/**
 * RestApi provides the root path to the REST API version. Setting the property
 * <code>oracle.iot.client.use_webapi</code> to <code>true</code> will cause the code to use
 * <code>/iot/webapi</code> instead of <code>/iot/api</code>.
 */
class RestApi {
   /**
    *
    * @param {string} version
    */
   constructor(version) {
      this.V1 = 'v1';
      this.V2 = 'v2';
      this.isWebApi = iotcs.oracle.iot.client.use_webapi;
      this.reqRoot = this.isWebApi ? '/iot/webapi/' : '/iot/api/' + version;
      this.privateRoot = this.isWebApi ? '/iot/privatewebapi/' : '/iot/privateapi/' + version;
   }

   /**
    *
    * @returns {string}
    */
   getReqRoot() {
      return this.reqRoot;
   }

   /**
    *
    * @returns {string}
    */
   getPrivateRoot() {
      return this.privateRoot;
   }

   /**
    *
    * @returns {boolean}
    */
   isWebApi() {
      return this.isWebApi;
   }
}


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/Impl.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Implementation functions and classes for the shared namespace.
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared global functions expressions
let _b2h = (() => {
    var r = [];

    for (var i = 0; i < 256; i++) {
        r[i] = (i + 0x100).toString(16).substr(1);
    }

    return r;
})();

function _initTam (callback) {
    if ((typeof window !== 'undefined') && iotcs.oracle.iot.client.serverUrl &&
        (typeof iotcs.oracle.iot.client.serverUrl === 'string') &&
        (typeof forge.util.parseUrl(iotcs.oracle.iot.client.serverUrl) === 'object'))
    {
        let parsed = forge.util.parseUrl(iotcs.oracle.iot.client.serverUrl);

        iotcs.impl._tam = {
            getServerHost: function () {
                return parsed.host;
            },
            getServerPort: function () {
                return parsed.port;
            }
        };

        callback();
    } else if (iotcs.oracle.iot.tam.store &&
               (typeof window !== 'undefined') &&
               location.hostname && location.protocol)
    {
        let i = location.protocol.indexOf(':');
        let protocol = (i<0) ? location.protocol : location.protocol.substring(0, i);

        iotcs.impl.Platform.Https._req({
            method: 'GET',
            path: iotcs.oracle.iot.tam.store,
            protocol: protocol,
            hostname: location.hostname,
            port: location.port
        }, '', response => {
            iotcs.impl.Port.File._store(iotcs.oracle.iot.tam.store, response);
            iotcs.impl._tam = new iotcs.enterprise.TrustedAssetsManager();
            callback();
        }, false);
    } else {
        iotcs.impl._tam = (iotcs.enterprise ?
                     new iotcs.enterprise.TrustedAssetsManager() :
                     new iotcs.device.TrustedAssetsManager());
        callback();
    }
}

/** @ignore */
function _httpsTamReq (options, payload, callback) {
    let basePath = null;
    let testPath = null;

    if (options.path.indexOf(iotcs.impl._reqRoot) > -1) {
        basePath = iotcs.impl._reqRoot;
        testPath = (iotcs.oracle.iot.client.test ? iotcs.oracle.iot.client.test.reqRoot : null);
    } else if (iotcs.oracle.iot.client.test &&
               (options.path.indexOf(iotcs.oracle.iot.client.test.reqRoot) > -1))
    {
        basePath = iotcs.oracle.iot.client.test.reqRoot;
    }

    // @TODO: Better way of handling links
    if(options.path &&
       ((options.path.indexOf('http:') === 0) || (options.path.indexOf('https:') === 0)))
    {
        options.path = options.path.substring(options.path.indexOf(basePath));
    }

    let opt = {};
    let oracleIoT = true;

    if (!(options.tam)) {
        options.tam = iotcs.impl._tam;
    }

    if (options.tam) {
        opt.protocol = 'https';
        opt.hostname = options.tam.getServerHost();
        opt.port = options.tam.getServerPort();
    } else if (typeof location !== 'undefined') {
        if (location.protocol) {
            var i = location.protocol.indexOf(':');
            opt.protocol = (i < 0) ? location.protocol : location.protocol.substring(0, i);
        }

        if (location.hostname) {
            opt.hostname = location.hostname;
        }

        if (location.port) {
            opt.port = location.port;
        }

        oracleIoT = false;
    }

    opt.headers = {};
    opt.headers.Accept = 'application/json';
    opt.headers['Content-Type'] = 'application/json';

    //@TODO: Remove basic auth; only for tests and test server
    //@TODO: (jy) use iotcs.debug if this configuration is really/always needed for tests ...
    if (iotcs.oracle.iot.client.test && iotcs.oracle.iot.client.test.auth.activated) {
        opt.protocol = iotcs.oracle.iot.client.test.auth.protocol;
        opt.headers.Authorization = 'Basic ' +
            iotcs.impl.Port.Util._btoa(iotcs.oracle.iot.client.test.auth.user +
                            ':' +
                            iotcs.oracle.iot.client.test.auth.password);

        if (testPath) {
            options.path = options.path.replace(basePath, testPath);
        }
    }

    for (var key in options) {
        if (key === 'headers') {
            for (var header in options.headers) {
                if (options.headers[header] === null) {
                    delete opt.headers[header];
                } else {
                    opt.headers[header] = options.headers[header];
                }
            }
        } else {
            opt[key] = options[key];
        }
    }

    iotcs.impl.Platform.Https._req(opt, payload, (responseBody, error) => {
        if (!responseBody || error) {
            callback(null, error);
            return;
        }
        var responseJson = null;
        try {
            responseJson = JSON.parse(responseBody);
        } catch (e) {

        }
        if (!responseJson || (typeof responseJson !== 'object')) {
            callback(null, iotcs.createError('response not JSON'));
            return;
        }
        callback(responseJson);
    }, oracleIoT);
}

/** @ignore */
function _mandatoryArg(arg, types) {
    if (!arg) {
        iotcs.error('missing argument');
        return;
    }
    __checkType(arg, types);
}

/** @ignore */
function _optionalArg(arg, types) {
    if (!arg) {
        return;
    }
    __checkType(arg, types);
}

/**
 * Determines if the argument is of the type listed in 'type'.
 *
 * @param {?} arg The argument to check.
 * @param type {string} A named type (e.g. 'string').
 * @returns {boolean} {@code true} if arg is of the type listed in 'type'.
 *
 * @ignore
 * @private
 */
function __isArgOfType(arg, type) {
    if ((type === 'array') ||
        (type === 'boolean') ||
        (type === 'function') ||
        (type === 'number') ||
        (type === 'object') ||
        (type === 'string') ||
        (type === 'symbol') ||
        (type === 'undefined'))
    {
        switch (type) {
            case 'array':
                return Array.isArray(arg);
            case 'boolean':
            case 'function':
            case 'number':
                return (typeof(arg) === type);
            case 'object':
                return (arg instanceof Object);
            case 'string':
                return (typeof(arg) === 'string') || (arg instanceof String);
            default:
        }
    } else {
        switch(typeof(type)) {
            case 'function':
            case 'object':
                return (arg instanceof type);
            case 'string':
                return (type==='array') ? Array.isArray(arg) : (typeof(arg) === type);
            default:
        }
    }

    return false;
}

/**
 * Determines if the argument is of a type listed in types.
 *
 * @ignore
 *
 * @param {?} arg The argument to check.
 * @param {string|Array} types Either a named type (e.g. 'string'), or an Array of named types (e.g.
 *         ['string', 'object'}.
 * @throws An Error if the argument is not one of the types listed in 'types'.
 */
function __checkType(arg, types) {
    var argType = typeof(arg);

    if (Array.isArray(types)) {
        var matches = types.some(type => {
            return __isArgOfType(arg, type);
        });

        if (!matches) {
            iotcs.log('Type mismatch: got ' + argType + ' but expecting any of ' + types.toString() +
                '.');
            iotcs.error('Illegal argument type.');
            return;
        }

        return;
    }

    if (!__isArgOfType(arg, types)) {
        iotcs.log('Type mismatch: got ' + argType + ' but expecting ' + types + '.');
        iotcs.error('Illegal argument type.');
    }
}

/**
 * @ignore
 */
function _isEmpty(obj) {
    if (obj === null || (typeof obj === 'undefined')) return true;
    return (Object.getOwnPropertyNames(obj).length === 0);
}

/**
 * Determines if the given URL is a valid storage cloud URI.  Note that this just tests the syntax
 * of the URI, not whether the URL points to a valid storage object web server.
 *
 * Oracle storage cloud host pattern matches URIs that start with
 * https://objectstorage.*.oraclecloud.com
 * or
 * https://*.storage.oraclecloud.com
 *
 * An object name in the storage cloud matches URIs that start with
 * https://objectstorage.*.oraclecloud.com/n/*&#47;/b/*&#47;/o/{object}
 * An object name in the classic storage could matches URIs that start with
 * https://*.storage.oraclecloud.com/v1/*&#47;/*&#47;/{object}
 *
 * Note that patterns make assumptions that the URI string being matched is valid.
 * Note that the port number on the URL is treated as optional.
 * Note that the 'localhost' optional match is for mock server.
 * Note that the use of [^/] is to match any character except the forward slash. This
 * ensures that the object name is correctly grouped for a classic storage URI
 * of the form https://*.storage.oraclecloud.com/v1/* /* /{endpoint-id}/{file-name}. If
 * the pattern was .+ (any character), the match would group just the {file-name}.
 * Alternatively, the pattern .+? (non-greedy match any) could have been used, but
 * 'match any character except forward slash' is easier to understand.
 *
 * Note: *&#47; is '* /' (without the space in the middle).  It's in the doc comment like this as
 *       the two characters together close the doc comment.
 *
 * @param {string} urlStr - A storage cloud URI as a string.
 * @returns {boolean} {@code true} if urlStr is a valid storage cloud URI.
 * @throws An Error if urlStr is not a valid storage cloud URI.
 *
 * @ignore
 */
function _isStorageCloudURI(urlStr) {
    try {
        let url = iotcs.impl.Platform._createUrl(urlStr);
        let pattern = new RegExp('https?://(?:(?:objectstorage\\..+|.+\\.storage)\\.oraclecloud\\.com|localhost).*');
        return pattern.test(url.href);
    } catch(error) {
        return false;
    }
}

// DJM: I don't think this is needed, it's been replaced by iotcs.impl.QueueNode.
//function _queueNode(data) {
//    this.data = data;
//
//    if (data.getJSONObject !== undefined) {
//        this.priority =
//            ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].indexOf(data.getJSONObject().priority);
//    } else {
//        this.priority = 'LOW';
//    }
//}

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared Https
// TODO: Default Trusted Assets Manager (TAM) Integration
/**
 * @ignore
 */
iotcs.impl.Https = class {
    // Private/protected functions
    static _req(options, payload, callback) {
        if (!iotcs.impl._tam && !(options.tam)) {
            _initTam(() => {
                _httpsTamReq(options, payload, callback);
            });
        } else {
            _httpsTamReq(options, payload, callback);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// shared PriorityQueue 
/**
 * @param {array} maxQueue = An array of objects with {data, priority}.
 */
iotcs.impl.PriorityQueue = class {
    constructor(maxQueue) {
        /** @type {QueueNode[]} */
        this._heap = [null];
        this._maxQueue = maxQueue;
    }

    // Private/protected functions
    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    _bubble(i) {
        while (i > 1) {
            let parentIndex = i >> 1; // <=> floor(i/2)

            // If equal, no bubble (maintains insertion order).
            if (!this._isHigherPriority(i, parentIndex)) {
                break;
            }

            this._swap(i, parentIndex);
            i = parentIndex;
        }
    }

    // Returns true if node i is higher priority than j.
    _isHigherPriority(i,j) {
        var prioI = ((this._heap[i] && this._heap[i]._priority) ? this._heap[i]._priority : 0);
        var prioJ = ((this._heap[j] && this._heap[j]._priority) ? this._heap[j]._priority : 0);
        return prioI < prioJ;
    }

    // Removes and returns the data of highest priority
    _pop() {
        if (this._heap.length === 1) {
            return null;
        }

        if (this._heap.length === 2) {
            var ret = this._heap.pop();
            return ((ret && ret._data) ? ret._data : null);
        }

        var topVal = ((this._heap[1] && this._heap[1]._data) ? this._heap[1]._data : null);
        this._heap[1] = this._heap.pop();
        this._sink(1);

        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue._pop, returning: ' +
            iotcs.impl.Platform._inspect(topVal));

        return topVal;
    }

    /**
     * Pushes an item onto the queue if adding this item to the queue doesn't go over the max queue
     * size.
     *
     * @param data the item to add to the queue.
     */
    _push(data) {
        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue.push, pushing: ' +
                                                    data);

        if (this._heap.length === (this._maxQueue + 1)) {
            iotcs.error('Maximum queue number reached.');
            return;
        }

        let node = new iotcs.impl.QueueNode(data);
        this._bubble(this._heap.push(node) -1);
    }

    _remove(data) {
        iotcs.impl.Platform._debug('iotcs.impl.PriorityQueue.push, removing: ' +
                                                    data);

        if (this._heap.length === 1) {
            return null;
        }

        // DJM: Are these StorageObjects?
        let index = this._heap.findIndex((element, index) => {
            if (element && (element.data.name === data.name) && (element.data.type === data.type)) {
                if (element.data._.internal.inputStream && element.data._.internal.inputStream.path &&
                    element.data._.internal.inputStream.path === data._.internal.inputStream.path ) {
                    return index;
                } else if (element.data._.internal.outputStream && element.data._.internal.outputStream.path &&
                    element.data._.internal.outputStream.path === data._.internal.outputStream.path ) {
                    return index;
                }
            }
        }, data);

        return this._heap.splice(index, 1);
    }

    // Does the opposite of the bubble() function.
    _sink(i) {
        while (i * 2 < this._heap.length - 1) {
            // If equal, left bubbles (maintains insertion order).
            var leftHigher = !this._isHigherPriority(i*2 +1, i*2);
            var childIndex = leftHigher ? i*2 : i*2 +1;

            // If equal, sink happens (maintains insertion order).
            if (this._isHigherPriority(i,childIndex)) break;

            this._swap(i, childIndex);
            i = childIndex;
        }
    }

    // Swaps the addresses of 2 nodes.
    _swap(i,j) {
        var temp = this._heap[i];
        this._heap[i] = this._heap[j];
        this._heap[j] = temp;
    }
};

iotcs.impl.QueueNode = class {
    constructor(data) {
        this._data = data;

        if (data.getJSONObject !== undefined) {
            this._priority =
                ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].indexOf(data.getJSONObject().priority);
        } else {
            this._priority = 'LOW';
        }
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Mqtt.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 *
 */
iotcs.impl.Mqtt = class {
    // Static private/protected functions
    static _close(client, callback) {
        client.end(true, callback);
    }

    static _initAndReconnect(tam, callback, disconnectCallback, messageHandler) {
        let connectOptions = {};
        let id = (tam.isActivated() ? tam.getEndpointId() : tam.getClientId());

        connectOptions.host = tam.getServerHost();
        connectOptions.port = tam.getServerPort();
        connectOptions.protocol = 'mqtts';
        connectOptions.rejectUnauthorized = true;

        if ((typeof tam.getTrustAnchorCertificates === 'function') &&
            Array.isArray(tam.getTrustAnchorCertificates()) &&
            (tam.getTrustAnchorCertificates().length > 0))
        {
            connectOptions.ca = tam.getTrustAnchorCertificates();
        }

        connectOptions.clientId = id;
        connectOptions.username = id;
        connectOptions.password = tam.buildClientAssertion();

        if (!connectOptions.password) {
            callback(null, iotcs.createError('Error on generating oauth signature.'));
            return;
        }

        connectOptions.clean = true;
        connectOptions.connectTimeout = 30 * 1000;
        connectOptions.reconnectPeriod = 60 * 1000;

        let client = require('mqtt').connect(connectOptions);

        client.on('error', error => {
            callback(null, error);
        });

        client.on('connect', connCallback => {
            callback(connCallback);
        });

        client.on('close', () => {
            disconnectCallback();
        });

        client.on('message', (topic, message, packet) => {
            messageHandler(topic, message);
        });
    }

    static _publish(client, topic, message, waitForResponse, callback) {
        let qos = (waitForResponse ? 1 : 0);

        client.publish(topic, message, {qos: qos, retain: false}, err => {
            if (err && (err instanceof Error)) {
                callback(err);
                return;
            }

            callback();
        });
    }

    static _subscribe(client, topics, callback) {
        client.subscribe(topics, (err, granted) => {
            if (err && (err instanceof Error)) {
                callback(iotcs.createError('Error on topic subscription: ' + topics.toString(),
                                           err));
                return;
            }

            callback();
        });
    }

    static _unsubscribe(client, topics) {
        client.unsubscribe(topics);
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/MqttController.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

function _addArrayCallback(array, callback) {
    if (Array.isArray(array)
        && (typeof callback === 'function')) {
        array.push(callback);
    }
}

function _callArrayCallback(array, messages, error) {
    if (Array.isArray(array)
        && (array.length > 0)
        && (typeof array[0] === 'function')) {
        array.splice(0, 1)[0](messages, error);
    }
}

/**
 *
 */
iotcs.impl.Mqtt.MqttController = class {
    constructor(tam, topicsGenerator) {
        this._apiHandlers = {};
        this._callbacks = [];
        this._connected = false;
        this._errorHandlers = {};
        this._staticApiHandlers = {};
        this._tam = tam;
        this._topicsGenerator = topicsGenerator;

        let self = this;

        this._disconnectHandler = () => {
            this._client = null;
            this._connected = false;
        };

        this._messageHandler = (topic, message) => {
            let responseJson = null;

            try {
                responseJson = JSON.parse(message);
            } catch (e) {
               // Do nothing. 
            }

            if (!responseJson || (typeof responseJson !== 'object')) {
                if (this._staticApiHandlers[topic]) {
                    this._staticApiHandlers[topic](null, new Error(message));
                }

                if (this._apiHandlers[topic]) {
                    _callArrayCallback(this._apiHandlers[topic], null, new Error(message));
                } else if (this._errorHandlers[topic] &&
                           this._apiHandlers[self.errorHandlers[topic]])
                {
                    _callArrayCallback(this._apiHandlers[this._errorHandlers[topic]], null,
                                       new Error(message));
                }

                return;
            }

            if (this._staticApiHandlers[topic]) {
                this._staticApiHandlers[topic](responseJson);
            }

            if (this._apiHandlers[topic]) {
                _callArrayCallback(this._apiHandlers[topic], responseJson);
            } else if (this._errorHandlers[topic] &&
                       this._apiHandlers[this._errorHandlers[topic]])
            {
                _callArrayCallback(this._apiHandlers[this._errorHandlers[topic]], null,
                                   new Error(message));
            }
        };

        this.connectHandler = (client, error) => {
            if (!client || error) {
                for (let topic in this._apiHandlers) {
                    _callArrayCallback(this._apiHandlers[topic], null, error);
                }

                _callArrayCallback(this._callbacks, null, error);
                return;
            }

            let topicObjects = this._topicsGenerator();

            if (Array.isArray(topicObjects) && (topicObjects.length > 0)) {
                let topics = [];

                topicObjects.forEach(topicObject => {
                    if (topicObject.responseHandler) {
                        topics.push(topicObject.responseHandler);
                    }

                    if (topicObject.errorHandler) {
                        this._errorHandlers[topicObject.errorHandler] = topicObject.responseHandler;
                        topics.push(topicObject.errorHandler);
                    }
                });

                iotcs.impl.Platform.Mqtt._subscribe(client, topics, error => {
                    if (error) {
                        let err = iotcs.createError('Unable to subscribe: ', error);
                        
                        for (let topic in this._apiHandlers) {
                            _callArrayCallback(this._apiHandlers[topic], null, err);
                        }
                        
                        for (let topic1 in this._staticApiHandlers) {
                            this._staticApiHandlers[topic1](null, err);
                        }
                        
                        _callArrayCallback(this._callbacks, null, err);
                        return;
                    }

                    this._client = client;
                    this._connected = true;
                    _callArrayCallback(this._callbacks, self);
                });
            } else {
                this._client = client;
                this._connected = true;
                _callArrayCallback(this._callbacks, self);
            }
        };
    }

    // Private/protected functions
    _connect(callback) {
        if (callback) {
            _addArrayCallback(this._callbacks, callback);
        }

        iotcs.impl.Platform.Mqtt._initAndReconnect(this._tam, this._connectHandler,
                                               this._disconnectHandler, this._messageHandler);
    }

    _disconnect(callback) {
        iotcs.impl.Platform.Mqtt._close(this._client, callback);
    }

    _isConnected() {
        if (!this._client) {
            return false;
        }

        return this._connected;
    }

    _register(topic, callback) {
        if (callback) {
            this._staticApiHandlers[topic] = callback;
        }
    }

    _req(topic, payload, expect, callback) {
        let request = (controller, error) => {
            if (!controller || error) {
                callback(null, error);
                return;
            }

            if (expect && callback && (typeof callback === 'function')) {
                let tempCallback = (message, error) => {
                    if (!message || error) {
                        callback(null, error);
                        return;
                    }

                    callback(message);
                };

                if (!this.apiHandlers[expect]) {
                    this._apiHandlers[expect] = [];
                }

                _addArrayCallback(this._apiHandlers[expect], tempCallback);
            }

            iotcs.impl.Platform.Mqtt._publish(this._client, topic, payload, (callback ? true : false),
                                          error =>
            {
                if (error && callback) {
                    callback(null, error);
                    return;
                }

                if (!expect && callback) {
                    callback(payload);
                }
            });
        };

        if (!this._isConnected()) {
            this._connect(request);
        } else {
            request(this);
        }
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Impl.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Implementation functions and classes for the device namespace.
 */

/** @ignore */
iotcs.impl._reqRoot = '/iot/api/v2';
iotcs.impl._privateRoot = '/iot/privateapi/v2';

////////////////////////////////////////////////////////////////////////////////////////////////////
// device global function expressions
function _mqttControllerInit (dcd) {
    if (!dcd._mqttController) {
        let getTopics = () => {
            let topics = [];
            let id = dcd._tam.getClientId();

            if (dcd.isActivated()) {
                id = dcd._tam.getEndpointId();

                topics.push({responseHandler: 'devices/' + id + '/deviceModels',
                             errorHandler: 'devices/' + id + '/deviceModels/error'});

                topics.push({responseHandler: 'devices/' + id + '/messages',
                             errorHandler: 'devices/' + id + '/messages/error'});

                topics.push({responseHandler: 'devices/' + id + '/messages/acceptBytes'});

                if (dcd._gateway) {
                    topics.push({responseHandler: 'devices/' + id + '/activation/indirect/device',
                                 errorHandler: 'devices/' + id + '/activation/indirect/device/error'});
                }
            } else {
                topics.push({responseHandler: 'devices/' + id + '/activation/policy',
                             errorHandler: 'devices/' + id + '/activation/policy/error'});

                topics.push({responseHandler: 'devices/' + id + '/deviceModels',
                             errorHandler: 'devices/' + id + '/deviceModels/error'});

                topics.push({responseHandler: 'devices/' + id + '/activation/direct',
                             errorHandler: 'devices/' + id + '/activation/direct/error'});
            }

            return topics;
        };

        //DJM: Fix
        Object.defineProperty(dcd._, 'mqttController', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: new iotcs.impl.Mqtt.MqttController(dcd._.tam, getTopics)
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// device global functions
/**
 * Performs a request with the specified parameters.  Creates a TrustedAssetsManager if one is not
 * specified in options.tam.  Performs an MQTT request if options.tam.getServerScheme returns
 * 'mqtt'.  Performs an HTTPS request for activation or token request.  Otherwise performs an HTTPS
 * request and may refresh the authorization token if required.
 *
 * @param {object!} options - The request options.
 * @param {object} payload - The request payload.
 * @param {function} callback - The function to call when the request is complete.
 * @param {functrion} retryCallback - The function to call to try the request again if it fails.
 * @param {DirectlyConnectedDevice} dcd
 * @param {DirectlyConnecteedDeviceUtil} dcdUtil
 *
 * @ignore
 */
iotcs.impl._protocolReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    if (!options.tam) {
        options.tam = new iotcs.device.TrustedAssetsManager();
    }

    if (options.tam.getServerScheme && (options.tam.getServerScheme().indexOf('mqtt') > -1)) {
        iotcs.impl.Mqtt._apiReq(options, payload, callback, retryCallback, dcd, dcdUtil);
    } else {
        if (options.path.startsWith(iotcs.impl._reqRoot+'/activation/policy') ||
            options.path.startsWith(iotcs.impl._reqRoot+'/activation/direct') ||
            options.path.startsWith(iotcs.impl._reqRoot+'/oauth2/token'))
        {
            iotcs.impl.Https._req(options, payload, callback);
        } else {
            iotcs.impl.Https._bearerReq(options, payload, callback, retryCallback, dcd, dcdUtil);
        }
    }
};

iotcs.impl._protocolRegister = (path, callback, dcd) => {
    if (dcd.isActivated() &&
        dcd._tam.getServerScheme &&
        (dcd._tam.getServerScheme().indexOf('mqtt') > -1))
    {
        _mqttControllerInit(dcd);

        if (path.startsWith(iotcs.impl._reqRoot + '/messages/acceptBytes')) {
            dcd._mqttController.register('devices/' + dcd.getEndpointId() + '/messages/acceptBytes',
                callback);
        } else if (path.startsWith(iotcs.impl._reqRoot + '/messages')) {
            dcd._mqttController.register('devices/' + dcd.getEndpointId() + '/messages', callback);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Https function additions for device.
iotcs.impl.Https._bearerReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    iotcs.impl.Https._req(options, payload, (responseBody, error) => {
        if (error) {
            let exception = null;

            try {
                exception = JSON.parse(error.message);

                if (exception.statusCode &&
                    (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                {
                    dcd._refreshBearer(false, error => {
                        if (error) {
                            callback(responseBody, error, dcdUtil);
                            return;
                        }

                        retryCallback();
                    });

                    return;
                }
            } catch (e) {
            }
        }

        callback(responseBody, error, dcdUtil);
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Mqtt function additions for device.
iotcs.impl.Mqtt._apiReq = (options, payload, callback, retryCallback, dcd, dcdUtil) => {
    let tempCallback = callback;

    let tempCallbackBearer = (responseBody, error) => {
        if (error) {
            let exception = null;

            try {
                exception = JSON.parse(error.message);
                if (exception.status && (exception.status === iotcs.StatusCode.UNAUTHORIZED)) {
                    dcd._mqttController.disconnect(retryCallback);
                    return;
                }
            } catch (e) {
            }
        }

        callback(responseBody, error, dcdUtil);
    };

    function callApi(controller) {
        let id = (dcd.isActivated() ? dcd._tam.getEndpointId() : dcd._tam.getClientId());
        let topic = null;
        let expect = null;

        if (options.method === 'GET') {
            if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/policy')) {
                topic = 'iotcs/' + id + '/activation/policy';
                expect = 'devices/' + id + '/activation/policy';
                payload = JSON.stringify({OSName: iotcs.impl.Platform.Os._type(), OSVersion: iotcs.impl.Platform.Os._release()});
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/deviceModels')) {
                topic = 'iotcs/' + id + '/deviceModels';
                expect = 'devices/' + id + '/deviceModels';
                tempCallback = tempCallbackBearer;
                payload = JSON.stringify({urn: options.path.substring(options.path.lastIndexOf('/') +
                    1)});
            }
        } else if (options.method === 'POST') {
            if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/direct')) {
                topic = 'iotcs/' + id + '/activation/direct';
                expect = 'devices/' + id + '/activation/direct';

                tempCallback = (responseBody, error) => {
                    if (error) {
                        dcd._tam.setEndpointCredentials(dcd._tam.getClientId(), null);
                    }

                    controller.disconnect(() => {
                        callback(responseBody, error);
                    });
                };
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/oauth2/token')) {
                callback({token_type: 'empty', access_token: 'empty'});
                return;
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/activation/indirect/device')) {
                topic = 'iotcs/' + id + '/activation/indirect/device';
                expect = 'devices/' + id + '/activation/indirect/device';
                tempCallback = tempCallbackBearer;
            } else if (options.path.startsWith(iotcs.impl._reqRoot + '/messages')) {
                expect = 'devices/' + id + '/messages';
                topic = 'iotcs/' + id + '/messages';
                tempCallback = tempCallbackBearer;

                let acceptBytes =
                    parseInt(options.path.substring(options.path.indexOf('acceptBytes=') + 12));

                if (acceptBytes &&
                    ((typeof controller.acceptBytes === 'undefined') ||
                     (controller.acceptBytes !== acceptBytes)))
                {
                    topic = 'iotcs/' + id + '/messages/acceptBytes';
                    let buffer = forge.util.createBuffer();
                    buffer.putInt32(acceptBytes);

                    controller.req(topic, buffer.toString(), null, () => {
                        controller.acceptBytes = acceptBytes;
                        topic = 'iotcs/' + id + '/messages';
                        controller.req(topic, payload, expect, tempCallback);
                    });

                    return;
                }
            }
        }

        controller.req(topic, payload, expect, tempCallback);
    }

    _mqttControllerInit(dcd);
    callApi(dcd._mqttController);
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/Client.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: Add and validate this.tam = new iotcs.impl.TrustedAssetsManager();.

/**
 * Client of the Oracle IoT Cloud Service. A client is a
 * directly-connected device, a gateway, or an enterprise
 * application.
 *
 * @alias iotcs.Client
 * @class iotcs.Client
 */
iotcs.Client = class {
    constructor() {
        this._cache = this._cache || {};
        this._cache.deviceModels = {};
        this._useVirtualStorageDirectories =
            (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
            (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);
    }

    // Public functions
    // DJM: Need to fix the internalDev references.
    /**
     * Create a new {@link iotcs.StorageObject} with the given object name and mime&ndash;type.
     *
     * @param {string} name - The unique name to be used to reference the content in storage.
     * @param {string} [type=iotcs.device.StorageObject.MIME_TYPE] - The mime-type of the content.
     * @returns {iotcs.StorageObject} A storage object.
     *
     * @function createStorageObject
     * @memberof iotcs.Client
     */
    createStorageObject(name, type) {
        _mandatoryArg(name, "string");
        _optionalArg(type, "string");

        // this._internalDev is defined in iotcs.device.util.DirectlyConnectedDevice.
        if (this._useVirtualStorageDirectories &&
            (this._internalDev._dcdImpl._tam.getEndpointId() !== null))
        {
            this._internalDev._storageObjectName =
                this._internalDev._dcdImpl._tam.getEndpointId() + "/" + name;
        } else {
            this._internalDev._storageObjectName = name;
        }

        // The storage object is created here, but it's data isn't filled in until we get to the
        // iotcs.device.util.DirectlyConnectedDeviceUtil.syncStorage call.
        let storage = new iotcs.device.StorageObject(undefined, this._internalDev._storageObjectName,
                                                     type, undefined, undefined, undefined);

        storage._setDevice(this._internalDev);
        return storage;
    }

    /**
     * Create an AbstractVirtualDevice instance with the given device model for the given device
     * identifier.  This method creates a new AbstractVirtualDevice instance for the given
     * parameters.  The client library does not cache previously created AbstractVirtualDevice
     * objects.
     * <p>
     * A device model can be obtained by it's afferent urn with the Client if it is registered on the
     * cloud.
     *
     * @param {string} endpointId - The endpoint identifier of the device being modeled.
     * @param {object} deviceModel - The device model object holding the full description of that
     *        device model that this device implements.
     * @returns {iotcs.AbstractVirtualDevice} The newly created virtual device.
     *
     * @function createVirtualDevice
     * @memberof iotcs.Client
     * @see {@link iotcs.Client#getDeviceModel}
     */
    createVirtualDevice(endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');
        return new iotcs.AbstractVirtualDevice(endpointId, deviceModel);
    }

    /**
     * Get the device model for the specified device model URN.
     *
     * @param {string} deviceModelUrn - The urn of the device model.
     * @param {function} callback - The callback function.  This function is called with the
     *        following argument: a deviceModel object holding a full description e.g.
     *        <code>{ name:"", description:"", fields:[...], created:date, isprotected:boolean,
     *        lastmodified:date ...}</code>.  If an error occurs the deviceModel object is
     *        <code>null</code> and an error object is passed: callback(deviceModel, error) and the
     *        reason can be taken from the error message.
     *
     * @function getDeviceModel
     * @memberof iotcs.client
     */
    getDeviceModel(deviceModelUrn, callback) {
        _mandatoryArg(deviceModelUrn, 'string');
        _mandatoryArg(callback, 'function');

        let deviceModel = this._cache.deviceModels[deviceModelUrn];

        if (deviceModel) {
            callback(deviceModel);
            return;
        }

        var self = this;

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/deviceModels/' + deviceModelUrn
        }, '', (response, error) => {
            if (!response || error || !(response.urn)){
                callback(null, iotcs.createError('Invalid response on get device model: ', error));
                return;
            }

            let deviceModel = response;
            Object.freeze(deviceModel);
            self._cache.deviceModels[deviceModelUrn] = deviceModel;
            callback(deviceModel);
        }, () => {
            self.getDeviceModel(deviceModelUrn, callback);
        }, (iotcs.impl.Platform._userAuthNeeded() ? null :
            (iotcs.device.impl.DirectlyConnectedDeviceImpl ?
             new iotcs.device.impl.DirectlyConnectedDeviceImpl() :
             new iotcs.enterprise.impl.EnterpriseClientImpl())));
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/Monitor.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: A little more JSDOC is needed; explain the (simple) state machine and e.g. when the monitor
//       thread is actually started, whether start and stop can be called multiple time; the default
//       frequency ...etc...

/**
 * @param {function()} callback - function associated to this monitor
 * @class
 */
/** @ignore */
iotcs.impl.Monitor = class {
    constructor(callback) {
        _mandatoryArg(callback, 'function');
        this._running = false;
        this._callback = callback;
    }

    // Private/protected functions
    /**
     * @memberof iotcs.util.Monitor
     * @function start
     */
    _start() {
        if (this._running) {
            return;
        }

        this._running = true;
        var self = this;
        this._monitorId = _register(this._callback);
    }

    /**
     * @memberof iotcs.util.Monitor
     * @function stop
     */
    _stop() {
        if (!this._running) {
            return;
        }

        this._running = false;
        _unregister(this._monitorId);
    }
};

//////////////////////////////////////////////////////////////////////////////
// Global monitor functions and fields.
/** @ignore */
let _index = 0;

/** @ignore */
let _monitors = {};

/** @ignore */
let _threadId = null;

/** @ignore */
function _carousel() {
    Object.keys(_monitors).forEach(id => {
        if (typeof _monitors[id] === 'function') {
            _monitors[id]();
        }
    });
}

/** @ignore */
function _register(callback) {
    _monitors[++_index] = callback;

    if (Object.keys(_monitors).length === 1) {
        // If at least one registered monitor, then start thread.
        if (_threadId) {
            iotcs.log('Inconsistent state: monitor thread already started!');
            return;
        }

        _threadId = setInterval(_carousel, iotcs.oracle.iot.client.monitor.pollingInterval);
    }

    return _index;
}

/** @ignore */
function _unregister(id) {
    if ((typeof id === 'undefined') || !_monitors[id]) {
        iotcs.log('Unknown monitor id.');
        return;
    }

    delete _monitors[id];

    if (Object.keys(_monitors).length === 0) {
        // If no registered monitor left, then stop thread.
        if (!_threadId) {
            iotcs.log('Inconsistent state: monitor thread already stopped!');
            return;
        }

        clearInterval(_threadId);
        _threadId = null;
    }
}


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/AbstractVirtualDevice.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * AbstractVirtualDevice is a representation of a device model implemented by an endpoint.  A device
 * model is a specification of the attributes, formats, and resources available on the endpoint.
 * <p>
 * The AbstractVirtualDevice API is identical for both the enterprise client and the device client.
 * The semantics of the API are also the same. The processing model on the enterprise client is
 * different, however, from the processing model on the device client.
 * <p>
 * A device model can be obtained by it's afferent URN with the Client if it is registered on the
 * cloud.
 * <p>
 * An AbstractVirtualDevice can also be created with the appropriate parameters from the Client.
 *
 * @param {string} endpointId - The endpoint id of this device.
 * @param {object} deviceModel - The device model, as a JSON object, holding the full description of
 *        that device model that this device implements.
 *
 * @alias iotcs.AbstractVirtualDevice
 * @class iotcs.AbstractVirtualDevice
 * @memberof iotcs
 *
 * @see {@link iotcs.Client#getDeviceModel}
 * @see {@link iotcs.Client#createVirtualDevice}
 */
iotcs.AbstractVirtualDevice = class {
    // Static private/protected functions
    /** @ignore */
    static _link(name, device, element) {
        _mandatoryArg(name, 'string');
        _mandatoryArg(device, 'object'); //@TODO: should be checked against instance name
        _mandatoryArg(element, 'object');

        if (device[name]) {
            return;
        }

        device[name] = element;
        // device is part of the public API.
        element.device = device;
    }

    constructor (endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');

        this._endpointId = endpointId;
        this._deviceModel = deviceModel;
        this._onChange = null;
        this._onError = null;
    }

    // Public functions
    /**
     * Close this virtual device and all afferent resources used for monitoring or controlling the
     * device.
     *
     * @function close
     * @memberof iotcs.AbstractVirtualDevice
     */
    close() {
        this._endpointId = null;
        this._deviceModel = null;
        this._onChange = function (arg) {};
        this._onError = function (arg) {};
    }

    get onChange() {
        return this._onChange;
    }

    get onError() {
        return this._onError;
    }

    /**
     * Get the device model of this device object. This is the exact model
     * that was used at construction of the device object.
     *
     * @function getDeviceModel
     * @memberof iotcs.AbstractVirtualDevice
     *
     * @returns {object} The device model, in JSON format, for this device.
     */
    getDeviceModel() {
        return this._deviceModel;
    }

    /**
     * Get the endpoint id of the device.
     *
     * @memberof iotcs.AbstractVirtualDevice
     * @function getEndpointId
     *
     * @returns {string} The endpoint id of this device as given at construction of the virtual device.
     */
    getEndpointId() {
        return this._endpointId;
    }

    set onChange(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onChange to something that is not a function.');
            return;
        }

        this._onChange = newFunction;
    }

    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onError to something that is not a function.');
            return;
        }

        this._onError = newFunction;
    }

    /**
     * The update call allows more than one value to be set on this Device object and in the end, it is
     * sending the values to the server.
     * <p>
     * The values are sent to the server when the method is called, which also marks the end of the
     * update transaction.
     * <p>
     * For example <code>device.update({"min":10, "max":20});</code>
     * <p>
     * If the virtual device has the onError property set with a callback method or any/all of the
     * attributes given in the update call have the onError attribute set with a callback method, in
     * case of error on update the callbacks will be called with related attribute information.  See
     * VirtualDevice description for more info on onError.
     *
     * @function update
     * @memberof iotcs.AbstractVirtualDevice
     * @see {@link VirtualDevice|iotcs.enterprise.VirtualDevice}
     *
     * @param {object} attributes - An object holding a list of attribute name/
     * value pairs to be updated as part of this transaction,
     * e.g. <code>{ "temperature":23, ... }</code>. Note that keys shall refer
     * to device attribute names.
     */
    update(attributes) {
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/UnifiedTrustStore.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This class provides an implementation of the trusted assets format as values of the
 * tag-length-value form in a Base64 encoded AES encrypted file.
 * <p>
 * Unified client provisioning format:
 * <p>
 * format = version & blob & *comment<br>
 * version = 1 byte, value 33<br>
 * blob = MIME base64 of encrypted & new line<br>
 * encrypted = IV & AES-128/CBC/PKCS5Padding of values<br>
 * IV = 16 random bytes<br>
 * values = *TLV<br>
 * TLV = tag & length & value<br>
 * tag = byte<br>
 * length = 2 byte BE unsigned int<br>
 * value = length bytes<br>
 * comment = # & string & : & string & new line<br>
 * string = UTF-8 chars<br>
 * <p>
 * The password based encryption key is the password processed by 10000 interations of
 * PBKDF2WithHmacSHA1 with the IV as the salt.
 * <p>
 * This class is internally used by the trusted assets store managers to read/write files in the
 * unified format.
 *
 * @alias iotcs.UnifiedTrustStore
 * @class iotcs.UnifiedTrustStore
 * @memberof iotcs
 */
iotcs.UnifiedTrustStore = class {
    constructor(taStoreFileExt, taStorePasswordExt, forProvisioning) {
        this._trustStoreValues = {
            _certificate: null,
            _clientId: null,
            _connectedDevices: null,
            _endpointId: null,
            _serverHost: null,
            _serverPort: null,
            _serverScheme: null,
            _sharedSecret: null,
            _privateKey: null,
            _publicKey: null,
            _trustAnchors: null
        };

        this._taStoreFile = taStoreFileExt || iotcs.oracle.iot.tam.store;
        this._taStorePassword = taStorePasswordExt || iotcs.oracle.iot.tam.storePassword;
        this._userInfo = "#";

        if (!this._taStoreFile) {
            iotcs.error('No Trusted Assets Store file defined.');
            return;
        }

        if (!this._taStorePassword) {
            iotcs.error('No Trusted Assets Store password defined.');
            return;
        }

        if (!forProvisioning) {
            this._load();
        }
    }

    // Private/protected functions
    _load() {
        let input = iotcs.impl.Platform.File._load(this._taStoreFile);

        if (input.charCodeAt(0) != iotcs.UnifiedTrustStore.constants.version) {
            iotcs.error('Invalid unified trust store version');
            return;
        }

        let base64BlockStr = input.substring(1, input.indexOf('#'));
        this._userInfo = input.substring(input.indexOf('#')) || this._userInfo;
        let encryptedData = forge.util.decode64(base64BlockStr);

        if (encryptedData.length <= 0) {
            iotcs.error('Invalid unified trust store.');
            return;
        }

        let iv = forge.util.createBuffer();
        let encrypted = forge.util.createBuffer();

        for (let i = 0; i < iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE; i++) {
            iv.putInt(encryptedData.charCodeAt(i), 8);
        }

        iv = iv.getBytes();

        for (let i = iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE;
             i < encryptedData.length;
             i++)
        {
            encrypted.putInt(encryptedData.charCodeAt(i), 8);
        }

        let key = forge.pkcs5.pbkdf2(this._taStorePassword, iv,
                                     iotcs.UnifiedTrustStore.constants.PBKDF2_ITERATIONS,
                                     iotcs.UnifiedTrustStore.constants.AES_KEY_SIZE);
        
        let decipher = forge.cipher.createDecipher('AES-CBC', key);
        decipher.start({iv: iv});
        decipher.update(encrypted);
        decipher.finish();
        let output = decipher.output;
        
        while (!output.isEmpty()) {
            let tag = output.getInt(8);
            let length = (output.getInt(16) >> 0);
            let buf = output.getBytes(length);

            switch (tag) {
            case iotcs.UnifiedTrustStore.constants.TAGS.serverUri:
                let urlObj = forge.util.parseUrl(buf);
                this._trustStoreValues._serverHost = urlObj.host;
                this._trustStoreValues._serverPort = urlObj.port;
                this._trustStoreValues._serverScheme = urlObj.scheme;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.clientId:
                this._trustStoreValues._clientId = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret:
                this._trustStoreValues._sharedSecret = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.endpointId:
                this._trustStoreValues._endpointId = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.trustAnchor:
                if (!this._trustStoreValues._trustAnchors) {
                    this._trustStoreValues._trustAnchors = [];
                }

                this._trustStoreValues._trustAnchors.push(forge.pki.certificateToPem(
                    forge.pki.certificateFromAsn1(forge.asn1.fromDer(buf))));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.privateKey:
                this._trustStoreValues._privateKey =
                    forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(buf));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.publicKey:
                this._trustStoreValues._publicKey =
                    forge.pki.publicKeyFromAsn1(forge.asn1.fromDer(buf));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.connectedDevice:
                if (!this._trustStoreValues._connectedDevices) {
                    this._trustStoreValues._connectedDevices = {};
                }

                let _data = { error: false };
                let _output = new forge.util.ByteStringBuffer().putBytes(buf);
                connectedDeviceLoop:

                while (!_output.isEmpty()) {
                    let _tag = _output.getInt(8);
                    let _length = (_output.getInt(16) >> 0);
                    let _buf = _output.getBytes(_length);

                    switch (_tag) {
                    case iotcs.UnifiedTrustStore.constants.TAGS.clientId:
                        _data.deviceId = _buf;
                        break;
                    case iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret:
                        _data.sharedSecret = _buf;
                        break;
                    default:
                        iotcs.error("Invalid TAG inside indirect connected device data.");
                        _data.error = true;
                        break connectedDeviceLoop;
                    }
                }

                if (!_data.error && _data.deviceId && _data.sharedSecret) {
                    this._trustStoreValues._connectedDevices[_data.deviceId] = _data.sharedSecret;
                }

                break;
            default:
                iotcs.error('Invalid unified trust store TAG.');
                return;
            }
        }
    }

    /** @ignore */
    _loadTrustAnchorsBinary(truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => {
                return ((elem.length > 1) && (elem.indexOf('M') > -1));
            })
            .map(elem => {
                return '-----BEGIN CERTIFICATE-----' + elem.replace(new RegExp('\r\n', 'g'),'\n') +
                    '-----END CERTIFICATE-----';
            });
    }

    //// DJM: setPrivateValues should be used for code in setPrivateValues...Need to have both until
    ////      all code is converted to ES6.
    //_setValues(otherManager) {
    //    Object.keys(otherManager).forEach(function (key) {
    //        if (this._trustStoreValues[key]) {
    //            otherManager[key] = this._trustStoreValues[key];
    //        }
    //    });
    //}
    _setPrivateValues(otherManager) {
        Object.keys(otherManager).forEach(key => {
            if (this._trustStoreValues[key]) {
                otherManager[key] = this._trustStoreValues[key];
            }
        });
    }

    _store(values) {
        if (values) {
            Object.keys(values).forEach(function (key) {
                this._trustStoreValues[key] = values[key];
            });
        }

        let buffer = forge.util.createBuffer();
        let serverUri = this._trustStoreValues._serverScheme + '://' +
            this._trustStoreValues._serverHost + ':' +
            this._trustStoreValues._serverPort;

        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.serverUri, 8);
        buffer.putInt(serverUri.length, 16);
        buffer.putBytes(serverUri);
        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.clientId, 8);
        buffer.putInt(this._trustStoreValues._clientId.length, 16);
        buffer.putBytes(this._trustStoreValues._clientId);
        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret, 8);
        buffer.putInt(this._trustStoreValues._sharedSecret.length, 16);
        buffer.putBytes(this._trustStoreValues._sharedSecret);

        if (this._trustStoreValues._endpointId) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.endpointId, 8);
            buffer.putInt(this._trustStoreValues._endpointId.length, 16);
            buffer.putBytes(this._trustStoreValues._endpointId);
        }

        if (Array.isArray(this._trustStoreValues._trustAnchors)) {
            this._trustStoreValues._trustAnchors.forEach(function (trustAnchor) {
                let trust = forge.asn1.toDer(forge.pki.certificateToAsn1(
                    forge.pki.certificateFromPem(trustAnchor))).getBytes();
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.trustAnchor, 8);
                buffer.putInt(trust.length, 16);
                buffer.putBytes(trust);
            });
        }

        if (this._trustStoreValues._privateKey) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.privateKey, 8);
            let tempBytes = forge.asn1.toDer(forge.pki.wrapRsaPrivateKey(
                forge.pki.privateKeyToAsn1(this._trustStoreValues._privateKey))).getBytes();
            buffer.putInt(tempBytes.length, 16);
            buffer.putBytes(tempBytes);
        }

        if (this._trustStoreValues._publicKey) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.publicKey, 8);
            let tempBytes1 = forge.asn1.toDer(forge.pki.publicKeyToAsn1(
                this._trustStoreValues._publicKey)).getBytes();
            buffer.putInt(tempBytes1.length, 16);
            buffer.putBytes(tempBytes1);
        }

        if (this._trustStoreValues._connectedDevices) {
            for (let deviceId in this._trustStoreValues._connectedDevices) {
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.connectedDevice, 8);
                // deviceId.length + sharedSecret.length + 6
                // where 6 bytes contains [ACTIVATION_ID_TAG|<icd activation id length> and
                //[SHARED_SECRET_TAG|<icd shared secret length>
                buffer.putInt(deviceId.length +
                              this._trustStoreValues._connectedDevices[deviceId].length + 6, 16);
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.clientId, 8);
                buffer.putInt(deviceId.length, 16);
                buffer.putBytes(deviceId);
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret, 8);
                buffer.putInt(this._trustStoreValues._connectedDevices[deviceId].length, 16);
                buffer.putBytes(this._trustStoreValues._connectedDevices[deviceId]);
            }
        }

        let iv = forge.random.getBytesSync(iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE);
        let key = forge.pkcs5.pbkdf2(this._taStorePassword, iv,
                                     iotcs.UnifiedTrustStore.constants.PBKDF2_ITERATIONS,
                                     iotcs.UnifiedTrustStore.constants.AES_KEY_SIZE);
        let cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({iv: iv});
        cipher.update(buffer);
        cipher.finish();
        let finalBuffer = forge.util.createBuffer();
        finalBuffer.putInt(iotcs.UnifiedTrustStore.constants.version, 8);
        finalBuffer.putBytes(forge.util.encode64(iv + cipher.output.getBytes()));
        finalBuffer.putBytes("\n" + this._userInfo);
        iotcs.impl.Platform.File._store(this._taStoreFile, finalBuffer.getBytes());
    }

    //// DJM: updatePrivate should be used for code in update...Need to have both until
    ////      all code is converted to ES6.
    //_update(otherManager) {
    //    Object.keys(otherManager).forEach(function (key) {
    //        if (otherManager[key] && (typeof this._trustStoreValues[key] !== 'undefined')) {
    //            this._trustStoreValues[key] = otherManager[key];
    //        }
    //    });
    //    this._store();
    //}

    _updatePrivate(otherManager) {
        Object.keys(otherManager).forEach(key => {
            if (otherManager[key] && (typeof this._trustStoreValues[key] !== 'undefined')) {
                this._trustStoreValues[key] = otherManager[key];
            }
        });

        this._store();
    }

    // Public functions
    /**
     * This is a helper method for provisioning files used by the trusted assets store managers in the
     * unified trust store format.
     *
     * @function provision
     * @memberof iotcs.UnifiedTrustStore
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverScheme - The scheme used to communicate with the server. Possible values
     *        are http(s) or mqtt(s).
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {string} clientId - The activation ID for devices or client ID for application
     *        integrations.
     * @param {string} sharedSecret - The client's shared secret.
     * @param {string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     * @param {string} connectedDevices - An array of indirect connect devices.
     */
    provision(taStoreFile, taStorePassword, serverScheme, serverHost, serverPort, clientId,
              sharedSecret, truststore, connectedDevices)
    {
        if (!taStoreFile) {
            throw 'No Trusted Assets Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No Trusted Assets Store password provided.';
        }

        let entries = {
            clientId: clientId,
            serverHost: serverHost,
            serverPort: serverPort,
            serverScheme: (serverScheme ? serverScheme : 'https'),
            sharedSecret: sharedSecret,
            trustAnchors: (truststore ?
                           (Array.isArray(truststore) ?
                            truststore : this._loadTrustAnchorsBinary(truststore)) : []),
            connectedDevices: (connectedDevices ? connectedDevices : {})
        };

        new iotcs.UnifiedTrustStore(taStoreFile, taStorePassword, true).store(entries);
    }
};

/**
 * Enumeration of unified trust store format constants.
 *
 * @alias constants
 * @class
 * @memberof iotcs.UnifiedTrustStore
 * @readonly
 * @enum {Integer}
 * @static
 */
iotcs.UnifiedTrustStore.constants = {
    version: 33,
    AES_BLOCK_SIZE: 16,
    AES_KEY_SIZE: 16,
    PBKDF2_ITERATIONS: 10000,
    TAGS: {}
};

iotcs.UnifiedTrustStore.constants.TAGS = {
    /**
     * The URI of the server, e.g., https://iotinst-mydomain.iot.us.oraclecloud.com:443
     */
    serverUri: 1,
    /** A client id is either an integration id (for enterprise clients), or an
     * activation id (for device clients). An activation id may also be
     * referred to a hardware id.
     */
    clientId: 2,
    /**
     * The shared secret as plain text
     */
    sharedSecret: 3,
    /**
     * For devices, the endpoint id TLV is omitted from the provisioning file
     * (unless part of a CONNECTED_DEVICE_TAG TLV).
     * For enterpise integrations, the endpoint id is set in the provisioning file
     * by the inclusion of the second ID argument.
     */
    endpointId: 4,
    /**
     * The trust anchor is the X509 cert
     */
    trustAnchor: 5,
    privateKey: 6,
    publicKey: 7,
    /**
     * The client id and shared secret of a device that can connect
     * indirectly through the device client
     *
     * Connected device TLV =
     * [CONNECTED_DEVICE_TAG|<length>|[CLIENT_ID_TAG|<icd activation id length>|<icd activation id>][SHARED_SECRET_TAG|<icd shared secrect length>|<icd shared secret>]]
     */
    connectedDevice: 8
};

Object.freeze(iotcs.UnifiedTrustStore.constants);
Object.freeze(iotcs.UnifiedTrustStore.constants.TAGS);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/TrustedAssetsManager.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The <code>TrustedAssetsManager</code> interface defines methods for handling trust
 * material used for activation and authentication to the IoT CS. Depending on
 * the capability of the client or device as well as on the security
 * requirements implementations of this interface may simply store sensitive
 * trust material in a plain persistent store, in some keystore or in a secure
 * token.
 * <dl>
 * <dt>Authentication of Devices with the IoT CS</dt>
 * <dd>
 * <dl>
 * <dt>Before/Upon Device Activation</dt>
 * <dd>
 * A device must use client secret-based authentication to authenticate with the
 * OAuth service and retrieve an access token to perform activation with the IoT
 * CS server. This is done by using an activation ID and a shared secret.
 * </dd>
 * <dt>After Device Activation</dt>
 * <dd>
 * A device must use client assertion-based authentication to authenticate with
 * the OAuth service and retrieve an access token to perform send and retrieve
 * messages from the IoT CS server. This is done by using the assigned endpoint ID
 * and generated private key.</dd>
 * </dl>
 * </dd>
 * <dt>Authentication of <em>Pre-activated</em> Enterprise Applications with the
 * IoT CS</dt>
 * <dd>
 * <dl>
 * <dt>Before/After Application Activation</dt>
 * <dd>
 * An enterprise integration must use client secret-based authentication to authenticate with the
 * OAuth service and retrieve an access token to perform any REST calls with the IoT
 * CS server. This is done by using the integration ID and a shared secret.</dd>
 * </dd>
 * </dl>
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation. This is optional.  If none is given the default global library parameter
 *        is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation. This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.device.TrustedAssetsManager
 * @class iotcs.device.TrustedAssetsManager
 * @memberof iotcs.device
 */
iotcs.device.TrustedAssetsManager = class {
    // Static private functions
    /**
     * @ignore
     */
    static _decryptSharedSecret (encryptedSharedSecret, password) {
	      let key = _pbkdf(password);
	      let cipher = forge.cipher.createDecipher('AES-CBC', key);
	      cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
	      cipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedSharedSecret),
                                              'binary'));
	      cipher.finish();
	      return cipher.output.toString();
    }

    /**
     * @ignore
     */
    static _encryptSharedSecret (sharedSecret, password) {
	      let key = _pbkdf(password);
	      let cipher = forge.cipher.createCipher('AES-CBC', key);
	      cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
	      cipher.update(forge.util.createBuffer(sharedSecret, 'utf8'));
	      cipher.finish();
	      return cipher.output.toHex();
    }

    /**
     * @ignore
     */
    static _generateSelfSignedCert (privateKey, publicKey, clientId) {
        let cert = forge.pki.createCertificate();
        cert.publicKey = publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        let attrs = [{
            name: 'commonName',
            value: clientId
        }];

        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(privateKey);
        return cert;
    }

    /**
     * @ignore
     */
    static _isSelfSigned (certificate) {
        return certificate.isIssuer(certificate);
    }

    /**
     * @ignore
     */
    static _loadTrustAnchors (truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => {
                return ((elem.length > 1) && (elem.indexOf('M') > -1));
            })
        //.filter(elem => elem.length > 0)
            .map(elem => {
                return '-----BEGIN CERTIFICATE-----' +
                    elem.replace(new RegExp('\r\n', 'g'),'\n') + '-----END CERTIFICATE-----';
            });
        //.map(elem => elem = '-----BEGIN CERTIFICATE-----' + elem + '-----END CERTIFICATE-----');
    }

    /**
     * @ignore
     */
    //PBKDF2 (RFC 2898)
    static _pbkdf (password) {
        return forge.pkcs5.pbkdf2(password, '', 1000, 16);
    }

    /**
     * @ignore
     */
    static _signTaStoreContent (taStoreEntries, password) {
        let data = '{' + taStoreEntries.clientId + '}'
            + '{' + taStoreEntries.serverHost + '}'
            + '{' + taStoreEntries.serverPort + '}'
            + '{' + taStoreEntries.serverScheme + '}'
            + '{' + taStoreEntries.sharedSecret + '}'
            + '{' + taStoreEntries.trustAnchors + '}'
            + '{' + (taStoreEntries.keyPair ? taStoreEntries.keyPair : null) + '}'
            + '{' + (taStoreEntries.connectedDevices ? taStoreEntries.connectedDevices : {}) + '}';

        let key = _pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);

        return {
            clientId: taStoreEntries.clientId,
            serverHost: taStoreEntries.serverHost,
            serverPort: taStoreEntries.serverPort,
            serverScheme: taStoreEntries.serverScheme,
            sharedSecret: taStoreEntries.sharedSecret,
            trustAnchors: taStoreEntries.trustAnchors,
            keyPair: (taStoreEntries.keyPair ? taStoreEntries.keyPair : null),
            connectedDevices: (taStoreEntries.connectedDevices ?
                               taStoreEntries.connectedDevices : {}),
            signature: hmac.digest().toHex()
        };
    }

    /**
     * @ignore
     */
    static _verifyTaStoreContent (taStoreEntries, password) {
        let data = '{' + taStoreEntries.clientId + '}'
	          + '{' + taStoreEntries.serverHost + '}'
	          + '{' + taStoreEntries.serverPort + '}'
            + (taStoreEntries.serverScheme ? ('{' + taStoreEntries.serverScheme + '}') : '')
	          + '{' + taStoreEntries.sharedSecret + '}'
	          + '{' + taStoreEntries.trustAnchors + '}'
	          + '{' + (taStoreEntries.keyPair ? taStoreEntries.keyPair : null) + '}'
            + (taStoreEntries.connectedDevices ? '{' + taStoreEntries.connectedDevices + '}' : '');

        let key = _pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
	      return taStoreEntries.signature && hmac.digest().toHex() === taStoreEntries.signature;
    }

    // Static public functions
    /**
     * Provisions the designated Trusted Assets Store with the provided provisioning assets.  The
     * provided shared secret will be encrypted using the provided password.
     *
     * @alias iotcs.device.TrustedAssetsManager
     * @function provision
     * @memberof iotcs.device.TrustedAssetsManager
     * @static
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverScheme - The scheme used to communicate with the server. Possible values
     *        are http(s) or mqtt(s).
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {string} clientId - The ID of the client.
     * @param {string} sharedSecret - The client's shared secret.
     * @param {string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     * @param {object} connectedDevices - The indirect connect devices.
     */
    static provision(taStoreFile, taStorePassword, serverScheme, serverHost, serverPort, clientId,
               sharedSecret, truststore, connectedDevices)
    {
        if (!taStoreFile) {
            throw 'No TA Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No TA Store password provided.';
        }

        let entries = {
            'clientId' : clientId,
            'serverHost' : serverHost,
            'serverPort' : serverPort,
            'serverScheme' : (serverScheme ? serverScheme : 'https'),
            'sharedSecret' : this._encryptSharedSecret(sharedSecret, taStorePassword),
            'trustAnchors' : (truststore ? (Array.isArray(truststore) ?
                                            truststore : this._loadTrustAnchors(truststore)) : []),
            'connectedDevices': (connectedDevices ? connectedDevices : {})
	      };

	      entries = this._signTaStoreContent(entries, taStorePassword);
	      let output = JSON.stringify(entries);
	      iotcs.impl.Platform.File._store(taStoreFile, output);
    }

    constructor(taStoreFile, taStorePassword) {
        //DJM: Need to figure out which of these is public and which is _private.
        this._clientId = null;
        this._sharedSecret = null;
        this._serverHost = null;
        this._serverPort = null;
        this._endpointId = null;
        this._serverScheme = 'https';
        this._taStoreFile = null;

        this._privateKey = null;
        this._publicKey = null;
        this._certificate = null;
        this._trustAnchors = [];
        this._connectedDevices = {};

        let _taStoreFile = taStoreFile || iotcs.oracle.iot.tam.store;
        let _taStorePassword = taStorePassword || iotcs.oracle.iot.tam.storePassword;

        if (!_taStoreFile) {
            iotcs.error('No trusted assets store file defined.');
            return;
        }

        if (!_taStorePassword) {
            iotcs.error('No trusted assets store password defined.');
            return;
        }

        if (!_taStoreFile.endsWith('.json')) {
            this._unifiedTrustStore =
                new iotcs.UnifiedTrustStore(_taStoreFile, _taStorePassword, false);
            this._unifiedTrustStore._setPrivateValues(this);
            this._taStoreFile = _taStoreFile;
        } else {
            this._load = () => {
                let input = iotcs.impl.Platform.File._load(_taStoreFile);
                let entries = JSON.parse(input);

                if (!_verifyTaStoreContent(entries, _taStorePassword)) {
                    iotcs.error('TA Store not signed or tampered with');
                    return;
                }

                this._clientId = entries.clientId;
                this._serverHost = entries.serverHost;
                this._serverPort = entries.serverPort;
                this._serverScheme = entries.serverScheme;
                this._sharedSecret = this._decryptSharedSecret(entries.sharedSecret, _taStorePassword);
                this._trustAnchors = entries.trustAnchors;
                this._connectedDevices = entries.connectedDevices;

                {
                    let keyPair = entries.keyPair;

                    if (keyPair) {
                        let p12Der = forge.util.decode64(entries.keyPair);
                        let p12Asn1 = forge.asn1.fromDer(p12Der, false);
                        let p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, _taStorePassword);

                        let bags = p12.getBags({
                            bagType: forge.pki.oids.certBag
                        });

                        this._certificate = bags[forge.pki.oids.certBag][0].cert;

                        bags = p12.getBags({
                            bagType: forge.pki.oids.pkcs8ShroudedKeyBag
                        });

                        let bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
                        this._privateKey = bag.key;
                        this._endpointId = bag.attributes.friendlyName[0];
                    }
                }
            };

            this._store = () => {
                iotcs.log('Store ' + ((this._privateKey !== null) ? 'true' : 'false') + ' ' +
                        this._endpointId + '.');
                let keyPairEntry = null;

                if (this._privateKey) {
                    let p12Asn1 = forge.pkcs12.toPkcs12Asn1(
                        this._privateKey,
                        this._certificate,
                        _taStorePassword, {
                            'friendlyName': this._endpointId
                        });

                    let p12Der = forge.asn1.toDer(p12Asn1).getBytes();
                    keyPairEntry = forge.util.encode64(p12Der);
                }

                let entries = {
                    'clientId': this._clientId,
                    'serverHost': this._serverHost,
                    'serverPort': this._serverPort,
                    'serverScheme': this._serverScheme,
                    'sharedSecret': this._encryptSharedSecret(this._sharedSecret, _taStorePassword),
                    'trustAnchors': this._trustAnchors,
                    'keyPair': keyPairEntry,
                    'connectedDevices': this._connectedDevices
                };

                entries = this._signTaStoreContent(entries, _taStorePassword);

                let output = JSON.stringify(entries);
                iotcs.impl.Platform.File._store(_taStoreFile, output);
            };

            this._load();
        }
    }

    // Private/protected functions
    _buildClientAssertion() {
        let id = (!this.isActivated() ? this.getClientId() : this.getEndpointId());
        let now = ((typeof this._serverDelay === 'undefined') ?
                   Date.now() : (Date.now() + this._serverDelay));
        let exp = parseInt((now + 900000)/1000);

        let header = {
            typ: 'JWT',
            alg: (!this.isActivated() ? 'HS256' : 'RS256')
        };

        let claims = {
            iss: id,
            sub: id,
            aud: 'oracle/iot/oauth2/token',
            exp: exp
        };

        let inputToSign = iotcs.impl.Platform.Util._btoa(JSON.stringify(header)) + '.' +
            iotcs.impl.Platform.Util._btoa(JSON.stringify(claims));

        let signed;

        try {
            if (!this.isActivated()) {
                let digest = this.signWithSharedSecret(inputToSign, "sha256", null);
                signed = forge.util.encode64(forge.util.hexToBytes(digest.toHex()));
            } else {
                let signatureBytes = this.signWithPrivateKey(inputToSign, "sha256");
                signed = forge.util.encode64(signatureBytes);
            }
        } catch (e) {
            let error = iotcs.createError('Error on generating oauth signature: ', e);
            return null;
        }

        inputToSign = inputToSign + '.' + signed;
        inputToSign = inputToSign.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
        return inputToSign;
    }

    /**
     * Generates the key pair to be used for assertion-based client authentication with the IoT CS.
     * This function is asynchronous and will use native APIs, which can be significantly faster
     * than using the non-native version.
     *
     * @function generateKeyPair
     * @ignore
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} algorithm The key algorithm.
     * @param {number} keySize The key size.
     * @param {function(boolean, error)} callback The callback to call with the results.
     * @returns {boolean} {@code true} if the key pair generation succeeded.
     */
    _generateKeyPairNative(algorithm, keySize, callback) {
        if (!algorithm) {
            callback(false, iotcs.createError('Algorithm cannot be null.'));
        }

        if (keySize <= 0) {
            callback(false, iotcs.createError('Key size cannot be negative or 0.'));
        }

        if (this._privateKey) {
            callback(false, iotcs.createError('Key pair already generated.'));
        }

        let keypair;
        let self = this;

        forge.rsa.generateKeyPair({bits: keySize, workers: -1}, (err, keypair) => {
            if (err) {
                callback(false, iotcs.createError('Could not generate key pair: ' + err));
            } else {
                self._keypair = keypair;
                self._privateKey = keypair.privateKey;
                self._publicKey = keypair.publicKey;
                callback(true);
            }
        });
    }

    // Public functions
    /**
     * Generates the key pair to be used for assertion-based client authentication with the IoT CS.
     *
     * @function generateKeyPair
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} algorithm - The key algorithm.
     * @param {number} keySize - The key size.
     * @returns {boolean} <code>true</code> if the key pair generation succeeded.
     */
    generateKeyPair(algorithm, keySize) {
        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return false;
        }

        if (keySize <= 0) {
            iotcs.error('Key size cannot be negative or 0.');
            return false;
        }

        if (this._privateKey) {
            iotcs.error('Key pair already generated.');
            return false;
        }

        try {
            let keypair = forge.rsa.generateKeyPair({
                bits : keySize
                //, e: 0x10001
            });

            this._privateKey = keypair.privateKey;
            this._publicKey = keypair.publicKey;
        } catch (e) {
            iotcs.error('Could not generate key pair: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Retrieves the ID of this client.  If the client is a device the client ID is the device
     * activation ID; if the client is a pre-activated enterprise application the client ID
     * corresponds to the assigned integration ID. The client ID is used along with a client secret
     * derived from the shared secret to perform secret-based client authentication with the IoT CS
     * server.
     *
     * @function getClientId
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The ID of this client or <code>null</code> if any error occurs retrieving
     *          the client ID.
     */
    getClientId() {
        return this._clientId;
    }

    /**
     * Retrieves the IoT CS connected devices.
     *
     * @function getConnectedDevices
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?object} The IoT CS connected devices or <code>null</code> if any error occurs
     *          retrieving connected devices.
     */
    getConnectedDevices() {
        return this._connectedDevices;
    }

    /**
     * Retrieves the assigned endpoint certificate.
     *
     * @function getEndpointCertificate
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The PEM-encoded certificate or <code>null</code> if no certificate was
     *          assigned, or if any error occurs retrieving the endpoint certificate.
     */
    getEndpointCertificate() {
        let certificate = null;

        if (!this._certificate) {
            iotcs.error('Endpoint certificate not assigned.');
            return null;
        }

        try {
            if (!this._isSelfSigned(this._certificate)) {
                certificate = forge.pki.certificateToPem(this._certificate);
            }
        } catch (e) {
            iotcs.error('Unexpected error retrieving certificate encoding: ' + 2);
            return null;
        }

        //XXX ??? is it an array or a string
        return certificate;
    }

    /**
     * Retrieves the assigned endpoint ID.
     *
     * @function getEndpointId
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @return {?string} The assigned endpoint ID or <code>null</code> if any error occurs retrieving
     *         the endpoint ID.
     */
    getEndpointId() {
        if (!this._endpointId) {
            throw new Error('EndpointId not assigned.');
        }

        return this._endpointId;
    }

    /**
     * Retrieves the public key to be used for certificate request.
     *
     * @function getPublicKey
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The device public key as a PEM-encoded string or <code>null</code> if any
     *          error occurs retrieving the public key.
     */
    getPublicKey() {
        if ((!this._publicKey) && (!this._certificate)) {
            throw new Error('Key pair not yet generated or certificate not yet assigned');
        }

        let key = (this._publicKey) ? this._publicKey : this._certificate.publicKey;
        return forge.pki.publicKeyToPem(key);
    }

    /**
     * Retrieves the IoT CS server host name.
     *
     * @function getServerHost
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server host name or <code>null</code> if any error occurs
     *          retrieving the server host name.
     */
    getServerHost() {
        return this._serverHost;
    }

    /**
     * Retrieves the IoT CS server port.
     *
     * @function getServerPort
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?number} The IoT CS server port (a positive integer) or <code>null</code> if any
     *          error occurs retrieving the server port.
     */
    getServerPort() {
        return this._serverPort;
    }

    /**
     * Retrieves the IoT CS server scheme.
     *
     * @function getServerScheme
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server scheme, or <code>null</code> if any error occurs
     *          retrieving the server scheme.
     */
    getServerScheme() {
        return this._serverScheme;
    }

    /**
     * Retrieves the trust anchor or most-trusted Certification Authority (CA) to be used to validate
     * the IoT CS server certificate chain.
     *
     * @function getTrustAnchorCertificates
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?Array} The PEM-encoded trust anchor certificates, or <code>null</code> if any error
     *          occurs retrieving the trust anchor.
     */
    getTrustAnchorCertificates() {
        return this._trustAnchors;
    }

    /**
     * Returns whether the client is activated.  The client is deemed activated if it has at least
     * been assigned endpoint ID.
     *
     * @function isActivated
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        //DJM:...why can't you just return the if part?...why a ternary here?
        return (this._endpointId && (this._endpointId !== null) && (this._endpointId !== '')) ?
            true : false;
    }

    /**
     * Resets the trust material back to its provisioning state; in particular, the key pair is
     * erased.  The client will have to go, at least,through activation again; depending on the
     * provisioning policy in place, the client may have to go through registration again.
     *
     * @function reset
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @return {boolean} <code>true</code> if the operation was successful.
     */
    reset() {
        this._endpointId = null;
        this._privateKey = null;
        this._publicKey = null;
        this._certificate = null;

        try {
            if (this._unifiedTrustStore) {
                this._unifiedTrustStore._updatePrivate(this);
            } else {
                this._store();
            }
        } catch (e) {
            iotcs.error('Error resetting the trust assets: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Sets the assigned endpoint ID and certificate as returned by the activation procedure.  Upon a
     * call to this method, a compliant implementation of the <code>TrustedAssetsManager</code>
     * interface must ensure the persistence of the provided endpoint credentials.  This method can only
     * be called once; unless the <code>TrustedAssetsManager</code> has been reset.
     * <p>
     * If the client is a pre-activated enterprise application, the endpoint ID has already been
     * provisioned and calling this method MUST fail with an <code>IllegalStateException</code>.
     * </p>
     *
     * @function setEndpointCredentials
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} endpointId - The assigned endpoint ID.
     * @param {string} certificate - The PEM-encoded certificate issued by the server or
     *        <code>null</code> if no certificate was provided by the server.
     * @returns {boolean} whether setting the endpoint credentials succeeded.
     */
    setEndpointCredentials(endpointId, certificate) {
        /*if (!endpointId) {
          iotcs.error('EndpointId cannot be null');
          return false;
          }
          if (this._endpointId) {
          iotcs.error('EndpointId already assigned');
          return false;
          }*/
        if (!this._privateKey) {
            iotcs.error('Private key not yet generated.');
            return false;
        }

        if (endpointId) {
            this._endpointId = endpointId;
        } else {
            this._endpointId = '';
        }

        try {
            if (!certificate || certificate.length <= 0) {
                this._certificate = iotcs.device.TrustedAssetsManager._generateSelfSignedCert(this._privateKey, this._publicKey,
                                                            this._clientId);
            } else {
                this._certificate = forge.pki.certificateFromPem(certificate);
            }
        } catch (e) {
            iotcs.error('Error generating certificate: ' + e);
            return false;
        }

        try {
            if (this._unifiedTrustStore) {
                this._unifiedTrustStore._updatePrivate(this);
            } else {
                this._store();
            }
        } catch (e) {
            iotcs.error('Error storing the trust assets: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Signs the provided data using the specified algorithm and the private key.  This method is only
     * use for assertion-based client authentication with the IoT CS.
     *
     * @function signWithPrivateKey
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {Array|string} data - A byte string to sign.
     * @param {string} algorithm - The algorithm to use.
     * @returns {?Array} The signature bytes or <code>null</code> if any error occurs retrieving the
     *          necessary key material or performing the operation.
     */
    signWithPrivateKey(data, algorithm) {
        let signature = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        if (!this._privateKey) {
            iotcs.error('Private key not yet generated.');
            return null;
        }

        try {
            let md = null;

            switch (algorithm) {
            case 'md5': {
                md = forge.md.md5.create();
                break;
            }
            case 'sha1': {
                md = forge.md.sha1.create();
                break;
            }
            case 'sha256': {
                md = forge.md.sha256.create();
                break;
            }
            case 'sha512': {
                md = forge.md.sha512.create();
                break;
            }
            case 'sha512/224': {
                md = forge.md.sha512.sha224.create();
                break;
            }
            case 'sha512/256': {
                md = forge.md.sha512.sha256.create();
                break;
            }
            }
            if (md) {
                md.update(data);
                signature = this._privateKey.sign(md);
            }
        } catch (e) {
            iotcs.error('Error signing with private key: ' + e);
            return null;
        }

        return signature;
    }

    /**
     * Signs the provided data using the specified algorithm and the shared secret of the device
     * indicated by the given hardware id.  Passing <code>null</code> for <code>hardwareId</code> is
     * identical to passing {@link #getClientId()}.
     *
     * @function signWithSharedSecret
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {Array} data - The bytes to be signed.
     * @param {string} algorithm - The hash algorithm to use.
     * @param {?string} hardwareId - The hardware id of the device whose shared secret is to be used
     *        for signing.
     * @return {?Array} The signature bytes or <code>null</code> if any error occurs retrieving the
     *         necessary key material or performing the operation.
     */
    signWithSharedSecret(data, algorithm, hardwareId) {
        let digest = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        let secretKey;

        if (hardwareId === null || hardwareId == this._clientId) {
            secretKey = this._sharedSecret;
        } else {
            secretKey = this._connectedDevices[hardwareId];
        }

        if (secretKey === null || (typeof secretKey === "undefined")) {
            iotcs.log("Shared secret is not provisioned for " +
                    (hardwareId ? hardwareId : this._clientId) + " device");
            return null;
        }

        try {
            let hmac = forge.hmac.create();
            hmac.start(algorithm, secretKey);
            hmac.update(data);
            digest = hmac.digest();
            // iotcs.log(digest.toHex());
        } catch (e) {
            iotcs.error('Error signing with shared secret: ' + e);
            return null;
        }

        return digest;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Message.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @alias iotcs.message
 * @memberof iotcs
 * @namespace
 */
iotcs.message = {};

/**
 * This object helps in the construction of a general type message to be sent to the server.  This
 * object and it's components are used as utilities by the Messaging API clients, like the
 * DirectlyConnectedDevice or GatewayDevice or indirectly by the MessageDispatcher.
 *
 * @alias iotcs.message.Message
 * @class iotcs.message.Message
 * @memberof iotcs.message
 * @public
 */
iotcs.message.Message = class {
    // Static private functions
    /**
     * This is a helper method for checking if an array of created messages pass the boundaries on
     * key/value length test.  If the test does not pass an error is thrown.
     *
     * @function checkMessagesBoundaries
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.message.Message.MAX_KEY_LENGTH}
     * @see {@link iotcs.message.Message.MAX_STRING_VALUE_LENGTH}
     *
     * @param {iotcs.message.Message[]} messages - The array of messages that need to be tested.
     */
    static _checkMessagesBoundaries(messages) {
        _mandatoryArg(messages, 'array');

        messages.forEach(message => {
            _mandatoryArg(message, iotcs.message.Message);

            this._recursiveSearchInMessageObject(message.getJSONObject(), (key, value) => {
                if (iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(key) > iotcs.message.Message.MAX_KEY_LENGTH) {
                    iotcs.error('Max length for key in message item exceeded.');
                }
                if ((typeof value === 'string') &&
                    (iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(value) >
                     iotcs.message.Message.MAX_STRING_VALUE_LENGTH))
                {
                    iotcs.error('Max length for value in message item exceeded.');
                }
            });
        });
    }

    /**
     * @ignore
     * @private
     */
    static _recursiveSearchInMessageObject(obj, callback) {
        if (obj) {
            let arrKeys = Object.keys(obj);

            for (let i = 0; i < arrKeys.length; i++) {
                callback(arrKeys[i], obj[arrKeys[i]]);

                if ((typeof obj[arrKeys[i]] === 'object') &&
                    (!(obj[arrKeys[i]] instanceof iotcs.StorageObject)))
                {
                    this._recursiveSearchInMessageObject(obj[arrKeys[i]], callback);
                }
            }
        }
    }

    // Static public functions
    /**
     * Constant which defines the number of times sending of a message should be retried.  The
     * minimum is 3.
     *
     * @constant BASIC_NUMBER_OF_RETRIES
     * @default 3
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get BASIC_NUMBER_OF_RETRIES() {
        let maxRetries = iotcs.oracle.iot.client.device.messageDispatcherBaseNumberOfRetries;
        return maxRetries > 3 ? maxRetries : 3;
    }

    /**
     * @constant MAX_KEY_LENGTH
     * @default 2048
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get MAX_KEY_LENGTH() {
        return 2048;
    }

    /**
     * @constant MAX_STRING_VALUE_LENGTH
     * @default 65536
     * @memberof iotcs.message.Message
     * @public
     * @type {number}
     */
    static get MAX_STRING_VALUE_LENGTH() {
        return 64 * 1024;
    }

    // Static public functions
    /**
     * This is a helper method for building a response message to be sent to the server as response to a
     * request message sent from the server.  This is mostly used by handlers registered with the
     * RequestDispatcher.  If no requestMessage is given the id for the response message will be a
     * random UUID.
     *
     * @function buildResponseMessage
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.RequestDispatcher}
     *
     * @param {object} [requestMessage] - The message received from the server as JSON.
     * @param {number} statusCode - The status code to be added in the payload of the response message.
     * @param {object} [headers] - The headers to be added in the payload of the response message.
     * @param {string} [body] - The body to be added in the payload of the response message.
     * @param {string} [url] - The URL to be added in the payload of the response message.
     *
     * @returns {iotcs.message.Message} The response message instance built on the given parameters.
     */
    static buildResponseMessage(requestMessage, statusCode, headers, body, url) {
        _optionalArg(requestMessage, 'object');
        _mandatoryArg(statusCode, 'number');
        _optionalArg(headers, 'object');
        _optionalArg(body, 'string');
        _optionalArg(url, 'string');

        let payload = {
            statusCode: statusCode,
            url: (url ? url : ''),
            requestId: ((requestMessage && requestMessage.id) ? requestMessage.id : iotcs.impl.Platform.Util._uuidv4()),
            headers: (headers ? headers : {}),
            body: (body ? iotcs.impl.Platform.Util._btoa(body) : '')
        };

        let message = new iotcs.message.Message();

        message.type(iotcs.message.Message.Type.RESPONSE)
            .source((requestMessage && requestMessage.destination) ? requestMessage.destination : '')
            .destination((requestMessage && requestMessage.source) ? requestMessage.source : '')
            .payload(payload);

        return message;
    }

    /**
     * This is a helper method for building a response wait message to notify RequestDispatcher that
     * response for server will be sent to the server later.  RequestDispatcher doesn't send these kind
     * of messages to the server.  This is mostly used by handlers registered with the
     * RequestDispatcher in asynchronous cases, for example, when device creates storage object by URI.
     *
     * @function buildResponseWaitMessage
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.RequestDispatcher}
     * @see {@link iotcs.device.util.DirectlyConnectedDevice#createStorageObject}
     *
     * @returns {iotcs.message.Message} The response message that notified about waiting final response.
     */
    static buildResponseWaitMessage() {
        let message = new iotcs.message.Message();
        message._properties.type = "RESPONSE_WAIT";
        return message;
    }

    constructor() {
        // Private fields 
        /**
         * Internal implementation object which contains properties and functions internal to the
         * implementation of Message.
         *
         * @ignore
         * @private
         */
        this._properties = {
            clientId: iotcs.impl.Platform.Util._uuidv4(),
            source: null,
            destination: '',
            sender: '',
            priority: 'LOW',
            reliability: 'BEST_EFFORT',
            eventTime: new Date().getTime(),
            type: null,
            properties: {},
            payload: {},
            remainingRetries: iotcs.message.Message.BASIC_NUMBER_OF_RETRIES
        };

        // Public fields
        this.onError = null;
    }

    // Private/protected functions
    _equals(message) {
        if (this === message) {return true;}
        if (!message || !(message instanceof iotcs.message.Message)) {return false;}
        if (this._properties.clientId != message._properties.clientId) {return false;}
        if (this._properties.destination != message._properties.destination) {return false;}
        if (this._properties.eventTime!== message._properties.eventTime) {return false;}
        if (this._properties.priority != message._properties.priority) {return false;}
        if (this._properties.reliability != message._properties.reliability) {return false;}
        if (this._properties.sender != message._properties.sender)  {return false;}
        if (this._properties.source !== message._properties.source) {return false;}
        if (this._properties.type !== message._properties.source) {return false;}
        if (this._properties.properties != message._properties.properties) {return false;}

        // DJM: Do we need any of these for _equals?
        /**
        if (id == null ? (message.id != null) : (!id.equals(message.id))) return false;
        if (diagnostics == null ? (message.diagnostics != null) : (!diagnostics.equals(message.diagnostics))) return false;
        if (direction == null ? (message.direction != null) : (!direction.equals(message.direction))) return false;
        if (receivedTime == null ? (message.receivedTime != null) : (!receivedTime.equals(message.receivedTime))) return false;
        if (gateway == null ? (message.gateway != null) : (!gateway.equals(message.gateway))) return false;
        if (sentTime == null ? (message.sentTime != null) : (!sentTime.equals(message.sentTime))) return false;
        // Do we need to equals payload?
        */
        return true;
    }

    // Public functions
    /**
     * This sets a key/value pair in the data property of the payload of the message.  This is
     * specific to DATA or ALERT type messages.
     *
     * @function dataItem
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} dataKey - The key.
     * @param {object} [dataValue] - The value associated with the key.
     * @returns {iotcs.message.Message} This object.
     */
    dataItem(dataKey, dataValue) {
        _mandatoryArg(dataKey, 'string');

        if (!('data' in this._properties.payload)) {
            this._properties.payload.data = {};
        }

        this._properties.payload.data[dataKey] = dataValue;
        return this;
    }

    /**
     * Sets the destination of the message.
     *
     * @function destination
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} destination - The destination.
     * @returns {iotcs.message.Message} This object.
     */
    destination(destination) {
        _mandatoryArg(destination, 'string');

        this._properties.destination = destination;
        return this;
    }

    /**
     * This sets the format URN in the payload of the message.  This is mostly specific for the DATA or
     * ALERT type * of messages.
     *
     * @function format
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} format - The format to set.
     * @returns {iotcs.message.Message} This object.
     */
    format(format) {
        _mandatoryArg(format, 'string');
        this._properties.payload.format = format;
        return this;
    }

    /**
     * This returns the built message as JSON to be sent to the server as it is.
     *
     * @function getJSONObject
     * @memberof iotcs.message.Message
     * @public
     *
     * @returns {object} A JSON representation of the message to be sent.
     */
    getJSONObject() {
        return this._properties;
    }

    /**
     * Gets the number of remaining retries for this message.  Not intended for general use.  Used
     * internally by the message dispatcher implementation.
     *
     * @function getRemainingRetries
     * @memberof iotcs.message.Message
     * @public
     *
     * @returns {integer} remainingRetries - The new number of remaining retries.
     */
    getRemainingRetries() {
        return this._properties.remainingRetries;
    }

    /**
     * Sets the payload of the message as object.
     *
     * @function payload
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {object} payload - The payload to set.
     * @returns {iotcs.message.Message} This object
     */
    payload(payload) {
        _mandatoryArg(payload, 'object');

        this._properties.payload = payload;
        return this;
    }

    /**
     * This sets the priority of the message. Priorities are defined in the Message.Priority
     * enumeration. If an invalid type is given an exception is thrown. The MessageDispatcher implements
     * a priority queue and it will use this parameter.
     *
     * @function priority
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.MessageDispatcher}
     * @see {@link iotcs.message.Message.Priority}
     *
     * @param {string} priority - The priority to set.
     * @returns {iotcs.message.Message} This object.
     */
    priority(priority) {
        _mandatoryArg(priority, 'string');

        if (Object.keys(iotcs.message.Message.Priority).indexOf(priority) < 0) {
            iotcs.error('Invalid priority given.');
            return this;
        }

        this._properties.priority = priority;
        return this;
    }

    /**
     * This sets the reliability of the message. Reliabilities are defined in the Message.Reliability
     * enumeration. If an invalid type is given, an exception is thrown.
     *
     * @function reliability
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.device.util.MessageDispatcher}
     * @see {@link iotcs.message.Message.Reliability}
     *
     * @param {string} priority - The reliability to set.
     * @returns {iotcs.message.Message} This object.
     */
    reliability(reliability) {
        _mandatoryArg(reliability, 'string');

        if (Object.keys(iotcs.message.Message.Reliability).indexOf(reliability) < 0) {
            iotcs.error('Invalid reliability given.');
            return this;
        }

        this._properties.reliability = reliability;
        return this;
    }

    /**
     * Sets the number of remaining retries for this message.  Not intended for general use.  Used
     * internally by the message dispatcher implementation.
     *
     * @function setRemainingRetries
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {integer} remainingRetries - The new number of remaining retries.
     * @returns {iotcs.message.Message} This object.
     */
    setRemainingRetries(remainingRetries) {
        _mandatoryArg(remainingRetries, 'integer');
        this._properties.remainingRetries = remainingRetries;
        return this;
    }

    /**
     * Sets the source of the message.
     *
     * @function source
     * @memberof iotcs.message.Message
     * @public
     *
     * @param {string} source - The source to set.
     * @returns {iotcs.message.Message} This object.
     */
    source(source) {
        _mandatoryArg(source, 'string');

        if (this._properties.source === null) {
            this._properties.source = source;
        }

        return this;
    }

    /**
     * This sets the type of the message. Types are defined in the
     * Message.Type enumeration. If an invalid type is given an
     * exception is thrown.
     *
     * @function type
     * @memberof iotcs.message.Message
     * @public
     * @see {@link iotcs.message.Message.Type}
     *
     * @param {string} type - The type to set.
     * @returns {iotcs.message.Message} This object.
     */
    type(type) {
        _mandatoryArg(type, 'string');

        if (Object.keys(iotcs.message.Message.Type).indexOf(type) < 0) {
            iotcs.error('Invalid message type given.');
            return this;
        }

        if (type === iotcs.message.Message.Type.RESOURCES_REPORT) {
            this._properties.id = iotcs.impl.Platform.Util._uuidv4();
        }

        this._properties.type = type;
        return this;
    }
};

/**
 * Enumeration of message types.
 *
 * @alias iotcs.message.Message.Type
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Type = {
    DATA: 'DATA',
    ALERT: 'ALERT',
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    RESOURCES_REPORT: 'RESOURCES_REPORT'
};

Object.freeze(iotcs.message.Message.Type);

/**
 * Enumeration of message priorities.
 *
 * @alias iotcs.message.Message.Priority
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Priority = {
    LOWEST: 'LOWEST',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    HIGHEST: 'HIGHEST'
};

Object.freeze(iotcs.message.Message.Priority);

/**
 * Enumeration of message reliability options.
 *
 * @alias iotcs.message.Message.Reliability
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.Reliability = {
    BEST_EFFORT: 'BEST_EFFORT',
    GUARANTEED_DELIVERY: 'GUARANTEED_DELIVERY',
    NO_GUARANTEE: 'NO_GUARANTEE'
};

Object.freeze(iotcs.message.Message.Reliability);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/AlertMessage.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Helpers for building alert messages.
 *
 * @alias iotcs.message.Message.AlertMessage
 * @class
 * @memberof iotcs.message.Message
 * @public
 */
iotcs.message.Message.AlertMessage = class {
    /**
     * Helper method used for building alert messages to be sent to the server.  The severity is defined
     * in the AlertMessage.Severity enumeration.  If an invalid value is given an exception is thrown.
     *
     * @function buildAlertMessage
     * @memberOf iotcs.message.Message.AlertMessage
     * @public
     * @see {@link iotcs.message.Message.AlertMessage.Severity}
     *
     * @param {string} format - The format added in the payload of the generated message.
     * @param {string} description - The description added in the payload of the generated message.
     * @param {string} severity - The severity added in the payload of the generated message.
     * @returns {iotcs.message.Message} The instance of the alert message built based on the given
     *          parameters, or <code>null</code> if the message could not be built.
     */
    static buildAlertMessage(format, description, severity) {
        _mandatoryArg(format, 'string');
        _mandatoryArg(description, 'string');
        _mandatoryArg(severity, 'string');

        if (Object.keys(iotcs.message.Message.AlertMessage.Severity).indexOf(severity) < 0) {
            iotcs.error('Invalid severity given.');
            return nulll;
        }

        let payload = {
            format: format,
            severity: severity,
            description: description,
            data: {}
        };

        let message = new iotcs.message.Message();

        message.type(iotcs.message.Message.Type.ALERT)
            .priority(iotcs.message.Message.Priority.HIGHEST)
            .payload(payload);

        return message;
    }
};

/**
 * Enumeration of severities for alert messages
 *
 * @alias Severity
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message.AlertMessage
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.AlertMessage.Severity = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    SIGNIFICANT: 'SIGNIFICANT',
    CRITICAL: 'CRITICAL'
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/ResourceMessage.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Helpers for building resource report messages.
 *
 * @alias iotcs.message.Message.ResourceMessage
 * @class
 * @public
 * @memberof iotcs.message.Message
 */
iotcs.message.Message.ResourceMessage = class {
    /**
     * Helper method used for building a resource report message to be sent to the server.  The
     * resources objects can be generated by using the ResourceMessage.Resource.buildResource method.
     * The reportType must be taken from the ResourceMessage.Type enumeration.  If an invalid value is
     * given an exception is thrown.  The rM parameter is the reconciliationMark that can be calculated
     * by using the ResourceMessage.getMD5ofList over the array of paths of the resources given as
     * objects.  A resource is an object that must have at least 2 properties as strings: path and
     * methods.  Also methods must be string that represents a concatenation of valid HTTP methods comma
     * separated.
     *
     * @function buildResourceMessage
     * @memberof iotcs.message.Message.ResourceMessage
     * @public
     * @see {@link iotcs.message.Message.ResourceMessage.Resource.buildResource}
     * @see {@link iotcs.message.Message.ResourceMessage.Type}
     *
     * @param {object[]} resources - The array of resources that are included in the report message
     *        resource report message.
     * @param {string} endpointName - The endpoint that is giving the resource report.
     * @param {string} reportType - The type of the report.
     * @param {string} [rM] - The reconciliationMark used by the server to validate the report.
     * @returns {iotcs.message.Message} The instance of the resource report message to be sent to the
     *          server or <code>null</code> if the message could not be created.
     */
    static buildResourceMessage(resources, endpointName, reportType, rM) {
        _mandatoryArg(resources, 'array');

        resources.forEach(resource => {
            _mandatoryArg(resource, 'object');
            _mandatoryArg(resource.path, 'string');
            _mandatoryArg(resource.methods, 'string');

            resource.methods.split(',').forEach(method => {
                if (['GET', 'PUT', 'POST', 'HEAD', 'OPTIONS', 'CONNECT', 'DELETE', 'TRACE'].indexOf(method) < 0) {
                    iotcs.error('Invalid method in resource message.');
                    return;
                }
            });
        });

        _mandatoryArg(endpointName, 'string');
        _mandatoryArg(reportType, 'string');

        if (Object.keys(iotcs.message.Message.ResourceMessage.Type).indexOf(reportType) < 0) {
            iotcs.error('invalid report type given');
            return null;
        }

        _optionalArg(rM, 'string');

        let payload = {
            type: 'JSON',
            value: {}
        };

        payload.value.reportType = reportType;
        payload.value.endpointName = endpointName;
        payload.value.resources = resources;

        if (rM) {
            payload.value.reconciliationMark = rM;
        }

        let message = new iotcs.message.Message();

        message.type(iotcs.message.Message.Type.RESOURCES_REPORT)
            .payload(payload);

        return message;
    }

    /**
     * This generates an MD5 hash of an array of strings.  This must to be used to generate the
     * reconciliationMark of the resource report message.
     *
     * @function getMD5ofList
     * @memberof iotcs.message.Message.ResourceMessage
     * @public
     *
     * @param {string[]} stringArray - The array of strings to use to generate the hash.
     * @returns {string} The MD5 hash.
     */
    static getMD5ofList(stringArray) {
        _mandatoryArg(stringArray, 'array');

        stringArray.forEach(str => {
            _mandatoryArg(str, 'string');
        });

        let hash = forge.md.md5.create();

        for (let i = 0; i < stringArray.length; i++) {
            hash.update(stringArray[i]);
        }

        return hash.digest().toHex();
    }
};

/**
 * Enumeration of the type of resource report messages.
 *
 * @alias Type
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message.ResourceMessage
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.ResourceMessage.Type = {
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    RECONCILIATION: 'RECONCILIATION'
};

Object.freeze(iotcs.message.Message.ResourceMessage.Type);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/ResourceMessageResource.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Helper method used to build a resource object. The status parameter must be given from the
 * Resource.Status enumeration. If an invalid value is given the method will throw an exception.
 * Also the methods array must be an array of valid HTTP methods, otherwise an exception will be
 * thrown.
 *
 * @function buildResource
 * @memberof iotcs.message.Message.ResourceMessage.Resource
 * @public
 * @see {@link iotcs.message.Message.ResourceMessage.Resource.Status}
 *
 * @param {string} name - The name of the resource.
 * @param {string} path - The path of the resource.
 * @param {string} methods - A comma-separated string of the methods that the resource implements.
 * @param {string} status - The status of the resource.  Must be one of
 *        iotcs.message.Message.ResourceMessage.Resource.Status.
 * @param {string} [endpointName] - The endpoint associated with the resource.
 * @returns {object} The instance of the object representing a resource.
 */
iotcs.message.Message.ResourceMessage.Resource = class {
    // Static public functions
    static buildResource(name, path, methods, status, endpointName) {
        _mandatoryArg(name, 'string');
        _mandatoryArg(path, 'string');
        _mandatoryArg(methods, 'string');

        methods.split(',').forEach(method => {
            if (['GET', 'PUT', 'POST', 'HEAD', 'OPTIONS', 'CONNECT', 'DELETE', 'TRACE'].indexOf(method) < 0) {
                iotcs.error('invalid method in resource message');
                return;
            }
        });

        _mandatoryArg(status, 'string');
        _optionalArg(endpointName, 'string');

        if (Object.keys(iotcs.message.Message.ResourceMessage.Resource.Status).indexOf(status) < 0) {
            iotcs.error('invalid status given');
            return;
        }

        let obj = {};
        obj.name = name;
        obj.path = path;
        obj.status = status;
        obj.methods = methods.toString();

        if (endpointName) {
            obj.endpointName = endpointName;
        }

        return obj;
    }

    constructor() {
        // Nothing to do here.
    }
};

/**
 * Enumeration of possible statuses of the resources.
 *
 * @alias Status
 * @class
 * @enum {string}
 * @memberof iotcs.message.Message.ResourceMessage.Resource
 * @public
 * @readonly
 * @static
 */
iotcs.message.Message.ResourceMessage.Resource.Status = {
    ADDED: 'ADDED',
    REMOVED: 'REMOVED'
};

Object.freeze(iotcs.message.Message.ResourceMessage.Resource.Status);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DataItem.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.DataItem = class {
    /**
     * Constructor that takes a string key and value.
     *
     * @param {string} key data item key.
     * @param {object} value data item value.
     *
     * TODO: Handle these two situations (below).
     * @throws Error when value is {@link Double#NEGATIVE_INFINITY},
     *         {@link Double#POSITIVE_INFINITY} or {@link Double#NaN} or the key is empty or long
     *         string. Maximum length for key is {@link Message.Utils#MAX_KEY_LENGTH} bytes. The
     *         length is measured after the key is encoded using UTF-8 encoding.
     * @throws Error when the key is {@code null}.
     */
    constructor(key, value) {
        // Note: We need to use 'typeof undefined' for value as a !value check is true when value is
        // 0, which is an OK value.
        if (!key || (typeof value === 'undefined')) {
            iotcs.error('Key and value must be defined.');
        }

        /**
         * Data item key
         * @type {string}
         *
         * @ignore
         * @private
         */
        this._key = key;

        /**
         * Data item value.
         * @type {object}
         *
         * @ignore
         * @private
         */
        this._value = value;

        /**
         * Type of the value.
         * @type {object} (Type)
         *
         * @ignore
         * @private
         */
        this._type = '';
    }

    // Private/protected functions
    _getKey() {
        return this._key;
    }

    _getType() {
        return this._type;
    }

    _getValue() {
        return this._value;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/PersistenceMetaData.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Meta-data related to persistence.
 */
iotcs.device.impl.PersistenceMetaData = class {
    static _isPersistenceEnabled() {
        return false;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DeviceFunction.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceFunction is an abstraction of a policy device function.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DeviceFunction = class {
    // Static private/protected functions
    /**
     * Adds the field/value to the alert message.
     *
     * @param {iotcs.message.Message} alertMessage - The alert message to add the field/value to.
     * @param {iotcs.device.impl.DeviceModelFormatField} field - The field to add.
     * @param {object} value - The value to add.
     */
    static _addDataItem(alertMessage, field, value) {
        switch (field.getType()) {
            case 'integer':
            case 'number':
                if (value instanceof Number) {
                    if (field.getType() === iotcs.impl.DeviceModelAttribute.Type.INTEGER) {
                        alertMessage.dataItem(field._getName(), value);
                    } else {
                        alertMessage.dataItem(field._getName(), Number(value));
                    }
                } else {
                    throw new Error("value of attribute '" + field._getName() + "' is not a " +
                        field._getType());
                }

                break;
            case 'string':
            case 'uri':
            default:
                alertMessage.dataItem(field._getName(), String(value));
                break;
            case 'boolean':
                if (value instanceof Boolean) {
                    alertMessage.dataItem(field._getName(), value);
                } else {
                    throw new Error("Value of attribute '" + field._getName() + "' is not a " +
                        field._getType());
                }

                break;
            case 'datetime':
                if (value instanceof Number) {
                    alertMessage.dataItem(field._getName(), value);
                } else if (value instanceof Date) {
                    alertMessage.dataItem(field._getName(), new Date(value).getTime());
                } else {
                    throw new Error("value of attribute '" + field._getName() + "' is not a " +
                        field._getType());
                }

                break;
        }
    }

    /**
     *
     *
     * @param {iotcs.device.impl.FormulaParserNode} node
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {number}
     */
    static _compute(node, deviceAnalog) {
        if (!node) {
            return NaN;
        }

        if (node instanceof iotcs.device.impl.FormulaParserTerminal) {
            const attr = node._getValue();

            switch (node._type) {
                case iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE: {
                    // {number}
                    const value = deviceAnalog._getAttributeValue(attr);

                    if (typeof value === 'number') {
                        return value;
                    } else if (typeof value === 'boolean') {
                        return value ? 1 : 0;
                    }

                    break;
                }
                case iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE:
                    /** @type {number} */
                    let value = iotcs.device.impl.DeviceFunction._getInProcessValue(deviceAnalog._getEndpointId(),
                        deviceAnalog._getDeviceModel()._getUrn(), attr);

                    if (value || deviceAnalog._getAttributeValue(attr)) {
                        if (typeof value === 'number') {
                            return value;
                        } else if (typeof value === 'boolean') {
                            return value ? 1 : 0;
                        }
                    }

                    break;
                case iotcs.device.impl.FormulaParserTerminal.Type.NUMBER:
                    return parseFloat(attr);
            }

            return NaN;
        }

        if (node._getOperation() === iotcs.device.impl.FormulaParserOperation.Op.TERNARY) {
            /** @type {number} */
            let cond = iotcs.device.impl.DeviceFunction._compute(node._getLeftHandSide(), deviceAnalog);

            if (cond === 1.0) {
                return iotcs.device.impl.DeviceFunction._compute(node._getRightHandSide()._getLeftHandSide(),
                    deviceAnalog);
            } else {
                return iotcs.device.impl.DeviceFunction._compute(node._getRightHandSide()._getRightHandSide(),
                    deviceAnalog);
            }
        } else if (node._getOperation() === iotcs.device.impl.FormulaParserOperation.Op.GROUP) {
            return iotcs.device.impl.DeviceFunction._compute(node._getLeftHandSide(), deviceAnalog);
        }

        /** @type {number} */
        let lhs = iotcs.device.impl.DeviceFunction._compute(node._getLeftHandSide(), deviceAnalog);
        /** @type {number} */
        let rhs = iotcs.device.impl.DeviceFunction._compute(node._getRightHandSide(), deviceAnalog);
        /** @type {Operation} */
        const operation = node._getOperation();

        switch (operation) {
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_MINUS:
                return -lhs;
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_PLUS:
                return +lhs;
            case iotcs.device.impl.FormulaParserOperation.Op.DIV:
                return lhs / rhs;
            case iotcs.device.impl.FormulaParserOperation.Op.MUL:
                return lhs * rhs;
            case iotcs.device.impl.FormulaParserOperation.Op.PLUS:
                return lhs + rhs;
            case iotcs.device.impl.FormulaParserOperation.Op.MINUS:
                return lhs - rhs;
            case iotcs.device.impl.FormulaParserOperation.Op.MOD:
                return lhs % rhs;
            case iotcs.device.impl.FormulaParserOperation.Op.OR:
                // Let NaN or NaN be false.
                if (isNaN(lhs)) {
                    return isNaN(rhs) ? 0.0 : 1.0;
                } else {
                    return lhs !== 0.0 || rhs!== 0.0 ? 1.0 : 0.0;
                }
            case iotcs.device.impl.FormulaParserOperation.Op.AND:
                // If lhs or rhs is NaN, return false
                if (isNaN(lhs) || isNaN(rhs)) {
                    return 0.0;
                } else {
                    return lhs !== 0.0 && rhs !== 0.0 ? 1.0 : 0.0;
                }
            case iotcs.device.impl.FormulaParserOperation.Op.EQ:
                // NaN.compareTo(42) == 1, 42.compareTo(NaN) == -1
                return lhs === rhs ? 1.0 : 0.0;
            case iotcs.device.impl.FormulaParserOperation.Op.NEQ:
                return lhs === rhs ? 0.0 : 1.0;
            case iotcs.device.impl.FormulaParserOperation.Op.GT:
                // NaN.compareTo(42) == 1, 42.compareTo(NaN) == -1
                // Let NaN > 42 return false, and 42 > NaN return true
                if (isNaN(lhs)) {return 0.0;}
                if (isNaN(rhs)) {return 1.0;}
                return lhs > rhs ? 1.0 : 0.0;
            case iotcs.device.impl.FormulaParserOperation.Op.GTE:
                // NaN.compareTo(42) == 1, 42.compareTo(NaN) == -1
                // Let NaN >= 42 return false, and 42 >= NaN return true
                if (isNaN(lhs)) {return isNaN(rhs) ? 1.0 : 0.0;}
                if (isNaN(rhs)) {return 1.0;}
                return lhs >= rhs ? 1.0 : 0.0;
            case iotcs.device.impl.FormulaParserOperation.Op.LT:
                // NaN.compareTo(42) == 1, 42.compareTo(NaN) == -1
                // Let NaN < 42 return false, and 42 < NaN return true
                if (isNaN(lhs)) {return 0.0;}
                if (isNaN(rhs)) {return 1.0;}
                return lhs < rhs ? 1.0 : 0.0;
            case iotcs.device.impl.FormulaParserOperation.Op.LTE:
                // NaN.compareTo(42) == 1, 42.compareTo(NaN) == -1
                // Let NaN <= 42 return false, and 42 <= NaN return true
                if (isNaN(lhs)) {return isNaN(rhs) ? 1.0 : 0.0;}
                if (isNaN(rhs)) {return 1.0;}
                return lhs <= rhs ? 1.0 : 0.0;
            case iotcs.device.impl.FormulaParserOperation.Op.TERNARY:
                break;
            case iotcs.device.impl.FormulaParserOperation.Op.ALTERNATIVE:
                break;
            case iotcs.device.impl.FormulaParserOperation.Op.NOT:
                return lhs === 1.0 ? 0.0 : 1.0;
            case iotcs.device.impl.FormulaParserOperation.Op.FUNCTION:
                break;
            case iotcs.device.impl.FormulaParserOperation.Op.GROUP:
                break;
            case iotcs.device.impl.FormulaParserOperation.Op.TERMINAL:
                break;
        }

        return NaN;
    }

    /**
     * Creates and returns an alert message.
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog - A device analog containing the device model and device's
     *        endpoint ID.
     * @param {Map<string, object>} configuration - The device policy parameters configuration.
     * @return {Message} - An alert message.
     */
    static _createAlert(deviceAnalog, configuration) {
        /** @type {iotcs.device.impl.DeviceModel} */
        const deviceModel = deviceAnalog._getDeviceModel();

        /** @type {Map<string, iotcs.device.impl.DeviceModelFormat>} */
        const deviceModelFormatMap = deviceModel.getDeviceModelFormats();

        if (!deviceModelFormatMap) {
            iotcs.error(deviceModel.getUrn() + " does not contain alert formats.");
        }

        /** @type {string} */
        const format = configuration.get("urn");
        /** @type {iotcs.device.impl.DeviceModelFormat} */
        const deviceModelFormat = deviceModelFormatMap.get(format);

        if (!deviceModelFormat) {
            iotcs.error(deviceModel.getUrn() + " does not contain alert format '" + format +
                "'");
        }

        /** @type {List<iotcs.device.impl.DeviceModelFormatField>} */
        const fields = deviceModelFormat._getFields();

        /** @type {AlertMessage.Severity} */
        let alertSeverity;

        try {
            /** @type {string} */
            const severityConfig = configuration.get("severity");

            alertSeverity = severityConfig ?
                severityConfig : iotcs.message.Message.AlertMessage.Severity.NORMAL;
        } catch (error) {
            alertSeverity = iotcs.message.Message.AlertMessage.Severity.NORMAL;
        }

        /** @type {AlertMessage} */
        let alertMessage = iotcs.message.Message.AlertMessage.buildAlertMessage(format,
            deviceModelFormat._getName(), alertSeverity);

        alertMessage
            .format(format)
            .source(deviceAnalog._getEndpointId());

        /** @type {Map<string,object>} */
        const fieldsFromPolicy = configuration.get("fields");

        fields.forEach (field => {
            /** @type {object} */
            const policyValue = fieldsFromPolicy.get(field.getName());

            if (!policyValue) {
                return;  //continue
            }

            try {
                /** @type {object} */
                let value = iotcs.device.impl.DeviceFunction._convertArg(deviceAnalog, field._getType(), policyValue);
                iotcs.device.impl.DeviceFunction._addDataItem(alertMessage, field, value);
            } catch (error) {
                console.log("Bad value for '" + field._getName() + "' in '" + eviceModel._getUrn() +
                    "' :" + error);
            }
        });

        return alertMessage;
    }

    /**
     * @param {string} endpointId
     * @param {string} deviceModelUrn
     * @param {string} attribute
     * @return {string}
     */
    static _createInProcessMapKey(endpointId, deviceModelUrn, attribute) {
        return endpointId + '/deviceModels/' + deviceModelUrn + ':attributes/' + attribute;
    }

    /**
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {string} type ({DeviceModelAttribute.Type})
     * @param {object} arg
     * @return {object} {@code null} if arg is undefined.
     */
    static _convertArg(deviceAnalog, type, arg) {
        if (!arg) {
            return null;
        }

        switch (type) {
            case 'string':
                return iotcs.device.impl.DeviceFunction._convertFormulaToString(deviceAnalog, String(arg));
            case 'uri':
            case 'boolean':
            case 'datetime':
            default:
                // No conversion
                return arg;
            case 'number':
                // Treat as formula.
                /** @type {number} */
                let num;

                if (typeof arg === 'string') {
                    num = iotcs.device.impl.DeviceFunction._convertFormula(deviceAnalog, arg);
                } else if (typeof arg === 'number') {
                    num =  arg;
                } else {
                    throw new Error("Expected NUMBER or STRING, found '" + typeof arg + "'");
                }

                if (type === iotcs.impl.DeviceModelAttribute.Type.INTEGER) {
                    return num;
                }

                return num;
        }
    }

    /**
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {string} formula
     * @return {number}
     */
    static _convertFormula(deviceAnalog, formula) {
        try {
            // If arg is a string, it should be a FORMULA.
            /** @type {Set<iotcs.device.impl.FormulaParser.token>} */
            const tokens = iotcs.device.impl.FormulaParser._tokenize(formula);
            /** @type {iotcs.device.impl.FormulaParserNode} */
            const node = iotcs.device.impl.FormulaParser._parseFormula(tokens, formula);
            return iotcs.device.impl.DeviceFunction._compute(node, deviceAnalog);
        } catch (error) {
            console.log('Field in formula not in device model: ' + formula);
        }

        return NaN;
    }

    /**
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {string} formula
     * @return {object}
     */
    static _convertFormulaToString(deviceAnalog, formula) {
        // If arg is a string, it should be a FORMULA.
        try {
            /** @type {Set<iotcs.device.impl.FormulaParserToken} */
            const tokens = iotcs.device.impl.FormulaParser._tokenize(formula);
            /** @type {Set<iotcs.device.impl.FormulaParserNode} */
            const node = iotcs.device.impl.FormulaParser._parseFormula(tokens, formula);

            if (node instanceof iotcs.device.impl.FormulaParserTerminal) {
                /** @type {iotcs.device.impl.FormulaParserTerminal } */
                let terminal = node;
                /** @type {string} */
                const nodeValue = node._getValue();

                switch (terminal.type) {
                    case iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE: {
                        /** @type {object} */
                        const value = deviceAnalog._getAttributeValue(nodeValue);

                        if (typeof value === 'string') {
                            return value;
                        }

                        break;
                    }
                    case iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE:
                        /** @type {object} */
                        let value = iotcs.device.impl.DeviceFunction._getInProcessValue(deviceAnalog._getEndpointId(),
                        deviceAnalog._getDeviceModel()._getUrn(), nodeValue);

                        if (value != null ||
                            (value = deviceAnalog._getAttributeValue(nodeValue)) != null)
                        {
                            if (typeof value === 'string') {
                                return value;
                            }
                        }

                        break;
                    case iotcs.device.impl.FormulaParserTerminal.Type.IDENT:
                        return nodeValue;
                }
            }
        } catch (error) {
            console.log('Could not parse formula: ' + formula);
        }

        return formula;
    }

    /**
     * Greatest common factor, e.g., gcd(90,60) = 30.
     *
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    static _gcd(x, y){
        return (y === 0) ? x : iotcs.device.impl.DeviceFunction._gcd(y, x % y);
    }

    /**
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {Map<string, object>} configuration
     * @return {object[]}
     */
    static _getActionArgs(deviceAnalog, configuration) {
        // This list comes from handling the "action" parameter in
        // iotcs.device.impl.DevicePolicyManager.devicePolicyFromJSON()
        /** @type {Set<object>} */
        let args = configuration.get('arguments');

        if (!args || args.size === 0) {
            return null;
        }

        /** @type {object[]} */
        let actionArgs = [args.size];

        for (let n = 0, nMax = args.size; n < nMax; n++) {
            /** @type {iotcs.device.impl.DeviceModel} */
            const deviceModel = deviceAnalog._getDeviceModel();
            /** @type {Map<string, iotcs.device.impl.DeviceModelAction} */
            const actionMap = deviceModel.getDeviceModelActions();

            if (!actionMap|| actionMap.size === 0) {
                // TODO: this could get annoying
                console.log('No actions in device model "' +
                    deviceModel.getUrn() + '"');

                actionArgs[n] = null;
                continue;
            }

            /** @type {string} */
            const actionName = configuration.get('name');
            /** @type {iotcs.device.impl.DeviceModelAction} */
            const deviceModelAction = actionMap.get(actionName);

            if (!deviceModelAction) {
                // TODO: this could also get annoying
                console.log('No action named "' + actionName
                    + '" in device model "' + deviceModel.getUrn() + '"');

                actionArgs[n] = null;
                continue;
            }

            /** @type {string} ({DeviceModelAttribute.Type}) */
            const type = deviceModelAction._getArguments()[n]._getArgType();

            try {
                actionArgs[n] = iotcs.device.impl.DeviceFunction._convertArg(deviceAnalog, type, args.get(n));
            } catch (error) {
                console.log('Bad argument to "' + actionName + '" in "' + deviceModel.getUrn() +
                    '" :' + error);

                // Maybe this was purposeful - let application handle.
                actionArgs[n] = args.get(n);
            }
        }

        return actionArgs;
    }

    /**
     * @param functionId (string)
     * @return iotcs.device.impl.DeviceFunction
     */
    static _getDeviceFunction(functionId) {
        return iotcs.device.impl.DeviceFunction._POLICY_MAP.get(functionId);
    }

    /**
     * @param  {string} endpointId
     * @param  {string} deviceModelUrn
     * @param  {string} attribute
     * @return {object}
     */
    static _getInProcessValue(endpointId, deviceModelUrn, attribute) {
        if (!iotcs.device.impl.DeviceFunction._inProcessValues) {
            iotcs.device.impl.DeviceFunction._inProcessValues = new Map();
        }

        if (!this._inProcessValues) {
            this._inProcessValues = new Map();
        }

        let k = iotcs.device.impl.DeviceFunction._createInProcessMapKey(endpointId, deviceModelUrn, attribute);
        return this._inProcessValues.get(k);
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} DeviceAnalog
     * @return {Set<Pair<iotcs.message.Message, StorageObject>>}
     */
    static _getPersistedBatchedData(deviceAnalog) {
        /** @type {Set<iotcs.message.Message>} */
        const messages = batchByPersistence._get(deviceAnalog._getEndpointId());
        batchByPersistence._delete(messages);
        /** @type {Set<Pair<iotcs.message.Message, StorageObject>>} */
        const pairs = new Set();

        messages.forEach(message => {
            pairs.add(new iotcs.device.impl.Pair(message, null));
        });

        return pairs;
    }


    /**
     * Utility for getting a "slide" value from a configuration.
     *
     * @param {Map<string, object>} configuration the parameters for this function from the device
     *        policy.
     * @param {number} window the corresponding window for the slide.
     * @return {number} the configured slide value, or window if there is no slide or slide is zero
     */
    static _getSlide(configuration, window) {
        /** @type {number} */
        const slide = configuration.get("slide");

        if (slide) {
            return slide > 0 ? slide : window;
        }

        return window;
    }

    /**
     * Utility for getting a "window" value from a configuration.
     *
     * @param {Map<string, object>} configuration the parameters for this function from the device
     *        policy
     * @return {number} a window value, or -1 if the configuration is not time based
     */
    static _getWindow(configuration) {
        let criterion = -1;
        ['window', 'delayLimit'].forEach(key => {
            let criterionTmp = configuration.get(key);

            if (criterionTmp) {
                criterion = criterionTmp;
            }
        });

        return criterion;
    }

    /**
     *
     * @param {string} endpointId
     * @param {string} deviceModelUrn
     * @param {string} attribute
     * @param {object} value
     * @return {void}
     */
    static _putInProcessValue(endpointId, deviceModelUrn, attribute, value) {
        if (!iotcs.device.impl.DeviceFunction._inProcessValues) {
            iotcs.device.impl.DeviceFunction._inProcessValues = new Map();
        }

        let k = iotcs.device.impl.DeviceFunction._createInProcessMapKey(endpointId, deviceModelUrn, attribute);
        iotcs.device.impl.DeviceFunction._inProcessValues.set(k, value);
    }

    static _removeInProcessValue(endpointId, deviceModelUrn, attribute) {
        let value = null;
        let key = iotcs.device.impl.DeviceFunction._createInProcessMapKey(endpointId, deviceModelUrn, attribute);

        if (iotcs.device.impl.DeviceFunction._inProcessValues.has(key)) {
            value = iotcs.device.impl.DeviceFunction._inProcessValues.get(key);
            iotcs.device.impl.DeviceFunction._inProcessValues.delete(key);
        }

        return value;
    }

    /**
     *
     * @param {string} id
     */
    constructor(id) {
        // Instance "variables"/properties.
        /**
         * The id of the function. This is the unique id from the function definition.
         *
         * @type {string}
         */
        this.id = id;
        Object.freeze(this.id);
        /** @type {BatchByPersistence} */
        this.batchByPersistence =
            iotcs.device.impl.PersistenceMetaData._isPersistenceEnabled() ? new iotcs.device.impl.BatchByPersistence() : null;
        // Instance "variables"/properties.

        if (!iotcs.device.impl.DeviceFunction._inProcessValues) {
            iotcs.device.impl.DeviceFunction._inProcessValues = new Map();
        }
    }

    // Private/protected functions
    /**
     * The {@code apply} method is where the logic for the function is coded.
     * This method returns {@code true} if the conditions for the function have
     * been met. Only when this function's apply method returns true
     * will the next function in the pipeline be applied.
     * <p>
     * After this method returns {@code true}, use
     * {@link #get(iotcs.device.impl.DeviceAnalog, string, Map, Map)} to retrieve
     * the value from the function.
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog the VirtualDevice, never {@code null}.
     * @param {(string|null)} attribute the DeviceModelAttribute, which may be {@code null} if the
     *                           function is being applied at the device model level
     * @param {Map<string, object>} configuration the parameters for this function from the device
     * policy
     * @param {Map<string, object>} data a place for storing data between invocations of the
     * function
     * @param {object} value the value to which the function is being applied
     * @return {boolean} {@code true} if the conditions for the function have been satisfied.
     */
    _apply(deviceAnalog, attribute, configuration, data, value){
        throw new Error('Must implement the apply method in subclass.');
    }

    /**
     * Return the value from the function. This method should only be called after
     * {@link #apply(iotcs.device.impl.DeviceAnalog, string, Map, Map, object)} returns {@code true}, or when a
     * window expires.
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog the VirtualDevice, never {@code null}.
     * @param {(string|null)} attribute the DeviceModelAttribute, which may be {@code null} if the
     *        function is being applied at the device model level.
     * @param {Map<string, object>} configuration the parameters for this function from the device
     *         policy.
     * @param {Map<string, object>} data a place for storing data between invocations of the
     *        function.
     * @return {object} the value from having applied the function
     */
    _get(deviceAnalog, attribute, configuration, data) {
        throw new Error('Must implement the get method in subclass.');
    }

    /**
     * Return a string representation of this function. Useful for logging.
     *
     * @param {Map<string, object>} configuration the parameters for this function from the device
     *        policy.
     * @return {string} a string representation of this function.
     */
    _getDetails(configuration) {
        return this._getId();
    }

    /**
     * Get the ID of the function. This is the unique ID from the function definition.
     *
     * @return {string} the policy ID.
     */
    _getId() {
        return this.id;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Policy definitions
////////////////////////////////////////////////////////////////////////////////////////////////////
class ACTION_CONDITION extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('actionCondition');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        /** @type {iotcs.device.impl.FormulaParserNode} */
        let condition = data.get('actionCondition.condition');

        if (!condition) {
            /** @type {string} */
            const str = configuration.get('condition');
            /** @type {Set<iotcs.device.impl.FormulaParserToken>} */
            let tokens = iotcs.device.impl.FormulaParser._tokenize(String(str));
            /** @type {Stack<iotcs.device.impl.FormulaParserNode>} */
            let stack = new Stack();
            iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, str, 0);
            condition = stack._pop();
            data.set('actionCondition.condition', condition);
        }

        /** @type {number} */
        const computedValue = iotcs.device.impl.DeviceFunction._compute(condition, deviceAnalog);

        if (!isFinite(computedValue) || (computedValue === 0.0)) { //zero is false.
            data.set('actionCondition.value', value);
            return true;
        }

        // getActionArgs may return null.
        /** @type {object[]} */
        const actionArgs = iotcs.device.impl.DeviceFunction._getActionArgs(deviceAnalog, configuration);
        /** @type {string} */
        let actionName = configuration.get('name');

        try {
            // TODO: Temporary until actionCondition allows multiple args.
            /** @type {Map<string, object>} */
            const argMap = new Map();
            argMap.put("value", actionArgs[0]);
            deviceAnalog._call(actionName, argMap);
        } catch (error) {
            iotcs.log(error.message);
        }

        /** @type {boolean} */
        let filter = configuration.get('filter');

        if (filter === null || filter) {
            // If this is a filter, returning false stops the pipeline.
            return false;
        }

        data.set('actionCondition.value', value);
        return true;
    }

    /**
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     *
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        const value = data.get('actionCondition.value');
        data.delete('actionCondition.value');
        return value;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {object} */
        const filter = config.containsKey('filter') ? config.get('filter') : true;

        return super._getDetails(config) +
            '[condition="' + config.get('condition') +
            '", action="'+ config.get('name')+
            '", arguments="'+ config.get('arguments') +
            '", filter="' + filter + ']';
    }
}

class ALERT_CONDITION extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('alertCondition');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        /** @type {iotcs.device.impl.FormulaParserNode} */
        let condition = data.get('alertCondition.condition');

        if (!condition) {
            /** @type {string} */
            const str = configuration.get('condition');
            /** @type {Set<iotcs.device.impl.FormulaParser.Token} */
            let tokens = iotcs.device.impl.FormulaParser._tokenize(String(str));
            /** @type {Stack<iotcs.device.impl.FormulaParserNode>} */
            let stack = new Stack();
            iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, str, 0);
            condition = stack._pop();
            data.set('alertCondition.condition', condition);
        }

        /** @type {number} */
        const computedValue = iotcs.device.impl.DeviceFunction._compute(condition, deviceAnalog);

        if (!isFinite(computedValue) || (computedValue === 0.0))  // zero is false.
        {
            data.set('alertCondition.value', value);
            return true;
        }

        /** @type {AlertMessage} */
        const alertMessage = iotcs.device.impl.DeviceFunction._createAlert(deviceAnalog, configuration);
        deviceAnalog._queueMessage(alertMessage);
        /** @type {boolean} */
        let filter = configuration.get('filter');

        if (!filter || filter) {
            // if this is a filter, returning false stops the pipeline
            return false;
        }

        data.set('alertCondition.value', value);
        return true;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        /** @type {object} */
        const value = data.get('alertCondition.value');
        data.delete('alertCondition.value');
        return value;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {object} */
        const filter = config.has('filter') ? config.get('filter') : true;

        return super._getDetails(config) +
            '[condition="' + config.get('condition') +
            '", urn="'+ config.get('urn') + '", fields=' +
            config.get('fields') +
            '", filter='+ filter +']';
    }
}

// Will batch data until networkCost (Satellite > Cellular > Ethernet) lowers to the configured value
class BATCH_BY_COST extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('batchByCost');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        if (this._batchByPersistence) {
            /** @type {Message} */
            const message = value.getKey();
            this._batchByPersistence.save(deviceAnalog._getEndpointId(), message);
        } else {
            /** @type {Set<object>} */
            let list = data.get("batchByCost.value");

            if (!list) {
                list = new Set();
                data.set("batchByCost.value", list);
            }

            list.add(value);
        }

         // Assume the configured cost is the most expensive
        /** @type {number} */
        const configuredCost = NetworkCost._getCost(configuration.get("networkCost"),
                        "networkCost", NetworkCost.Type.SATELLITE);

        // Assume the client cost is the least expensive
        /** @type {number} */
        const networkCost = NetworkCost._getCost((process['env_oracle_iot_client_network_cost']),
            'oracle_iot_client_network_cost', NetworkCost.Type.ETHERNET);

        // If the cost of the network the client is on (networkCost) is greater than
        // the cost of the network the policy is willing to bear (configuredCost),
        // then return false (the value is filtered).
        if (networkCost > configuredCost) {
            return false;
        }

        return true;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        if (this._batchByPersistence) {
            /** @type {Set<Pair<Message, StorageObject>>} */
            const value = _getPersistedBatchedData(deviceAnalog);
            return value;
        } else {
            /** @type {object} */
            const value = data.get("batchByCost.value");
            data.delete("batchByCost.value");
            return value;
        }
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[networkCost=' + config.get('networkCost') + ']';
    }
}

class BATCH_BY_SIZE extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('batchBySize');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        if (this._batchByPersistence) {
            /** @type {Message} */
            const message = value.getKey();
            this._batchByPersistence.save(deviceAnalog._getEndpointId(), message);

        } else {
            /** @type {Set<object>} */
            let list = data.get("batchBySize.value");

            if (!list) {
                list = new Set();
                data.set("batchBySize.value", list);
            }

            list.add(value);
        }

        /** @type {number} */
        let batchCount = data.get("batchBySize.batchCount");

        if (!batchCount) {
            batchCount = 0;
        }

        batchCount += 1;
        data.set("batchBySize.batchCount", batchCount);

        /** @type {number} */
        let batchSize = configuration.get('batchSize');
        return !batchSize || batchSize === list.size;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        data.set("batchBySize.batchCount", 0);

        if (this._batchByPersistence) {
            /** @type {Set<Pair<Message, StorageObject>>} */
            const value = _getPersistedBatchedData(deviceAnalog);
            return value;
        } else {
            /** @type {object} */
            const value = data.get("batchBySize.value");
            data.delete("batchBySize.value");
            return value;
        }
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[batchSize=' + config.get('batchSize') + ']';
    }
}

class BATCH_BY_TIME extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('batchByTime');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        iotcs.impl.Platform._debug('iotcs.device.impl.DeviceFunction._BATCH_BY_TIME.apply called.');
        /** @type {Set<object>} */
        let list = data.get('batchByTime.value');

        if (this._batchByPersistence) {
            /** @type {Message} */
            const message = value.getKey();
            this._batchByPersistence.save(deviceAnalog._getEndpointId(), message);
        } else {
            /** @type {Set<object>} */
            let list = data.get("batchByTime.value");

            if (!list) {
                list = new Set();
                data.set("batchByTime.value", list);
            }

            list.add(value);
        }

        return false;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        iotcs.impl.Platform._debug('iotcs.device.impl.DeviceFunction._BATCH_BY_TIME.get called @' +
                                   new Date());
        let value = data.get('batchByTime.value');
        iotcs.impl.Platform._debug('iotcs.device.impl.DeviceFunction._BATCH_BY_TIME.get value = ' +
                                   iotcs.impl.Platform._inspect(value));

        if (this._batchByPersistence) {
            /** @type {Set<Pair<Message, StorageObject>>} */
            const value = _getPersistedBatchedData(deviceAnalog);
            return value;
        } else {
            /** @type {object} */
            const value = data.get("batchByTime.value");
            data.delete("batchByTime.value");
            return value;
        }
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[delayLimit=' + config.get('delayLimit') + ']';
    }
}

class COMPUTED_METRIC extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('computedMetric');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        /** @type {iotcs.device.impl.FormulaParserNode} */
        let formula = data.get('computedMetric.formula');

        if (!formula) {
            /** @type {string} */
            const str = configuration.get('formula');
            /** @type {Set<iotcs.device.impl.FormulaParser.Token>} */
            let tokens = iotcs.device.impl.FormulaParser._tokenize(str);
            formula = iotcs.device.impl.FormulaParser._parseFormula(tokens, str);
            data.set('computedMetric.formula', formula);
        }

        /** @type {number} */
        const computedValue = iotcs.device.impl.DeviceFunction._compute(formula, deviceAnalog);

        if (!isFinite(computedValue)) {
            return false;
        }

        data.set('computedMetric.value', computedValue);
        return true;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        const value = data.get('computedMetric.value');
        data.delete('computedMetric.value');
        return value;
    }


    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[formula="' + config.get('formula') + '"]';
    }
}

class DETECT_DUPLICATES extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('detectDuplicates');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        /** @type {number} */
        const now = new Date().getTime();
        /** @type {object} */
        const lastValue = data.get('detectDuplicates.lastValue');
        data.set('detectDuplicates.lastValue', value);

        // If value equals lastValue, then this is a duplicate value.
        // If value is the first duplicate value, then lastValue has already
        // been passed along and we want to filter out the current value and
        // all other sequential duplicates within the window.
        if (value === lastValue) {
            // windowEnd is the end time of the current window.
            /** @type {number} */
            const windowEnd = data.get("detectDuplicates.windowEnd");

            // If the current window has expired (i.e., windowEnd <= now), then update windowEnd.
            if (windowEnd <= now) {
                // windowEnd is the current time plus the window. window is normalized so that
                // window is greater than or equal to zero.
                /** @type {number} */
                const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
                data.set("detectDuplicates.windowEnd", now + (window > 0 ? window : 0));
                // When the window moves, we need to send an alert.
                data.set("detectDuplicates.alertSent", false);
            }

            // The first time we get here, alertSent will be false (because of the "else" part
            // below) and an alert will be sent. alertSent will then be true until the window
            // expires or a non-duplicate value is received.
            /** @type {boolean} */
            const alertSent = data.get("detectDuplicates.alertSent");

            if (!alertSent) {
                data.set("detectDuplicates.alertSent", true);
                /** @type {AlertMessage} */
                const alertMessage = iotcs.device.impl.DeviceFunction._createAlert(deviceAnalog, configuration);
                deviceAnalog._queueMessage(alertMessage);
            }
        } else {
            // Values are not duplicates. Move window. windowEnd is the current time plus the
            // window. window is normalized so that window is greater than or equal to zero.
            /** @type {number} */
             const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
            data.set("detectDuplicates.windowEnd", now + (window > 0 ? window : 0));
            data.set("detectDuplicates.alertSent", false);
        }

        // detectDuplicates does not filter data. Return true.
        return true;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        /** @type {object} */
        return data.get('detectDuplicates.lastValue');
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[window=' + config.get('window') +
            ', alertFormatURN="' + config.get('alertFormatURN') + '"]';
    }
}

class ELIMINATE_DUPLICATES extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('eliminateDuplicates');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        /** @type {boolean} */
        let isDuplicate = false;
        /** @type {number} */
        const now = new Date().getTime();
        /** @type {object} */
        const lastValue = data.get('eliminateDuplicates.lastValue');
        data.set('eliminateDuplicates.lastValue', value);

        // If value equals lastValue, then this is a duplicate value.
        // If value is the first duplicate value, then lastValue has already
        // been passed along and we want to filter out the current value and
        // all other sequential duplicates within the window.
        if (value === lastValue) {
            // windowEnd is the end time of the current window.
            /** @type {number} */
            const windowEnd = data.get("eliminateDuplicates.windowEnd");

            // If the current window has not expired (i.e., now <= windowEnd), then the value is
            // filtered out.
            isDuplicate = (now <= windowEnd);

            // If the current window has expired (i.e., windowEnd <= now),
            // then update windowEnd.
            if (windowEnd <= now) {
                // windowEnd is the current time plus the window.
                // window is normalized so that window is greater than or equal to zero.
                /** @type {number} */
                const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
                data.set("eliminateDuplicates.windowEnd", now + (window > 0 ? window : 0));
            }
        } else {
            // Values are not duplicates. Move window. windowEnd is the current time plus the
            // window. window is normalized so that window is greater than or equal to zero.
            /** @type {number} */
            const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
            data.set("eliminateDuplicates.windowEnd", now + (window > 0 ? window : 0));
        }

        return !isDuplicate;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        return data.get('eliminateDuplicates.lastValue');
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[window=' + config.get('window') + ']';
    }
}

class FILTER_CONDITION extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('filterCondition');
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     * @return {boolean}
     */
    _apply(deviceAnalog, attribute, configuration, data, value) {
        data.set('filterCondition.value', value);
        /** @type {iotcs.device.impl.FormulaParserNode} */
        let condition = data.get('filterCondition.condition');

        if (!condition) {
            /** @type {string} */
            const str = configuration.get('condition');
            /** @type {Set<Token>} */
            let tokens = iotcs.device.impl.FormulaParser._tokenize(String(str));

            /** @type {iotcs.device.impl.Stack<iotcs.device.impl.FormulaParserNode>} */
            let stack = new iotcs.device.impl.Stack();
            iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, str, 0);
            condition = stack._pop();
            data.set('filterCondition.condition', condition);
        }

        /** @type {number} */
        const computedValue = iotcs.device.impl.DeviceFunction._compute(condition, deviceAnalog);
        // For a filter condition, if the computation returns 0.0, meaning
        // the condition evaluated to false, then we want to return 'true'
        // because "filter" means out, not in.
        return -1.0 < computedValue && computedValue < 1.0;
    }


    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        /** @type {object} */
        const value = data.get('filterCondition.value');
        data.delete('filterCondition.value');
        return value;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        return super._getDetails(config) + '[condition="' + config.get('condition') + '"]';
    }
}

class MAX extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('max');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceanalog, attribute, configuration, data, value) {
        // See iotcs.device.impl.DeviceFunction("mean") for details on handling slide
        // and what all this bucket stuff is about
        /** @type {number} */
        const now = new Date().getTime();
        /** @type {number} */
        let windowStartTime = data.get("max.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = now;
            data.set("max.windowStartTime", windowStartTime);
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {iotcs.device.impl.Bucket[]} */
        let buckets = data.get("max.buckets");

        if (!buckets) {
            /** @type {number} */
            const numberOfBuckets = (Math.max(slide,window) / span) + 1;
            buckets = new Array(numberOfBuckets);

            for (let i = 0; i < numberOfBuckets; i++) {
                buckets[i] = new iotcs.device.impl.Bucket(Number.MIN_VALUE);
            }

            data.set("max.buckets", buckets);
        }

        /** @type {number} */
        let bucketZero = data.get("max.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            bucketZero = 0;
            data.set("max.bucketZero", bucketZero);
        }

        /** @type {number} */
        const bucketIndex = Math.trunc((now - windowStartTime) / span);
        /** @type {number} */
        const bucket = (bucketZero + bucketIndex) % buckets.length;

        /** @type {number} */
        let max = buckets[bucket].value;

        buckets[bucket].value = (value <= max) ? max : value;
        return false;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        // See iotcs.device.impl.DeviceFunction("mean")#get for explanation of slide and buckets
        /** @type {iotcs.device.impl.Bucket[]} */
        const buckets = data.get("max.buckets");

        if (!buckets) {
            // Must have called get before apply.
            return null;
        }

        /** @type {number} */
        const bucketZero = data.get("max.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            // If buckets is not null, but bucketZero is, something is wrong with our implementation.
            return null;
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {number} */
        const bucketsPerWindow = window / span;
        /** @type {number} */
        const bucketsPerSlide = slide / span;
        /** @type {number} */
        let windowStartTime = data.get("max.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = new Date().getTime();
        }

        data.set("max.windowStartTime", windowStartTime + span * bucketsPerSlide);
        data.set("max.bucketZero", (bucketZero + bucketsPerSlide) % buckets.length);

        /** @type {number} */
        let max = Number.MIN_VALUE;

        for (let i = 0; i < bucketsPerWindow; i++) {
            /** @type {number} */
            const index = (bucketZero + i) % buckets.length;
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[index];
            /** @type {number} */
            let num = bucket.value;
            max = (num <= max) ? max : num;
        }

        for (let i = 0; i < bucketsPerSlide; i++) {
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[(bucketZero + i) % buckets.length];
            bucket.value = Number.MIN_VALUE;
        }

        return max;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {string} */
        let details = super._getDetails(config);
        /** @type {object} */
        const window = config.get("window");

        if (window) {
            details += '[window=' + window;
        }

        /** @type {object} */
        const slide = config.get("slide");

        if (slide) {
            details += (window) ? ',' : '[';
            details += 'slide=' + slide;
        }

        details += ']';
        return details;
    }
}

class MEAN extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('mean');
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     * @return {boolean}
     */
    _apply(deviceanalog, attribute, configuration, data, value) {
        // Handling slide:
        //
        // Slide is how much the window moves after the
        // window expires. If there is a window of 5 seconds
        // with a slide of 2 seconds, then at the end of
        // 5 seconds, the window slides over by two seconds.
        // That means that the next window's worth of data
        // would include 3 seconds of data from the previous
        // window, and 2 seconds of new data.
        //
        // To handle this, we divide up the window into buckets.
        // Each bucket represents a period of time, such
        // that the time period is the greatest common factor
        // between the window and the slide. For example, if
        // the window is 60 seconds and the slide is 90
        // seconds, a bucket would span 30 seconds, and
        // there would be three buckets.
        //
        // When the window expires and the get method is called,
        // the return value of the mean policy function will
        // include the value and number of terms of bucket[0]
        // through bucket[n]. Then the buckets that don't
        // contribute to the next window are emptied (so to speak)
        // and the cycle continues.
        //
        // Best case is that the slide equal to the window.
        // In this case, there is only ever one bucket.
        // The worst case is when greatest common factor between
        // slide and window is small. In this case, you end up
        // with a lot of buckets, potentially one bucket per
        // slide time unit (e.g., 90 seconds, 90 buckets).
        // But this is no worse (memory wise) than keeping
        // an array of values and timestamps.
        //
        /** @type {number} */
        const now = new Date().getTime();

        // windowStartTime is the time at which the first
        // call to apply was made for the current window
        // of time. We need to know when this window
        // started so that we can figure out what bucket
        // the data goes into.
        /** @type {number} */
        let windowStartTime = data.get("mean.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = now;
            data.set("mean.windowStartTime", windowStartTime);
        }

        // The greatest common factor between the
        // window and the slide represents the greatest
        // amount of time that goes evenly into
        // both window and slide.
        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        // Each bucket spans this amount of time.
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {iotcs.device.impl.Bucket[]} */
        let buckets = data.get("mean.buckets");

        if (!buckets) {
            // The number of buckets is the window or span
            // (which ever is greater) divided
            // by the amount of time it spans. Thus, if
            // there is a 5 second window with a 2 second slide,
            // the greatest common factor is 1 second and we end
            // up with 5 buckets. But if the slide was 7 seconds,
            // you'd end up with 7 buckets. This lets us fill
            // up buckets without worrying about whether the
            // window is greater than, equal to, or less than
            // the slide.
            // Note: we add 1 so there is a bucket for when
            // a value comes in for the next window, but before
            // the window has been moved.
            /** @type {number} */
            const numberOfBuckets = (Math.max(slide, window) / span) + 1;
            buckets = new Array(numberOfBuckets);

            for (let i = 0; i < numberOfBuckets; i++) {
                buckets[i] = new iotcs.device.impl.Bucket(0);
            }

            data.set("mean.buckets", buckets);
        }

        // bucketZero is the index of the zeroth bucket
        // in the buckets array. This allows the buckets array
        // to be treated as a circular buffer so we don't have
        // to move array elements when the window slides.
        /** @type {number} */
        let bucketZero = data.get("mean.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            bucketZero = 0;
            data.set("mean.bucketZero", bucketZero);
        }

        // Which bucket are we working on is calculated
        // by the dividing the amount of time we are into
        // the window by the span of time represented by
        // one bucket. For example, say we have a 2 second
        // slide and a 10 second window giving us 5 buckets.
        // Say our window started at 20 seconds and the
        // value arrives at 25 seconds (5 seconds into the
        // window). The value, then should be added to the
        // third bucket (buckets[2]) since that bucket
        // represents the time from 4 seconds to 6 seconds
        // into the current window.
        /** @type {number} */
        const bucketIndex = Math.trunc((now - windowStartTime) / span);
        /** @type {number} */
        const bucket = (bucketZero + bucketIndex) % buckets.length;
        buckets[bucket].value += value;
        buckets[bucket].terms += 1;

        return false;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        /** @type {iotcs.device.impl.Bucket[]} */
        const buckets = data.get("mean.buckets");

        if (!buckets) {
            // Must have called get before apply.
            return null;
        }

        /** @type {number} */
        const bucketZero = data.get("mean.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            // If buckets is not null, but bucketZero is, something is wrong with our implementation.
            return null;
        }

        // The greatest common factor between the
        // window and the slide represents the greatest
        // amount of time that goes evenly into
        // both window and slide.
        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);

        // Each bucket spans this amount of time.
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);

        // The number of buckets that make up a window.
        /** @type {number} */
        const bucketsPerWindow = window / span;

        // The number of buckets that make up the slide.
        /** @type {number} */
        const bucketsPerSlide = slide / span;

        // Update windowStartTime for the next window.
        // The new windowStartTime is just the current window
        // start time plus the slide.
        /** @type {number} */
        let windowStartTime = data.get("mean.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = new Date().getTime();
        }

        data.set("mean.windowStartTime", windowStartTime + span * bucketsPerSlide);

        // Update bucketZero index. bucketZero is the index
        // of the zeroth bucket in the circular buckets array.
        data.set("mean.bucketZero", (bucketZero + bucketsPerSlide) % buckets.length);
        /** @type {number} */
        let sum = 0;
        /** @type {number} */
        let terms = 0;

        // Loop through the number of buckets in the window and sum them up.
        for (let i = 0; i < bucketsPerWindow; i++) {
            /** @type {number} */
            const index = (bucketZero + i) % buckets.length;
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[index];
            sum += bucket.value;
            terms += bucket.terms;
        }

        // Now slide the window.
        for (let i = 0; i < bucketsPerSlide; i++) {
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[(bucketZero + i) % buckets.length];
            bucket.value = 0;
            bucket.terms = 0;
        }

        if ((sum === iotcs.device.impl.DeviceFunction._ZERO) || (terms === 0)) {
            return null;
        }

        return sum / terms;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {string} */
        let details = super._getDetails(config);
        /** @type {object} */
        const window = config.get("window");

        if (window) {
            details += '[window=' + window;
        }

        /** @type {object} */
        const slide = config.get("slide");

        if (slide) {
            details += (window) ? ',' : '[';
            details += 'slide=' + slide;
        }

        details += ']';
        return details;
    }
}

class MIN extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('min');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceanalog, attribute, configuration, data, value) {
        // See iotcs.device.impl.DeviceFunction("mean") for details on handling slide
        // and what all this bucket stuff is about
        /** @type {number} */
        const now = new Date().getTime();
        /** @type {number} */
        let windowStartTime = data.get("min.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = now;
            data.set("min.windowStartTime", windowStartTime);
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {iotcs.device.impl.Bucket[]} */
        let buckets = data.get("min.buckets");

        if (!buckets) {
            /** @type {number} */
            const numberOfBuckets = (Math.min(slide,window) / span) + 1;
            buckets = new Array(numberOfBuckets);

            for (let i = 0; i < numberOfBuckets; i++) {
                buckets[i] = new iotcs.device.impl.Bucket(Number.MAX_VALUE);
            }

            data.set("min.buckets", buckets);
        }

        /** @type {number} */
        let bucketZero = data.get("min.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            bucketZero = 0;
            data.set("min.bucketZero", bucketZero);
        }

        /** @type {number} */
        const bucketIndex = Math.trunc((now - windowStartTime) / span);
        /** @type {number} */
        const bucket = (bucketZero + bucketIndex) % buckets.length;
        /** @type {number} */
        const min = buckets[bucket].value;
        buckets[bucket].value = (value <= min) ? value : min;
        return false;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        // See iotcs.device.impl.DeviceFunction("mean")#get for explanation of slide and buckets.
        /** @type {iotcs.device.impl.Bucket[]} */
        const buckets = data.get("min.buckets");

        if (!buckets) {
            // Must have called get before apply.
            return null;
        }

        /** @type {number} */
        const bucketZero = data.get("min.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            // If buckets is not null, but bucketZero is, something is wrong with our implementation.
            return null;
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {number} */
        const bucketsPerWindow = window / span;
        /** @type {number} */
        const bucketsPerSlide = slide / span;
        /** @type {number} */
        let windowStartTime = data.get("min.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = new Date().getTime();
        }

        data.set("min.windowStartTime", windowStartTime + span * bucketsPerSlide);
        data.set("min.bucketZero", (bucketZero + bucketsPerSlide) % buckets.length);
        /** @type {number} */
        let min = Number.MAX_VALUE;

        for (let i = 0; i < bucketsPerWindow; i++) {
            /** @type {number} */
            const index = (bucketZero + i) % buckets.length;
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[index];
            /** @type {number} */
            let num = bucket.value;
            min = num <=  min ? num : min;
        }

        for (let i = 0; i < bucketsPerSlide; i++) {
            /** @type {iotcs.device.impl.Bucket} */
            let bucket = buckets[(bucketZero + i) % buckets.length];
            bucket.value = Number.MAX_VALUE;
        }

        return min;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {string} */
        let details = super._getDetails(config);
        /** @type {object} */
        const window = config.get("window");

        if (window) {
            details += '[window=' + window;
        }

        /** @type {object} */
        const slide = config.get("slide");

        if (slide) {
            details += (window) ? ',' : '[';
            details += 'slide=' + slide;
        }

        details += ']';
        return details;
    }
}

class SAMPLE_QUALITY extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('sampleQuality');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceanalog, attribute, configuration, data, value) {
        // Always put the value in the data map.
        data.set("sample.value", value);
        /** @type {number} */
        let terms = data.get("sample.terms");

        if (!terms || terms === Number.MAX_VALUE) {
            terms = 0;
        }

        data.set("sample.terms", ++terms);
        /** @type {number} */
        const criterion = configuration.get("rate");

        // -1 is random, 0 is all
        if (criterion === 0) {
            return true;
        } else if (criterion === -1) {
            // TODO: make configurable
            return (Math.floor(Math.random() * 30) === 0);
        }

        return (criterion === terms);
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        const sample = data.get("sample.value");
        data.delete("sample.value");
        data.delete("sample.terms");
        return sample;
    }


    _getDetails(config) {
        /** @type {object} */
        const rate = config.get("rate");
        /** @type {string} */
        const isString = ("all" === rate) || ("none" === rate) || ("random" === rate);
        return super._getDetails(config) + '[rate=' + (isString ? '"' + rate + '"' : rate) + ']';
    }
}


class STANDARD_DEVIATION extends iotcs.device.impl.DeviceFunction {
    constructor() {
        super('standardDeviation');
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @param {object} value
     *
     * @return {boolean}
     */
    _apply(deviceanalog, attribute, configuration, data, value) {
        // See iotcs.device.impl.DeviceFunction("mean") for details on handling slide
        // and what all this bucket stuff is about
        /** @type {number} */
        const now = new Date().getTime();
        /** @type {number} */
        let windowStartTime = data.get("standardDeviation.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = now;
            data.set("standardDeviation.windowStartTime", windowStartTime);
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {iotcs.device.impl.Bucket<Set>>[]} */
        let buckets = data.get("standardDeviation.buckets");

        if (!buckets) {
            /** @type {number} */
            const numberOfBuckets = (Math.min(slide, window) / span) + 1;
            buckets = new Array(numberOfBuckets);

            for (let i = 0; i < numberOfBuckets; i++) {
                buckets[i] = new iotcs.device.impl.Bucket(new Set());
            }

            data.set("standardDeviation.buckets", buckets);
        }

        /** @type {number} */
        let bucketZero = data.get("standardDeviation.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            bucketZero = 0;
            data.set("standardDeviation.bucketZero", bucketZero);
        }

        /** @type {number} */
        const bucketIndex = Math.trunc((now - windowStartTime) / span);
        /** @type {number} */
        const bucket = (bucketZero + bucketIndex) % buckets.length;
        buckets[bucket].value.add(value);
        return false;
    }

    /**
     * @Override
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {(string|null)} attribute
     * @param {Map<string, object>} configuration
     * @param {Map<string, object>} data
     * @return {object}
     */
    _get(deviceAnalog, attribute, configuration, data) {
        // See iotcs.device.impl.DeviceFunction("mean")#get for explanation of slide and buckets
        /** @type {iotcs.device.impl.Bucket<Set>[]} */
        const buckets = data.get("standardDeviation.buckets");

        if (!buckets) {
            // Must have called get before apply.
            return null;
        }

        /** @type {number} */
        const  bucketZero = data.get("standardDeviation.bucketZero");

        if (!bucketZero && (bucketZero !== 0)) {
            // If buckets is not null, but bucketZero is, something is wrong with our implementation.
            return null;
        }

        /** @type {number} */
        const window = iotcs.device.impl.DeviceFunction._getWindow(configuration);
        /** @type {number} */
        const slide = iotcs.device.impl.DeviceFunction._getSlide(configuration, window);
        /** @type {number} */
        const span = iotcs.device.impl.DeviceFunction._gcd(window, slide);
        /** @type {number} */
        const bucketsPerWindow = window / span;
        /** @type {number} */
        const bucketsPerSlide = slide / span;
        /** @type {number} */
        let windowStartTime = data.get("standardDeviation.windowStartTime");

        if (!windowStartTime) {
            windowStartTime = new Date().getTime();
        }

        data.set("standardDeviation.windowStartTime", windowStartTime + span * bucketsPerSlide);
        data.set("standardDeviation.bucketZero", (bucketZero + bucketsPerSlide) % buckets.length);
        /** @type {Set<number>} */
        let terms = new Set();

        for (let i = 0; i < bucketsPerWindow; i++) {
            /** @type {number} */
            const index = (bucketZero + i) % buckets.length;
            /** @type {iotcs.device.impl.Bucket<Set<number>>} */
            let bucket = buckets[index];
            /** @type {Set<number>} */
            let values = bucket.value;

            values.forEach(val => {
                terms.add(val);
            });
        }

        /** @type {number} */
        let sum = 0;
        let termsAry = Array.from(terms);

        for (let n = 0, nMax = termsAry.length; n < nMax; n++) {
            /** @type {number} */
            sum += termsAry[n];
        }

        /** @type {number} */
        let mean = sum / termsAry.length;

        for (let n = 0, nMax = termsAry.length; n < nMax; n++) {
            /** @type {number} */
            let d = termsAry[n] - mean;
            termsAry[n] = Math.pow(d, 2);
        }

        sum = 0;

        for (let n = 0, nMax = termsAry.length; n < nMax; n++) {
            /** @type {number} */
            sum += termsAry[n];
        }

        mean = sum / termsAry.length;

        /** @type {number} */
        let stdDeviation = Math.sqrt(mean);

        for (let i = 0; i < bucketsPerSlide; i++) {
            /** @type {iotcs.device.impl.Bucket<Set<number>>} */
            let bucket = buckets[(bucketZero + i) % buckets.length];
            bucket.value.clear();
        }

        return stdDeviation;
    }

    /**
     * @param {Map<string, object>} config
     * @return {string}
     */
    _getDetails(config) {
        /** @type {string} */
        let details = super._getDetails(config);
        /** @type {object} */
        const window = config.get("window");

        if (window) {
            details += '[window=' + window;
        }

        /** @type {object} */
        const slide = config.get("slide");

        if (slide) {
            details += (window) ? ',' : '[';
            details += 'slide=' + slide;
        }

        details += ']';
        return details;
    }
}

iotcs.device.impl.DeviceFunction._ZERO = 0.0;
iotcs.device.impl.DeviceFunction._POLICY_MAP = new Map();
let actionConditionDeviceFunction = new ACTION_CONDITION();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(actionConditionDeviceFunction._getId(),
                               actionConditionDeviceFunction);
let alertConditionDeviceFunction = new ALERT_CONDITION();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(alertConditionDeviceFunction._getId(), alertConditionDeviceFunction);
let batchByCostDeviceFunction = new BATCH_BY_COST();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(batchByCostDeviceFunction._getId(), batchByCostDeviceFunction);
let batchBySizeDeviceFunction = new BATCH_BY_SIZE();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(batchBySizeDeviceFunction._getId(), batchBySizeDeviceFunction);
let batchByTimeDeviceFunction = new BATCH_BY_TIME();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(batchByTimeDeviceFunction._getId(), batchByTimeDeviceFunction);
let computedMetricDeviceFunction = new COMPUTED_METRIC();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(computedMetricDeviceFunction._getId(), computedMetricDeviceFunction);
let detectDuplicatesDeviceFunction = new DETECT_DUPLICATES();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(detectDuplicatesDeviceFunction._getId(),
                               detectDuplicatesDeviceFunction);
let eliminateDuplicatesDeviceFunction = new ELIMINATE_DUPLICATES();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(eliminateDuplicatesDeviceFunction._getId(),
    eliminateDuplicatesDeviceFunction);
let filterConditionDeviceFunction = new FILTER_CONDITION();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(filterConditionDeviceFunction._getId(),
                               filterConditionDeviceFunction);
let maxDeviceFunction = new MAX();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(maxDeviceFunction._getId(), maxDeviceFunction);
let meanDeviceFunction = new MEAN();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(meanDeviceFunction._getId(), meanDeviceFunction);
let minDeviceFunction = new MIN();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(minDeviceFunction._getId(), minDeviceFunction);
let sampleQualityDeviceFunction = new SAMPLE_QUALITY();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(sampleQualityDeviceFunction._getId(), sampleQualityDeviceFunction);
let standardDeviationDeviceFunction = new STANDARD_DEVIATION();
iotcs.device.impl.DeviceFunction._POLICY_MAP.set(standardDeviationDeviceFunction._getId(),
    standardDeviationDeviceFunction);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModel.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Detailed information on a device model. A device model is a specification
 * of the attributes, formats, and resources available on the device.
 *
 * @classdesc
 */
iotcs.impl.DeviceModel = class {
    /**
     * Constructs a DeviceModel.
     *
     * @param {string} urn - The device model's URN.
     * @param {string} name - The name of the device model.
     * @param {string} description - The device model's description.
     * @param {DeviceModelAttribute[]} deviceModelAttributes - An array of attribute's for this
     *        device model.
     * @param {DeviceModelAction[]} deviceModelActions - An array of actions's for this device
     *        model.
     * @param {DeviceModelFormat[]} deviceModelFormats - An array of attribute's for this device
     *        model.
     *
     * @class
     */
    constructor(urn,
                name,
                description,
                deviceModelAttributes,
                deviceModelActions,
                deviceModelFormats)
    {
        /**
         * The URN of the device model.
         *
         * @type {string}
         */
        this._urn = urn;
        /**
         * The device model's name.
         *
         * @type {string}
         */
        this._name = name;
        /**
         * The device model's description.
         *
         * @type {string}
         */
        this._description = description;

        /**
         * Map of attribute names to DeviceModelAttribute's.
         * @type {Map<string, iotcs.impl.DeviceModelAttribute>}
         */
        this._deviceModelAttributes = new Map();
        /**
         * Map of action names to DeviceModelAction's.
         * @type {Map<string, iotcs.impl.DeviceModelAction>}
         */
        this._deviceModelActions = new Map();
        /**
         * Map of format names to DeviceModelFormat's.
         * @type Map<string, iotcs.impl.DeviceModelFormat>}
         */
        this._deviceModelFormats = new Map();

        if (deviceModelAttributes) {
            deviceModelAttributes.forEach(deviceModelAttribute => {
                let attributeName = deviceModelAttribute._name;

                if (!this._deviceModelAttributes.get(attributeName)) {
                    this._deviceModelAttributes.set(attributeName, deviceModelAttribute);
                }
            });
        }

        if (deviceModelActions) {
            for (let i = 0; i < deviceModelActions.length; i++) {
                let actName = deviceModelActions[i]._name;

                if (this._deviceModelActions.get(actName) == null) {
                    let deviceModelAction = new iotcs.impl.DeviceModelAction(actName,
                        deviceModelActions[i]._description, deviceModelActions[i]._args,
                        deviceModelActions[i]._alias);

                    this._deviceModelActions.set(actName, deviceModelAction);
                }
            }
        }

        if (deviceModelFormats) {
            for (let i = 0; i < deviceModelFormats.length; i++) {
                let formatUrn = deviceModelFormats[i]._urn;

                if (!this._deviceModelFormats.get(formatUrn)) {
                    let fields = [];

                    if (deviceModelFormats[i].value &&
                        deviceModelFormats[i].value.fields &&
                        deviceModelFormats[i].value.fields.length > 0)
                    {
                        let fs = deviceModelFormats[i].value.fields;

                        fs.forEach(v => {
                            fields.push(new iotcs.impl.DeviceModelFormatField(v._name,
                                v._description, v._type, v._optional));
                        });
                    }

                    let deviceModelFormat = new iotcs.impl.DeviceModelFormat(
                        deviceModelFormats[i]._urn, deviceModelFormats[i]._name,
                        deviceModelFormats[i]._description, deviceModelFormats[i]._type, fields);

                    this._deviceModelFormats.set(formatUrn, deviceModelFormat);
                }
            }
        }
    }

    /**
     * Returns the actions for this device model.
     *
     * @return {Map<string, iotcs.impl.DeviceModelAction>} the actions for this device model.
     */
    _getDeviceModelActions() {
        return this._deviceModelActions;
    }

    /**
     * Returns the attributes for this device model.
     *
     * @return {Map<string, iotcs.impl.DeviceModelAttribute>} the attributes for this device model.
     */
    _getDeviceModelAttributes() {
        return this._deviceModelAttributes;
    }

    /**
     * @return {Map<string, iotcs.impl.DeviceModelFormat>}
     */
    _getDeviceModelFormats() {
        return this._deviceModelFormats;
    }

    /**
     * Returns the device model's description.
     *
     * @return {string} the device model's description.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Returns the device model's name.
     *
     * @return {string} the device model's name.
     */
    _getName() {
        return this._name;
    }

    /**
     * Returns the device model's URN.
     *
     * @return {string} the device model's URN.
     */
    _getUrn() {
        return this._urn;
    }

    /**
     * Returns a string representation of this device model.
     *
     * @return {string}
     */
    _toString() {
        // let StringBuilder = require('stringbuilder');
        // let firstItem = true;
        // let b = new StringBuilder("urn = ");
        // b.append("\t");
        // b.append(urn);
        // b.append(",\n\tname = ");
        // b.append(name);
        // b.append(",\n\tdescription = ");
        // b.append(description);
        // b.append(",\n\tattributes = [");
        //
        // for (let attribute of this._deviceModelAttributes.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(attribute);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("],\n\tactions = [");
        // firstItem = true;
        //
        // for (let action of this._deviceModelActions.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(action);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("],\n\tformats = [");
        // firstItem = true;
        //
        // for (let format of this._deviceModelFormats.values()) {
        //     if (!firstItem) {
        //         b.append(",");
        //     } else {
        //         firstItem = false;
        //     }
        //
        //     b.append("\n\t{");
        //     b.append(format);
        //     b.append("}");
        // }
        //
        // if (!firstItem) {
        //     b.append("\n\t");
        // }
        //
        // b.append("]");
        // return b.toString();
        return '';
     }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelFormat.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * DeviceModelFormat
 */
iotcs.impl.DeviceModelFormat = class {
    /**
     * @param {string} urn
     * @param {string} name
     * @param {string} description
     * @param {iotcs.message.Message.Type} type
     * @param {DeviceModelFormatField[]} fields
     */
    constructor(urn, name, description, type, fields) {
        // Instance "variables"/properties.
        this._urn = urn;
        this._name = name;
        this._description = description;
        this._fields = fields;

        if (iotcs.message.Message.Type.hasOwnProperty(type)) {
            this._type = type;
        } else {
            this._type = null;
        }
    }

    // Private/protected functions
    /**
     * @return {string}
     */
    _getDescription() {
        return this._description;
    }

    /**
     *
     * @return {DeviceModelFormatField[]}
     */
    _getFields() {
        return this._fields;
    }

    /**
     * @return {string}
     */
    _getName() {
        return this._name;
    }

    /**
     * @return {string}
     */
    _getType() {
        return this._type;
    }

    /**
     * @return {string}
     */
    _getUrn() {
        return this._urn;
    }

    /**
     * @return {string}
     */
    _toString() {
        let str =
            'name = ' + this._name +
            ', description = ' + this._description +
            ', type = ' + this._type +
            ',\n fields = [';


        let firstItem = true;

        this._fields.forEach(field => {
            if (!firstItem) {
                str += ',';
            } else {
                firstItem = false;
            }

            str += '\n {' + field + '}"';
        });

        if (!firstItem) {
            str += '\n';
        }

        str += ' ]';
        return str;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelFormatField.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Describes a field of a message.
 */
iotcs.impl.DeviceModelFormatField = class {
    /**
     *
     * @param {string} name
     * @param {string} description
     * @param {string} type
     * @param {boolean} optional
     */
    constructor(name, description, type, optional) {
        this._name = name;
        this._description = description;
        this._optional = optional;

        if (DeviceModelAttribute.Type.hasOwnProperty(type)) {
            this._type = type;
        } else {
            this._type = null;
        }
    }

    // Private/protected functions
    /**
     * @return {string}
     */
    _getName() {
        return this._name;
    }

    /**
     * @return {string} - DeviceModelAttribute.Type
     */
    _getType() {
        return this._type;
    }

    /**
     * @return {boolean}
     */
    _isOptional() {
        return this._optional;
    }

    /**
     * @return {string}
     */
    _toString() {
        let str = 'name = ' + this._name +
        ', description = ' + this._description +
        ', type = ' + this._type +
        ', optional = ' + this._optional + 'optional';

        return str;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DevicePolicyFunction.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.DevicePolicyFunction = class {
    /**
     * Create a point.
     *
     * @param {string} id - The ID of the function.
     * @param {Map<string, object>} parameters - The parameters of the function.
     */
    constructor(id, parameters) {
        /** @type {string} */
        this._id = id;
        /** @type {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} */
        this._parameters = '';

        if (parameters && parameters.size !== 0) {
            this._parameters = parameters;
        } else {
            this._parameters = new Map();
        }
    }

    // Private/protected functions
    /**
     * Returns the function's ID.
     *
     * @return {string} the function's ID.
     */
    _getId() {
        return this._id;
    }

    /**
     * Returns the function's parameters.
     *
     * @return {Map<string, object>} the function's parameters.
     */
    _getParameters() {
        return this._parameters;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DevicePolicy.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Detailed information on a device policy.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DevicePolicy = class {
    /**
     * Converts a JSON representation of a device policy to a DevicePolicy object.
     *
     * @param {string} deviceModelUrn
     * @param {string} devicePolicyJson
     * @return {DevicePolicy} a device policy from a JSON representation of a device policy.
     */
    static _fromJson(deviceModelUrn, devicePolicyJson) {
        // This *should* be a JSON representation of a device policy, but it might also be an array
        // of items of device policies.
        let devicePolicyJsonTmp = JSON.parse(devicePolicyJson);
        let devicePolicyJsonObj;

        if (devicePolicyJsonTmp && devicePolicyJsonTmp.items && (devicePolicyJsonTmp.count > 0)) {
            devicePolicyJsonObj = devicePolicyJsonTmp.items[0];
        } else if (devicePolicyJsonTmp && devicePolicyJsonTmp.pipelines) {
            devicePolicyJsonObj = devicePolicyJsonTmp;
        } else {
            return null;
        }

        /** @type {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} */
        let pipelines = new Map();
        let pipelinesAry = devicePolicyJsonObj.pipelines;

        for (let i = 0; i < devicePolicyJsonObj.pipelines.length; i++) {
            /** @type {string} */
            let attributeName = devicePolicyJsonObj.pipelines[i].attributeName;
            /** @type {pipeline[]} */
            let pipelineAry = devicePolicyJsonObj.pipelines[i].pipeline;
            /** @type {Set<iotcs.device.impl.DevicePolicyFunction>} */
            let functions = new Set();

            for (let j = 0; j < pipelineAry.length; j++) {
                let functionObj = pipelineAry[j];
                /** @type {string} */
                let functionId = functionObj.id;
                /** @type {Map<string, object>} */
                let parameterMap = new Map();
                let parameters = functionObj.parameters;

                for (let parameterName of Object.keys(parameters)) {
                    let parameterValue = parameters[parameterName];

                    if ("action" === parameterName) {
                        parameterMap.set("name", parameterValue.name);
                        let args = parameterValue.arguments;

                        if (args && args.length > 0) {
                            /** @type {Set<object>} */
                            let argumentList = new Set();

                            for (let a = 0; a < args.length; a++) {
                                /** @type {object} */
                                let argTmp = args[a];
                                argumentList.add(argTmp);
                            }

                            parameterMap.set("arguments", argumentList);
                        }
                    } else if ("alert" === parameterName) {
                        let urn = parameterValue.urn;
                        parameterMap.set("urn", urn);
                        let fields = parameterValue.fields;
                        /** @type {Map<string, object>} */
                        let fieldMap = new Map();

                        for (let fieldName of Object.keys(fields)) {
                            let fieldValue = fields[fieldName];
                            fieldMap.set(fieldName, fieldValue);
                        }

                        parameterMap.set("fields", fieldMap);

                        if (parameterValue.severity) {
                            parameterMap.set("severity", parameterValue.severity);
                        }
                    } else {
                        parameterMap.set(parameterName, parameterValue);
                    }
                }

                functions.add(new iotcs.device.impl.DevicePolicyFunction(functionId,
                                                                                   parameterMap));
            }

            pipelines.set(attributeName, functions);
        }

        return new iotcs.device.impl.DevicePolicy(devicePolicyJsonObj.id, deviceModelUrn,
            devicePolicyJsonObj.description, pipelines, devicePolicyJsonObj.enabled,
            devicePolicyJsonObj.lastModified);
    }

    /**
     * Constructs a DevicePolicy.
     *
     * @param {string} id - The device policy ID.
     * @param {string} deviceModelUrn - The device model URN.
     * @param {string} description - The description of the device policy.
     * @param {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} pipelines - The
     *        functions of this policy.
     * @param {boolean} enabled - <code>true</code> if this device policy is enabled.
     * @param {Date} lastModified - The date/time the policy was last modified.
     */
    constructor(id, deviceModelUrn, description, pipelines, enabled, lastModified) {
        this._id = id;
        this._deviceModelUrn = deviceModelUrn;
        this._description = description;
        this._pipelines = pipelines;
        this._enabled = enabled;
        this._lastModified = lastModified;
    }

    /**
     * Get the free form description of the device policy.
     *
     * @return {string} the description of the model.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Get the target device model URN.
     *
     * @return {string} the URN of the target device model
     */
    _getDeviceModelUrn() {
        return this._deviceModelUrn;
    }

    /**
     * Returns the policy ID.
     *
     * @return {string} the policy ID.
     */
    _getId() {
        return this._id;
    }

    /**
     * Get the date of last modification.
     *
     * @return {number} the date of last modification.
     */
    _getLastModified() {
        return this._lastModified;
    }

    /**
     * Get the function pipeline of this policy for an attribute.
     *
     * @param {string} attributeName the name of the attribute to retrieve the pipeline for.
     * @return {Set} a read-only Set of {@link DevicePolicyFunction}.
     */
    _getPipeline(attributeName) {
        if (attributeName) {
            return this._pipelines.get(attributeName);
        } else {
            return this._pipelines.get(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);
        }
    }

    /**
     * Get all the pipelines of this policy. The map key is an attribute name, the value is the
     * pipeline for that attribute.
     *
     * @return {Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>} the pipelines of
     *         this policy.
     */
    _getPipelines() {
        return this._pipelines;
    }

    /**
     * Get the {@code enabled} state of the device policy.
     *
     * @return {boolean} {@code true} if the policy is enabled.
     */
    _isEnabled() {
        return this._enabled;
    }
};

iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES = '*';


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelParser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Parser for device models.
 *
 * @classdesc
 * @ignore
 * @private
 */
iotcs.impl.DeviceModelParser = class {
    // Static private functions
    /**
     * Returns a DeviceModel from a JSON string or object representation of a Device model.
     *
     * @param {(string|object)} deviceModelJson a device model as a JSON string or object.
     * @returns {(iotcs.impl.DeviceModel|null)} The DeviceModel, or <code>null</code>.
     */
    static _fromJson(deviceModelJson) {
        if (!deviceModelJson) {
            return null;
        }

        let deviceModelJsonObj;

        // Is this a device model JSON string or object?  We need an object.
        if (deviceModelJson.hasOwnProperty('urn')) {
            deviceModelJsonObj = deviceModelJson;
        } else {
            deviceModelJsonObj = JSON.parse(deviceModelJson);
        }

        iotcs.impl.DeviceModelParser._printDeviceActions(deviceModelJsonObj.actions);
        iotcs.impl.DeviceModelParser._printDeviceAttributes(deviceModelJsonObj.attributes);
        iotcs.impl.DeviceModelParser._printDeviceFormats(deviceModelJsonObj.formats);
        let deviceModelActions = [];
        let deviceModelAttributes = [];
        let deviceModelFormats = [];

        if (deviceModelJsonObj.actions) {
            deviceModelJsonObj.actions.forEach(action => {
                /** @type {Array<iotcs.impl.DeviceModelActionArgument>} */
                let args = [];

                if (action['arguments']) {
                    let self = this;
                    // New multiple args.
                    for (let i = 0; i < action.arguments.length; i++) {
                        let arg = action.arguments[i];

                        /** @type {iotcs.impl.DeviceModelAttribute.Type} */
                        let type = iotcs.impl.DeviceModelAttribute._getType(arg.type);
                        let range = arg.range;

                        /** @type {number} */
                        let min = null;
                        /** @type {number} */
                        let max = null;

                        if (range) {
                            /** @type {Array<string>} */
                            const strings = range.split(",");
                            min = strings[0];
                            max = strings[1];
                        }

                        /** @type {iotcs.impl.DeviceModelActionArgument} */
                        args.push(new iotcs.impl.DeviceModelActionArgument(arg.name,
                            arg.description, type, min, max, arg.defaultValue));
                    }
                } else if (action.argType) {
                    // Legacy single argument.
                    args.push(new iotcs.impl.DeviceModelActionArgument('value', null, action.argType,
                        null, null, null));
                }

                deviceModelActions.push(new iotcs.impl.DeviceModelAction(action.name, action.description,
                    args, action.alias));
            });
        }

        if (deviceModelJsonObj.attributes) {
            deviceModelJsonObj.attributes.forEach(attribute => {
                deviceModelAttributes.push(new iotcs.impl.DeviceModelAttribute(deviceModelJson.urn,
                    attribute.name, attribute.description, attribute.type, attribute.lowerBound,
                    attribute.upperBound, attribute.access, attribute.alias,
                    attribute.defaultValue));
            });
        }

        if (deviceModelJsonObj.formats) {
            deviceModelJsonObj.formats.forEach(format => {
                let fields = [];

                if (format.fields) {
                    //format.value.fields?
                    format.fields.forEach(field => {
                        fields.push(new iotcs.impl.DeviceModelFormatField(field.name, field.description,
                            field.type, field.optional));
                    });
                }

                deviceModelFormats.push(new iotcs.impl.DeviceModelFormat(format.urn, format.name,
                    format.description, format.type, fields));
            });
        }

        return new iotcs.impl.DeviceModel(deviceModelJsonObj.urn, deviceModelJsonObj.name,
            deviceModelJsonObj.description, deviceModelAttributes,
            deviceModelActions, deviceModelFormats);
    }

    static _printDeviceActions(actionsJson) {
        if (actionsJson) {
            for (let i = 0; i < actionsJson.length; i++) {
                let action = actionsJson[i];
            }
        }
    }

    static _printDeviceAttributes(attributesJson) {
        if (attributesJson) {
            for (let i = 0; i < attributesJson.length; i++) {
                let attribute = attributesJson[i];
            }
        }
    }

    static _printDeviceFormats(formatsJson) {
        if (formatsJson) {
            for (let i = 0; i < formatsJson.length; i++) {
                let format = formatsJson[i];
            }
        }
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DeviceAnalog.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceAnalog combines a device (endpoint id and attributes) with a model.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DeviceAnalog = class {
    /**
     *
     * @param {iotcs.device.impl.DirectlyConnectedDeviceImpl} directlyConnectedDevice
     * @param {DeviceModel} deviceModel
     * @param {string} endpointId the endpoint ID of the DirectlyConnectedDevice with this device
     * model.
     */
    constructor(directlyConnectedDevice, deviceModel, endpointId) {
        /**
         *
         * @type {Map<string, object>}
         *
         * @ignore
         * @private
         */
        this._attributeValueMap = new Map();

        /**
         *
         * @type {iotcs.device.impl.DirectlyConnectedDeviceImpl}
         *
         * @ignore
         * @private
         */
        this._directlyConnectedDevice = directlyConnectedDevice;

        /**
         *
         * @type {iotcs.device.impl.DeviceModel}
         *
         * @ignore
         * @private
         */
        this._deviceModel = deviceModel;

        /**
         *
         * @type {string}
         *
         * @ignore
         * @private
         */
        this._endpointId = endpointId;
    }

    /**
     * Invoke an action. The {@code argumentValues} parameter may be empty if there are no arguments
     * to pass, but will not be {@code null}.
     *
     * @param {string} actionName The name of the action to call.
     * @param {Map<string, ?>} argumentValues  The data to pass to the action, possibly an empty
     *        Map but never {@code null}.
     * @throws {iotcs.error} If
     */
    _call(actionName, argumentValues) {
        /** @type {Map<string, iotcs.device.impl.DeviceModelAction} */
        const deviceModelActionMap = this._deviceModel.getDeviceModelActions();

        if (!deviceModelActionMap) {
            return;
        }

        /** @type {iotcs.device.impl.DeviceModelAction} */
        const deviceModelAction = deviceModelActionMap.get(actionName);

        if (!deviceModelAction) {
            return;
        }

        // What this is doing is pushing a request message into the message
        // queue for the requested action. To the LL, it is handled just like
        // any other RequestMessage. But we don't want this RM going to the
        // server, so the source and destination are set to be the same
        // endpoint id. In SendReceiveImpl, if there is a RequestMessage
        // with a source == destination, it is treated it specially.
        /** @type {object} */
        let requestMessage = {};

        requestMessage.payload = {
            body: '',
            method: 'POST',
            url: "deviceModels/" + this._getDeviceModel()._getUrn() + "/actions/" + actionName
        };

        requestMessage.destination = this._getEndpointId();
        requestMessage.source = this._getEndpointId();
        requestMessage.type = iotcs.message.Message.Type.REQUEST;

        /** @type {Array<iotcs.device.impl.DeviceModelActionArgument>} */
        const argumentList = deviceModelAction._getArguments();

        try {
            /** @type {object} */
            let actionArgs = null;

            /** @type {iotcs.device.impl.DeviceModelActionArgument} */
            argumentList.forEach (argument => {
                /** @type {object} */
                let value = argumentValues.get(argument._getName());

                if (!value) {
                    value = argument._getDefaultValue();

                    if (!value) {
                        iotcs.error("Action not called: missing argument '" + argument._getName() +
                            " in call to '" + actionName + "'.");
                        return;
                    }
                }

                this._encodeArg(actionArgs, deviceModelAction, argument, value);
            });

            requestMessage.payload.body = actionArgs._toString();
        } catch (error) {
            iotcs.log(error.message);
            return;
        }

        /** @type {boolean} */
        const useLongPolling = iotcs.oracle.iot.client.device.disableLongPolling;

        // Assumption here is that, if you are using long polling, you are using message dispatcher.
        // This could be a bad assumption. But if long polling is disabled, putting the message on
        // the request buffer will work regardless of whether message dispatcher is used.
        if (useLongPolling) {
            try {
                /** @type {iotcs.device.Message} (ResponseMessage) */
                const responseMessage =
                    new iotcs.device.impl.util.RequestDispatcher().dispatch(requestMessage);
            } catch (error) {
                console.log(error);
            }
        } else {
            // Not long polling, push request message back on request buffer.
            try {
                /** @type {iotcs.device.Message} (ResponseMessage) */
                const responseMessage =
                    new iotcs.device.impl.util.RequestDispatcher().dispatch(requestMessage);
            } catch (error) {
                console.log(error);
            }
        }
    }

    /**
     * Determines if value is outside the lower and upper bounds of the argument.
     *
     * @param {DeviceModelAction} deviceModelAction
     * @param {DeviceModelActionArgument} argument
     * @param {number} value
     * @throws {error} if value is less than the lower bound or greater than the upper bound of the
     *         argument.
     */
    _checkBounds(deviceModelAction, argument, value) {
        /** @type {number} */
        const upperBound = argument._getUpperBound();
        /** @type {number} */
        const lowerBound = argument._getLowerBound();

        // Assumption here is that lowerBound <= upperBound.
        if (upperBound) {
            if (value > upperBound) {
                iotcs.error(deviceModelAction._getName() + " '" + argument._getName() +
                          "' out of range: " + value + " > " + upperBound + '.');
            }
        }

        if (lowerBound) {
            if(value < lowerBound) {
                iotcs.error(deviceModelAction._getName() + " '" + argument._getName() +
                          "' out of range: " + value + " < " + lowerBound + '.');
            }
        }
    }

    /**
     * Checks the data type of the value against the device model, converts the value to the
     * required type if needed, and adds the argument/value to the jsonObject.
     *
     * @param {object} jsonObject - The JSON object to add the argument and value to.
     * @param {DeviceModelAction} deviceModelAction - The device model action.
     * @param {DeviceModelActionArgument} argument - The device model action argument specification.
     * @param {object} value - The argument value.
     * @throws iotcs.error If there was a problem encoding the argument.
     */
    _encodeArg(jsonObject, deviceModelAction, argument, value) {
        /** @type {string} */
        const actionName = deviceModelAction._getName();
        /** @type {string} */
        const argumentName = argument._getName();
        /** @type {string} */
        const typeOfValue = typeof value;

        /** @type {DeviceModelAttribute.Type} */
        switch (argument._getArgType()) {
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                if (typeOfValue !== 'number') {
                    iotcs.error(actionName + " value for '" + argument + "' is not a NUMBER.");
                }

                this._checkBounds(deviceModelAction, argument, value);
                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
                if (typeOfValue !== 'integer') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not an INTEGER.");
                }

                this._checkBounds(deviceModelAction, argument, value);
                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
                if ((typeOfValue !== 'date') && (typeOfValue !== 'long')) {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a DATETIME.");
                }

                if (typeOfValue === 'date') {
                    let d = new Date();
                    jsonObject.put(argumentName, value.getMilliseconds());
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
                if (typeOfValue !== 'boolean') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a BOOLEAN.");
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.STRING:
                if (typeOfValue !== 'string') {
                    iotcs.error(actionName + " value for '" + argumentName + "' is not a STRING.");
                }

                jsonObject.put(argumentName, value);
                break;
            case iotcs.impl.DeviceModelAttribute.Type.URI:
                if (!(value instanceof iotcs.ExternalObject)) {
                    iotcs.error(actionName + " value for '" + argumentName +
                        "' is not an ExternalObject.");
                }

                jsonObject.put(argumentName, value);
                break;
            default:
                iotcs.error(actionName + " argument '" + argumentName + "' has an unknown type.");
        }
    }

    /**
     * Returns the attribute value of the attribute with the specified name.  If the attribute value
     * is not available, returns the attribute's default value.
     *
     * @param {string} attributeName - The name of the attribute.
     * @return {object} The attribute's value or default value.
     */
    _getAttributeValue(attributeName) {
        /** @type {iotcs.device.impl.Attribute} */
        let deviceModelAttribute = this._deviceModel.getDeviceModelAttributes().get(attributeName);

        if (deviceModelAttribute === null) {
            iotcs.error(this._deviceModel.getUrn() + " does not contain attribute " +
                attributeName);
        }

        let value = this._attributeValueMap.get(attributeName);

        if (value === null) {
            value = deviceModelAttribute._getDefaultValue();
        }

        return value;
    }


    /**
     * Returns the device model.
     *
     * @returns {DeviceModel} The device model.
     */
    _getDeviceModel() {
        return this._deviceModel;
    }

    /**
     * Returns the device's endpoint ID.
     *
     * @return {string} The device's endpoint ID.
     */
    _getEndpointId() {
        return this._directlyConnectedDevice._getEndpointId();
    }

    /**
     * Enqueue's the message for dispatching.
     *
     * @param {Message} message - The message to be enqueued.
     */
    _queueMessage(message) {
        try {
            this._directlyConnectedDevice._messageDispatcher.queue(message);
        } catch(error) {
            console.log('Error queueing message: ' + error);
        }
    }

    /**
     * Set the named attribute to the given value.
     *
     * @param {string} attribute - The attribute to set.
     * @param {object} value - The value of the attribute.
     * @throws Error If the attribute is not in the device model, the value is <code>null</code>, or
     *         the value does not match the attribute type.
     */
    _setAttributeValue(attribute, value) {
        if (value === null) {
            throw new Error("value cannot be null");
        }

        let deviceModelAttribute = this._deviceModel.getDeviceModelAttributes().get(attribute);

        if (!deviceModelAttribute) {
            throw new Error(this._deviceModel.getUrn() + " does not contain attribute " +
                            attribute);
        }

        /** @type {DeviceModelAttribute.Type} */
        let type = deviceModelAttribute.getType();
        let badValue;
        let typeOfValue = null;

        switch (type) {
            // TODO: We don't need all of these types in JavaScript.
            case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
            case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                typeOfValue = typeof value === 'number';
                badValue = !typeOfValue;
                break;
            case iotcs.impl.DeviceModelAttribute.Type.STRING:
            case iotcs.impl.DeviceModelAttribute.Type.URI:
                typeOfValue = typeof value === 'string';
                badValue = !typeOfValue;
                break;
            case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
                typeOfValue = typeof value === 'boolean';
                badValue = !typeOfValue;
                break;
            default:
                throw new Error('Unknown type ' + type);
        }

        if (badValue) {
            throw new Error("Cannot set '"+ this._deviceModel.getUrn() + ":attribute/" + attribute +
                            "' to " + value.toString());
        }

        this._attributeValueMap.set(attribute, value);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DirectlyConnectedDeviceImpl.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This is the private, internal directly-connected device which supports the low-level API
 * iotcs.device.util.DirectlyConnectedDevice.
 */

/** @ignore */
iotcs.device.impl.DirectlyConnectedDeviceImpl = class {
    // Static private functions
    /**
     *
     * Generate the request body for POSTing to /iot/api/v2/provisioner/storage.
     * See https://docs.cloud.oracle.com/iaas/Content/API/Concepts/signingrequests.htm.
     *
     * @param {string} objectName - The name for object in storage cloud, not <code>null</code>.
     * @param {string} method - The method being requested in storage cloud API, GET, HEAD, or POST,
     *        not <code>null</code>.
     * @returns {Uint8Array} The request body for POSTing to /iot/api/v2/provisioner/storage.
     */
    static _createAuthenticationRequestBody(objectName, methodName) {
        _mandatoryArg(objectName, 'string');
        _mandatoryArg(methodName, 'string');

        // {
        //    "object":"object_name"
        //    "method":"PUT"
        // }
        let authRequestBody = {};
        authRequestBody.object = objectName;
        authRequestBody.method = methodName.toLocaleUpperCase();
        return iotcs.impl.Platform._encode(JSON.stringify(authRequestBody));
    }

    /**
     * @ignore
     */
    static _getUtf8BytesLength(string) {
        return forge.util.createBuffer(string, 'utf8').length();
    }

    /**
     * @ignore
     */
    static _optimizeOutgoingMessage(obj) {
        if (!__isArgOfType(obj, 'object')) {
            return null;
        }

        if (_isEmpty(obj.properties)) {
            delete obj.properties;
        }

        return obj;
    }

    /**
     * @ignore
     */
    static _updateURIinMessagePayload(payload) {
        if (payload.data) {
            Object.keys(payload.data).forEach(key => {
                if (payload.data[key] instanceof iotcs.ExternalObject) {
                    payload.data[key] = payload.data[key].getURI();
                }
            });
        }

        return payload;
    }

    constructor(taStoreFile, taStorePassword, dcd, gateway) {
        if (dcd) {
            // The "parent", low-level API DCD associated with this internal DCD.
            this._parentDcd = dcd;
        }

        if (gateway) {
            this._gateway = gateway;
        }

        this._activating = false;
        this._bearer = "";
        /**
         * Determines if this device is closed.
         *
         * @returns {@code true} if this device is closed.
         */
        this._isClosed = false;
        this._isRefreshingBearer = false;
        this._restStorageAuthentication = new RestApi('v2').getReqRoot() + "/provisioner/storage";
        this._storageAuthToken = "";
        this._storageAuthTokenStartTime = null;
        this._storageContainerUrl = "";
        this._storageObjectName = null;
        this._storageRefreshing = false;
        this._tam = new iotcs.device.TrustedAssetsManager(taStoreFile, taStorePassword);
        /** The current token expiration time in MS. */
        this._tokenExpirationMs8 = -1;

        if (this._isActivated()) {
            let persistenceStore =
                iotcs.device.impl.PersistenceStoreManager._get(this._tam.getEndpointId());
            let devicePolicyManager =
                new iotcs.device.impl.DevicePolicyManager(this);

            if (devicePolicyManager) {
                persistenceStore
                    ._openTransaction()
                    ._putOpaque('DevicePolicyManager', devicePolicyManager)
                    ._commit();
            }
        }
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _activate(deviceModelUrns, callback) {
        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        if (this._isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        let self = this;

        /**
         * Gets the activation policy for this device, generates the keys, and activates the device.
         *
         * @ignore
         *
         * @param {error} error If an error occurs during processing.
         */
        function _privateGetPolicy(error) {
            // The callback referenced is the one passed to the activate function.
            if (error) {
                callback(null, iotcs.createError('Error on get policy for activation.', error));
                return;
            }

            let options = {
                path: iotcs.impl._reqRoot + '/activation/policy?OSName=' + iotcs.impl.Platform.Os._type() +
                    '&OSVersion=' + iotcs.impl.Platform.Os._release(),
                method: 'GET',
                headers: {
                    'Authorization': self._bearer,
                    'X-ActivationId': self._tam.getClientId()
                },
                tam: self._tam
            };

            iotcs.impl._protocolReq(options, "", (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.keyType ||
                    !responseBody.hashAlgorithm ||
                    !responseBody.keySize)
                {
                    self._activating = false;
                    callback(null, iotcs.createError('Error on get policy for activation.', error));
                    return;
                }

                _privateKeyGenerationAndActivationAsync(responseBody);
            }, null, self);
        }

        /**
         *
         *
         * @ignore
         *
         * @param {object} activationPolicy The activation policy response from an activation policy
         *        request.
         */
        function _privateKeyGenerationAndActivationAsync(activationPolicy) {
            // The callback referenced is the one passed to the activate function.
            let algorithm = activationPolicy.keyType;
            let hashAlgorithm = activationPolicy.hashAlgorithm;
            let keySize = activationPolicy.keySize;

            self._tam._generateKeyPairNative(algorithm, keySize, (isGenKeys, error) => {
                if (error || !isGenKeys) {
                    self._activating = false;
                    callback(null, iotcs.createError('Keys generation failed on activation.',
                                                     error));
                }

                let content = self._tam.getClientId();
                let payload = {};

                try {
                    let clientSecret = self._tam.signWithSharedSecret(content, 'sha256', null);
                    let publicKey = self._tam.getPublicKey();

                    publicKey = publicKey.substring(publicKey.indexOf('----BEGIN PUBLIC KEY-----') +
                                                    '----BEGIN PUBLIC KEY-----'.length,
                                                    publicKey.indexOf('-----END PUBLIC KEY-----')).replace(/\r?\n|\r/g, "");

                    let toBeSigned =
                        forge.util.bytesToHex(forge.util.encodeUtf8(self._tam.getClientId() + '\n' +
                                                                    algorithm + '\nX.509\nHmacSHA256\n')) +
                        forge.util.bytesToHex(clientSecret) +
                        forge.util.bytesToHex(forge.util.decode64(publicKey));

                    toBeSigned = forge.util.hexToBytes(toBeSigned);

                    let signature =
                        forge.util.encode64(self._tam.signWithPrivateKey(toBeSigned, 'sha256'));

                    payload = {
                        certificationRequestInfo: {
                            subject: self._tam.getClientId(),
                            subjectPublicKeyInfo: {
                                algorithm: algorithm,
                                publicKey: publicKey,
                                format: 'X.509',
                                secretHashAlgorithm: 'HmacSHA256'
                            },
                            attributes: {}
                        },
                        signatureAlgorithm: hashAlgorithm,
                        signature: signature,
                        deviceModels: deviceModelUrns
                    };
                } catch (e) {
                    self._activating = false;
                    callback(null, iotcs.createError('Certificate generation failed on activation.',
                                                     e));
                }

                let options = {
                    path: iotcs.impl._reqRoot + '/activation/direct' +
                        (iotcs.oracle.iot.client.device.allowDraftDeviceModels ? '' :
                         '?createDraft=false'),
                    method: 'POST',
                    headers: {
                        'Authorization': self._bearer,
                        'X-ActivationId': self._tam.getClientId()
                    },
                    tam: self._tam
                };

                iotcs.impl._protocolReq(options, JSON.stringify(payload), (responseBody, error) => {
                    if (!responseBody ||
                        error ||
                        !responseBody.endpointState ||
                        !responseBody.endpointId)
                    {
                        self._activating = false;
                        callback(null, iotcs.createError('Invalid response on activation.', error));
                        return;
                    }

                    if (responseBody.endpointState !== 'ACTIVATED') {
                        self._activating = false;

                        callback(null, iotcs.createError('Endpoint not activated: ' +
                                                         JSON.stringify(responseBody)));
                        return;
                    }

                    try {
                        self._tam.setEndpointCredentials(responseBody.endpointId,
                                                          responseBody.certificate);

                        let persistenceStore =
                            iotcs.device.impl.PersistenceStoreManager._get(self._tam.getEndpointId());

                        persistenceStore
                            ._openTransaction()
                            ._putOpaque('DevicePolicyManager',
                                        new iotcs.device.impl.DevicePolicyManager(self))
                            ._commit();
                    } catch (e) {
                        self._activating = false;

                        callback(null, iotcs.createError('Error when setting credentials on activation.',
                                                       e));
                        return;
                    }

                    self._clearBearer();

                    self._refreshBearer(false, error => {
                        self._activating = false;

                        if (error) {
                            callback(null, iotcs.createError('Error on authorization after activation.',
                                                           error));
                            return;
                        }

                        try {
                            self._registerDevicePolicyResource();
                        } catch (error) {
                            console.log("Could not register device policy resource: " + error);
                        }

                        callback(self);
                    });
                }, null, self);
            });
        }

        /**
         *
         * @ignore
         *
         * @param {object} activationPolicy The activation policy response from an activation policy
         *        request.
         */
        function _privateKeyGenerationAndActivation(activationPolicy) {
            let algorithm = activationPolicy.keyType;
            let hashAlgorithm = activationPolicy.hashAlgorithm;
            let keySize = activationPolicy.keySize;
            let isGenKeys = null;

            try {
                isGenKeys = self._tam.generateKeyPair(algorithm, keySize);
            } catch (e) {
                self._activating = false;
                callback(null, iotcs.createError('Keys generation failed on activation.', e));
                return;
            }

            if (!isGenKeys) {
                self._activating = false;
                callback(null, iotcs.createError('Keys generation failed on activation.'));
                return;
            }

            let content = self._tam.getClientId();
            let payload = {};

            try {
                let clientSecret = self._tam.signWithSharedSecret(content, 'sha256', null);
                let publicKey = self._tam.getPublicKey();

                publicKey = publicKey.substring(publicKey.indexOf('----BEGIN PUBLIC KEY-----')
                                                + '----BEGIN PUBLIC KEY-----'.length,
                                                publicKey.indexOf('-----END PUBLIC KEY-----')).replace(/\r?\n|\r/g, "");

                let toBeSigned = forge.util.bytesToHex(forge.util.encodeUtf8(self._tam.getClientId() +
                                                                             '\n' + algorithm + '\nX.509\nHmacSHA256\n')) +
                    forge.util.bytesToHex(clientSecret) +
                    forge.util.bytesToHex(forge.util.decode64(publicKey));

                toBeSigned = forge.util.hexToBytes(toBeSigned);

                let signature = forge.util.encode64(self._tam.signWithPrivateKey(toBeSigned,
                                                                                  'sha256'));

                payload = {
                    certificationRequestInfo: {
                        subject: self._tam.getClientId(),
                        subjectPublicKeyInfo: {
                            algorithm: algorithm,
                            publicKey: publicKey,
                            format: 'X.509',
                            secretHashAlgorithm: 'HmacSHA256'
                        },
                        attributes: {}
                    },
                    signatureAlgorithm: hashAlgorithm,
                    signature: signature,
                    deviceModels: deviceModelUrns
                };
            } catch (e) {
                self._activating = false;
                callback(null, iotcs.createError('Certificate generation failed on activation.', e));
                return;
            }

            let options = {
                path : iotcs.impl._reqRoot + '/activation/direct' +
                    (iotcs.oracle.iot.client.device.allowDraftDeviceModels ? '' :
                     '?createDraft=false'),
                method : 'POST',
                headers : {
                    'Authorization' : self._bearer,
                    'X-ActivationId' : self._tam.getClientId()
                },
                tam: self._.tam
            };

            iotcs.impl._protocolReq(options, JSON.stringify(payload), (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.endpointState ||
                    !responseBody.endpointId)
                {
                    self._activating = false;
                    callback(null,iotcs.createError('Invalid response on activation.', error));
                    return;
                }

                if(responseBody.endpointState !== 'ACTIVATED') {
                    self._activating = false;
                    callback(null,iotcs.createError('Endpoint not activated: ' +
                                                    JSON.stringify(responseBody)));
                    return;
                }

                try {
                    self._tam.setEndpointCredentials(responseBody.endpointId,
                                                      responseBody.certificate);
                    let persistenceStore =
                        iotcs.device.impl.PersistenceStoreManager._get(self._tam.getEndpointId());

                    persistenceStore
                        ._openTransaction()
                        ._putOpaque('DevicePolicyManager',
                                    new iotcs.device.impl.DevicePolicyManager(self))
                        ._commit();
                } catch (e) {
                    self._activating = false;
                    callback(null,iotcs.createError('Error when setting credentials on activation.',
                                                    e));
                    return;
                }

                self._clearBearer();

                self._refreshBearer(false, error => {
                    self._activating = false;

                    if (error) {
                        callback(null,iotcs.createError('Error on authorization after activation.',
                                                        error));
                        return;
                    }

                    try {
                        self._registerDevicePolicyResource();
                    } catch (e) {
                        console.log("Could not register device policy resource: " + e);
                    }

                    callback(self);
                });
            }, null, self);
        }

        self._activating = true;
        self._refreshBearer(true, _privateGetPolicy);
    }

    _clearBearer() {
        this._tokenExpirationMs = -1;
        delete this._bearer;
        this._bearer = "";
    }

    /**
     * Closes this device.
     */
    _close() {
        this._isClosed = true;
    }

    _getCurrentServerTime() {
        if (typeof this._serverDelay === 'undefined') {
            return Date.now();
        } else {
            return (Date.now() + this._serverDelay);
        }
    }

    /**
     * @ignore
     */
    _getEndpointId() {
        return this._tam.getEndpointId();
    }

    /**
     * @ignore
     */
    _isActivated() {
        return this._tam.isActivated();
    }

    /**
     * The refreshBearer function will send a request to the IoT CS to get a new token (bearer).
     * Note: Tokens (bearers) are device-specific.  As such, the management of them must be done in
     *       this "class".
     *
     * @param {boolean} activation <code>true</code> if this is being called during activation.
     * @param {function} callback the function to call back with the results.
     */
    _refreshBearer(activation, callback) {
        if (this._isClosed) {
            return;
        }

        // If we already have a non-expired token, don't attempt to get another token.
        if ((this._isRefreshingBearer) ||
            ((this._bearer) && (Date.now() < this._tokenExpirationMs)))
        {
            if (callback) {
                callback();
            }
        } else {
            this._isRefreshingBearer = true;
            let inputToSign = this._tam._buildClientAssertion();

            if (!inputToSign) {
                this._isRefreshingBearer = false;
                let error1 = iotcs.createError('error on generating oauth signature');

                if (callback) {
                    callback(error1);
                }

                return;
            }

            let dataObject = {
                grant_type: 'client_credentials',
                client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                client_assertion: inputToSign,
                scope: (activation ? 'oracle/iot/activation' : '')
            };

            let payload = iotcs.impl.Platform.Query._stringify(dataObject, null, null,
                {encodeURIComponent: iotcs.impl.Platform.Query._unescape});

            payload = payload.replace(new RegExp(':', 'g'), '%3A');

            let options = {
                path: iotcs.impl._reqRoot + '/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                tam: this._tam
            };

            iotcs.impl._protocolReq(options, payload, (responseBody, error) => {
                if (!responseBody ||
                    error ||
                    !responseBody.token_type ||
                    !responseBody.access_token)
                {
                    if (error) {
                        let exception = null;

                        try {
                            exception = JSON.parse(error.message);
                            let now = Date.now();

                            if (exception.statusCode &&
                                (exception.statusCode === iotcs.StatusCode.FORBIDDEN))
                                // Should this be iotcs.StatusCode.BAD_REQUEST?
                            {
                                if (exception.body) {
                                    try {
                                        let body = JSON.parse(exception.body);

                                        if ((body.currentTime) &&
                                            (typeof this._serverDelay === 'undefined') &&
                                            (now < parseInt(body.currentTime)))
                                        {
                                            this._serverDelay = (parseInt(body.currentTime) - now);

                                            this._tam._serverDelay =
                                                (parseInt(body.currentTime) - now);

                                            this._refreshBearer(activation, callback);
                                            return;
                                        }
                                    } catch (ignore) {
                                       // Do nothing. 
                                    }
                                }

                                if (activation) {
                                    this._tam.setEndpointCredentials(this._tam.getClientId(), null);

                                    this._refreshBearer(false, error => {
                                        this._activating = false;

                                        if (error) {
                                            callback(null, error);
                                            return;
                                        }

                                        callback(this);
                                    });

                                    return;
                                }
                            }
                        } catch (ignore) {
                            // Do nothing.
                        }

                        if (callback) {
                            callback(error);
                        }
                    } else {
                        if (callback) {
                            callback(iotcs.error(JSON.stringify(responseBody)));
                        }
                    }

                    return;
                }

                delete this._bearer;
                this._bearer = (responseBody.token_type + ' ' + responseBody.access_token);

                if (responseBody.expires_in && (responseBody.expires_in > 0)) {
                    this._tokenExpirationMs = Date.now() + responseBody.expires_in;
                } else {
                    this._tokenExpirationMs = -1;
                }

                if (callback) {
                    callback();
                }

                this._isRefreshingBearer = false;
            }, null, this);
        }
    }

    /**
     * Refreshes the classic storage authorization token if needed by making an HTTP request to the
     * IoT CS for a current authorization token.
     *
     * Note: The "new" storage server authentication token is storageObject-specific, so it is 
     *       stored with the storage object.  The "classic" storage server authentication token is 
     *       *not* storageObject-specific, so it is stored in the DirectlyConnectedDevice(Util).
     *
     * @param {iotcs.StorageObject} storageObject - The storage object being sync'd.
     * @param {function} callback - The function to call back when complete.
     *
     * @ignore
     */
    _refreshClassicStorageAuthToken(callback) {
        this._storageRefreshing = true;
        let self = this;

        let options = {
            path: self._restStorageAuthentication,
            method: 'GET',
            headers: {
                'Authorization': self._bearer,
                'X-EndpointId': self._tam.getEndpointId()
            },
            tam: self._tam
        };

        let refreshFunction = (response, error) => {
            self._storageRefreshing = false;

            if (!response || error || !response.storageContainerUrl || !response.authToken) {
                if (error) {
                    if (callback) {
                        callback(error);
                    }
                } else {
                    self._refreshClassicStorageAuthToken(callback);
                }
                return;
            }

            delete self._storageAuthToken;
            self._storageAuthToken = response.authToken;

            delete self._storageContainerUrl;
            self._storageContainerUrl = response.storageContainerUrl;

            delete self._storageAuthTokenStartTime;
            self._storageAuthTokenStartTime = Date.now();

            if (callback) {
                callback();
            }
        };

        iotcs.impl._protocolReq(options, "", refreshFunction, () => {
            this._refreshClassicStorageAuthToken(callback);
        }, this);
    }

   /**
    * Get the new storage authorization token by making an HTTP request to the IoT CS for a current 
    * authorization token.  We try with a "new" storage request first.  If it fails, we make a call 
    * to refreshClassicStorageAuthToken.  Once the token is retrieved, it is set in the storage
    * object.
    *
    * In order to create the StorageObject, we need to form the URI.  To form the URI, we need
    * to get the storage authentication data.  But we don't know whether the storage service
    * configured on IoT CS is for Object Storage or Object Storage Classic. We could look at
    * the current storage authentication data (if we have it), but there is a (slim) chance
    * that the storage service configuration on IoT CS has changed.  Therefore, we always get
    * the storage authentication data when creating the storage object since it will give the
    * correct URI.  Since we don't know which API to use, we assume Object Storage
    * (POST /api/v2/provisioner/storage) and fall back to Object Storage Classic
    * (GET /api/v2/provisioner/storage). This should be most often correct with post 19.1.1
    * versions of the IoT CS.
    *
    * Note: The "new" storage server authentication token is storageObject-specific, so it is stored
    *       with the storage object.  The "classic" storage server authentication token is *not*
    *       storageObject-specific, so it is stored in the DirectlyConnectedDevice(Util).
    *
    * @param {iotcs.StorageObject} storageObject - The storage object being sync'd.
    * @param {function} callback - The function to call back when complete.
    *
    * @ignore
    */
    _refreshNewStorageAuthToken(storageObject, callback) {
        let payload =
            iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(storageObject.getName(),
                                                                                           "PUT");
        let self = this;

        let options = {
            agent: false,
            headers: {
                'Authorization': self._bearer,
                'X-EndpointId': self._tam._endpointId
            },
            method: 'POST',
            path: self._restStorageAuthentication,
            rejectUnauthorized: true,
            tam: self._tam
        };

        iotcs.impl._protocolReq(options, payload, (response, error) => {
            iotcs.impl.Platform._debug();

            if (error) {
                iotcs.impl.Platform._debug("Error: " + error);
                let httpStatus = JSON.parse(error.message);

                if ((httpStatus.statusCode === iotcs.StatusCode.PRECOND_FAILED) ||
                    (httpStatus.statusCode === iotcs.StatusCode.METHOD_NOT_ALLOWED))
                {
                    // These status codes indicate we're using classic storage, so switch to usding
                    // classic.
                    self._refreshClassicStorageAuthToken(callback);
                } else {
                    throw error;
                }
            } else {
                iotcs.impl.Platform._debug("Response: " + response.statusCode + ' ' +
                                          response.statusMessage);
                iotcs.impl.Platform._debug(response.headers);

                if (response.storageUrl) {
                    storageObject._storageAuthenticationData = response;
                    callback();
                }
            }
        });
    }

    /**
     * @ignore
     */
    _registerDevicePolicyResource() {
        if (!this._isActivated()) {
            return;
        }

        // Note: Any changes here should also be made in MessageDispatcher.  This should really not be
        // here.  It should reference the handlerMethods in MessageDispatcher.
        let handlerMethods = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": "PUT",
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": 'PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": 'GET,PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": 'GET,PUT'
        };

        let resources = [];

        resources.push(iotcs.message.Message.ResourceMessage.Resource.buildResource(
            "urn:oracle:iot:dcd:capability:device_policy",
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged",
            'PUT',
            iotcs.message.Message.ResourceMessage.Resource.Status.ADDED,
            this._tam.getEndpointId()));

        let resourceMessage = iotcs.message.Message.ResourceMessage.buildResourceMessage(
            resources,
            this._parentDcd.getEndpointId(),
            iotcs.message.Message.ResourceMessage.Type.UPDATE,
            iotcs.message.Message.ResourceMessage.getMD5ofList(Object.keys(handlerMethods)))
            .source(this._parentDcd.getEndpointId())
            .priority(iotcs.message.Message.Priority.HIGHEST);

        this._parentDcd.send([resourceMessage], (messages, error) => {
            if (error) {
                console.log('Error registering device policy resources.  ' + error);
            }
        });
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DirectlyConnectedDeviceUtil.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @alias iotcs.device.util
 * @memberof iotcs.device
 * @namespace
 */
iotcs.device.util = {};

/**
 * A directly-connected device is able to send messages to, and receive messages from, the IoT
 * server.  When the directly-connected device is activated on the server, the server assigns a
 * logical-endpoint identifier.  This logical-endpoint identifier is required for sending messages
 * to, and receiving messages from, the server.
 * <p>
 * The directly-connected device is able to activate itself using the direct activation capability.
 * The data required for activation and authentication is retrieved from a TrustedAssetsStore
 * generated using the TrustedAssetsProvisioner tool using the Default TrustedAssetsManager.
 * <p>
 * This object represents the low-level API for the directly-connected device and uses direct
 * methods for sending or receiving messages.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 * @param {boolean} [gateway] - <code>true</code> to indicate creation of a GatewayDevice
 *        representation.
 *
 * @alias iotcs.device.util.DirectlyConnectedDevice
 * @class iotcs.device.util.DirectlyConnectedDevice
 * @memberof iotcs.device.util
 */
iotcs.device.util.DirectlyConnectedDevice = class {
    // Static private functions
    /**
     * Returns the content length of the data in the input stream.
     *
     * @param {?} inputStream - An input stream pointing to data.
     * @returns {number} The content length of the data in the inputStream, or -1 if the content length
     *          could not be determined.
     * @throws Error If there was a problem determining the content length.
     *
     * @ignore
     */
    // TODO: Implement...not sure if this is needed, I implemented this another, better way.
    static _getContentLength(inputStream) {
        // if (inputStream.markSupported() || (inputStream instanceof FileInputStream)) {
        //     if (inputStream.markSupported()) {
        //         inputStream.mark(Integer.MAX_VALUE);
        //     }
        //
        //     long total = 0;
        //
        //     try {
        //         int len;
        //         final byte[] buf = new byte[4096];
        //
        //         while ((len = inputStream.read(buf)) != -1) {
        //             total += len;
        //         }
        //     }  finally {
        //         if (inputStream.markSupported()) {
        //             inputStream.reset();
        //         } else {
        //             ((FileInputStream)inputStream).getChannel().position(0);
        //         }
        //     }
        //
        //     if (total > Integer.MAX_VALUE) {
        //         // Later we cast to int, so check here.
        //         throw new IOException("file too large");
        //     }
        //
        //     return (int)total;
        // }
        //
        // // Cannot calculate length of input stream
        // return -1;
    }

    /**
     * Returns the name of the storage object from the given URL.
     *
     * @param {URL} storageCloudUrl - The storage cloud URL.
     * @returns {string} The name of the storage object from the given URL.
     * @throws {Error} If there was a problem obtaining the storage object name.
     *
     * @ignore
     */
    static _getObjectNameFromUrl(storageCloudUrl) {
        let objectStoragePattern = new RegExp('https?://(?:objectstorage\\..+\\.oraclecloud\\.com|localhost)(?::\\d+)?/n/[^/]+/b/[^/]+/o/(.+)');
        let match = storageCloudUrl.href.match(objectStoragePattern);

        if (match) {
            if (match.length > 0) {
                return match[1];
            }
        } else {
            let objectStorageClassicPattern = new RegExp('https?://(?:.+\\.storage\\.oraclecloud\\.com|localhost)(?::\\d+)?/v1/[^/]+/[^/]+/(.+)');
            match = storageCloudUrl.href.match(objectStorageClassicPattern);

            if (match) {
                if (match.length > 0) {
                    return match[1];
                }
            }
        }

        throw new Error("storageCloudUrl does not contain object name.");
    }

    /**
     * Determines if the path is to a classic object store and if not, if it's syntax is for the new
     * object store.
     *
     * @param {string} path - A URL path.
     * @returns {boolean} <code>true</code> if the path is to a classic object store.
     *
     * @ignore
     */
    static _isPathClassicObjectStore(path) {
        if (path.startsWith("/v1/")) {
            return true;
        }

        if (!path.startsWith("/n/")) {
            throw new Error("path does not start with expected tokens.");
        }

        return false;
    }

    constructor(taStoreFile, taStorePassword, gateway) {
        this._maxAcceptBytes = iotcs.oracle.iot.client.device.requestBufferSize;
        this._receiveMessageQueue = [];
        let sending = false;
        this._dcdImpl =
            new iotcs.device.impl.DirectlyConnectedDeviceImpl(taStoreFile, taStorePassword,
                                                                      this, gateway);

        if (this._dcdImpl._tam.getServerScheme &&
            (this._dcdImpl._tam.getServerScheme().indexOf('mqtt') > -1))
        {
            let messageRegisterMonitor = null;

            messageRegisterMonitor = new iotcs.impl.Monitor(() => {
                if (!this._dcdImpl._isActivated()) {
                    return;
                }

                if (messageRegisterMonitor) {
                    messageRegisterMonitor.stop();
                }

                iotcs.impl._protocolRegister(iotcs.impl._reqRoot + '/messages/acceptBytes', (message, error) => {
                    let acceptBytes1 = this._maxAcceptBytes -
                        iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));
                    let logMessage = (error ? error.message : JSON.stringify(message));
                    let buffer = forge.util.createBuffer(logMessage, 'utf8');
                    let bytes = buffer.getInt32();

                    if (bytes > this._maxAcceptBytes) {
                        iotcs.createError('The server has a request of ' + bytes +
                                        ' bytes for this client, which is too large for the ' +
                                        this._maxAcceptBytes +
                                        ' byte request buffer. Please restart the client with larger value for ' +
                                        'the iotcs.oracle.iot.client.device.requestBufferSize property.');
                    } else if (bytes > acceptBytes1) {
                        iotcs.createError('The server has a request of ' + bytes +
                                        ' which cannot be sent because the ' + this._maxAcceptBytes +
                                        ' byte request buffer is filled with ' +
                                        (this._maxAcceptBytes - acceptBytes1) +
                                        ' of unprocessed requests.');
                    }
                }, this._dcdImpl);
            });

            messageRegisterMonitor._start();
        }

        try {
            this._dcdImpl._registerDevicePolicyResource();
        } catch (error) {
            console.log("Could not register device policy resource: " + error);
        }
    }

    // Private/protected functions
    get _storageObjectName() {
        return this._dcdImpl._storageObjectName;
    }

    _getReceivedMessage() {
        if (this._receiveMessageQueue.length > 0) {
            return this._receiveMessageQueue.splice(0, 1)[0];
        } else {
            return null;
        }
    }

    _isClassicStorageAuthenticated() {
        return (this._dcdImpl._storageAuthenticationData != null);
    }

    _isClassicStorageTokenExpired() {
        // Period in minutes recalculated in milliseconds.
        return ((this._dcdImpl._storageAuthenticationData.authTokenStartTime +
                 iotcs.oracle.iot.client.storageTokenPeriod * 60000) < Date.now());
    }

    _isStorageAuthenticated() {
        return (this._dcdImpl._storageContainerUrl && this._dcdImpl._storageAuthToken);
    }

    _isStorageTokenExpired() {
        // period in minutes recalculated in milliseconds
        return ((this._dcdImpl._storageAuthTokenStartTime +
                 iotcs.oracle.iot.client.storageTokenPeriod * 60000) < Date.now());
    }

    /**
     * Sends the messages in 'messages' and receives incoming messages and calls sentMessagesCallback
     * or errorCallback.
     *
     * @param {message[]} messages
     * @param {function(message[])} sentMsgsCallback - Callback for successfully sent messages.
     * @param {function(message[], error)} sentMsgsErrCallback - Callback for errors for sent
     *        messages.
     * @param {function(message[])} receivedMsgsCallback - Callback for received messages.
     * @param {boolean} longPolling {@code true} to enable long polling.
     * @param {number} timeout the number of milliseconds to wait to hear a response from the
     *                 server before giving up.
     */
    _sendReceiveMessages(messages, deliveryCallback, errorCallback, longPolling, timeout) {
        if (!this._dcdImpl._isActivated()) {
            let error = iotcs.createError('Device not yet activated.');

            if (errorCallback) {
                errorCallback(messages, error);
            }

            return;
        }

        if (!this._dcdImpl._bearer) {
            this._dcdImpl._refreshBearer();
            return;
        }

        try {
            iotcs.message.Message._checkMessagesBoundaries(messages);
        } catch (e) {
            if (errorCallback) {
                errorCallback(messages, e);
            }

            return;
        }

        let bodyArray = [];
        let i;
        let len = messages.length;

        // Construct the messages to be sent.
        for (let i = 0; i < len; i++) {
            let messagePush = messages[i].getJSONObject();

            if (this._dcdImpl._serverDelay) {
                bodyArray.push(iotcs.device.impl.DirectlyConnectedDeviceImpl._optimizeOutgoingMessage({
                    clientId: messagePush.clientId,
                    source: messagePush.source,
                    destination: messagePush.destination,
                    sender: messagePush.sender,
                    priority: messagePush.priority,
                    reliability: messagePush.reliability,
                    eventTime: messagePush.eventTime + this._dcdImpl._serverDelay,
                    type: messagePush.type,
                    properties: messagePush.properties,
                    payload: iotcs.device.impl.DirectlyConnectedDeviceImpl._updateURIinMessagePayload(messagePush.payload)
                }));
            } else {
                messagePush.payload = iotcs.device.impl.DirectlyConnectedDeviceImpl._updateURIinMessagePayload(messagePush.payload);
                bodyArray.push(iotcs.device.impl.DirectlyConnectedDeviceImpl._optimizeOutgoingMessage(messagePush));
            }
        }

        let postBody = JSON.stringify(bodyArray);

        iotcs.impl.Platform._debug('DirectlyConnectedDevice.sendReceiveMessages postBody = ' +
                       postBody);

        let acceptBytes = this._maxAcceptBytes -
            iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));

        if ((typeof acceptBytes !== 'number') ||
            isNaN(acceptBytes) ||
            (acceptBytes < 0) ||
            (acceptBytes > this._maxAcceptBytes))
        {
            let error1 = iotcs.createError('Bad acceptBytes query parameter.');

            if (errorCallback) {
                errorCallback(messages, error1);
            }

            return;
        }

        let options = {
            path: iotcs.impl._reqRoot + '/messages?acceptBytes=' + acceptBytes +
                (longPolling ? '&iot.sync' : '') + (timeout ? ('&iot.timeout=' + timeout) : ''),
            method: 'POST',
            headers: {
                'Authorization': this._dcdImpl._bearer,
                'X-EndpointId': this._dcdImpl._tam.getEndpointId(),
                //'Content-Length': Buffer.byteLength(postBody, 'utf-8')
            },
            tam: this._dcdImpl._tam
        };

        // Send the messages.
        iotcs.impl._protocolReq(options, postBody, (responseBody, error, dcdUtil) => {
            if (!responseBody || error) {
                let err = error;

                if (messages.length > 0) {
                    err = iotcs.createError('Error on sending messages, will re-try some: ',
                                          error);

                    // Re-queue messages with retries remaining and which are
                    // GUARANTEED_DELIVERY.
                    messages.forEach(message => {
                        if ((message._properties.remainingRetries > 0) ||
                            (message._properties.reliability &&
                             (message._properties.reliability === 'GUARANTEED_DELIVERY')))
                        {
                            if (dcdUtil.dispatcher) {
                                message._properties.remainingRetries =
                                    message._properties.remainingRetries - 1;

                                dcdUtil.messageDispatcher.queue(message);
                            }
                        } else if (((message._properties.type === iotcs.message.Message.Type.ALERT) ||
                                    (message._properties._type === iotcs.message.Message.Type.DATA)) &&
                                   (message._properties.remainingRetries === 0) &&
                                   (message.onError))
                        {
                            message.onError(error);
                        }
                    });
                }

                if (errorCallback) {
                    errorCallback(messages, err);
                }

                return;
            }

            // Messages were successfully sent.
            let messagePersistenceImpl = iotcs.device.impl.MessagePersistenceImpl._getInstance();

            // Guaranteed delivery messages are the only ones persisted.  Now that they're
            // sent, we need delete them from message persistence.
            if (messagePersistenceImpl) {
                messages.forEach(message => {
                    if (message._properties.reliability ===
                        iotcs.message.Message.Reliability.GUARANTEED_DELIVERY)
                    {
                        messagePersistenceImpl._delete(messages);
                    }
                });
            }

            // Receive any messages coming in and add them to the receiveMessageQueue.
            if (Array.isArray(responseBody) && responseBody.length > 0) {
                let i;

                for (let i = 0; i < responseBody.length; i++) {
                    this._receiveMessageQueue.push(responseBody[i]);
                }
            } else if ((typeof responseBody === 'object') &&
                       (responseBody['x-min-acceptbytes'] !== 0))
            {
                let acceptBytes1 = this._maxAcceptBytes -
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(this._receiveMessageQueue));

                let bytes = parseInt(responseBody['x-min-acceptbytes']);

                if (bytes > this._maxAcceptBytes) {
                    iotcs.createError('The server has a request of ' + bytes +
                                    ' bytes for this client, which is too large for the ' +
                                    this._maxAcceptBytes +
                                    ' byte request buffer. Please restart the client with larger ' +
                                    'value for the ' +
                                    'iotcs.oracle.iot.client.device.requestBufferSize property.');
                } else if (bytes > acceptBytes1) {
                    iotcs.createError('The server has a request of ' + bytes +
                                    ' which cannot be sent because the ' + this._maxAcceptBytes +
                                    ' byte request buffer is filled with ' +
                                    (this._maxAcceptBytes - acceptBytes1) + ' of unprocessed requests.');
                }
            }

            if (deliveryCallback) {
                deliveryCallback(messages);
            }

        }, () => {
            this._sendReceiveMessages(messages, deliveryCallback, errorCallback, longPolling,
                                         timeout);
        }, this._dcdImpl, this);
    }

    set _storageObjectName(newName) {
        this._dcdImpl._storageObjectName = newName;
    }

    /**
     * Synchronizes the storage object by either uploading or downloading the object.
     *
     * @param {iotcs.StorageObject} storageObject - The storage object to sync.
     * @param {function} deliveryCallback - The function to call when
     * @param {function} errorCallback - The function to call when the sync fails.
     * @param {function} processCallback - The function to call when
     */
    _syncStorage(storageObject, deliveryCallback, errorCallback, processCallback, timeout) {
        if (!this._dcdImpl._isActivated()) {
            let error = iotcs.createError('Device not yet activated.');

            if (errorCallback) {
                errorCallback(storageObject, error);
            }

            return;
        }

        let self = this;

        this._dcdImpl._refreshNewStorageAuthToken(storageObject, () => {
            /** @type {string} */
            let storageUri = storageObject.getURI();

            if (storageObject._storageAuthenticationData) {
                storageUri = storageObject._storageAuthenticationData.storageUrl;
                storageObject._setURI(storageUri);
            } else if (!storageUri) {
                storageObject._setURI(this._dcdImpl._storageContainerUrl + "/" +
                                      storageObject.getName());
                /** @type {string} */
                storageUri = storageObject.getURI();
            }

            /** @type {URL} */
            let url = iotcs.impl.Platform._createUrl(storageUri);
            /** @type {string} */
            const name = iotcs.device.util.DirectlyConnectedDevice._getObjectNameFromUrl(url);
            /** @type {boolean} */
            const isClassicObjectStorage =
                  iotcs.device.util.DirectlyConnectedDevice._isPathClassicObjectStore(url.path);

            let options = {
                headers: {},
                host: url.host,
                hostname: url.hostname,
                path: url.path,
                port: url.port || iotcs.oracle.iot.client.storageCloudPort,
                protocol: url.protocol.slice(0, -1)
            };


            if (isClassicObjectStorage) {
                options.headers['X-Auth-Token'] = this._dcdImpl._storageAuthToken;
            } else {
                // Add OCI headers
                let headers = storageObject._storageAuthenticationData.headers;

                for (const key in headers) {
                    if ("(request-target)" !== key) {
                        options.headers[key] = headers[key];
                    }
                }
            }

            if (storageObject.getInputStream()) {
                // Upload file
                /** @type {Uint8Array} */
                storageObject._storageAuthenticationData = isClassicObjectStorage ?  null :
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                                   "PUT");

                // Upload file
                options.method = "PUT";

                if (storageObject.getLength() == -1) {
                    options.headers['Transfer-Encoding'] = "chunked";
                }

                options.headers['Content-Type'] = storageObject.getType();
                let encoding = storageObject.getEncoding();

                if (encoding) {
                    options.headers['Content-Encoding'] = encoding;
                }

                /** @type {object} */
                let metadata = storageObject.getCustomMetadata();

                if (metadata) {
                    for(const key in metadata) {
                        if (isClassicObjectStorage) {
                            options.headers['X-Object-Meta-' + key] = metadata[key];
                        } else {
                            options.headers['opc-meta-' + key] = metadata[key];
                        }
                    }
                }
            } else {
                // Download file
                /** @type {Uint8Array} */
                storageObject._storageAuthenticationData = isClassicObjectStorage ?  null : 
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                                   "GET");

                options.method = "GET";
            }

            iotcs.impl.Platform.Https._storageReq(options, storageObject, isClassicObjectStorage,
                                                  deliveryCallback, error =>
           {
               if (error) {
                   let exception = null;

                   try {
                       exception = JSON.parse(error.message);

                       if (exception.statusCode &&
                           (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                       {
                           this._dcdImpl._refreshClassicStorageAuthToken(() => {
                               this._syncStorage(storageObject, deliveryCallback, errorCallback,
                                                 processCallback, timeout);
                           });

                           return;
                       }
                   } catch (ignore) {
                       // Do nothing.
                   }

                   errorCallback(storageObject, error, -1);
               }
           }, processCallback);
        });
    }

    // Public functions
    /**
     * Activate the device.  The device will be activated on the server if necessary. When the device
     * is activated on the server.  The activation would tell the server the models that the device
     * implements.  Also the activation can generate additional authorization information that will
     * be stored in the TrustedAssetsStore and used for future authentication requests.  This can be
     * a time/resource consuming operation for some platforms.
     * <p>
     * If the device is already activated, this method will throw an exception.  The user should call
     * the isActivated() method prior to calling activate.
     *
     * @param {string[]} deviceModelUrns - An array of deviceModel URNs implemented by this directly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with this object
     *        but in the activated state.  If the activation is not successful then the object will
     *        be <code>null</code> and an error object is passed in the form callback(device, error)
     *        and the reason can be taken from error.message.
     *
     * @function activate
     * @ignore
     * @memberof DirectlyConnectedDevice
     */
    activate(deviceModelUrns, callback) {
        if (this.isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => {
            _mandatoryArg(urn, 'string');
        });

        let deviceModels = deviceModelUrns;
        deviceModels.push('urn:oracle:iot:dcd:capability:direct_activation');
        deviceModels.push('urn:oracle:iot:dcd:capability:device_policy');

        this._dcdImpl._activate(deviceModels, (activeDev, error) => {
            if (!activeDev || error) {
                callback(null, error);
                return;
            }

            callback(this);
        });
    }

    /**
     * This method will close this directly connected device (client) and all it's resources.  All
     * monitors required by the message dispatcher associated with this client will be stopped, if
     * there is one.
     *
     * @function close
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @see {@link iotcs.device.util.MessageDispatcher}
     */
    close() {
        this._dcdImpl._close();

        if (this._messageDispatcher) {
            this._messageDispatcher._stop();
        }

        if (this._storageDispatcher) {
            this._storageDispatcher._stop();
        }
    }

    //DJM: This shows up in the public docs under iotcs.device.util.DirectlyConnectedDevice, which I
    //     don't this is right.  I think it should be on the DCD, not a DCDUtil.
    /**
     * Create a new {@link iotcs.enterprise.StorageObject}.
     *
     * <p>
     * The createStorageObject method works in two modes:
     * </p><p>
     * </p><pre>
     * 1. client.createStorageObject(name, type) - Creates a new {@link iotcs.StorageObject} with
     *    the given object name and mime&ndash;type.
     *
     *    Parameters:
     *       {string} name - The unique name to be used to reference the content in storage.
     *       {?string} [type] - The mime-type of the content. If <code>type</code> is
     *                          <code>null</code> or <code>undefined</code>, the mime&ndash;type
     *                          defaults to {@link iotcs.StorageObject.MIME_TYPE}.
     *
     *    Returns:
     *       {iotcs.StorageObject} A StorageObject.
     *
     * 2. client.createStorageObject(uri, callback) - Creates a new {@link iotcs.StorageObject} from
     *    the URL for a named object in storage and returns it in a callback. Creates a new
     *    {@link iotcs.ExternalObject} if using an external URI.
     *
     * </p><pre>
     *    Parameters:
     *       {string} url - The URL of the object in the storage cloud.
     *       {function(storage, error)} callback - The callback called once getting storage data
     *                                             completes.
     * </pre>
     *
     * @param {string} arg1 - The first argument.
     * @param {string | function} arg2 - The second argument.
     * @returns {?iotcs.StorageObject} a {@link iotcs.StorageObject}, or <code>null</code>.
     *
     * @function createStorageObject
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     */
    createStorageObject(arg1, arg2) {
        _mandatoryArg(arg1, "string");

        if ((typeof arg2 === "string") || (arg2 === undefined) || arg2 === null) {
            // createStorageObject(name, type)

            let useVirtualStorageDirectories =
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);

            if (useVirtualStorageDirectories && (this._dcdImpl._tam.getEndpointId() !== null)) {
                this._storageObjectName = this._dcdImpl._tam.getEndpointId() + "/" + arg1;
            } else {
                this._storageObjectName = arg1;
            }

            let storage = new iotcs.StorageObject(null, this._storageObjectName, arg2, undefined, 
                                                undefined, undefined);

            storage._setDevice(this);
            return storage;
        } else {
            // createStorageObject(uri, callback)
            _mandatoryArg(arg2, "function");

            if (!this.isActivated()) {
                iotcs.error('Device not activated yet.');
                return null;
            }

            let storageUrlStr = arg1;
            let callback = arg2;
            let urlObj;

            try {
                /** @type {URL} */
                urlObj = iotcs.impl.Platform._createUrl(storageUrlStr);
            } catch(error) {
                throw new Error('Storage Cloud URL is an invalid URL.');
            }

            /** @type {string} */
            let name = iotcs.device.util.DirectlyConnectedDevice._getObjectNameFromUrl(urlObj);
            /** @type {boolean} */
            let isClassicObjectStorage =
                iotcs.device.util.DirectlyConnectedDevice._isPathClassicObjectStore(urlObj.path);
            /** @type {Uint8Array} */
            let authenticationRequestBody = isClassicObjectStorage ? null :
                iotcs.device.impl.DirectlyConnectedDeviceImpl._createAuthenticationRequestBody(name,
                                                                                               'HEAD');

            if (!storageUrlStr.startsWith(this._dcdImpl._storageAuthenticationData.storageContainerUrl)) {
                callback(null, new new Error('Storage container URL does not match.'));
                return null;
            }

            var options = {
                agent: false,
                headers: {},
                host: urlObj.host,
                hostname: urlObj.hostname,
                method: "HEAD",
                path: urlObj.path,
                port: urlObj.port || iotcs.oracle.iot.client.storageCloudPort,
                protocol: urlObj.protocol,
                rejectUnauthorized: true
            };

            if (isClassicObjectStorage) {
                options.headers['X-Auth-Token'] =
                    this._dcdImpl._storageAuthenticationData.authToken;
            } else {
                /** @type {object} */
                let headers = this._dcdImpl._storageAuthenticationData.headers;

                for(let key in headers) {
                    options.headers[key] = headers[key];
                }
            }

            iotcs.impl.Platform._debug("Request: " + new Date().getTime());
            iotcs.impl.Platform._debug(options.path);
            iotcs.impl.Platform._debug(options);

            let protocol = options.protocol.indexOf("https") !== -1 ?
                require('https') : require('http');

            let self = this;

            let req = protocol.request(options, function (response) {
                iotcs.impl.Platform._debug();
                iotcs.impl.Platform._debug("Response: " + response.statusCode + ' ' +
                                           response.statusMessage);
                iotcs.impl.Platform._debug(response.headers);

                let body = '';

                response.on('data', function (d) {
                    body += d;
                });

                response.on('end', function () {
                    if (response.statusCode === iotcs.StatusCode.OK) {
                        let type = response.headers["content-type"];
                        let encoding = response.headers["content-encoding"];
                        let date = new Date(Date.parse(response.headers["last-modified"]));
                        let len = parseInt(response.headers["content-length"]);
                        let storage = new iotcs.StorageObject(storageUrlStr, name, type, encoding,
                                                              date, len);
                        storage._setDevice(self);
                        callback(storage);
                    } else if (response.statusCode === iotcs.StatusCode.UNAUTHORIZED) {
                        this._dcdImpl._refreshNewStorageAuthToken(function () {
                            self._createStorageObject(storageUrlStr, callback);
                        });
                    } else {
                        let e = new Error(JSON.stringify({
                            statusCode: response.statusCode,
                            statusMessage: (response.statusMessage ? response.statusMessage : null),
                            body: body
                        }));

                        callback(null, e);
                    }
                });
            });

            req.on('abort', function (error) {
                callback(null, error);
            });

            req.on('error', function (error) {
                callback(null, error);
            });

            req.on('timeout', function () {
                callback(null, new Error('Connection timeout.'));
            });

            req.end();
        }
    }

    /**
     * Get the device model for the specified device model URN.
     *
     * @function getDeviceModel
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @param {string} deviceModelUrn - The URN of the device model.
     * @param {function} callback - The callback function.  This function is called with the
     *        following argument: a deviceModel object holding full description e.g. <code>{ name:"",
     *        description:"", fields:[...], created:date, isProtected:boolean, lastModified:date
     *        ... }</code>.  If an error occurs the deviceModel object is <code>null</code> and an
     *        error object is passed: callback(deviceModel, error) and the reason can be taken from
     *        the error.message.
     */
    getDeviceModel(deviceModelUrn, callback) {
        new iotcs.device.impl.DeviceModelFactory()._getDeviceModel(this, deviceModelUrn,
                                                                           callback);
    }

    /**
     * Return the logical-endpoint identifier of this directly-connected device.  The logical-endpoint
     * identifier is assigned by the server as part of the activation process.
     *
     * @function getEndpointId
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @returns {string} The logical-endpoint identifier of this directly-connected device.
     */
    getEndpointId() {
        return this._dcdImpl._getEndpointId();
    }

    /**
     * This will return the directly connected device state.
     *
     * @function isActivated
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        return this._dcdImpl._isActivated();
    }

    /**
     * Offer a message to be queued. Depending on the policies, if any, the message will be queued if it
     * is possible to do so without violating capacity restrictions.
     *
     * @function offer
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @param {iotcs.message.Message[]} messages - The message to be offered.
     * @throws Error - If all the messages cannot be added to the queue.
     * @throws Error - If <code>messages</code> is <code>null</code> or empty.
     */
    offer(messages) {
        if (this.isActivated()) {
            // We need to distinguish between an empty list of messages
            // that has been passed in versus an empty list of message
            // that has resulted from policies being applied.
            // So if the list we receive is empty, let send handle it.
            if (!messages || (messages.size === 0)) {
                this.send(messages, (messages, error) => {
                    if (error) {
                        console.log('Error sending offered messages: ' + error);
                    }
                });
            }

            /** @type {PersistenceStore} */
            const persistenceStore = iotcs.device.impl.PersistenceStoreManager._get(this.getEndpointId());
            /** @type {MessagePolicyImpl} */
            let messagingPolicyImpl;
            /** @type {object} */
            const mpiObj = persistenceStore._getOpaque('MessagingPolicyImpl', null);

            if (!mpiObj) {
                messagingPolicyImpl = new iotcs.device.impl.MessagingPolicyImpl(this);

                persistenceStore
                    ._openTransaction()
                    ._putOpaque('MessagingPolicyImpl', messagingPolicyImpl)
                    ._commit();

                /** @type {DevicePolicyManager} */
                const devicePolicyManager =
                      iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this.getEndpointId());
                devicePolicyManager._addChangeListener(messagingPolicyImpl);
            } else {
                messagingPolicyImpl = mpiObj;
            }

            let self = this;

            // Now we know here that messages list is not empty.
            // If the message list is not empty after applying policies,
            // then send the messages. If it is empty after applying the
            // policies, then there is nothing to send because messages
            // were filtered, or are aggregating values (e.g., mean policy).
            /** @type {Set<Message>} */
            messages.forEach(message => {
                /** @type {Message[]} */
                messagingPolicyImpl._applyPolicies(message).then(messagesFromPolicies => {
                    if (messagesFromPolicies) {
                        self.send(messagesFromPolicies, (messages, error) => {
                            if (error) {
                                console.log('Error sending offered messages: ' + error);
                            }
                        });
                    }
                });
            });
        } else {
            throw new Error("Device not activated.");
        }
    }

    /**
     * This method is used for retrieving messages.  The DirectlyConnectedDevice uses an internal buffer
     * for the messages received that has a size of 4192 bytes.  When this method is called and there is
     * at least one message in the buffer, the first message from the buffer is retrieved.  If no
     * message is in the buffer, a force send of an empty message is tried so to see if any messages are
     * pending on the server side for the device and if there are, the buffer will be filled with them
     * and the first message retrieved.
     *
     * @function receive
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     *
     * @param {number} [timeout] - The forcing for retrieving the pending messages will be done this
     *        amount of time.
     * @param {function} callback - The callback function.  This function is called with the first
     *        message received or null is no message is received in the timeout period.
     */
    receive(timeout, callback) {
        if (!this.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        if (typeof  timeout === 'function') {
            callback = timeout;
        } else {
            _optionalArg(timeout, 'number');
        }

        _mandatoryArg(callback, 'function');

        let message = this._getReceivedMessage();

        if (message) {
            callback(message);
        } else {
            let self = this;
            let startTime = Date.now();
            let monitor = null;
            let handleReceivedMessages = () => {
                message = this._getReceivedMessage();

                if (message || (timeout && (Date.now() > (startTime + timeout)))) {
                    if (monitor) {
                        monitor.stop();
                    }

                    callback(message);
                }
            };

            let handleSendReceiveMessages = () => {
                if (this._dcdImpl._refreshing) {
                    return;
                }

                this._sendReceiveMessages([], handleReceivedMessages, handleReceivedMessages);
            };

            if (this._receiver) {
                monitor = new iotcs.impl.Monitor(handleReceivedMessages);
                monitor.start();
            } else if (iotcs.oracle.iot.client.device.disableLongPolling ||
                       self._dcdImpl._mqttController)
            {
                monitor = new iotcs.impl.Monitor(handleSendReceiveMessages);
                monitor.start();
            } else {
                this._sendReceiveMessages([], handleReceivedMessages, handleReceivedMessages, true,
                    (typeof timeout === 'number' ? Math.floor(timeout/1000) : null));
            }
        }
    }

    /**
     * This method is used for sending messages to the server.  If the directly connected device is
     * not activated an exception will be thrown. If the device is not yet authenticated the method
     * will try first to authenticate the device and then send the messages.
     *
     * @memberof iotcs.device.util.DirectlyConnectedDevice
     * @function send
     *
     * @param {iotcs.message.Message[]} messages - An array of the messages to be sent.
     * @param {function} callback - The callback function. This function is called with the messages
     *        that have been sent and in case of error the actual error from sending as the second
     *        parameter.
     */
    send(messages, callback) {
        if (!this.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        _mandatoryArg(messages, 'array');
        _mandatoryArg(callback, 'function');

        messages.forEach(message => {
            _mandatoryArg(message, iotcs.message.Message);
        });

        this._sendReceiveMessages(messages, callback, callback);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/FormulaParser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.FormulaParser = class {
    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} left
     * @param {iotcs.device.impl.FormulaParserNode} right
     * @return {number}
     */
    static _comparePrecedence(left, right) {
        return iotcs.device.impl.FormulaParserOperation._getPrecedence(left._getOperation()) -
            iotcs.device.impl.FormulaParserOperation._getPrecedence(right._getOperation());
    }

    static _dump(node) {
        if (!node) {
            return null;
        }

        if (node instanceof iotcs.device.impl.FormulaParserTerminal) {
            let s = node._getValue();

            if (node.type === iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE) {
                s = "$(".concat(s).concat(")");
            } else if (node.type === iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE) {
                s = "$(".concat(s).concat(")");
            }

            return s;
        }

        const lhs = iotcs.device.impl.FormulaParser._dump(node.getLeftHandSide());
        const rhs = iotcs.device.impl.FormulaParser._dump(node.getRightHandSide());

        const operation = node._getOperation();
        return "["+operation + "|" + lhs + "|" + rhs + "]";
    }

    //
    // additiveExpression
    //     : multiplicativeExpression (PLUS multiplicativeExpression | MINUS multiplicativeExpression )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<Token>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseAdditiveExpression(stack, tokens, formula, index) {
        if (index >= tokens.size) {
            return tokens.size();
        }

        index = iotcs.device.impl.FormulaParser._parseMultiplicativeExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
        case iotcs.device.impl.FormulaParserToken.Type.PLUS:
            lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.PLUS, stack.pop());
                index += 1;
                break;
        case iotcs.device.impl.FormulaParserToken.Type.MINUS:
            lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MINUS, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // args
    //     : conditionalOrExpression
    //     | conditionalOrExpression COMMA args
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseArgs(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        let previous = null;

        while (index < tokens.size) {
            index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
            let arg = previous === null ? stack.peek() : stack.pop();

            if (previous !== null) {
                previous.setRightHandSide(arg);
            }

            previous = arg;
            const tokensAry = Array.from(tokens);
            const current = tokensAry[index];

            switch (current.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.COMMA:
                    index += 1;
                    break;
                default:
                    return index;
            }
        }

        return index;
    }


//
    // brackettedExpression
    //     : LPAREN conditionalOrExpression RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseBrackettedExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.LPAREN: {
                index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula,
                    index + 1);

                let current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + " expected RPAREN");
                }

                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GROUP, stack.pop()));
                index += 1; // consume RPAREN
            }
        }

        return index;
    }

    //
    // conditionalAndExpression
    //     : valueLogical ( AND valueLogical )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * Takes a formula as a string along with the tokens present in the formula
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseConditionalAndExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseValueLogical(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.AND:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.AND, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalAndExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }


    // conditionalOrExpression
    //     : conditionalAndExpression ( OR conditionalAndExpression )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseConditionalOrExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalAndExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.OR:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.OR, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // expressionElement
    //     : IDENT | NUMBER | propertyRef
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseExpressionElement(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserTerminal.Type.IDENT: {
                const value = formula.substring(token.getPos(), token.getPos() + token.getLength());
                stack.push(new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.IDENT, value));
                index += 1; // consume IDENT
                break;
            }
            case iotcs.device.impl.FormulaParserTerminal.Type.NUMBER: {
                const value = formula.substring(token.getPos(), token.getPos() + token.getLength());
                stack.push(new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.NUMBER, value));
                index += 1; // consume NUMBER
                break;
            }
            default: {
                index = iotcs.device.impl.FormulaParser._parsePropertyRef(stack, tokens, formula, index);
                break;
            }
        }

        return index;
    }

    // formula
    //    : numericExpression
    //    | ternaryExpression
    //    ;
    //
    // returns the root of the AST
    /**
     * @param {Set<iotcs.device.impl.FormulaParserToken>} tokens
     * @param {string} formula
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    static _parseFormula(tokens, formula) {
        /** @type {Stack<Node>} */
        const stack = new Stack();
        let index = -1;

        try {
            index = iotcs.device.impl.FormulaParser._parseNumericExpression(stack, tokens, formula, 0);
        } catch (error) {
            // drop through = try as conditional expression
        }

        if (index < tokens.size) {
            stack.clear();
            index = iotcs.device.impl.FormulaParser._parseTernaryExpression(stack, tokens, formula, 0);
        }

        let tokensAry = Array.from(tokens);

        if (index < tokens.size) {
            /** @type {iotcs.device.impl.FormulaParserToken} */
            const lastToken = tokensAry[index];
            throw new Error('Formula: parser bailed @ ' + lastToken.pos);
        }

        return stack.get(0);
    }

    //
    // functionElement
    //     : FUNCTION (args)? RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseFunctionElement(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.FUNCTION: {
                const next = iotcs.device.impl.FormulaParser._peekSet(tokens, index + 1);
                // token.getLength()-1 to strip off LPAREN
                const value = formula.substring(token.getPos(), token.getPos() +
                    token.getLength() - 1);

                // FUNCTION operation has function name on LHS, args chaining from RHS to RHS
                const func = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.FUNCTION,
                    new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.IDENT, value));

                if (next.getType() === iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    // no-arg function
                } else {
                    // FUNCTION arg [, arg]* )
                    index = iotcs.device.impl.FormulaParser._parseArgs(stack, tokens, formula, index + 1);
                    func.setRightHandSide(stack.pop());
                    let current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                    if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                        throw new TypeError("term: Found " + current.getType() + " @ " +
                            current.getPos() + ". Expected RPAREN");
                    }

                    index += 1;
                }

                stack.push(func);
                index += 1; // consume RPAREN
                break;
            }
        }

        return index;
    }


    //
    // multiplicativeExpression
    //     : exponentiationExpression (MUL exponentiationExpression | DIV exponentiationExpression |
    // MOD exponentiationExpression)*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseMultiplicativeExpression(stack, tokens, formula, index) {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseUnaryExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.MUL:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MUL, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.DIV:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.DIV, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.MOD:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MOD, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseMultiplicativeExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // numericExpression
    //     : additiveExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseNumericExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        return iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index);
    }

    //
    // primaryExpression
    //     : brackettedExpression
    //     | functionElement
    //     | expressionElement
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parsePrimaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        let newIndex = iotcs.device.impl.FormulaParser._parseBrakettedExpression(stack, tokens, formula, index);

        if (newIndex === index) {
            newIndex = iotcs.device.impl.FormulaParser._parseFunctionElement(stack, tokens, formula, index);
            if (newIndex === index) {
                newIndex = iotcs.device.impl.FormulaParser._parseExpressionElement(stack, tokens, formula, index);
            }
        }

        if (newIndex === index) {
            throw new TypeError(
                "_parsePrimaryExpression: expected [brackettedExpression|functionElement|expressionElement]"
            );
        }

        return newIndex;
    }

    //
    // propertyRef
    //     : DOLLAR? ATTRIBUTE IDENT RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parsePropertyRef(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE:
            case iotcs.device.impl.FormulaParserToken.Type.DOLLAR: {
                let current = token;

                // Handle attribute, which is $? $( IDENT )
                let dollarCount = 0;

                while (current.getType() === iotcs.device.impl.FormulaParserToken.Type.DOLLAR) {
                    dollarCount += 1;

                    if (dollarCount > 1) {
                        throw new TypeError("term: " + current.getType() + " @ " +
                            current.getPos() + " not expected");
                    }

                    index += 1;
                    current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);
                }

                const attrType = iotcs.device.impl.FormulaParserTerminal._getTypeValue(dollarCount);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected ATTRIBUTE");
                }

                index += 1;
                current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected IDENT");}

                const value = formula.substring(current.getPos(), current.getPos() +
                    current.getLength());

                index += 1;
                current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected RPAREN");
                }

                stack.push(new iotcs.device.impl.FormulaParserTerminal(attrType, value));
                index += 1; // consume RPAREN
                break;
            }
        }

        return index;
    }


    //
    // relationalExpression
    //     : numericExpression (EQ numericExpression | NEQ numericExpression | LT numericExpression | GT numericExpression | LTE numericExpression | GTE numericExpression )?
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseRelationalExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseNumericExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.EQ:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.EQ, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.NEQ:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.NEQ, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.LT:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.LT, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.LTE:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.LTE, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.GT:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GT, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.GTE:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GTE, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseRelationalExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    // ternaryExpression
    //     : conditionalOrExpression QUESTION_MARK additiveExpression COLON additiveExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseTernaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
        let tokensAry = Array.from(tokens);
        let token = tokensAry[index];

        if (token.getType() !== iotcs.device.impl.FormulaParserToken.Type.QUESTION_MARK) {
            throw new TypeError("_parseTernaryExpression: found " + token +
                ", expected QUESTION_MARK");
        }

        let ternary = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.TERNARY, stack.pop());
        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index + 1);
        tokensAry = Array.from(tokens);
        token = tokensAry[index];

        if (token.getType() !== iotcs.device.impl.FormulaParserToken.Type.COLON) {
            throw new TypeError("_parseTernaryExpression: found " + token + ", expected COLON");
        }

        let alternatives = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.ALTERNATIVE, stack.pop());
        ternary.setRightHandSide(alternatives);
        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index+1);
        alternatives.setRightHandSide(stack.pop());
        stack.push(ternary);

        return index;
    }

    //
    // unaryExpression
    //     : NOT primaryExpression
    //     | PLUS primaryExpression
    //     | MINUS primaryExpression
    //     | primaryExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseUnaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.NOT: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.NOT, stack.pop()));
                break;
            }
            case iotcs.device.impl.FormulaParserToken.Type.PLUS: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.UNARY_PLUS, stack.pop()));
                break;
            }
            case iotcs.device.impl.FormulaParserToken.Type.MINUS: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.UNARY_MINUS, stack.pop()));
                break;
            }
            default: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index);
                break;
            }
        }

        return index;
    }

    //
    // valueLogical
    //     : relationalExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseValueLogical(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        return iotcs.device.impl.FormulaParser._parseRelationalExpression(stack, tokens, formula, index);
    }

    /**
     *
     * @param tokens Set<iotcs.device.impl.FormulaParserToken>
     * @param offset int
     */
    static _peekSet(tokens, offset) {
        let index = 0 <= offset && offset <= tokens.size - 1 ? offset : tokens.size - 1;
        const tokensAry = Array.from(tokens);
        return tokensAry[index];
    }

    /**
     *
     * @param {string} str
     * @param {number} offset
     * @return {string}
     */
    static _peekString(str, offset) {
        return (offset < str.length) ? str.charAt(offset) : '\0';
    }

    // left hand side needs to have higher precedence than right hand side
    // so that post-fix traversal does higher precedence operations first.
    // The swap on compare == 0 ensures the remaining operations are left-to-right.
    /**
     * @param lhs (Node)
     * @param rhs (Node)
     */
    static _prioritized(lhs, rhs) {
        if (rhs._getOperation() !== iotcs.device.impl.FormulaParserOperation.Op.TERMINAL) {
            let c = iotcs.device.impl.FormulaParser._comparePrecedence(lhs, rhs);

            if (c === 0) {
                lhs.setRightHandSide(rhs.getLeftHandSide());
                const rightHandSide = rhs.getRightHandSide();
                rhs.setLeftHandSide(lhs);
                rhs.setRightHandSide(rightHandSide);
                return rhs;
            } else if (c > 0) {
                const leftHandSide = rhs.getLeftHandSide();
                rhs.setLeftHandSide(lhs);
                lhs.setRightHandSide(leftHandSide);
                return lhs;
            } else {
                lhs.setRightHandSide(rhs);
                return lhs;
            }
        } else {
            lhs.setRightHandSide(rhs);
            return lhs;
        }
    }

    /**
     * Takes a formula as a string and returns the Set of tokens in the formula.
     *
     * @param {string} formula
     * @return {Set<iotcs.device.impl.FormulaParserToken>}
     */
    static _tokenize(formula) {
        const tokens = new Set();
        let pos = 0;
        let tokenType = null;

        for (let i = 0; i < formula.length; ++i) {
            let type = tokenType;
            let length = i - pos;
            const ch = formula.charAt(i);

            switch (ch) {
                case '(':
                    type = iotcs.device.impl.FormulaParserToken.Type.LPAREN;
                    break;
                case ')':
                    type = iotcs.device.impl.FormulaParserToken.Type.RPAREN;
                    break;
                case ',':
                    type = iotcs.device.impl.FormulaParserToken.Type.COMMA;
                    break;
                case '?':
                    type = iotcs.device.impl.FormulaParserToken.Type.QUESTION_MARK;
                    break;
                case ':':
                    type = iotcs.device.impl.FormulaParserToken.Type.COLON;
                    break;
                case '+':
                    type = iotcs.device.impl.FormulaParserToken.Type.PLUS;
                    break;
                case '-':
                    if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                        type = iotcs.device.impl.FormulaParserToken.Type.MINUS;
                    }

                    break;
                case '*':
                    type = iotcs.device.impl.FormulaParserToken.Type.MUL;
                    break;
                case '/':
                    type = iotcs.device.impl.FormulaParserToken.Type.DIV;
                    break;
                case '%':
                    type = iotcs.device.impl.FormulaParserToken.Type.MOD;
                    break;
                case '=': {
                    type = iotcs.device.impl.FormulaParserToken.Type.EQ;
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    // Be forgiving of '=='.
                    if (peekChar === '=') {
                        i += 1;
                    }

                    break;
                }
                case '!': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.NEQ;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.NOT;
                    }

                    break;
                }
                case '>': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.GTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.GT;
                    }

                    break;
                }
                case '<': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.LTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.LT;
                    }

                    break;
                }
                case '|': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '|') {
                        type = iotcs.device.impl.FormulaParserToken.Type.OR;
                        i += 1;
                    }

                    break;
                }
                case '&': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '&') {
                        type = iotcs.device.impl.FormulaParserToken.Type.AND;
                        i += 1;
                    }

                    break;
                }
                // The $ case needs to be in double quotes otherwise the build will fail.
                case "$": {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '(') {
                        type = iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.DOLLAR;
                    }

                    break;
                }
               default:
                    if (ch === ' ') {
                        type = iotcs.device.impl.FormulaParserToken.Type.WS;
                    } else if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                        if (Number.isInteger(parseInt(ch))) {
                            type = iotcs.device.impl.FormulaParserToken.Type.NUMBER;
                        } else if (ch === '.') {
                            // [0-9]+|[0-9]*"."[0-9]+
                            if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.NUMBER) {
                                let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                                if (Number.isInteger(parseInt(peekChar))) {
                                    type = iotcs.device.impl.FormulaParserToken.Type.NUMBER;
                                    i += 1;
                                } else {
                                    throw new TypeError("Found '" + peekChar + "' @ " + i + 1 +
                                        ": expected [0-9]");
                                }
                            }
                        } else {
                            type = iotcs.device.impl.FormulaParserToken.Type.IDENT;
                        }
                    }

                   break;
            }

            // Add previous token when lexer hits a new token.
            if (tokenType !== type) {
                if (tokenType === iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                    const token = formula.substring(pos, pos+length);

                    if ("AND" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.AND;
                    } else if ("OR" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.OR;
                    } else if ("NOT" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.NOT;
                    } else if (type === iotcs.device.impl.FormulaParserToken.Type.LPAREN) {
                        tokenType = type = iotcs.device.impl.FormulaParserToken.Type.FUNCTION;
                        continue;
                    }
                }

                // tokenType should only be null the first time through
                if (tokenType) {
                    if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.WS) {
                        tokens.add(new iotcs.device.impl.FormulaParserToken(tokenType, pos, length));
                    }

                    pos += length;
                }

                // Previous token is now current token.
                tokenType = type;
            }
        }

        // Add the last token.
        if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.WS) {
            tokens.add(new iotcs.device.impl.FormulaParserToken(tokenType, pos, formula.length - pos));
        }

        return tokens;
    }

    constructor(height, width) {
        this._height = height;
        this._width = width;
    }
};

iotcs.device.impl.FormulaParserNode = class {
    /**
     *
     * @param {number} operation
     * @param {iotcs.device.impl.FormulaParserNode} leftHandSide
     */
    constructor(operation, leftHandSide) {
        this._operation = operation;
        this._leftHandSide = leftHandSide;
        this._rightHandSide = null;
        this._type = 'node';
        Object.freeze(this._type);
    }

    // Private/protected functions
    /**
     * @param {object} obj
     * @return {boolean} {@code true} if they are equal.
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (obj === null || typeof obj !== typeof this)  {
            return false;
        }

        let lhsEquals = this._leftHandSide === obj.leftHandSide;

        if (this._leftHandSide !== null ? !lhsEquals : obj.leftHandSide !== null)
        {
            return false;
        }

        return this._rightHandSide !== null ? this._rightHandSide === obj.rightHandSide :
            obj.rightHandSide === null;
    }

    /**
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    _getLeftHandSide() {
        return this._leftHandSide;
    }

    /**
     *
     * @return {iotcs.device.impl.FormulaParserOperation}
     */
    _getOperation() {
        return this._operation;
    }

    /**
     *
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    _getRightHandSide() {
        return this._rightHandSide;
    }

    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} leftHandSide
     */
    _setLeftHandSide(leftHandSide) {
        this._leftHandSide = leftHandSide;
    }

    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} rightHandSide
     */
    _setRightHandSide(rightHandSide) {
        this._rightHandSide = rightHandSide;
    }
};

iotcs.device.impl.FormulaParserOperation = class {
    /**
     *
     * @param {string} operation
     * @return {number} the precedence of this operation.
     */
    static _getPrecedence(operation) {
        switch(operation) {
            case iotcs.device.impl.FormulaParserOperation.Op.GROUP:
            case iotcs.device.impl.FormulaParserOperation.Op.TERMINAL:
                return -1;
            case iotcs.device.impl.FormulaParserOperation.Op.ALTERNATIVE:
            case iotcs.device.impl.FormulaParserOperation.Op.TERNARY:
                return 0;
            case iotcs.device.impl.FormulaParserOperation.Op.AND:
            case iotcs.device.impl.FormulaParserOperation.Op.OR:
                return 1;
            case iotcs.device.impl.FormulaParserOperation.Op.EQ:
            case iotcs.device.impl.FormulaParserOperation.Op.GT:
            case iotcs.device.impl.FormulaParserOperation.Op.GTE:
            case iotcs.device.impl.FormulaParserOperation.Op.LT:
            case iotcs.device.impl.FormulaParserOperation.Op.LTE:
            case iotcs.device.impl.FormulaParserOperation.Op.NEQ:
                return 2;
            case iotcs.device.impl.FormulaParserOperation.Op.MINUS:
            case iotcs.device.impl.FormulaParserOperation.Op.PLUS:
                return 3;
            case iotcs.device.impl.FormulaParserOperation.Op.DIV:
            case iotcs.device.impl.FormulaParserOperation.Op.MOD:
            case iotcs.device.impl.FormulaParserOperation.Op.MUL:
                return 4;
            case iotcs.device.impl.FormulaParserOperation.Op.FUNCTION:
            case iotcs.device.impl.FormulaParserOperation.Op.NOT:
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_MINUS:
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_PLUS:
                return 6;
        }
    }
};

iotcs.device.impl.FormulaParserOperation.Op = {
    // This is for the alternatives part of ?:, RHS is true choice, LHS is false choice.
    ALTERNATIVE: 'ALTERNATIVE',
    AND: 'AND',
    DIV: 'DIV',
    EQ: 'EQ',
    FUNCTION: 'FUNCTION', // function LHS is function name. args, if any, chain to rhs
    GROUP: 'GROUP', // group LHS is the enclosed arithmetic expression
    GT: 'GT',
    GTE: 'GTE',
    LT: 'LT',
    LTE: 'LTE',
    MINUS: 'MINUS',
    MOD: 'MOD',
    MUL: 'MUL',
    NEQ: 'NEQ',
    NOT: 'NOT', // ! has only LHS, no RHS. LHS is an equality expression or numeric expression
    OR: 'OR',
    PLUS: 'PLUS',
    TERMINAL: 'TERMINAL', // terminal is a number or attribute, LHS is a Terminal, no RHS
    TERNARY: 'TERNARY', // this is for the logical part of ?:, LHS is the logical, RHS is the alternatives
    UNARY_MINUS: 'UNARY_MINUS',
    UNARY_PLUS: 'UNARY_PLUS'
};

iotcs.device.impl.FormulaParserTerminal = class extends iotcs.device.impl.FormulaParserNode {
    /**
     *
     * @param {number} num
     * @return {string} The FormulaParserTerminal.Type, or <code>null</code> if the type is invalid.
     */
    static _getTypeValue(num) {
        switch(num) {
            case 0:
                return iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE;
            case 1:
                return iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE;
            case 2:
                return iotcs.device.impl.FormulaParserTerminal.Type.NUMBER;
            case 3:
                return iotcs.device.impl.FormulaParserTerminal.Type.IDENT;
            default:
                iotcs.error('Invalid FormulaParserTerminal type.');
                return null;
        }
    }

    /**
     *
     * @param {string} type
     * @param {string} value
     */
    constructor(type, value) {
        super(iotcs.device.impl.FormulaParserOperation.Op.TERMINAL, null);
        this._type = type;
        Object.freeze(this._type);
        this._value = value;
    }

    /**
     * @param {object} obj
     * @return {boolean} {@code true} if the objects are equal.
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (!obj || typeof obj !== typeof this) {
            return false;
        }

        if (this._type !== obj.type) {
            return false;
        }

        return !(!this._value ? this._value !== obj.value : obj.value);
    }

    /**
     * @return {string}
     */
    _getValue() {
        return this._value;
    }
};

iotcs.device.impl.FormulaParserTerminal.Type = {
    TYPE: 'TERMINAL',
    IN_PROCESS_ATTRIBUTE: 'IN_PROCESS_ATTRIBUTE',
    CURRENT_ATTRIBUTE: 'CURRENT_ATTRIBUTE',
    NUMBER: 'NUMBER',
    IDENT: 'IDENT',
};

iotcs.device.impl.FormulaParserToken = class {
    /**
     *
     * @param {iotcs.device.impl.FormulaParserToken.Type} type
     * @param {number} pos
     * @param {number} length
     */
    constructor(type, pos, length) {
        this._type = type;
        Object.freeze(this._type);
        this._pos = pos;
        this._length = length;
    }

    /**
     * @return {iotcs.device.impl.FormulaParserToken.Type}
     */
    getType() {
        return this._type;
    }

    /**
     * @return {number}
     */
    getPos() {
        return this._pos;
    }

    /**
     * @return {number}
     */
    getLength() {
        return this._length;
    }

    /**
     * @param {object} obj
     * @return {boolean}
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (!obj || typeof obj !== typeof this) {
            return false;
        }

        return this._type === obj.type && this._pos === obj.pos && this._length === obj.length;
    }
};

// Token types
// DJM: Make these "private".
iotcs.device.impl.FormulaParserToken.Type = {
    AND: 'AND',    // &&
    COLON: 'COLON',  // :
    COMMA: 'COMMA',  // ,
    DIV: 'DIV',    // \
    DOLLAR: 'DOLLAR', // $
    EQ: 'EQ',     // =
    FUNCTION: 'FUNCTION', // IDENT '('
    ATTRIBUTE: 'ATTRIBUTE', // '$(' IDENT ')'
    GT: 'GT',     // >
    GTE: 'GTE',    // >=
    IDENT: 'IDENT',  // [_a-zA-Z]+ [_a-zA-Z0-9\-]*
    LPAREN: 'LPARN', // (
    LT: 'LT',     // <
    LTE: 'LTE',    // <=
    MINUS: 'MINUS',  // -
    MOD: 'MOD',    // %
    MUL: 'MUL',    // *
    NEQ: 'NEQ',    // !=
    NOT: 'NOT',    // !
    NUMBER: 'NUMBER', // [0-9]+|[0-9]*"."[0-9]+
    OR: 'OR',     // ||
    PLUS: 'PLUS',   // +
    QUESTION_MARK: 'QUESTION_MARK',
    RPAREN: 'RPAREN', // )
    WS: 'WS'     // whitespace is not significant and is consumed
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/GatewayDeviceUtil.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This represents a GatewayDevice in the Messaging API.  It has the exact same specifications and
 * capabilities as a directly connected device from the Messaging API and additionally it has the
 * capability to register indirectly connected devices.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.device.util.GatewayDevice
 * @class iotcs.device.util.GatewayDevice
 * @extends iotcs.device.util.DirectlyConnectedDevice
 * @memberof iotcs.device.util
 */
iotcs.device.util.GatewayDevice = class extends iotcs.device.util.DirectlyConnectedDevice {
    constructor(taStoreFile, taStorePassword) {
        super(taStoreFile, taStorePassword, true);
    }

    /**
     * Activate the device.  The device will be activated on the server if necessary. When the device
     * is activated on the server.  The activation would tell the server the models that the device
     * implements.  Also the activation can generate additional authorization information that will
     * be stored in the TrustedAssetsStore and used for future authentication requests.  This can be
     * a time/resource consuming operation for some platforms.
     * <p>
     * If the device is already activated, this method will throw an exception.  The user should call
     * the isActivated() method prior to calling activate.
     *
     * @function activate
     * @memberof iotcs.device.util.GatewayDevice
     *
     * @param {string[]} deviceModelUrns - An array of deviceModel URNs implemented by this directly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with this object
     *        but in the activated state.  If the activation is not successful then the object will
     *        be null and an error object is passed in the form callback(device, error) and the
     *        reason can be taken from error.message.
     */
    activate(deviceModelUrns, callback) {
        if (this.isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => _mandatoryArg(urn, 'string'));

        let deviceModels = deviceModelUrns;
        deviceModels.push('urn:oracle:iot:dcd:capability:direct_activation');
        deviceModels.push('urn:oracle:iot:dcd:capability:indirect_activation');
        deviceModels.push('urn:oracle:iot:dcd:capability:device_policy');

        this._dcdImpl._activate(deviceModels, (activeDev, error) => {
            if (!activeDev || error) {
                callback(null, error);
                return;
            }

            callback(this);
        });
    }

    /**
     * Register an indirectly-connected device with the cloud service and specify whether
     * the gateway device is required to have the appropriate credentials for activating
     * the indirectly-connected device.
     *
     * The <code>restricted</code> parameter controls whether or not the client
     * library is <em>required</em> to supply credentials for activating
     * the indirectly-connected device. The client library will
     * <em>always</em> supply credentials for an indirectly-connected
     * device whose trusted assets have been provisioned to the client.
     * If, however, the trusted assets of the indirectly-connected device
     * have not been provisioned to the client, the client library can
     * create credentials that attempt to restrict the indirectly connected
     * device to this gateway device.
     *
     * Pass <code>true</code> for the <code>restricted</code> parameter
     * to ensure the indirectly-connected device cannot be activated
     * by this gateway device without presenting credentials. If <code>restricted</code>
     * is <code>true</code>, the client library will provide credentials to the server.
     * The server will reject the activation request if the indirectly connected
     * device is not allowed to roam to this gateway device.
     *
     * Pass <code>false</code> to allow the indirectly-connected device to be activated
     * without presenting credentials if the trusted assets of the
     * indirectly-connected device have not been provisioned to the client.
     * If <code>restricted</code> is <code>false</code>, the client library will provide
     * credentials if, and only if, the credentials have been provisioned to the
     * client. The server will reject the activation if credentials are required
     * but not supplied, or if the provisioned credentials do not allow the
     * indirectly connected device to roam to this gateway device.
     *
     * The <code>hardwareId</code> is a unique identifier within the cloud service
     * instance and may not be <code>null</code>. If one is not present for the device,
     * it should be generated based on other metadata such as: model, manufacturer,
     * serial number, etc.
     *
     * The <code>metaData</code> Object should typically contain all the standard
     * metadata (the constants documented in this class) along with any other
     * vendor defined metadata.
     *
     * @function registerDevice
     * @memberof iotcs.device.util.GatewayDevice
     *
     * @param {boolean} restricted - <code>true</code> if credentials are required for activating
     *        the indirectly connected device.
     * @param {!string} hardwareId - An identifier unique within the Cloud Service instance.
     * @param {object} metaData - The metadata of the device.
     * @param {string[]} deviceModelUrns - An array of device model URNs supported by the indirectly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with the
     *        following argument: the endpoint ID of the indirectly-connected device is the
     *        registration was successful or <code>null</code> and an error object as the second
     *        parameter: callback(id, error).  The reason can be retrieved from error.message and it
     *        represents the actual response from the server or any other network or framework error
     *        that can appear.
     */
    registerDevice(restricted, hardwareId, metaData, deviceModelUrns, callback) {
        if (!this.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        if (typeof (restricted) !== 'boolean') {
            iotcs.log('Type mismatch: got '+ typeof (restricted) +' but expecting any of boolean).');
            iotcs.error('Illegal argument type.');
            return;
        }

        _mandatoryArg(hardwareId, 'string');
        _mandatoryArg(metaData, 'object');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => _mandatoryArg(urn, 'string'));
        let payload = metaData;
        payload.hardwareId = hardwareId;
        payload.deviceModels = deviceModelUrns;

        let data = this._dcdImpl._tam.getEndpointId();
        // If the ICD has been provisioned, use the shared secret to generate the
        // signature for the indirect activation request.
        // If this call return null, then the ICD has not been provisioned.
        let signature = this._dcdImpl._tam.signWithSharedSecret(data, "sha256", hardwareId);

        // If the signature is null, then the ICD was not provisioned. But if
        // the restricted flag is true, then we generate a signature which will
        // cause the ICD to be locked (for roaming) to the gateway
        if (restricted && (signature === null)) {
            signature = this._dcdImpl._tam.signWithPrivateKey(data, "sha256");
        }

        if (signature !== null) {
            if (typeof signature === 'object') {
                payload.signature = forge.util.encode64(signature.bytes());
            } else {
                payload.signature = forge.util.encode64(signature);
            }
        }

        let indirectRequest = () => {
            let options = {
                path: iotcs.impl._reqRoot + '/activation/indirect/device' +
                    (iotcs.oracle.iot.client.device.allowDraftDeviceModels ? '' : '?createDraft=false'),
                method: 'POST',
                headers: {
                    'Authorization': this._dcdImpl._bearer,
                    'X-EndpointId': this._dcdImpl._tam.getEndpointId()
                },
                tam: this._dcdImpl._tam
            };

            iotcs.impl._protocolReq(options, JSON.stringify(payload), (responseBody, error) => {
                if (!responseBody || error || !responseBody.endpointState) {
                    callback(null, iotcs.createError('Invalid response on indirect registration.',
                        error));
                   
                    return;
                }

                if (responseBody.endpointState !== 'ACTIVATED') {
                    callback(null, iotcs.createError('Endpoint not activated: ' +
                        JSON.stringify(responseBody)));

                    return;
                }

                callback(responseBody.endpointId);

            }, indirectRequest, this._dcdImpl);
        };

        indirectRequest();
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DeviceModelFactory.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @ignore
 */
iotcs.device.impl.DeviceModelFactory = class {
    constructor() {
        if (iotcs.device.impl.DeviceModelFactory._instanceDeviceModelFactory) {
            return iotcs.device.impl.DeviceModelFactory._instanceDeviceModelFactory;
        }

        this._cache = this.cache || {};
        this._cache.deviceModels = {};
        iotcs.device.impl.DeviceModelFactory._instanceDeviceMModelFactory = this;
    }

    /**
     *
     * @param dcdUtil {iotcs.device.util.DirectlyConnectedDevice}
     * @ignore
     */
    _getDeviceModel(dcdUtil, deviceModelUrn, callback) {
        iotcs.impl.Platform._debug('DeviceModelFactory.getDeviceModel Getting device model for deviceModelUrn: ' +
                       deviceModelUrn);

        _mandatoryArg(dcdUtil, iotcs.device.util.DirectlyConnectedDevice);

        if (!dcdUtil.isActivated()) {
            iotcs.error('Device not activated yet.');
            return;
        }

        _mandatoryArg(deviceModelUrn, 'string');
        _mandatoryArg(callback, 'function');

        let deviceModel = this._cache.deviceModels[deviceModelUrn];

        if (deviceModel) {
            callback(deviceModel);
            return;
        }

        let options = {
            headers: {
                'Authorization': dcdUtil._dcdImpl._bearer,
                'X-EndpointId': dcdUtil._dcdImpl._tam.getEndpointId()
            },
            method: 'GET',
            path: iotcs.impl._reqRoot + '/deviceModels/' + deviceModelUrn,
            tam: dcdUtil._dcdImpl._tam
        };

        iotcs.impl._protocolReq(options, '', (response, error) => {
            iotcs.impl.Platform._debug('DeviceModelFactory.getDeviceModel response = ' + response +
                           ', error = ' + error);

            if (!response || !(response.urn) || error) {
                callback(null, iotcs.createError('Invalid response when getting device model.',
                    error));
                return;
            }

            let deviceModel = response;

            if (!iotcs.oracle.iot.client.device.allowDraftDeviceModels && deviceModel.draft) {
                callback(null, iotcs.createError('Found draft device model.  Iotcsrary is not configured for draft device models.'));

                return;
            }

            Object.freeze(deviceModel);
            this._cache.deviceModels[deviceModelUrn] = deviceModel;
            callback(deviceModel);
        }, () => {
            this._getDeviceModel(dcdUtil, deviceModelUrn, callback);
        }, dcdUtil._dcdImpl);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/InMemoryPersistenceStore.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * InMemoryPersistenceStore
 */
iotcs.device.impl.InMemoryPersistenceStore = class {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        this._name = name;

        /**
         * Map of items.  Key is the item name.
         * @type {Map<string, object>}
         */
        this._items = new Map();
    }

    /**
     * Return true if this PersistenceStore contains the given key.
     *
     * @param key the key to search for.
     * @returns {boolean} true if this {PersistenceStore contains the given key.
     */
    _contains(key) {
        return iotcs.device.impl.PersistenceStoreManager._has(key);
    }

    /**
     * Return a map of all key/value pairs in this PersistenceStore.
     *
     * @return {Map<string, object>}
     */
    _getAll() {
        return new Map(this._items);
    }

    _getName() {
        return this._name;
    }

    /**
     * Return an object value for the given key.
     *
     * @param {string} key the key to search for.
     * @param {object} defaultValue the value to use if this PersistenceStore does not contain the
     *                 key.
     * @return {object} the value for the key.
     */
    _getOpaque(key, defaultValue) {
        let obj = this._items.get(key);
        return obj ? obj : defaultValue;
    }

    _openTransaction() {
        return new iotcs.device.impl.PersistenceStoreTransaction(this);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/TestConnectivity.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @ignore
 */
iotcs.device.impl.TestConnectivity  = class {
    constructor(messageDispatcher) {
        this._count = 0;
        this._currentCount = 0;
        this._interval = 0;
        this._messageDispatcher = messageDispatcher;
        this._size = 0;
        this._startPooling = null;

        let self = this;

        this._monitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (self._startPooling + self._interval)) {
                if (messageDispatcher._dcdUtil.isActivated()) {
                    let message = new iotcs.message.Message();

                    message
                        .type(iotcs.message.Message.Type.DATA)
                        .source(messageDispatcher._.dcd.getEndpointId())
                        .format("urn:oracle:iot:dcd:capability:diagnostics:test_message")
                        .dataItem("count", self.currentCount)
                        .dataItem("payload", _strRepeat('*', self.size))
                        .priority(iotcs.message.Message.Priority.LOWEST);

                    self.messageDispatcher.queue(message);
                    self._currentCount = self._currentCount + 1;
                }

                self._startPooling = currentTime;

                if (self._currentCount === self.count) {
                    self._count = 0;
                    self._currentCount = 0;
                    self._interval = 0;
                    self._monitor._stop();
                    self._size = 0;
                }
            }
        });
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _startHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'PUT')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        let data = null;

        try {
            data = JSON.parse(port.util.atob(requestMessage.payload.body));
        } catch (e) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.BAD_REQUEST, {}, iotcs.StatusCode.BAD_REQUEST, '');
        }

        if (!data || !data.interval || !data.size || !data.count ||
            (typeof data.interval !== 'number') || (data.interval % 1 !== 0) ||
            (typeof data.size !== 'number') || (data.size < 0) || (data.size % 1 !== 0) ||
            (typeof data.count !== 'number') || (data.count < 0) || (data.count % 1 !== 0))
        {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.BAD_REQUEST, {}, iotcs.StatusCode.BAD_REQUEST, '');
        }

        if (this.monitor.running) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.CONFLICT, {}, iotcs.StatusCode.CONFLICT_MESSAGE, '');
        }

        this._count = data.count;
        this._currentCount = 0;
        this._size = data.size;
        this._interval = (data.interval < iotcs.oracle.iot.client.monitor.pollingInterval ? iotcs.oracle.iot.client.monitor.pollingInterval : data.interval);
        this._startPooling = Date.now();
        this._monitor._start();
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
    }

    /**@ignore*/
    _stopHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'PUT')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                            iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        this._monitor._stop();
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
    }

    /**
     * @ignore
     */
    _testHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'GET')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        let obj = {
            active: this.monitor.running,
            count: this.count,
            currentCount: this.currentCount,
            interval: this.interval,
            size: this.size
        };

        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(obj),
            '');
    }
};

// Global functions
/**
 * @ignore
 */
function _strRepeat(str, qty) {
    if (qty < 1) {
    return '';
    }

    let result = '';

    while (qty > 0) {
        if (qty & 1) {
            result += str;
        }

        qty >>= 1;
        str = str + str;
    }

    return result;
}


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/MessageDispatcher.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This object is used for store and forward messages to the cloud by using a priority queue and
 * handling the priority attribute of messages.  It is also used for monitoring received messages
 * and any errors that can arise when sending messages.
 * <p>
 * There can be only one MessageDispatcher instance per DirectlyConnectedDevice at a time and it is
 * created at first use. To close an instance of a MessageDispatcher the
 * DirectlyConnectedDevice.close method must be used.
 * <p>
 * The message dispatcher uses the RequestDispatcher for dispatching automatically request messages
 * that come from the server and generate response messages to the server.
 * <p>
 * The onDelivery and onError attributes can be used to set handlers that are called when messages
 * are successfully delivered or an error occurs:
 * <br>
 * <code>messageDispatcher.onDelivery = function (messages);</code><br>
 * <code>messageDispatcher.onError = function (messages, error);</code><br>
 * Where messages is an array of the iotcs.message.Message object representing the messages that
 * were sent or not and error is an Error object.
 * <p>
 * Also the MessageDispatcher implements the message dispatcher, diagnostics and connectivity test
 * capabilities.
 *
 * @param {iotcs.device.util.DirectlyConnectedDevice} dcdUtil - The directly connected device (Messaging
 *        API) associated with this message dispatcher.
 *
 * @alias iotcs.device.util.MessageDispatcher
 * @class iotcs.device.util.MessageDispatcher
 * @memberof iotcs.device.util
 * @public
 * @see {@link iotcs.message.Message}
 * @see {@link iotcs.message.Message.Priority}
 * @see {@link iotcs.device.util.RequestDispatcher}
 * @see {@link iotcs.device.util.DirectlyConnectedDevice#close}
 */
iotcs.device.util.MessageDispatcher = class {
    // Static private/protected functions
    static _getMethodForRequestMessage(requestMessage) {
        let method = null;

        if (requestMessage.payload && requestMessage.payload.method) {
            method = requestMessage.payload.method.toUpperCase();
        }

        if (requestMessage.payload.headers &&
            Array.isArray(requestMessage.payload.headers['x-http-method-override']) &&
            (requestMessage.payload.headers['x-http-method-override'].length > 0))
        {
            method = requestMessage.payload.headers['x-http-method-override'][0].toUpperCase();
        }

        return method;
    }

    constructor(dcdUtil) {
        _mandatoryArg(dcdUtil, iotcs.device.util.DirectlyConnectedDevice);

        if (dcdUtil._messageDispatcher) {
            return dcdUtil._messageDispatcher;
        }

        this._dcdUtil = dcdUtil;
        this._failMessageClientIdArray = [];

        this._storageDependencies = {
            keys: [],
            values: []
        };

        this._onDelivery = arg => {};
        this._onError = (arg1, arg2) => {};
        this._priorityQueue = new iotcs.impl.PriorityQueue(iotcs.oracle.iot.client.device.maximumMessagesToQueue);
        this._poolingInterval = iotcs.oracle.iot.client.device.defaultMessagePoolingInterval;
        this._startPooling = null;
        this._startTime = this._dcdUtil._dcdImpl._getCurrentServerTime();
        this._totalMessagesSent = 0;
        this._totalMessagesReceived = 0;
        this._totalMessagesRetried = 0;
        this._totalBytesSent = 0;
        this._totalBytesReceived = 0;
        this._totalProtocolErrors = 0;
        this._connectivityTestObj = new iotcs.device.impl.TestConnectivity(this);
        this._longPollingStarted = false;

        let handlers = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

                if (!method || method !== 'POST') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }

                let devicePolicyManager = iotcs.device.impl.DevicePolicyManager.getDevicePolicyManager(dcdUtil.getEndpointId());
                return devicePolicyManager.policyChanged(dcdUtil, requestMessage);
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || method !== 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                let counterObj = {
                    totalMessagesSent: this._totalMessagesSent,
                    totalMessagesReceived: this._totalMessagesReceived,
                    totalMessagesRetried: this._totalMessagesRetried,
                    totalBytesSent: this._totalBytesSent,
                    totalBytesReceived: this._totalBytesReceived,
                    totalProtocolErrors: this._totalProtocolErrors
                };
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(counterObj), '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || (method !== 'PUT')) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                this._totalMessagesSent = 0;
                this._totalMessagesReceived = 0;
                this._totalMessagesRetried = 0;
                this._totalBytesSent = 0;
                this._totalBytesReceived = 0;
                this._totalProtocolErrors = 0;
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || ((method !== 'PUT') && (method !== 'GET'))) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                if (method === 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify({pollingInterval: this._poolingInterval}), '');
                } else {
                    let data = null;
                    try {
                        data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                    }
                    if (!data || (typeof data.pollingInterval !== 'number') || (data.pollingInterval % 1 !== 0)) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                    }
                    this._poolingInterval = (data.pollingInterval < iotcs.oracle.iot.client.monitor.pollingInterval ? iotcs.oracle.iot.client.monitor.pollingInterval : data.pollingInterval);
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
                }
            },
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": requestMessage => {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                if (!method || method !== 'GET') {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {}, iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }
                let obj = {
                    freeDiskSpace: 'Unknown',
                    ipAddress: 'Unknown',
                    macAddress: 'Unknown',
                    totalDiskSpace: 'Unknown',
                    version: 'Unknown',
                    startTime: this._startTime
                };
                if (iotcs.impl.Platform.Util._diagnostics) {
                    obj = iotcs.impl.Platform.Util._diagnostics();
                }
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(obj), '');
            },
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": requestMessage =>  {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
                let data = null;
                try {
                    data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                }
                if (!data || ((method === 'PUT') && (typeof data.active !== 'boolean'))) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST, '');
                }
                if (method === 'PUT') {
                    if (data.active) {
                        return this._connectivityTestObj.startHandler(requestMessage);
                    } else {
                        return this._connectivityTestObj.stopHandler(requestMessage);
                    }
                } else {
                    return this._connectivityTestObj.testHandler(requestMessage);
                }
            }
        };

        // Note: Any changes here must also be changed in
        // iotcs.device.impl.DirectlyConnectedDevice.registerDevicePolicyResource.
        let handlerMethods = {
            "deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged": "PUT",
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/counters": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/reset": 'PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:message_dispatcher/pollingInterval": 'GET,PUT',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/info": 'GET',
            "deviceModels/urn:oracle:iot:dcd:capability:diagnostics/testConnectivity": 'GET,PUT'
        };

        this._deliveryCallback = messages => {
            this._totalMessagesSent = this._totalMessagesSent + messages.length;

            messages.forEach(message => {
                this._totalBytesSent = this._totalBytesSent +
                    iotcs.device.impl.DirectlyConnectedDeviceImpl.getUtf8BytesLength(JSON.stringify(message));
            });

            this.onDelivery(messages);
        };

        this._errorCallback = (messages, error) => {
            this._totalProtocolErrors = this._totalProtocolErrors + 1;
            this.onError(messages, error);
        };

        this._sendMonitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (this._startPooling + this._poolingInterval)) {
                if (!dcdUtil.isActivated() ||
                    dcdUtil._dcdImpl._activating ||
                    dcdUtil._dcdImpl._refreshing)
                {
                    this._startPooling = currentTime;
                    return;
                } else if (!dcdUtil._dcdImpl._bearer) {
                    dcdUtil._dcdImpl._refreshBearer(false, error => {
                        this._sendMessages(currentTime);
                    });
                } else {
                    this._sendMessages(currentTime);
                }
            }
        });

        if (this._dcdUtil._receiver) {
            let oldReceiver = this._dcdUtil._receiver;

            this._dcdUtil._receiver = (messages, error) => {
                oldReceiver(messages, error);
                let message = this._dcdUtil._getReceivedMessage();

                while (message) {
                    this._totalMessagesReceived = this._totalMessagesReceived + 1;
                    this._totalBytesReceived = this._totalBytesReceived +
                        iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(message));

                    if (message.type === iotcs.message.Message.Type.REQUEST) {
                        let responseMessage = this.getRequestDispatcher().dispatch(message);

                        if (responseMessage) {
                            this.queue(responseMessage);
                        }
                    }

                    message = this._dcdUtil._getReceivedMessage();
                }
            };
        }

        let self = this; 
        this._resourceMessageMonitor = null;

        this._resourceMessageMonitor = new iotcs.impl.Monitor(() => {
            if (!self._dcdUtil.isActivated()) {
                return;
            }

            if (self._resourceMessageMonitor) {
                self._resourceMessageMonitor._stop();
            }

            for (let path in handlers) {
                self.getRequestDispatcher().registerRequestHandler(dcdUtil.getEndpointId(), path, handlers[path]);
            }
            let resources = [];

            for (let path1 in handlerMethods) {
                resources.push(iotcs.message.Message.ResourceMessage.Resource.buildResource(path1, path1, handlerMethods[path1], iotcs.message.Message.ResourceMessage.Resource.Status.ADDED));
            }

            let message = iotcs.message.Message.ResourceMessage.buildResourceMessage(resources, dcdUtil.getEndpointId(), iotcs.message.Message.ResourceMessage.Type.UPDATE, iotcs.message.Message.ResourceMessage.getMD5ofList(Object.keys(handlerMethods)))
                .source(dcdUtil.getEndpointId())
                .priority(iotcs.message.Message.Priority.HIGHEST);

            this.queue(message);
        });

        this._resourceMessageMonitor._start();
        this._startPooling = Date.now();
        this._sendMonitor._start();
        this._startTime = this._dcdUtil._dcdImpl._getCurrentServerTime();

        // Do this last after everything else is established.
        // Populate outgoing message queue from persisted messages, but leave the
        // messages in persistence. The messages are removed from persistence when
        // they are delivered successfully.
        /** @type {iotcs.device.impl.MessagePersistenceImpl} */
        const messagePersistenceImpl =
              iotcs.device.impl.MessagePersistenceImpl._getInstance();

        if (messagePersistenceImpl && (this._dcdUtil.isActivated() === true)) {
            messagePersistenceImpl._load(this._dcdUtil.getEndpointId()).then(messages => {
                if (messages && messages.size > 0) {
                    messages.forEach(message => {
                        this.queue(message);
                    });
                }
            }).catch(error => {
                //console.log('Error loading persistent messages: ' + error);
            });
        }

        /**
         * Callback handler for DirectlyConnectedDeviceUtil.sendReceiveMessages when messages are
         * successfully sent and when errors occur sending messages.  If error is supplied, any
         * specified error callback handlers are called.
         *
         * @ignore
         * @private
         *
         * @param {Message[]} messages - The messages to be sent.
         * @param {error} [error] - The error when sending messages, if there is one.
         */
        this._handleSentAndErrorMessages = (messages, error) => {
            try {
                if (error) {
                    this._errorCallback(messages, error);
                } else {
                    this._deliveryCallback(messages);
                }
            } catch (ignore) {
                // Do nothing 
            }

            let message = this._dcdUtil._getReceivedMessage();

            while (message) {
                this._totalMessagesReceived = this._totalMessagesReceived + 1;
                this._totalBytesReceived = this._totalBytesReceived +
                    iotcs.device.impl.DirectlyConnectedDeviceImpl._getUtf8BytesLength(JSON.stringify(message));

                if (message.type === iotcs.message.Message.Type.REQUEST) {
                    let responseMessage = this.getRequestDispatcher().dispatch(message);

                    if (responseMessage) {
                        this.queue(responseMessage);
                    }
                }

                message = this._dcdUtil._getReceivedMessage();
            }
        };

        /**
         * Pushes message into array if it isn't already there.
         *
         * @param {Message[]} array - An array of messages.
         * @param {Message} message - A message.
         *
         * @ignore
         */
        this._pushMessage = (msgAry, message) => {
            let inArray = false;

            inArray = msgAry.forEach(msg => {
                if (message._equals(msg)) {
                    return true;
                }
            });

            if (!inArray) {
                msgAry.push(message);   
            }
        };

        this._dcdUtil._messageDispatcher = this;
    }

    // Private/protected functions
    _addStorageDependency(storage, msgClientId) {
        let index = this._storageDependencies.keys.indexOf(storage);

        if (index == -1) {
            // add new KV in storageDependencies
            this._storageDependencies.keys.push(storage);
            this._storageDependencies.values.push([msgClientId]);
        } else {
            // add value for key
            this._storageDependencies.values[index].push(msgClientId);
        }
    }

    _isStorageDependent(clientId) {
        for (let i = 0; i < this._storageDependencies.values.length; ++i) {
            if (this._storageDependencies.values[i].indexOf(clientId) !== -1) {
                return true;
            }
        }

        return false;
    }

    _push(message) {
        this._priorityQueue._push(message);
    }

    _removeStorageDependency(storage) {
        let completed = (storage.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.IN_SYNC);
        let index = this._storageDependencies.keys.indexOf(storage);
        this._storageDependencies.keys.splice(index, 1);
        let msgClientIds = this._storageDependencies.values.splice(index, 1)[0];

        if (!completed && msgClientIds.length > 0) {
            // Save failed clientIds.
            this.msgClientIds.forEach(msgClientId => {
                if (this._failMessageClientIdArray.indexOf(msgClientId) === -1) {
                    this._failMessageClientIdArray.push(msgClientId);
                }
            });
        }
    }

    _sendMessages(currentTime) {
        let sent = false;
        let message;
        let waitMessageArray = [];
        let sendMessageArray = [];
        let errorMessageArray = [];
        let inProgressSources = [];

        // Go through the queue and add the messages to the send message or wait message arrays
        // depending on whether it's a request message, if it has a storage dependency, or if
        // messages to this source are in-progress (so we can group messages to the same source
        // together in the same connection).
        while ((message = this._priorityQueue._pop()) !== null) {
            let clientId = message._properties.clientId;
            let source = message._properties.source;

            if (this._failMessageClientIdArray.indexOf(clientId) > -1) {
                if (errorMessageArray.indexOf(message) === -1) {
                    errorMessageArray.push(message);
                }

                continue;
            }

            if ((message._properties.type === iotcs.message.Message.Type.REQUEST) ||
                !(inProgressSources.indexOf(source) !== -1 || this._isStorageDependent(clientId)))
            {
                message._properties.remainingRetries = message._properties.BASIC_NUMBER_OF_RETRIES;
                this._pushMessage(sendMessageArray, message);

                if (sendMessageArray.length === iotcs.oracle.iot.client.device.maximumMessagesPerConnection) {
                    break;
                }
            } else {
                if (inProgressSources.indexOf(source) === -1) {
                    inProgressSources.push(source);
                }

                this._pushMessage(waitMessageArray, message);
            }
        }

        sent = true;
        let messageArr = [];

        if (sendMessageArray.length > 0) {
            messageArr = sendMessageArray;
        }

        waitMessageArray.forEach(message => {
            this.queue(message);
        });

        this._dcdUtil._sendReceiveMessages(messageArr, this._handleSentAndErrorMessages,
                                         this._handleSentAndErrorMessages);

        if (errorMessageArray.length > 0) {
            this._errorCallback(errorMessageArray, new Error("Content sync failed."));
        }

        if (!sent && !this._dcdUtil._receiver && (iotcs.oracle.iot.client.device.disableLongPolling || this._dcdUtil._dcdImpl._mqttController)) {
            this._dcdUtil._sendReceiveMessages([], this._handleSentAndErrorMessages, this._handleSentAndErrorMessages);
        }

        if (!this._dcdUtil._receiver && !iotcs.oracle.iot.client.device.disableLongPolling && !this._dcdUtil._dcdImpl._mqttController) {
            let longPollCallback = null;

            longPollCallback = (messages, error) => {
                if (!error) {
                    this._dcdUtil._sendReceiveMessages([], longPollCallback, longPollCallback, true);
                } else {
                    this._longPollingStarted = false;
                }

                this._handleSentAndErrorMessages(messages, error);
            };

            if (!this._longPollingStarted) {
                this._dcdUtil._sendReceiveMessages([], longPollCallback, longPollCallback, true);
                this._longPollingStarted = true;
            }
        }

        this._startPooling = currentTime;
    }

    _stop() {
        this._sendMonitor._stop();

        if (this._resourceMessageMonitor) {
            this._resourceMessageMonitor._stop();
        }
    }

    // Public functions
    /**
     * (Optional)
     * Callback function called when messages are successfully delivered to the IoT CS.
     *
     * @name iotcs.device.util.MessageDispatcher#onDeliveryCallback
     * @public
     * @type {?iotcs.device.util.MessageDispatcher~onDeliveryCallback}
     */
    get onDelivery() {
        return this._onDelivery;
    }

    /**
     * (Optional)
     * Callback function called when there is an error sending the Alert.
     *
     * @name iotcs.device.Alert#onError
     * @public
     * @type {?iotcs.device.Alert~onErrorCallback}
     */
    get onError() {
        return this._onError;
    }

    set onDelivery(newFunction) {
        if (!newFunction|| (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onDelivery to something that is not a function.');
            return;
        }

        this._onDelivery = newFunction;
    }

    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onDelivery to something that is not a function.');
            return;
        }

        this._onError = newFunction;

    }
    /**
     * This method returns the RequestDispatcher used by this MessageDispatcher for dispatching
     * messages.
     *
     * @function getRequestDispatcher
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @returns {iotcs.device.util.RequestDispatcher} The RequestDispatcher instance.
     */
    getRequestDispatcher() {
        return new iotcs.device.util.RequestDispatcher();
    }

    /**
     * Offer a message to be queued. Depending on the policies, if any, the message will be queued
     * if it is possible to do so without violating capacity restrictions.
     *
     * @param {iotcs.message.Message} message - The message to be offered.
     * @throws Error if all the messages cannot be added to the queue.
     * @throws Error if <code>messages</code> is <code>null</code> or empty.
     *
     * @function offer
     * @memberof iotcs.device.util.MessageDispatcher
     * @public
     */
    offer(message) {
        _mandatoryArg(message, iotcs.message.Message);

        /** @type {PersistenceStore} */
        const persistenceStore =
              iotcs.device.impl.PersistenceStoreManager._get(this._dcdUtil.getEndpointId());

        /** @type {MessagingPolicyImpl} */
        const mpi = persistenceStore._getOpaque('MessagingPolicyImpl', null);
        /** @type {MessagingPolicyImpl} */
        let messagingPolicyImpl;

        if (mpi) {
            messagingPolicyImpl = mpi;
        } else {
            messagingPolicyImpl = new iotcs.device.impl.MessagingPolicyImpl(this._dcdUtil);

            persistenceStore
                ._openTransaction()
                ._putOpaque('MessagingPolicyImpl', messagingPolicyImpl)
                ._commit();

            /** @type {DevicePolicyManager} */
            const devicePolicyManager =
                  iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this._dcdUtil.getEndpointId());

            devicePolicyManager._addChangeListener(messagingPolicyImpl);
        }

        let messageDispatcher = this;

        messagingPolicyImpl._applyPolicies(message).then(messageAry => {
            if (messageAry) {
                messageAry.forEach(message => {
                    messageDispatcher._push(message);
                });
            }
        }).catch(error => {
            console.log('MessageDispatcher.offer error: ' + error);
        });
    }

    /**
     * This method adds a message to the queue of this MessageDispatcher to be sent to the cloud.
     *
     * @function queue
     * @ignore
     * @memberof iotcs.device.util.MessageDispatcher
     *
     * @param {iotcs.message.Message} message - The message to be sent.
     */
    queue(message) {
        _mandatoryArg(message, iotcs.message.Message);

        const messagePersistenceImpl =
              iotcs.device.impl.MessagePersistenceImpl._getInstance();

        if (messagePersistenceImpl && message._properties.reliability ===
            iotcs.message.Message.Reliability.GUARANTEED_DELIVERY)
        {
            const messages = new Set();
            messages.add(message);
            messagePersistenceImpl._save(messages, this._dcdUtil.getEndpointId());
        }

        this._push(message);
    }
};

// JSDocs Callback documentation.
/**
 * Callback function called when messages are successfully delivered to the IoT CS.
 *
 * @callback iotcs.device.util.MessageDispatcher~onDeliveryCallback
 *
 * @param {iotcs.message.Message[]} An array of the iotcs.message.Message's representing the
 *        messages that were sent.
 */

/**
 * Callback function called when there is an error sending messages to the IoT CS.
 *
 * @callback iotcs.device.Alert~onErrorCallback
 *
 * @param {iotcs.message.Message[]} An array of the iotcs.message.Message's representing all of the
 *        messages that were attempted to be sent.
 * @param {string} error - The error which occurred when sending the messages.
 */


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/MessagePersistenceImplBrowser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Provides for storing and retrieving messages to a persistent store for the browser.  The browser
 * doesn't support persistence, so this implementation is empty.
 */
iotcs.oracle.iot.client.device.MessagePersistenceImpl = class {
    static _getInstance() {
        // There is no message persistence in the browser.
        iotcs.oracle.iot.client.device.persistenceEnabled = false;
        return null;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/BatchByPersistenceBrowser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * SQL database persistence for 'batchBy' policy data for the browser.   Contains empty
 * implementations of the required functions for the browser.
 */
iotcs.device.impl.BatchByPersistence = class {
    /**
     * Creates the message persistent storage table if it doesn't exist.
     */
    _createBatchByTableIfNotExists() {}

    /**
     * @param {Set<iotcs.Message>}
     * @return {boolean}
     */
    _delete(messages) {}

    /**
     * @param {string} endpointId
     * @return {Set<iotcs.message.Message>}
     */
    _get(endpointId) {
        return new Promise((resolve, reject) => {
            resolve(new Set());
        });
    }

    /**
     *
     * @param {Set<iotcs.message.Message>} messages
     * @param {string} endpointId
     */
    _save(messages, endpointId) {}
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/RequestDispatcher.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This object is used for request messages dispatch.  You can register handlers to an instance of
 * this object that will handle request messages that come from the cloud and will return a response
 * message associated for that request message.
 * <p>
 * There can be only one instance of this object (singleton) generated at first use.
 *
 * @alias iotcs.device.util.RequestDispatcher
 * @class iotcs.device.util.RequestDispatcher
 * @memberof iotcs.device.util
 */
iotcs.device.util.RequestDispatcher = class {
    constructor() {
        if (iotcs.device.util.RequestDispatcher._instanceRequestDispatcher) {
            return iotcs.device.util.RequestDispatcher._instanceRequestDispatcher;
        }

        this._requestHandlers = {};
        iotcs.device.util.RequestDispatcher._instanceRequestDispatcher = this;
    }

    // Private/protected functions
    _defaultHandler(requestMessage) {
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND,
                                                          {}, iotcs.StatusCode.NOT_FOUND_MESSAGE, '');
    }

    // Public functions
    /**
     * This is main function of the RequestDispatcher that dispatches a request message to the
     * appropriate handler, if one is found and the handler is called so the appropriate response
     * message is returned. If no handler is found, the RequestDispatcher implements a default
     * request message dispatcher that would just return a 404 (Not Found) response message. This
     * method will never return <code>null</code>.
     *
     * @function dispatch
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {object} requestMessage - The request message to dispatch.
     * @returns {iotcs.message.Message} The response message associated with the request.
     */
    dispatch(requestMessage) {
        if (!requestMessage ||
            !requestMessage.type ||
            (requestMessage.type !== iotcs.message.Message.Type.REQUEST) ||
            !requestMessage.destination ||
            !requestMessage.payload ||
            !requestMessage.payload.url ||
            !this._requestHandlers[requestMessage.destination] ||
            !this._requestHandlers[requestMessage.destination][requestMessage.payload.url])
        {
            return this._defaultHandler(requestMessage);
        }

        let message = this._requestHandlers[requestMessage.destination][requestMessage.payload.url](requestMessage);

        if (message &&
            (message instanceof iotcs.message.Message) &&
            (message.getJSONObject().type === "RESPONSE_WAIT"))
        {
            return null;
        }

        if (!message ||
            !(message instanceof iotcs.message.Message) ||
            (message.getJSONObject().type !== iotcs.message.Message.Type.RESPONSE))
        {
            return this._defaultHandler(requestMessage);
        }

        return message;
    }

    /**
     * Returns a registered request handler, if it is registered, otherwise <code>null</code>.
     *
     * @function getRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {string} endpointId - The endpoint ID that the handler was registered with.
     * @param {string} path - The path that the handler was registered with.
     * @returns {function} The actual handler or <code>null</code>.
     */
    getRequestHandler(endpointId, path) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(path, 'string');

        if (!this._requestHandlers[endpointId] || !this._requestHandlers[endpointId][path]) {
            return null;
        }

        return this._requestHandlers[endpointId][path];
    }

    /**
     * This method registers a handler to the RequestDispatcher.  The handler is a function that
     * must have the form:
     * <br> <code>handler = function (requestMessage) { ... return responseMessage};
     * </code><br>.  Where requestMessage if a JSON representing the exact message received from
     * the cloud that has the type REQUEST and responseMessage is an instance of
     * iotcs.message.Message that has type RESPONSE.  If neither of the conditions are satisfied the
     * RequestDispatcher will use the default handler.
     * <p>
     * It is advisable to use the iotcs.message.Message.buildResponseMessage method for generating
     * response messages.
     *
     * @function registerRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     * @see {@link iotcs.message.Message.Type}
     * @see {@link iotcs.message.Message.buildResponseMessage}
     *
     * @param {string} endpointId - The endpoint IDthat is the destination of the request message.
     * @param {string} path - The path that is the "address" (resource definition) of the request
     *        message.
     * @param {function} handler - The actual handler to be registered.
     */
    registerRequestHandler(endpointId, path, handler) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(path, 'string');
        _mandatoryArg(handler, 'function');

        if (!this._requestHandlers[endpointId]) {
            this._requestHandlers[endpointId] = {};
        }

        this._requestHandlers[endpointId][path] = handler;
    }

    /**
     * This method removed a handler from the registered handlers list of the RequestDispatcher.  If
     * handler is present as parameter, then endpointId and path parameters are ignored.
     *
     * @function unregisterRequestHandler
     * @memberof iotcs.device.util.RequestDispatcher
     *
     * @param {function} handler - The reference to the handler to be removed.
     * @param {string} endpointId - The endpoint id that the handler was registered with.
     * @param {string} path - The path that the handler was registered with.
     */
    unregisterRequestHandler(handler, endpointId, path) {
        if (handler && (typeof handler === 'string')) {
            endpointId = handler;
            path = endpointId;
            handler = null;
        }

        if (handler && (typeof handler === 'function')) {
            Object.keys(this._requestHandlers).forEach(endpointId => {
                Object.keys(this._requestHandlers[endpointId]).forEach(path => {
                    delete this._requestHandlers[endpointId][path];

                    if (Object.keys(this._requestHandlers[endpointId]).length === 0) {
                        delete this._requestHandlers[endpointId];
                    }
                });
            });

            return;
        } else {
            _mandatoryArg(endpointId, 'string');
            _mandatoryArg(path, 'string');
        }

        if (!this._requestHandlers[endpointId] || !this._requestHandlers[endpointId][path]) {
            return;
        }
        delete this._requestHandlers[endpointId][path];
        if (Object.keys(this._requestHandlers[endpointId]).length === 0) {
            delete this._requestHandlers[endpointId];
        }
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Attribute.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Attribute is an attribute in the device model.
 *
 * @class
 * @ignore
 */
iotcs.device.impl.Attribute = class {
    // Static private functions
    /**
     * @param {any} newValue
     * @param {object} spec
     * @return {any} - The new value or <code>null</code>.
     *
     * @ignore
     */
    static _checkAndGetNewValue(newValue, spec) {
        if (spec.type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in date time parameter.');
                return null;
            }
        }

        if (!iotcs.device.impl.Attribute._matchType(spec.type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec.name + '" has type [' + spec.type +
                        '].');
            return null;
        }

        return newValue;
    }

    /**
     * Determines if the value matches the requested type.  The requested type must be one of:
     *   - BOOLEAN
     *   - DATETIME
     *   - INTEGER 
     *   - NUMBER
     *   - STRING
     *   - URI
     *
     * @return {boolean|null} - <code>true</code> if the <code>value</code> is of the type specified
     *         in <code>reqType</code>, or <code>null</code> if the requeted type is not one of ther
     *         ones supported.
     * @throws error If the requested type is not one of the supported ones.
     *
     * @ignore
     */
    static _matchType(reqType, value) {
        _mandatoryArg(reqType, 'string');

        switch(reqType) {
        case 'INTEGER':
            return ((typeof value === 'number') && (value % 1 === 0));
        case 'NUMBER':
            return (typeof value === 'number');
        case 'STRING':
            return (typeof value === 'string');
        case 'BOOLEAN':
            return (typeof value === 'boolean');
        case 'DATETIME':
            return (value instanceof Date);
        case 'URI':
            return (value instanceof iotcs.ExternalObject) || (typeof value === 'string');
        default:
            iotcs.error('Illegal type.');
            return null;
        }
    }

    /**
     * {
     *    low: <value>,
     *    hight: <value>
     * }
     * @return {object} An <code>object</code> containing the parsed low and high range, or
     *         <code>null</null> if there was an error parsing the range.
     * 
     * @ignore
     */
    static _parseRange(type, rangeStr) {
        _mandatoryArg(type, 'string');
        _mandatoryArg(rangeStr, 'string');

        if ((type !== 'NUMBER') && (type !== 'INTEGER')) {
            iotcs.error('Device model specification is invalid.');
            return null;
        }

        let rangeLimits = rangeStr.split(',');

        if (rangeLimits.length != 2) {
            iotcs.error('Device model specification is invalid.');
            return null;
        }

        let first = parseFloat(rangeLimits[0]);
        let second = parseFloat(rangeLimits[1]);

        return {
            low: Math.min(first,second),
            high: Math.max(first,second)
        };
    }

    constructor(attributeSpec) {
        _mandatoryArg(attributeSpec, 'object');

        if ((!attributeSpec.name) || (!attributeSpec.type)) {
            iotcs.error('Attribute specification in device model is incomplete.');
            return;
        }

        this._spec = {
            name: attributeSpec.name,
            description: (attributeSpec.description || ''),
            type: attributeSpec.type,
            writable: (attributeSpec.writable || false),
            alias: (attributeSpec.alias || null),
            range: (attributeSpec.range ?
                    iotcs.device.impl.Attribute._parseRange(attributeSpec.type, attributeSpec.range) : null),
            defaultValue: ((typeof attributeSpec.defaultValue !== 'undefined') ?
                           attributeSpec.defaultValue : null)
        };

        if (this._spec.type === "URI" && (typeof this._spec.defaultValue === "string")) {
            this._spec.defaultValue = new iotcs.ExternalObject(this._spec.defaultValue);
        }

        // Private properties
        /**
         * @ignore
         */
        this._value = this._spec.defaultValue;

        /**
         * @ignore
         */
        this._lastKnownValue = this._spec.defaultValue;

        /**
         * @ignore
         */
        this._lastUpdate = null;

        // Public properties
        /**
         * @memberof iotcs.Attribute
         * @member {string} description - the description
         * of this attribute
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.defaultValue = this._spec.defaultValue;

        /**
         * @memberof iotcs.Attribute
         * @member {string} description - the description
         * of this attribute
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.description = this._spec.description;

        /**
         * @memberof iotcs.Attribute
         * @member {string} id - the unique/reproducible
         * id for this attribute (usually its name)
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.id = this._spec.name;

        /**
         * @memberof iotcs.Attribute
         * @member {string} type - one of <code>INTEGER</code>,
         * <code>NUMBER</code>, <code>STRING</code>, <code>BOOLEAN</code>,
         * <code>DATETIME</code>
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.type = this._spec.type;

        /**
         * @ignore
         * @memberof iotcs.Attribute
         * @member {boolean} writable - expressing whether
         * this attribute is writable or not
         * DJM: Probably should be just a getter so it can be made read-only..
         */
        this.writable = this._spec.writable;
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _checkAndGetNewValueCallback(newValue, spec, virtualDevice, callback) {
        let isURICallback = false;

        if (spec.type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in date time parameter.');
                return;
            }
        }

        if (spec.type === 'URI') {
            if (newValue instanceof iotcs.ExternalObject) {
                // nothing to do
            } else if (typeof newValue === 'string') {
                // get uri from server
                if (this._isStorageCloudURI(newValue)) {
                    isURICallback = true;

                    virtualDevice._client._internalDev.createStorageObject(newValue,
                        (storage, error) => {
                            if (error) {
                                iotcs.error('Error during creation storage object: ' + error);
                                return;
                            }

                            let storageObject = new iotcs.device.StorageObject(storage.getURI(),
                                                                             storage.getName(),
                                                                             storage.getType(),
                                                                             storage.getEncoding(),
                                                                             storage.getDate(),
                                                                             storage.getLength());

                            storageObject._setDevice(virtualDevice._client._internalDev);
                            storageObject._setSyncEventInfo(spec.name, virtualDevice);

                            if (!iotcs.device.impl.Attribute._matchType(spec.type, storageObject)) {
                                iotcs.error('Type mismatch.  Attribute "' + spec.name +
                                          '" has type [' + spec.type + ']');
                                return;
                            }

                            callback(storageObject);
                        });

                    return;
                } else {
                    newValue = new iotcs.ExternalObject(newValue);
                }
            } else {
                iotcs.error('Invalid URI parameter.');
                return;
            }
        }

        if (!iotcs.device.impl.Attribute._matchType(spec.type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec.name + '" has type [' + spec.type + '].');
            return;
        }

        if (!isURICallback) {
            callback(newValue, true);
        }
    }

    /**
     * @ignore
     */
    _equal(newValue, oldValue, spec) {
        if (spec.type === 'DATETIME' &&
            (newValue instanceof Date) &&
            (oldValue instanceof Date))
        {
            return (newValue.getTime() === oldValue.getTime());
        } else {
            return (newValue === oldValue);
        }
    }

    /**
     * @private
     */
    _getNewValue(newValue, virtualDevice, callback) {
        try {
            if (this._isValidValue(newValue)) {
                this._checkAndGetNewValueCallback(newValue, this._spec, virtualDevice,
                                                  (attributeValue, isSync) => {
                                                      if (callback) {
                                                          callback(attributeValue, isSync);
                                                      }
                                                  });
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    //@TODO: See comment in AbstractVirtualDevice; this is not clean especially it is supposed to be
    // a private function and yet used in 4 other objects ...etc...; this looks like a required
    // ((semi-)public) API ... or an $impl.XXX or a function ()...
    _isValidValue(newValue) {
        try {
            newValue = iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                                                                                  this._spec);
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }

        if (typeof newValue === 'undefined') {
            iotcs.createError('Trying to set an invalid value.');
            return false;
        }

        if (this._spec.range &&
            ((newValue < this._spec.range.low) || (newValue > this._spec.range.high)))
        {
            iotcs.createError('Trying to set a value out of range [' + this._spec.range.low + ' - ' +
                              this._spec.range.high + '].');

            return false;
        }

        return true;
    }

    /**
     * @private
     */
    _localUpdate(newValue, nosync) {
        if (this._isValidValue(newValue)) {
            newValue = iotcs.device.impl.Attribute._checkAndGetNewValue(newValue,
                                                                                  this._spec);

            if (this._equal(newValue, this._value, this._spec)) {
                return;
            }

            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;
            let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                newValue.getURI() : newValue;
            iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                                       this._spec.type + '" from ' + consoleValue + ' to ' +
                                       consoleNewValue + '.');
            this._value = newValue;
            this._lastKnownValue = newValue;

            if (!nosync) {
                let attributes = {};
                attributes[this._spec.name] = newValue;

                if (!self.device || !(self.device instanceof iotcs.device.VirtualDevice)) {
                    return;
                }

                this._virtualDevice._updateAttributes(attributes);
            }
        } else {
            iotcs.error('Invalid value.');
        }
    }

    /**
     * @private
     */
    _onUpdateResponse(error) {
        if (error) {
            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;

            let consoleLastKnownValue = (this._lastKnownValue instanceof iotcs.ExternalObject) ?
                this._lastKnownValue.getURI() : this._lastKnownValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                                       this._spec.type + '" from ' + consoleValue + ' to ' +
                                       consoleLastKnownValue + '.');

            this._value = this._lastKnownValue;
        } else {
            this._lastKnownValue = this._value;
        }

        this._lastUpdate = new Date().getTime();
    }

    /**
     * @private
     */
    _remoteUpdate(newValue) {
        try {
            if (this._isValidValue(newValue)) {
                if (!this._spec.writable) {
                    iotcs.createError('Trying to set a read only value.');
                    return false;
                }

                this._lastUpdate = Date.now();

                if (this._equal(newValue, this._lastKnownValue, this._spec)) {
                    return true;
                }

                this._lastKnownValue = newValue;

                let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                    this._value.getURI() : this._value;
                let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                    newValue.getURI() : newValue;

                iotcs.impl.Platform._debug('Updating attribute "' + this._spec.name + '" of type "' +
                          this._spec.type + '" from ' + consoleValue + ' to ' + consoleNewValue +
                          '.');

                this._value = newValue;
                return true;
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }
    }

    // Public functions
    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} lastKnownValue - Used for getting the current value of
     *         this attribute
     */
    get lastKnownValue() {
        return this._lastKnownValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {Date} lastUpdate - The date of the last value update.
     */
    get lastUpdate() {
        return this._lastUpdate;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {function(Object)} onChange - Function called back when value as changed on the
     *         server side. Callback signature is <code>function (e) {}</code>, where <code>e</code>
     *         is <code>{'attribute':this, 'newValue':, 'oldValue':}</code>.
     */
    get onChange() {
        return this._onChange;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {function(Object)} onError - Function called back when value could not be changed.
     *         Callback signature is <code>function (e) {}</code>, where <code>e</code> is
     *         <code>{'attribute':this, 'newValue':, 'tryValue':}</code>.
     */
    get onError() {
        return this._onError;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} value - Used for setting or getting the current value
     *         of this attribute (subject to whether it is writable or not).
     */
    get value() {
        return this._value;
    }

    set lastKnownValue(newValue) {
       // Do nothing. 
    }

    set lastUpdate(newValue) {
        // Do nothing. 
    }

    set value(newValue) {
        this._localUpdate(newValue, false);
    }

    set onChange(newFunction) {
        if (!newFunction|| (typeof newFunction!== 'function')) {
            iotcs.error('Trying to set to onChange to something that is not a function!');
            return;
        }

        this._onChange = newFunction;
    }

    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set to onError to something that is not a function!');
            return;
        }

        this._onError = newFunction;
    }

};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/ActionSpecBase.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The base class for an Action specification, based on a JSON representation of the action
 * specification.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.impl.ActionSpecBase = class {
    /**
     * Constructs an ActionSpecBase class.
     *
     * @param {string} actionSpec - A JSON string which represents the specification of this action.
     */
    constructor(actionSpec) {
        _mandatoryArg(actionSpec, 'object');

        if (!actionSpec.name) {
            iotcs.error('The attribute specification in the device model is incomplete.');
            return;
        }

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {object} spec - The action specification information.
         */
        this._spec = {
            alias: (actionSpec.alias || null),
            args: undefined,   // New arguments.
            argType: undefined,   // Legacy argument.
            description: (actionSpec.description || ''),
            name: actionSpec.name,
            range: undefined   // Legacy range.
        };

        /**
         * The arguments for the action.
         *
         * @type {object[]}
         */
        let args = [];

        // Do we have legacy or new action arguments?
        if (actionSpec.argType) {
            // For legacy action arguments.
            this._spec.range = actionSpec.range ?
                _parseRange(actionSpec.argType, actionSpec.range) : null;
            this._spec.argType = (actionSpec.argType || null);
        } else if (actionSpec.arguments) {
            // For new, multiple action arguments.
            actionSpec.arguments.forEach(actionArgument => {
                args.push(actionArgument);
            });

            this._spec.args = args;
        } else {
            this._spec.args = null;
        }

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {string} name - the name of this action
         */
        this._name = this._spec.name;

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {string} description - the description of this action
         */
        this._description = this._spec.description;
    }

    /**
     * @memberof iotcs.impl.ActionSpecBase
     * @member {function(object)} onAction - The action to perform when the response to an
     *         execute is received from the other party.
     */
    get _onAction() {
        return this.__onAction;
    }

    set _onAction(newFunction) {
        if (newFunction && (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onAction that is not a function!');
            return;
        }

        this.__onAction = newFunction;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/ActionSpec.js
//////////////////////////////////////////////////////////////////////////////
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



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Alert.js
//////////////////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Data.js
//////////////////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DirectlyConnectedDevice.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A directly-connected device is able to send messages to, and receive messages from, the IoT
 * server.  When the directly-connected device is activated on the server, the server assigns a
 * logical-endpoint identifier.  This logical-endpoint identifier is required for sending
 * messages to, and receiving messages from, the server.
 * <p>
 * The directly-connected device is able to activate itself using the direct activation capability.
 * The data required for activation and authentication is retrieved from a TrustedAssetsStore
 * generated using the TrustedAssetsProvisioner tool using the Default TrustedAssetsManager.
 * <p>
 * This object represents the Virtualization API (high-level API) for the directly-connected device
 * and uses the MessageDispatcher for sending/receiving messages.  Also it implements the message
 * dispatcher, diagnostics and connectivity test capabilities.  Also it can be used for creating
 * virtual devices.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation. This is optional. If none is given the default global library parameter
 *        is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 * @param {boolean} [gateway] - <code>true</code> to indicate creation of a GatewayDevice
 *        representation.
 *
 * @alias iotcs.device.DirectlyConnectedDevice
 * @class iotcs.device.DirectlyConnectedDevice
 * @extends iotcs.Client
 * @memberof iotcs.device
 * @see {@link iotcs.device.util.MessageDispatcher}
 */
iotcs.device.DirectlyConnectedDevice = class extends iotcs.Client {
    constructor(taStoreFile, taStorePassword, gateway) {
        super();

        /**
         * @type {DirectlyConnectedDevice|GatewayDevice}
         *
         * @ignore
         */
        this._internalDev = gateway ?
            new iotcs.device.util.GatewayDevice(taStoreFile, taStorePassword) :
            new iotcs.device.util.DirectlyConnectedDevice(taStoreFile, taStorePassword);

        this._virtualDevices = {};
        this.messageDispatcher = new iotcs.device.util.MessageDispatcher(this._internalDev);
        this.messageDispatcher.onDelivery = this._messageResponseHandler;
        this.messageDispatcher.onError = this._messageResponseHandler;
        this.storageDispatcher = new iotcs.device.util.StorageDispatcher(this._internalDev);
        this.storageDispatcher.onProgress = this._storageHandler;
    }

    // Private/protected functions
    _addVirtualDevice(device){
        this._removeVirtualDevice(device);

        if (!this._virtualDevices[device.getEndpointId()]) {
            this._virtualDevices[device.getEndpointId()] = {};
        }
        this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn] = device;
    }

    _messageResponseHandler(messages, exception) {
        let deviceMap = {};
        let self = this;

        messages.forEach(messageObj => {
            let message = messageObj.getJSONObject();

            if ((message.type === iotcs.message.Message.Type.DATA) &&
                message.payload.data &&
                message.payload.format &&
                (message.payload.format.indexOf(':attributes') > -1))
            {
                let model = message.payload.format.substring(0,
                    message.payload.format.indexOf(':attributes'));

                let devId = message.source;

                if (!(devId in deviceMap)) {
                    deviceMap[devId] = {};
                }

                if (!(model in deviceMap)) {
                    deviceMap[devId][model] = {};
                }

                for (let key in message.payload.data) {
                    deviceMap[devId][model][key] = message.payload.data[key];
                }
            } else if (((message.type === iotcs.message.Message.Type.ALERT) ||
                        (message.type === iotcs.message.Message.Type.DATA)) &&
                       message.payload.format)
            {
                let devId1 = message.source;

                if (!(devId1 in deviceMap)) {
                    deviceMap[devId1] = {};
                }

                let format = message.payload.format;

                if (devId1 in self._virtualDevices) {
                    for (let model1 in self._virtualDevices[devId1]) {
                        if (format in self._virtualDevices[devId1][model1]) {
                            if (!(model1 in deviceMap)) {
                                deviceMap[devId1][model1] = {};
                            }

                            deviceMap[devId1][model1][format] = message.payload.data;
                        }
                    }
                }
            }
        });

        for (let deviceId in deviceMap) {
            for (let deviceModel in deviceMap[deviceId]) {
                if ((deviceId in self._virtualDevices) &&
                    (deviceModel in self._virtualDevices[deviceId]))
                {
                    let device = self._virtualDevices[deviceId][deviceModel];
                    let attributeNameValuePairs = deviceMap[deviceId][deviceModel];
                    let attrObj = {};
                    let newValObj = {};
                    let tryValObj = {};

                    for (let attributeName in attributeNameValuePairs) {
                        let attribute = device[attributeName];

                        if (attribute && (attribute instanceof iotcs.device.impl.Attribute)) {
                            attribute._onUpdateResponse(exception);
                            attrObj[attribute.id] = attribute;
                            newValObj[attribute.id] = attribute.value;
                            tryValObj[attribute.id] = attributeNameValuePairs[attributeName];

                            if (exception && attribute.onError) {
                                let onAttributeErrorTuple = {
                                    attribute: attribute,
                                    newValue: attribute.value,
                                    tryValue: attributeNameValuePairs[attributeName],
                                    errorResponse: exception
                                };

                                attribute._onError(onAttributeErrorTuple);
                            }
                        } else if (attribute && (attribute.type === 'ALERT')) {
                            attrObj[attribute.urn] = new iotcs.device.Alert(device, attribute.urn);
                            let data = attributeNameValuePairs[attributeName];

                            for (let key in data) {
                                attrObj[attribute.urn].fields[key] = data[key];
                            }
                        } else if (attribute && (attribute.type === 'DATA')) {
                            attrObj[attribute.urn] = new iotcs.device.Data(device, attribute.urn);
                            let data1 = attributeNameValuePairs[attributeName];

                            for (let key1 in data1) {
                                attrObj[attribute.urn].fields[key1] = data1[key1];
                            }
                        }
                    }

                    if (exception && device.onError) {
                        let onDeviceErrorTuple = {
                            attributes: attrObj,
                            newValues: newValObj,
                            tryValues: tryValObj,
                            errorResponse: exception
                        };

                        device.onError(onDeviceErrorTuple);
                    }
                }
            }
        }
    }

    _removeVirtualDevice(device) {
        if (this._virtualDevices[device.getEndpointId()]) {
            if (this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn]) {
                delete this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn];
            }

            if (Object.keys(this._virtualDevices[device.getEndpointId()]).length === 0) {
                delete this._virtualDevices[device.getEndpointId()];
            }
        }
    }

    _storageHandler(progress, error) {
        let storage = progress.getStorageObject();

        if (error) {
            if (storage._deviceForSync && storage._deviceForSync.onError) {
                let tryValues = {};
                tryValues[storage._nameForSyncEvent] = storage.getURI();

                let onDeviceErrorTuple = {
                    newValues: tryValues,
                    tryValues: tryValues,
                    errorResponse: error
                };

                storage._deviceForSync.onError(onDeviceErrorTuple);
            }
            return;
        }

        if (storage) {
            /** @type iotcs.StorageDispatcher.Progress */
            let state = progress.getState();
            let oldSyncStatus = storage.getSyncStatus();

            switch (state) {
            case iotcs.StorageDispatcher.Progress.State.COMPLETED:
                storage._syncStatus = iotcs.device.StorageObject.SyncStatus.IN_SYNC;
                break;
            case iotcs.StorageDispatcher.Progress.State.CANCELLED:
            case iotcs.StorageDispatcher.Progress.State.FAILED:
                storage._syncStatus = iotcs.device.StorageObject.SyncStatus.SYNC_FAILED;
                break;
            case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            case iotcs.StorageDispatcher.Progress.State.INITIATED:
            case iotcs.StorageDispatcher.Progress.State.QUEUED:
                // do nothing
            }

            if (oldSyncStatus !== storage.getSyncStatus()) {
                storage._handleStateChange();

                if (storage._onSync) {
                    let syncEvent;

                    while ((syncEvent = storage._syncEvents.pop()) != null) {
                        storage._onSync(syncEvent);
                    }
                }
            }
        }
    }

    // Public functions
    /**
     * Activate the device.  The device will be activated on the server if necessary.  When the
     * device is activated on the server. The activation would tell the server the models that the
     * device implements. Also the activation can generate additional authorization information that
     * will be stored in the TrustedAssetsStore and used for future authentication requests.  This
     * can be a time/resource consuming operation for some platforms.
     * <p>
     * If the device is already activated, this method will throw an exception.  The user should call
     * the isActivated() method prior to calling activate.
     *
     * @function activate
     * @memberOf iotcs.device.DirectlyConnectedDevice
     *
     * @param {string[]} deviceModelUrns - An array of deviceModel URNs implemented by this directly
     *        connected device.
     * @param {function} callback - The callback function.  This function is called with this object
     *        but in the activated state.  If the activation is not successful then the object will
     *        be <code>null</code> and an error object is passed in the form callback(device, error)
     *        and the reason can be taken from error.message.
     */
    activate(deviceModelUrns, callback) {
        if (this.isActivated()) {
            iotcs.error('Cannot activate an already activated device.');
            return;
        }

        _mandatoryArg(deviceModelUrns, 'array');
        _mandatoryArg(callback, 'function');

        deviceModelUrns.forEach(urn => {
            _mandatoryArg(urn, 'string');
        });

        let deviceModels = deviceModelUrns;
        deviceModels.push('urn:oracle:iot:dcd:capability:diagnostics');
        deviceModels.push('urn:oracle:iot:dcd:capability:message_dispatcher');
        deviceModels.push('urn:oracle:iot:dcd:capability:device_policy');

        this._internalDev.activate(deviceModels, (activeDev, error) => {
            if (!activeDev || error) {
                callback(null, error);
                return;
            }

            callback(this);
        });
    }

    /**
     * This method will close this directly connected device (client) and
     * all it's resources. All monitors required by the message dispatcher
     * associated with this client will be stopped and all created virtual
     * devices will be removed.
     *
     * @memberof iotcs.device.DirectlyConnectedDevice
     * @function close
     */
    close() {
        this._internalDev.close();

        for (let key in this._virtualDevices) {
            for (let key1 in this._virtualDevices[key]) {
                this._virtualDevices[key][key1].close();
            }
        }
    }

    /**
     * Create a VirtualDevice instance with the given device model for the given device identifier.
     * This method creates a new VirtualDevice instance for the given parameters. The client library
     * does not cache previously created VirtualDevice objects.
     * <p>
     * A device model can be obtained by it's afferent URN with the DirectlyConnectedDevice if it is
     * registered on the cloud.
     *
     * @function createVirtualDevice
     * @memberof iotcs.device.DirectlyConnectedDevice
     * @see {@link iotcs.device.DirectlyConnectedDevice#getDeviceModel}
     *
     * @param {string} endpointId - The endpoint identifier of the device being modeled.
     * @param {object} deviceModel - The device model object holding the full description of that
     *        device model that this device implements.
     * @returns {iotcs.device.VirtualDevice} The newly created virtual device.
     */
    createVirtualDevice(endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');

        // // Add the device policy manager for the Gateway.
        // let persistenceStore = PersistenceStoreManager._get(endpointId);
        // let devicePolicyManager = new DevicePolicyManager(this);
        // console.log('DirectlyConnectedDevice devicePolicyManager for endpointId: ' + this._.internalDev.getEndpointId() + ' = ' + devicePolicyManager);
        //
        // if (devicePolicyManager) {
        //     persistenceStore
        //         ._openTransaction()
        //         ._putOpaque('DevicePolicyManager', devicePolicyManager)
        //         ._commit();
        // }

        // let dcd = new iotcs.device.DirectlyConnectedDevice(
        //     this._.internalDev._.internalDev._.tam.taStoreFile,
        //     this._.internalDev._.internalDev._.tam.sharedSecret,
        //     this);

        return new iotcs.device.VirtualDevice(endpointId, deviceModel, this);
    }

    /**
     * @inheritdoc
     */
    getDeviceModel(deviceModelUrn, callback) {
        return this._internalDev.getDeviceModel(deviceModelUrn, callback);
    }

    /**
     * Return the logical-endpoint identifier of this directly-connected device.  The logical-endpoint
     * identifier is assigned by the server as part of the activation process.
     *
     * @function getEndpointId
     * @memberof iotcs.device.DirectlyConnectedDevice
     *
     * @returns {string} The logical-endpoint identifier of this directly-connected device.
     */
    getEndpointId() {
        return this._internalDev.getEndpointId();
    }

    /**
     * This will return the directly connected device activated state.
     *
     * @function isActivated
     * @memberof iotcs.device.DirectlyConnectedDevice
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        return this._internalDev.isActivated();
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/GatewayDevice.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This represents a GatewayDevice in the Virtualization API.  It has the exact same specifications
 * and capabilities as a directly connected device from the Virtualization API and additionally it
 * has the capability to register indirectly connected devices.
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.device.GatewayDevice
 * @class iotcs.device.GatewayDevice
 * @extends iotcs.device.DirectlyConnectedDevice
 * @memberof iotcs.device
 */
iotcs.device.GatewayDevice = class extends iotcs.device.DirectlyConnectedDevice {
    constructor(taStoreFile, taStorePassword) {
        super((taStoreFile ? taStoreFile : null), (taStorePassword ? taStorePassword : null),
              true);
    }

    /**
     * Register an indirectly-connected device with the cloud service and specify whether the gateway
     * device is required to have the appropriate credentials for activating the indirectly-connected
     * device.
     *
     * The <code>restricted</code> parameter controls whether or not the client library is
     * <em>required</em> to supply credentials for activating the indirectly-connected device.  The
     * client library will <em>always</em> supply credentials for an indirectly-connected device
     * whose trusted assets have been provisioned to the client.  If, however, the trusted assets of
     * the * indirectly-connected device have not been provisioned to the client, the client library
     * can create credentials that attempt to restrict the indirectly connected device to this
     * gateway device.
     *
     * The <code>restricted</code> parameter could be omitted. This is the equivalent of calling
     * <code>iotcs.device.util.GatewayDevice.registerDevice(false, hardwareId, metaData,
     * deviceModels, callback)</code>.
     *
     * Pass <code>true</code> for the <code>restricted</code> parameter to ensure the
     * indirectly-connected device cannot be activated by this gateway device without presenting
     * credentials.  If <code>restricted</code> is <code>true</code>, the client library will
     * provide credentials to the server.  The server will reject the activation request if the
     * indirectly * connected device is not allowed to roam to this gateway device.
     *
     * Pass <code>false</code> to allow the indirectly-connected device to be activated without
     * presenting credentials if the trusted assets of the indirectly-connected device have not been
     * provisioned to the client.  If <code>restricted</code> is <code>false</code>, the client
     * library * will provide credentials if, and only if, the credentials have been provisioned to
     * the client.  The server will reject the activation if credentials are required but not
     * supplied, or if the provisioned credentials do not allow the indirectly connected device to
     * roam to this gateway * device.
     *
     * The <code>hardwareId</code> is a unique identifier within the cloud service instance and may
     * not be <code>null</code>.  If one is not present for the device, it should be generated based
     * on other metadata such as: model, manufacturer, serial number, etc.
     *
     * The <code>metaData</code> Object should typically contain all the standard metadata (the
     * constants documented in this class) along with any other vendor defined metadata.
     *
     * @param {boolean} [restricted] - <code>true</code> if the client library is <em>required</em>
     *        to supply credentials for activating the indirectly-connected device.
     * @param {!string} hardwareId - An identifier unique within the Cloud Service instance.
     * @param {object} metaData - The metadata of the device.
     * @param {string[]} deviceModelUrns - An array of device model URNs supported by the indirectly
     *        connected device.
     * @param {function(Object)} callback - The callback function.  This function is called with the
     *        following argument: the endpoint ID of the indirectly-connected device is the
     *        registration was successful or <code>null</code> and an error object as the second
     *        parameter: callback(id, error).  The reason can be retrieved from error.message and it
     *        represents the actual response from the server or any other network or framework error
     *        that can appear.
     *
     * @function registerDevice
     * @memberof iotcs.device.GatewayDevice
     * @see {@link iotcs.device.GatewayDevice.DeviceMetadata}
     */
    registerDevice(restricted, hardwareId, metaData, deviceModelUrns, callback) {
        if (arguments.length == 4) {
            hardwareId = arguments[0];
            metaData = arguments[1];
            deviceModelUrns = arguments[2];
            callback = arguments[3];
            restricted = false;
        }

        this._internalDev.registerDevice(restricted, hardwareId, metaData, deviceModelUrns,
                                         callback);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/GatewayDeviceMetadata.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * Enumeration of the standard properties that can be used in the metadata object given as parameter
 * on indirect registration.
 *
 * @alias DeviceMetadata
 * @class
 * @enum {string}
 * @memberOf iotcs.device.GatewayDevice
 * @readonly
 * @see {@link iotcs.device.GatewayDevice#registerDevice}
 * @static
 */
iotcs.device.GatewayDevice.DeviceMetadata = {
    MANUFACTURER: "manufacturer",
    MODEL_NUMBER: "modelNumber",
    SERIAL_NUMBER: "serialNumber",
    DEVICE_CLASS: "deviceClass",
    PROTOCOL: "protocol",
    PROTOCOL_DEVICE_CLASS: "protocolDeviceClass",
    PROTOCOL_DEVICE_ID: "protocolDeviceId",
};

Object.freeze(iotcs.device.GatewayDevice.DeviceMetadata);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/NamedValue.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A name-value pair in an event.  Typically, the name is the name of an attribute, and value is the
 * attribute's value.  But a name-value pair could also be the name of a field in a format, or the
 * name of an action.
 *
 * @classdesc
 * @ignore
 */
iotcs.impl.NamedValue = class {
    /**
     * Constructs a NamedValue.
     *
     * @param {!string} name - The name of the value.
     * @param {*} value - The value.
     *
     * @class
     */
    constructor(name, value) {
        /**
         * The name of the value.
         *
         * @type {string}
         */
        this._name = name;

        /**
         * The value.
         *
         * @type {*}
         */
        this._value = value;

        /**
         * The next value in the chain.
         *
         * @type {NamedValue}
         */
        this._nextNamedValue = undefined;
    }

    /**
     * Get the name.
     *
     * @return {string} The name.
     */
    getName() {
        return this._name;
    }

    /**
     * Get the value.
     *
     * @return {*} The value.
     */
    getValue() {
        return this._value;
    }

    /**
     * Get the next name-value pair in the event.  This method returns <code>null</code> if there
     * are no more name-value pairs.
     *
     * @return {NamedValue} The next name-value pair, or <code>null</code>.
     */
    next() {
        return this._nextNamedValue;
    }

    /**
     * Sets the next name-value pair.
     *
     * @param {NamedValue} next - The next name-value pair.
     */
    setNext(next) {
        this._nextNamedValue = next;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/ActionEvent.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An action event.
 *
 * @alias iotcs.ActionEvent
 * @class
 */
iotcs.impl.ActionEvent = class {
    /**
     * Constructs an ActionEvent.
     *
     * @param {VirtualDevice} virtualDevice - The virtual device associated with the action.
     * @param {string} actionName - The name of the action.
     * @param {NamedValue} namedValue - A named value of action arguments.
     */
    constructor(virtualDevice, actionName, namedValue) {
        if (!virtualDevice || !actionName) {
            iotcs.error('Error constructing ActionEvent.  VirtualDevice and actionName cannot be ' +
                        'null.');
        }

        this._virtualDevice = virtualDevice;
        this._actionName = actionName;
        this._namedValue = namedValue;
    }

    // Private/protected functions
    // Public functions
    /**
     * Get the action name.
     *
     * @return {string} The action name, never <code>null</code>.
     */
    getName() {
        return this._actionName;
    }

    /**
     * Get the name-value pair.
     *
     * @return {NamedValue} The name-value pair, never <code>null</code>.
     */
    getNamedValue() {
        return this._namedValue;
    }

    /**
     * Get the virtual device that is the source of the event.
     *
     * @return {VirtualDevice} The virtual device, never <code>null</code>.
     */
    getVirtualDevice() {
        return this._virtualDevice;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/VirtualDevice.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * VirtualDevice is a representation of a device model
 * implemented by an endpoint. A device model is a
 * specification of the attributes, formats, and resources
 * available on the endpoint.
 * <p>
 * This VirtualDevice API is specific to the device
 * client. This implements the alerts defined in the
 * device model and can be used for raising alerts to
 * be sent to the server for the device. Also it has
 * action handlers for actions that come as requests
 * from the server side.
 * <p>
 * A device model can be obtained by it's afferent urn with the
 * DirectlyConnectedDevice if it is registered on the cloud.
 * <p>
 * The VirtualDevice has the attributes, actions and alerts of the device
 * model as properties and it provides functionality to the device
 * model in the following ways:
 * <p>
 * <b>Get the value of an attribute:</b><br>
 * <code>let value = device.temperature.value;</code><br>
 * <p>
 * <b>Get the last known value of an attribute:</b><br>
 * <code>let lastValue = device.temperature.lastKnownValue;</code><br>
 * <p>
 * <b>Set the value of an attribute (with update on cloud and error callback handling):</b><br>
 * <code>device.temperature.onError = function (errorTuple);</code><br>
 * <code>device.temperature.value = 27;</code><br>
 * where errorTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , tryValue: ... , errorResponse: ...}</code>.
 * The library will throw an error in the value to update is invalid
 * according to the device model.
 * <p>
 * <b>Monitor a specific attribute for any value change (that comes from the cloud):</b><br>
 * <code>device.maxThreshold.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , oldValue: ...}</code>.
 * To tell the cloud that the attribute update has failed
 * an error must be thrown in the onChange function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor a specific action that was requested from the server:</b><br>
 * <code>device.reset.onAction = function (value);</code><br>
 * where value is an optional parameter given if the action has parameters
 * defined in the device model. To tell the cloud that an action has failed
 * an error must be thrown in the onAction function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor all attributes for any value change (that comes from the cloud):</b><br>
 * <code>device.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object with array type properties of the form
 * <code>[{attribute: ... , newValue: ... , oldValue: ...}]</code>.
 * To tell the cloud that the attribute update has failed
 * an error must be thrown in the onChange function, otherwise the
 * library will send an OK response message to the cloud.
 * <p>
 * <b>Monitor all update errors:</b><br>
 * <code>device.onError = function (errorTuple);</code><br>
 * where errorTuple is an object with array type properties (besides errorResponse) of the form
 * <code>{attributes: ... , newValues: ... , tryValues: ... , errorResponse: ...}</code>.
 * <p>
 * <b>Raising alerts:</b><br>
 * <code>let alert = device.createAlert('urn:com:oracle:iot:device:temperature_sensor:too_hot');</code><br>
 * <code>alert.fields.temp = 100;</code><br>
 * <code>alert.fields.maxThreshold = 90;</code><br>
 * <code>alert.raise();</code><br>
 * If an alert was not sent the error is handled by the device.onError handler where errorTuple has
 * the following structure:<br>
 * <code>{attributes: ... , errorResponse: ...}</code><br>
 * where attributes are the alerts that failed with fields already set, so the alert can be retried
 * only by raising them.
 * <p>
 * <b>Sending custom data fields:</b><br>
 * <code>let data = device.createData('urn:com:oracle:iot:device:motion_sensor:rfid_detected');</code><br>
 * <code>data.fields.detecting_motion = true;</code><br>
 * <code>data.submit();</code><br>
 * If the custom data fields were not sent, the error is handled by the device.onError handler where errorTuple has
 * the following structure:<br>
 * <code>{attributes: ... , errorResponse: ...}</code><br>
 * where attributes are the Data objects that failed to be sent with fields already set, so the Data objects can be retried
 * only by sending them.
 * <p>
 * A VirtualDevice can also be created with the appropriate
 * parameters from the DirectlyConnectedDevice.
 *
 * @param {string} endpointId - The endpoint ID of this device.
 * @param {object} deviceModel - The device model object holding the full description of that device
 *        model that this device implements.
 * @param {iotcs.device.DirectlyConnectedDevice} client - The device client used as message
 *        dispatcher for this virtual device.
 *
 * @see {@link DirectlyConnectedDevice#getDeviceModel|iotcs.device.DirectlyConnectedDevice#getDeviceModel}
 * @see {@link DirectlyConnectedDevice#createVirtualDevice|iotcs.device.DirectlyConnectedDevice#createVirtualDevice}
 *
 * @alias iotcs.device.VirtualDevice
 * @class iotcs.device.VirtualDevice
 * @extends iotcs.AbstractVirtualDevice
 * @memberof iotcs.device
 */
iotcs.device.VirtualDevice = class extends iotcs.AbstractVirtualDevice {
    constructor(endpointId, deviceModel, dcd) {
        super(endpointId, deviceModel);
        // Instance "variables"/properties...see constructor.
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');
        _mandatoryArg(dcd, iotcs.device.DirectlyConnectedDevice);

        // The device client used as a message dispatcher for this virtual device.
        /** @type {DirectlyConnectedDevice} */
        this._dcd = dcd;

        let persistenceStore = iotcs.device.impl.PersistenceStoreManager._get(endpointId);
        this._devicePolicyManager = new iotcs.device.impl.DevicePolicyManager(dcd);

        if (this._devicePolicyManager) {
            persistenceStore
                ._openTransaction()
                ._putOpaque('DevicePolicyManager', this._devicePolicyManager)
                ._commit();
        }

        // actionCallbackMap is a mapping from action name to a callback.
        /** @type {Map<string, function>} */
        this._actionCallbackMap = undefined;
        // callableMap is a mapping from action name to an oracle.iot.client.device.VirtualDevice.Callable.
        /** @type {Map<string, function>} */
        this._callableMap = new Map();
        // DJM: This references a class function inside the constructor...is this OK?
        this._attributeMap = this._createAttributeMap(this, deviceModel);
        this._messageDispatcher = new iotcs.device.util.MessageDispatcher(this._dcd._internalDev);
        let messageDispatcher = this._messageDispatcher; // TODO: fix references to local dispatcher.
        this._attributes = this;

        // The key is the set of attributes that are referred to in the computedMetric formula.
        // The value is the attribute that is computed.
        /** @type {Set<Pair<Set<string>, string>>} */
        this._computedMetricTriggerMap = new Set();
        /** @type {DevicePolicyManager} */
        this._devicePolicyManager =
            iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(endpointId);
        this._devicePolicyManager._addChangeListener(this);
        // Millisecond time in the future at which the policy value should be computed.
        /** @type {number} */
        this._expiry = 0;
        // {Map<string, Set<Map<string, object>>>}
        this._pipelineDataCache = new Map();
        // { attributeName : pipelineIndex }
        /** @type {Map<string, number>} */
        this._pipelineIndices = new Map();
        // Window based policy support (as in "window", not Windows OS). Have one scheduled task for
        // each policy "slide" value. The slide value is how much to move the window, so we want to run
        // the policy when the slide expires. When the slide expires, the runnable will call back each
        // VirtualDeviceAttribute that has a policy for that slide value.
        // Window and slide are the key.
        // { {window,slide} : ScheduledPolicyData }
        /** @type {Map<ScheduledPolicyDataKey, ScheduledPolicyData>} */
        this._scheduledPolicies = new Map();
        // How much the window moves is used to calculate expiry.
        /** @type {number} */
        this._slide = 0;
        /** @type {TimedPolicyThread} */
        this._timedPolicyThread = new iotcs.device.impl.TimedPolicyThread(this);

        let self = this;

        let attributeHandler = requestMessage => {
            let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

            if (!method || (method !== 'PUT')) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                  iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
            }

            let urlAttribute =
                requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

            if ((urlAttribute in self._attributes) &&
                (self._attributes[urlAttribute] instanceof iotcs.device.impl.Attribute))
            {
                try {
                    let attribute = self._attributes[urlAttribute];
                    let data = null;
                    let isDone = false;

                    try {
                        data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                          iotcs.StatusCode.BAD_REQUEST, '');
                    }

                    let oldValue = attribute.value;

                    if (!data ||
                        (typeof data.value === 'undefined') ||
                        !attribute._isValidValue(data.value))
                    {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                          iotcs.StatusCode.BAD_REQUEST, '');
                    }

                    // DJM: Lexical this OK here?
                    this.attribute._getNewValue(data.value, self, (attributeValue, isSync) => {
                        let onChangeTuple = {
                            attribute: attribute,
                            newValue: attributeValue,
                            oldValue: oldValue
                        };

                        if (attribute.onChange) {
                            attribute.onChange(onChangeTuple);
                        }

                        if (self.onChange) {
                            self.onChange([onChangeTuple]);
                        }

                        attribute._remoteUpdate(attributeValue);
                        let message = new iotcs.message.Message();

                        message
                            .type(iotcs.message.Message.Type.DATA)
                            .source(this.getEndpointId())
                            .format(this.deviceModel.urn + ":attributes");

                        message.dataItem(urlAttribute, attributeValue);
                        messageDispatcher.queue(message);

                        if (isSync) {
                            isDone = true;
                        } else {
                            messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage,
                                                                                                iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                        }
                    });

                    if (isDone) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                          '');
                    } else {
                        return iotcs.message.Message.buildResponseWaitMessage();
                    }
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                      iotcs.StatusCode.BAD_REQUEST, '');
                }
            } else {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                  '');
            }
        };

        let attributes = self._deviceModel.attributes;

        for (let indexAttr in attributes) {
            let attribute = new iotcs.device.impl.Attribute(attributes[indexAttr]);

            if (attributes[indexAttr].alias) {
                iotcs.AbstractVirtualDevice._link(attributes[indexAttr].alias, this, attribute);
                messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                                'deviceModels/' + self._deviceModel.urn + '/attributes/' +
                                                                                attributes[indexAttr].alias, attributeHandler);
            }

            iotcs.AbstractVirtualDevice._link(attributes[indexAttr].name, this, attribute);
            messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                            'deviceModels/' + self._deviceModel.urn + '/attributes/' + attributes[indexAttr].name,
                                                                            attributeHandler);
        }

        this._actions = this;

        /**
         * Function which handles action requests from the server.
         *
         * @param {iotcs.message.Message} requestMessage - The message containing the action
         *        information.
         * @returns {iotcs.message.Message} - A response message with the results of invoking the
         *          action.
         */
        let actionHandler = requestMessage => {
            let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);
            let actionName =
                requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

            if (!method || (method !== 'POST')) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                  'Method Not Allowed.', '');
            }

            /** @typeof {object} JSON object. */
            let action = this._actions[actionName];

            if ((actionName in this._actions) &&
                (action instanceof iotcs.device.impl.ActionSpec) &&
                action.onAction)
            {
                try {
                    let action = this._actions[actionName];
                    /** @type {Map<string, object>} */
                    let actionArgs = [];
                    let data = null;
                    let isDone = false;

                    /**
                     * If argType is available, we have a legacy single-argument action.  If args is
                     * available, we have a new multi-argument action. 
                     */
                    if ((action._spec.argType)  || (action._spec.args)) {
                        try {
                            data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                        } catch (e) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN,
                                {}, 'Bad Request.', '');
                        }

                        if (!data) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN,
                                {}, iotcs.StatusCode.BAD_REQUEST, '');
                        }
                    } else {
                        // No-argument action.
                        data = {};
                    }

                    let dataLength = Object.keys(data).length;

                    if (dataLength === 1) {
                        // Single-argument action.
                        actionArgs.push(data);
                    } else if (dataLength > 1) {
                        // Multiple-arguments action.
                        // Dates need to be special-cased.
                        for (const key of Object.keys(data)) {
                            let arg;

                            for (let a of action._spec.args) {
                                if (key === a.name) {
                                    arg = a;
                                    break;
                                }
                            }

                            let value;

                            if (arg.type === 'DATETIME') {
                                value = new Date(parseInt(data[key]));
                            } else {
                                value = data[key];
                            }

                            actionArgs.push({'key': key, 'value': value});
                        }
                    }

                    if (actionArgs.length === 0) {
                        action._validateArgument(undefined, undefined, self,
                                                 (argName, argValue, virtualDevice, isSync) => {
                                                     let actionEvent = new iotcs.impl.ActionEvent(self, actionName);
                                                     action.onAction(actionEvent);

                                                     if (isSync) {
                                                         isDone = true;
                                                     } else {
                                                         messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                             requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                     }
                                                 });
                    } else if (actionArgs.length === 1) {
                        // Single action argument validation.
                        action._validateArgument(actionArgs[0].key, actionArgs[0].value, self,
                                                 (argName, argValue, virtualDevice, isSync) => {
                                                     let namedValue = new iotcs.impl.NamedValue(argName, argValue);
                                                     let actionEvent = new iotcs.impl.ActionEvent(virtualDevice, actionName, namedValue);
                                                     action.onAction(actionEvent);

                                                     if (isSync) {
                                                         isDone = true;
                                                     } else {
                                                         messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                             requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                     }
                                                 });
                    } else {
                        // Multiple action argument validation.
                        action._validateArguments(actionArgs, self,
                                                  (args, virtualDevice, isSync) => {
                                                      let namedValue = undefined;
                                                      let firstNamedValue = undefined;

                                                      // Create NamedValue objects for all args in the order they appear in
                                                      // the device model.
                                                      for (let i = 0; i < action._spec.args.length; i++) {
                                                          let specArgName = action._spec.args[i].name;

                                                          /** @typeof {object[]} */
                                                          for (let arg of args) {
                                                              if (arg.key === specArgName) {
                                                                  let nv = new iotcs.impl.NamedValue(arg.key, arg.value);

                                                                  if (namedValue) {
                                                                      namedValue.setNext(nv);
                                                                      namedValue = nv;
                                                                  } else {
                                                                      firstNamedValue = namedValue = nv;
                                                                  }

                                                                  break;
                                                              }
                                                          }
                                                      }

                                                      let actionEvent = new iotcs.impl.ActionEvent(virtualDevice, actionName,
                                                                                        firstNamedValue);

                                                      action.onAction(actionEvent);

                                                      if (isSync) {
                                                          isDone = true;
                                                      } else {
                                                          messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(
                                                              requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                                      }
                                                  });
                    }

                    if (isDone) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                          '');
                    } else {
                        return iotcs.message.Message.buildResponseWaitMessage();
                    }
                } catch (e) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.INTERNAL_SERVER_ERROR, {},
                                                                      iotcs.StatusCode.INTERNAL_SERVER_ERROR, '');
                }
            } else {
                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                  '');
            }
        };

        let actions = this._deviceModel.actions;

        for (let indexAction in actions) {
            let actionSpec = new iotcs.device.impl.ActionSpec(actions[indexAction]);

            if (actions[indexAction].alias) {
                iotcs.AbstractVirtualDevice._link(actions[indexAction].alias, this._actions, actionSpec);

                messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                                'deviceModels/' + this._deviceModel.urn + '/actions/' + actions[indexAction].alias,
                                                                                actionHandler);
            }

            iotcs.AbstractVirtualDevice._link(actions[indexAction].name, this._actions, actionSpec);

            messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId,
                                                                            'deviceModels/' + this._deviceModel.urn + '/actions/' + actions[indexAction].name,
                                                                            actionHandler);
        }

        if (this._deviceModel.formats) {
            this._alerts = this;
            this._dataFormats = this;

            // DJM: Lexeical this OK here?
            this._deviceModel.formats.forEach(format => {
                if (format.type && format.urn) {
                    if (format.type === 'ALERT') {
                        this._alerts[format.urn] = format;
                    }

                    if (format.type === 'DATA') {
                        this._dataFormats[format.urn] = format;
                    }
                }
            });
        }

        messageDispatcher.getRequestDispatcher().registerRequestHandler(endpointId, 'deviceModels/' +
            this._deviceModel.urn + '/attributes', requestMessage =>
            {
                let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

                if (!method || (method !== 'PATCH')) {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                                      iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
                }

                if (this.onChange) {
                    try {
                        let data = null;

                        try {
                            data = JSON.parse(iotcs.impl.Platform.Util._atob(requestMessage.payload.body));
                        } catch (e) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                              iotcs.StatusCode.BAD_REQUEST, '');
                        }

                        if (!data) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                              iotcs.StatusCode.BAD_REQUEST, '');
                        }
                        
                        let tupleArray = [];
                        let index = 0;
                        let isDoneForEach = new Array(Object.keys(data).length);
                        isDoneForEach.fill(false);

                        Object.keys(data).forEach(attributeName => {
                            let attribute = this._attributes[attributeName];

                            if (!attribute) {
                                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                                  iotcs.StatusCode.BAD_REQUEST, '');
                            }

                            let oldValue = attribute.value;

                            if (!attribute._isValidValue(data[attributeName])) {
                                return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {},
                                                                                  iotcs.StatusCode.BAD_REQUEST, '');
                            }

                            attribute._getNewValue(data[attributeName], this,
                                (attributeValue, isSync) =>
                            {
                                let onChangeTuple = {
                                    attribute: attribute,
                                    newValue: attributeValue,
                                    oldValue: oldValue
                                };

                                if (attribute.onChange) {
                                    attribute.onChange(onChangeTuple);
                                }

                                tupleArray.push(onChangeTuple);

                                if (isSync) {
                                    isDoneForEach[index] = true;
                                }

                                if (++index === Object.keys(data).length) {
                                    // Run after last attribute handle.
                                    this._onChange(tupleArray);

                                    let message = new iotcs.message.Message();

                                    message
                                        .type(iotcs.message.Message.Type.DATA)
                                        .source(this.getEndpointId())
                                        .format(this._deviceModel.urn + ":attributes");

                                    Object.keys(data).forEach(attributeName1 => {
                                        let attribute1 = this._attributes[attributeName1];

                                        let attributeValue1 = tupleArray.filter(tuple => {
                                            return tuple.attribute === attribute1;
                                        }, attribute1)[0].newValue;

                                        attribute1._remoteUpdate(attributeValue1);
                                        message.dataItem(attributeName1, attributeValue1);
                                    });

                                    messageDispatcher.queue(message);
                                    // one of async attribute handle will be the last
                                    // check if at least one async attribute handle was called
                                    if (isDoneForEach.indexOf(false) !== -1) {
                                        messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE, ''));
                                    }
                                }
                            });
                        });

                        if (isDoneForEach.indexOf(false) === -1) {
                            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, iotcs.StatusCode.OK_MESSAGE,
                                                                              '');
                        } else {
                            return iotcs.message.Message.buildResponseWaitMessage();
                        }
                    } catch (e) {
                        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.INTERNAL_SERVER_ERROR, {},
                                                                          iotcs.StatusCode.INTERNAL_SERVER_ERROR, '');
                    }
                } else {
                    return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.NOT_FOUND, {}, iotcs.StatusCode.NOT_FOUND_MESSAGE,
                                                                      '');
                }
            });

        // seal object
        Object.preventExtensions(this);
        this._dcd._addVirtualDevice(this);
    }

    // Private/protected functions
    /**
     * @ignore
     *
     * @param {number} window
     * @param {number} slide
     * @param {number} timeZero
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _addScheduledPolicy(window, slide, timeZero, attributeName, pipelineIndex) {
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy called.');
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy window = ' + window);
        /** @type {ScheduledPolicyDataKey} */
        const key = new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
        /** @type {ScheduledPolicyData} */
        let scheduledPolicyData = this._scheduledPolicies.get(key);
        iotcs.impl.Platform._debug('VirtualDevice.addScheduledPolicy scheduledPolicyData = ' +
                        scheduledPolicyData);

        if (!scheduledPolicyData) {
            scheduledPolicyData =
                new iotcs.device.impl.ScheduledPolicyData(window, slide, timeZero);
            this._scheduledPolicies.set(key, scheduledPolicyData);
            this._timedPolicyThread._addTimedPolicyData(scheduledPolicyData);

            if (!this._timedPolicyThread._isAlive() && !this._timedPolicyThread._isCancelled()) {
                this._timedPolicyThread._start();
            }
        }

        scheduledPolicyData._addAttribute(attributeName, pipelineIndex);
    }

    /**
     * Invoke an action callback.
     *
     * @param {string} actionName - The name of the action from the device model.
     * @param {Map<string, *>} argumentValues - A map of argument names to values.
     * @return a success or failure status code.
     */
    _callImpl(actionName, argumentValues) {
        // If actionCallbackMap has the action name or "*" (all actions), or if callableMap (legacy)
        // contains the action name, then handle the action.
        /** @type {function} */
        const specificActionCallback =
              this._actionCallbackMap ? this._actionCallbackMap.get(actionName) : null;
        /** @type {function} */
        const allActionsCallback =
              this._actionCallbackMap ? this._actionCallbackMap.get("*") : null;
        /** @type {function} */
        const callable = this._callableMap ? this._callableMap.get(actionName) : null;

        if (!specificActionCallback && !allActionsCallback && !callable) {
            return StatusCode.NOT_IMPLEMENTED;
            //DJM: Where does requestMessage come from?
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.FORBIDDEN, {}, iotcs.StatusCode.BAD_REQUEST,
                                                            '');
        }

        try {
            /** @type {DeviceModelAction} */
            // DJM: Where is this function?  There is enterprise.Action.getDeviceModelAction...is
            //      this what we want?...wrong package if so.
            // DJM: Where is base defined?
            const deviceModelAction = Action.getDeviceModelAction(base.getDeviceModel(), actionName);

            if (!deviceModelAction) {
                return StatusCode.BAD_REQUEST;
            }

            /** @type {NamedValue} */
            const args = this._getActionArguments(deviceModelAction, argumentValues);

            /** @type {ActionEvent} */
            const actionEvent = new ActionEvent(this, actionName, args);

            if (specificActionCallback) {
                specificActionCallback.onAction(actionEvent);
            }

            if (allActionsCallback) {
                allActionsCallback.onAction(actionEvent);
            }

            if (callable) {
                /** @type {object} */
                const data = args ? args.getValue() : null;
                callable.call(this, data);
            }
            return StatusCode.ACCEPTED;
        } catch (error) {
            // The call method may throw errors. Since the client library has no knowledge of what these
            // might be, the Error is caught here.
            console.log(this.getEndpointId() + " : Call  : " + error);
            return StatusCode.BAD_REQUEST;
        }
    }

    /**
     * @ignore
     *
     * @param {Set<string>} updatedAttributes
     * @return {Set<string>}
     */
    _checkComputedMetrics(updatedAttributes) {
        if (!updatedAttributes || (updatedAttributes.size === 0)) {
            return new Set();
        }

        if (this._computedMetricTriggerMap.size === 0) {
            return new Set();
        }

        // This will be the set of attributes that have computed metrics
        // that are triggered by the set of updated attributes.
        /** @type {Set<string>} */
        let computedAttributes = new Set();

        // key is @type {Set<string>}, value is @type {string}.
        this._computedMetricTriggerMap.forEach((value, key) => {
            // If the set of attributes that the formula refers to
            // is a subset of the updated attributes, then compute
            // the value of the attribute.
            if (key.every(val => updatedAttributes.has(val))) {
                computedAttributes.add(value);
            }
        });

        if (computedAttributes.size > 0) {
            /** @type {Iterator<string>} */
            let computedAttributesAry = Array.from(computedAttributes.entries());

            for (let i = computedAttributesAry.length - 1; i > 0; i--) {
                /** @type {string} */
                const attributeName = computedAttributesAry[i];
                const attribute = this.getAttribute(attributeName);

                if (!attribute.isSettable()) {
                    iotcs.impl.Platform._debug('Attempt to modify read-only attribute "' + attributeName + '"');
                    computedAttributes.delete(attributeName);
                    continue;
                }

                /** @type {DevicePolicy} */
                // DJM: Where does endpointId come from?
                const devicePolicy = this._devicePolicyManager._getPolicy(this._deviceModel.urn,
                                                                          endpointId);

                if (!devicePolicy) {
                    continue;
                }

                /** @type {Set<DevicePolicyFunction>} */
                const pipeline = devicePolicy._getPipeline(attributeName);

                if (!pipeline || (pipeline.size === 0)) {
                    continue;
                }

                /** @type {Set<Map<string, object>>} */
                const pipelineData = this._getPipelineData(attributeName);

                // offer0 returns true if the attribute was set. If the attribute was not set,
                // then remove the attribute name from the list of attributesToCompute.
                /** @type {object} */
                const policyValue = this._offer0(attribute._getDeviceModelAttribute(),
                                                 attribute.get(), pipeline, pipelineData);

                if (policyValue) {
                    iotcs.impl.Platform._debug(endpointId + ' : Set   : ' + attributeName + '" = ' +
                                    policyValue);
                    attribute._update(policyValue);
                } else {
                    computedAttributesAry.splice(i, 1);
                }

                computedAttributes = new Set(computedAttributesAry);
            }
        }

        return computedAttributes;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {DeviceModel} deviceModel
     * @return {Map<string, iotcs.device.impl.VirtualDeviceAttribute>}
     */
    _createAttributeMap(virtualDevice, deviceModel) {
        /** @type {Map<string, iotcs.device.impl.VirtualDeviceAttribute<VirtualDevice, object>>} */
        const map = new Map();
        const deviceModelObj = iotcs.impl.DeviceModelParser._fromJson(deviceModel);

        deviceModelObj._getDeviceModelAttributes().forEach((attribute, attributeName) => {
            let vda = new iotcs.device.impl.VirtualDeviceAttribute(virtualDevice, attribute);
            map.set(attributeName, vda);
            /** @type {string} */
            let alias = attribute._getName();

            if (alias && (alias.length > 0)) {
                map.set(alias, vda);
            }
        });

        return map;
    }

    /**
     * Return the arguments of the device model action as a NamedValue chain. The name/value
     * pairs in the chain are in the same order as they appear in the device model action.
     * All arguments are returned. If there is no value for an argument in the JSON body,
     * the argument's default value is used.
     *
     * @param {DeviceModelAction } action - The action.
     * @param {Map<string,*>} argumentValues - The arguments as a JSON map.
     * @return {iotcs.impl.NamedValue} The root node of the NamedValue chain, or <code>null</code> if there are no
     *         arguments.
     */
    _getActionArguments(action, argumentValues) {
        // Multiple arguments for the callback are passed as a chain of NameValue's.  'args' is the
        //root of the NamedValue chain.
        /** @type {iotcs.impl.NamedValue} */
        let args = null;

        /** @type {string} */
        const actionName = action._getName();
        /** @type {DeviceModelActionArgument[]} */
        const deviceModelActionArguments = action.getArguments();

        if (deviceModelActionArguments && (deviceModelActionArguments.length > 0)) {
            // The current argument in the chain.
            /** @type {iotcs.impl.NamedValue} */
            let arg = null;

            // For each argument in the action, get the argument value from the JSON body and add it to
            // the value to 'arguments'.
            /** @type {DeviceModelActionArgument} */
            for (let actionArg of deviceModelActionArguments) {
                /** @type {string} */
                const argName = actionArg._getName();
                /** @type {*} */
                const argValue = argumentValues.has(argName) ?
                      argumentValues.get(argName) : actionArg._getDefaultValue();

                try {
                    if (typeof argValue === 'number') {
                        /** @type {number} */
                        const upperBound = actionArg._getUpperBound();

                        if (upperBound) {
                            if (argValue > upperBound) {
                                iotcs.error("argument '" + argName + "' to device model '" +
                                          this.getDeviceModel()._getUrn() + "' action '" +
                                          actionName + "' out of range: " + argValue + " > " +
                                          upperBound);
                            }
                        }

                        /** @type {number} */
                        const lowerBound = actionArg.getLowerBound();

                        if (lowerBound) {
                            if (argValue < lowerBound) {
                                iotcs.error(this.getDeviceModel()._getUrn() + "argument '" + argName +
                                          "' to device model '" + this.getDeviceModel().getUrn() +
                                          "' action '" + actionName + "' out of range: " + argValue +
                                          " < " + lowerBound);
                            }
                        }
                    }
                } catch (error) {
                    iotcs.error(action._getName() + " argument " + argName + " bad value: " +
                              argValue);
                }

                /** @type {iotcs.impl.NamedValue} */
                const namedValue = new iotcs.impl.NamedValue(argName, value);

                if (arg) {
                    arg._setNext(namedValue);
                    arg = namedValue;
                } else {
                    arg = args = namedValue;
                }
            }
        }

        return args;
    }

    /**
     * @ignore
     *
     * @param {string} attributeName
     * @return {VirtualDeviceAttribute}
     */
    _getAttribute(attributeName) {
        /** @type {VirtualDeviceAttribute} */
        const virtualDeviceAttribute = this._attributeMap.get(attributeName);

        if (!virtualDeviceAttribute) {
            throw new Error('No such attribute "' + attributeName +
                            '".\n\tVerify that the URN for the device model you created ' +
                            'matches the URN that you use when activating the device in ' +
                            'the Java application.\n\tVerify that the attribute name ' +
                            '(and spelling) you chose for your device model matches the ' +
                            'attribute you are setting in the Java application.');
        }

        return virtualDeviceAttribute;
    }

    /**
     * Returns the pipeline data for the specified attribute.
     *
     * @ignore
     *
     * @param {string} attribute
     * @param {function} callback
     * @return {Set<Map<string, object>>} the pipeline.
     */
    _getPipelineData(attribute, callback) {
        iotcs.impl.Platform._debug('VirtualDevice._getPipelineData called.');
        this._devicePolicyManager._getPolicy(this.getDeviceModel().urn, this.getEndpointId())
            .then(devicePolicy =>
                  {
                      if (!devicePolicy) {
                          callback(new Set());
                      }

                      let pipeline = devicePolicy._getPipeline(attribute);

                      if (!pipeline || (pipeline.size === 0)) {
                          callback(new Set());
                      }

                      // {Set<Map<string, object>>}
                      let pipelineData = this._pipelineDataCache.get(attribute);

                      if (!pipelineData) {
                          pipelineData = new Set();
                          this._pipelineDataCache.set(attribute, pipelineData);
                      }

                      // Create missing function maps.
                      if (pipelineData.size < pipeline.size) {
                          // Create missing function data maps.
                          for (let n = pipelineData.size, nMax = pipeline.size; n < nMax; n++) {
                              pipelineData.add(new Map());
                          }
                      }

                      callback(pipelineData);
                  }).catch(error => {
                      console.log('Error getting device policy: ' + error);
                  });
    }

    _handleStorageObjectStateChange(storage) {
        this._messageDispatcher._removeStorageDependency(storage);
    }

    /**
     * The main logic for handling a policy pipeline.
     *
     * @ignore
     *
     * @param {iotcs.impl.DeviceModelAttribute} attribute
     * @param {object} value
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {Set<Map<string, object>>} pipelineData
     * @return {object} a policy value.
     */
    _offer0(attribute, value, pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._offer0 called.');
        let attributeName = attribute._getName();
        let policyValue = value;

        if (pipeline && (pipeline.size > 0)) {
            iotcs.impl.Platform._debug('VirtualDevice._offer0 we have a pipeline, size = ' + pipeline.size);
            iotcs.device.impl.DeviceFunction.putInProcessValue(this.endpointId,
                                                                       this._deviceModel.urn,
                                                                       attributeName,
                                                                       policyValue);

            let pipelineAry = Array.from(pipeline);
            let pipelineDataAry = Array.from(pipelineData);

            for (let index = 0, maxIndex = pipelineAry.length; index < maxIndex; index++) {
                let devicePolicyFunction = pipelineAry[index];
                iotcs.impl.Platform._debug('VirtualDevice._offer0 devicePolicyFunction = ' +
                                devicePolicyFunction);

                /** @type {Map<string, object>} */
                let functionData;

                if (index < pipelineData.size) {
                    functionData = pipelineDataAry[index];
                } else {
                    functionData = new Map();
                    pipelineData.add(functionData);
                }

                /** @type {string} */
                const key = devicePolicyFunction._getId();
                /** @type {Map<string, object>} */
                const parameters = devicePolicyFunction._getParameters();
                /** @type {DeviceFunction} */
                const deviceFunction =
                      iotcs.device.impl.DeviceFunction._getDeviceFunction(key);
                iotcs.impl.Platform._debug('VirtualDevice.offer0 deviceFunction = ' + deviceFunction);

                if (!deviceFunction) {
                    continue;
                }

                if (deviceFunction._apply(this, attributeName, parameters, functionData,
                                          policyValue))
                {
                    iotcs.impl.Platform._debug('VirtualDevice._offer0 in deviceFunction.apply.');

                    /** @type {object} */
                    let valueFromPolicy = deviceFunction.get(this, attributeName, parameters,
                                                             functionData);

                    if (valueFromPolicy) {
                        policyValue = valueFromPolicy;

                        iotcs.device.impl.DeviceFunction._putInProcessValue(endpointId,
                            this._deviceModel.urn, attributeName, policyValue);
                    } else {
                        iotcs.impl.Platform._debug(attributeName + ' got null value from policy.' +
                                       deviceFunction._getDetails(parameters));

                        return null;
                    }
                } else {
                    iotcs.impl.Platform._debug('VirtualDevice._offer0 in deviceFunction.apply else.');

                    if (deviceFunction._getId().startsWith("filter")) {
                        iotcs.impl.Platform._debug('VirtualDevice: ' + endpointId + ': offer "' +
                                        attributeName + '" = ' + policyValue +
                                        ' rejected by policy "' +
                                        deviceFunction._getDetails(parameters) + '"');
                    }

                    return null;
                }

            }
        }

        return policyValue;
    }

    /**
     * DevicePolicyManager.ChangeListener interface
     *
     * @ignore
     *
     * @param {DevicePolicy} devicePolicy
     * @param {Set<string>} assignedDevices
     */
    _policyAssigned(devicePolicy, assignedDevices) {
        iotcs.impl.Platform._debug('VirtualDevice._policyAssigned called.');

        if (!assignedDevices || !assignedDevices.has(this.endpointId)) {
            return;
        }

        iotcs.impl.Platform._debug(this.endpointId + " : Policy assigned : " + devicePolicy._getId());
        /** @type {number} */
        const timeZero = new Date().getTime();

        devicePolicy._getPipelines().forEach((value, key) => {
            this._policyAssigned2(key, value, timeZero);
        });
    }

    /**
     *
     * @ignore
     *
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} newPipeline
     * @param {number} timeZero
     */
    _policyAssigned2(attributeName, newPipeline, timeZero) {
        iotcs.impl.Platform._debug('VirtualDevice._policyAssigned2 called.');

        if (newPipeline && (newPipeline.size > 0)) {
            /** @type {DevicePolicyFunction[]} */
            let newPipelineAry = Array.from(newPipeline);

            for (let index = 0, indexMax = newPipeline.size; index < indexMax; index++) {
                /** @type {DevicePolicyFunction} */
                const pipelineFunction = newPipelineAry[index];
                /** @type {string} */
                const id = pipelineFunction.getId();
                /** @type {Map<string, object>} */
                const parameters = pipelineFunction._getParameters();
                /** @type {number} */
                const newWindow = iotcs.device.impl.DeviceFunction._getWindow(parameters);

                if (newWindow > -1 && ('eliminateDuplicates' !== id)) {
                    /** @type {number} */
                    const newSlide =
                          iotcs.device.impl.DeviceFunction._getSlide(parameters, newWindow);
                    this._addScheduledPolicy(newWindow, newSlide, timeZero, attributeName, index);
                }

                // If the first policy in the chain is a computed metric,
                // see if it refers to other attributes.
                if ((index === 0) && ('computedMetric' === id)) {
                    /** @type {string} */
                    const formula = parameters.get('formula');
                    /** @type {Set<string>} */
                    const triggerAttributes = new Set();
                    /** @type {number} */
                    let pos = formula.indexOf('$(');

                    while (pos !== -1) {
                        /** @type {number} */
                        const end = formula.indexOf(')', pos + 1);

                        if ((pos === 0) || (formula.charAt(pos - 1) !== '$')) {
                            /** @type {string} */
                            const attr = formula.substring(pos + '$('.length, end);

                            if (!attr.equals(attributeName)) {
                                triggerAttributes.add(attr);
                            }
                        }

                        pos = formula.indexOf('$(', end + 1);
                    }

                    if (triggerAttributes.size > 0) {
                        this._computedMetricTriggerMap.add(new iotcs.device.impl.Pair(triggerAttributes, attributeName));
                    }
                }
            }
        }
    }

    /**
     *
     * @ignore
     *
     * @param {DevicePolicy} devicePolicy
     * @param {Set<string>} unassignedDevices
     */
    _policyUnassigned(devicePolicy, unassignedDevices) {
        if (!unassignedDevices || !unassignedDevices.has(this._getEndpointId())) {
            return;
        }

        iotcs.impl.Platform._debug(this._getEndpointId() + " : Policy un-assigned : " + devicePolicy._getId());

        /** @type {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} */
        const updatedAttributes = new Set();

        devicePolicy._getPipelines().forEach((value, key) => {
            this._policyUnassigned2(updatedAttributes, key, value);
        });

        if (updatedAttributes.size > 0) {
            // Call updateFields to ensure the computed metrics get run,
            // and will put all attributes into one data message.
            this._updateFields(updatedAttributes);
        }
    }

    /**
     *
     * @ignore
     *
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} oldPipeline
     */
    _policyUnassigned2(updatedAttributes, attributeName, oldPipeline) {
        if (oldPipeline && (oldPipeline.size > 0)) {
            const oldPipelineAry = Array.from(oldPipeline);
            // The order in which the oldPipeline is finalized is important.
            // First, remove any scheduled policies so they don't get executed. Any
            // pending data will be committed in the next step.
            // Second, commit any "in process" values. This may cause a computedMetric
            // to be triggered.
            // Third, remove any computed metric triggers.
            // Lastly, remove any data for this pipeline from the policy data cache
            for (let index = 0, indexMax = oldPipelineAry.length; index < indexMax; index++) {
                /** @type {DevicePolicyFunction} */
                const oldPipelineFunction = oldPipelineAry[index];
                /** @type {string} */
                const id = oldPipelineFunction.getId();
                /** @type {Map<string, object>} */
                const parameters = oldPipelineFunction._getParameters();
                /** @type {number} */
                const window = iotcs.device.impl.DeviceFunction._getWindow(parameters);

                if ((window > -1) && ('eliminateDuplicates' !== id)) {
                    /** @type {number} */
                    const slide =
                          iotcs.device.impl.DeviceFunction._getSlide(parameters, window);
                    this._removeScheduledPolicy(slide, attributeName, index, window);
                }
            }

            // Commit values from old pipeline.
            /** @type {Set<Map<string, object>>} */
            this._getPipelineData(attributeName, pipelineData => {
                if (pipelineData && (pipelineData.size > 0)) {
                    if (iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES !== attributeName) {
                        this._processExpiredFunction2(updatedAttributes, attributeName, oldPipeline,
                                                      pipelineData);
                    } else {
                        this._processExpiredFunction1(oldPipeline, pipelineData);
                    }
                }

                if (attributeName) {
                    // Remove this attribute from the computedMetricTriggerMap.
                    this._computedMetricTriggerMap.forEach(computedMetricTriggerPair => {
                        if (attributeName === computedMetricTriggerPair._getValue()) {
                            this._computedMetricTriggerMap.delete(computedMetricTriggerPair);
                        }
                    });
                }

                // Remove data from cache.
                this._pipelineDataCache.delete(attributeName);
            });
        }
    }

    /**
     * Routine for handling invocation of a policy function when the window's
     * slide expires. This routine gets the value of the function, and then
     * processes the remaining functions in the pipeline (if any).
     *
     * @ignore
     *
     * @param {Set<DevicePolicyFunction>} pipeline
     * @param {Map<string, object>} pipelineData
     */
    _processExpiredFunction1(pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._processExpiredFunction1 called.');

        if (!pipeline || pipeline.size === 0) {
            return;
        }

        try {
            const pipelineAry = Array.from(pipeline);
            const pipelineDataAry = Array.from(pipelineData);
            /** @type {DevicePolicyFunction} */
            const devicePolicyFunction = pipelineAry[0];
            /** @type {string} */
            const functionId = devicePolicyFunction.getId();
            /** @type {Map<string, object>} */
            const config = devicePolicyFunction.getParameters();
            /** @type {Map<string, object>} */
            const data = pipelineDataAry[0];
            /** @type {DeviceFunction} */
            const deviceFunction =
                  iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                console.log('Device function "' + functionId + '" not found.');
                return;
            }

            /** @type {object} */
            let value = deviceFunction._get(this, null, config, data);

            if (value && (pipeline.size > 1)) {
                // Process remaining policies in the pipeline.
                value = this._offer0(null, value, pipeline.subList(1, pipeline.size),
                                     pipelineData.subList(1, pipelineData.size));
            }

            if (value) {
                /** @type {Set<Pair<Message, StorageObjectImpl>>} */
                const pairs = value;

                if (pairs.size === 0) {
                    return;
                }

                /** @type {Message[]} */
                let messages = new Array(pairs.size);

                for (let n = 0, nMax = pairs.size; n < nMax; n++) {
                    /** @type {Pair<Message, StorageObjectImpl>} */
                    const messagePair = pairs.get(n);
                    messages[n] = messagePair._getKey();
                    /** @type {StorageObject} */
                    const storageObject = messagePair._getValue();

                    if (storageObject) {
                        this._messageDispatcher._addStorageObjectDependency(storageObject,
                            messages[n]._getClientId());

                        storageObject.sync();
                    }
                }

                this._messageDispatcher.queue(messages);

            }
        } catch (error) {
            console.log('Error occurred: ' + error);
        }
    }

    /**
     * Routine for handling invocation of a policy function when the window's
     * slide expires. This routine gets the value of the function, and then
     * processes the remaining functions in the pipeline (if any).
     *
     * @ignore
     *
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} updatedAttributes
     * @param {string} attributeName
     * @param {Set<DevicePolicyFunction>} pipeline
     * @param {Set<Map<string, object>>} pipelineData
     */
    _processExpiredFunction2(updatedAttributes, attributeName, pipeline, pipelineData) {
        iotcs.impl.Platform._debug('VirtualDevice._processExpiredFunction2 called.');

        if (!pipeline || (pipeline.size === 0)) {
            return;
        }

        try {
            // Convert the pipeline and pipeline data Sets to arrays so we can index from them.
            let pipelineDataAry = Array.from(pipelineData);
            let pipelineAry = Array.from(pipeline);
            /** @type {VirtualDeviceAttribute} */
            const attribute = this._getAttribute(attributeName);
            /** @type {DeviceModelAttribute} */
            const deviceModelAttribute = attribute._getDeviceModelAttribute();
            /** @type {DevicePolicyFunction} */
            const devicePolicyFunction = pipelineAry[0];
            /** @type {string} */
            const functionId = devicePolicyFunction._getId();
            /** @type {Map<string, object>} */
            const config = devicePolicyFunction._getParameters();
            /** @type {Map<string, object>} */
            const data = pipelineDataAry[0];
            /** @type {DeviceFunction} */
            const deviceFunction =
                  iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                console.log('Device function "' + functionId + '" not found.');
                return;
            }

            /** @type {object} */
            let value = deviceFunction._get(null, attributeName, config, data);

            if (value && pipeline.size > 1) {
                // Process remaining policies in the pipeline.
                value = this._offer0(deviceModelAttribute, value, pipeline.subList(1, pipeline.size),
                                    pipelineData.subList(1, pipelineData.size));
            }

            if (value) {
                /** @type {object} */
                let policyValue = value;

                if (policyValue) {
                    iotcs.impl.Platform._debug('VirtualDevice.processExpiredFunction 2 adding to updatedAttributes:"' +
                                    attributeName + '" = ' + policyValue);
                    updatedAttributes.add(new iotcs.device.impl.Pair(attribute, policyValue));
                }
            }
        } catch (error) {
            console.log('Error occurred: ' + error);
        }
    }

    /**
     * Called from updateFields.
     *
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     *
     * @ignore
     */
    _processOnChange1(updatedAttributes) {
        if (updatedAttributes.size === 0) {
            return;
        }

        /** @type {Set<VirtualDeviceAttribute>} */
        const keySet = new Set();
        let dataMessage = new iotcs.message.Message();
        dataMessage.type(iotcs.message.Message.Type.DATA);
        let storageObject = new iotcs.device.impl.WritableValue();

        // Use for here so we can break out of the loop.
        /** @type {Pair<VirtualDeviceAttribute, object>} */
        for (let entry of updatedAttributes) {
            /** @type {VirtualDeviceAttribute} */
            const attribute = entry.getKey();
            keySet.add(attribute);
            /** @type {object} */
            const newValue = entry.getValue();

            try {
                this._processOnChange2(dataMessage, attribute, newValue, storageObject);
            } catch(error) {
                console.log(error);
                break;
            }
        }

        dataMessage.type(iotcs.message.Message.Type.DATA);

        try {
            this._queueMessage(dataMessage, storageObject._getValue());
        } catch(error) {
            console.log('Message queue error: ' + error);
        }
    }

    /**
     *
     * @ignore
     *
     * @param {iotcs.message.Message} dataMessage
     * @param {VirtualDeviceAttribute} virtualDeviceAttribute
     * @param {object} newValue
     * @param {WritableValue} storageObject
     */
    _processOnChange2(dataMessage, virtualDeviceAttribute, newValue, storageObject) {
        /** @type {DeviceModelAttribute} */
        const deviceModelAttribute = virtualDeviceAttribute._getDeviceModelAttribute();
        /** @type {string} */
        const attributeName = deviceModelAttribute._getName();

        dataMessage
            .format(this._deviceModel.urn + ":attributes")
            .source(this.endpointId);

        switch (deviceModelAttribute.getType()) {
        case 'INTEGER':
        case 'NUMBER':
        case 'STRING':
            dataMessage.dataItem(attributeName, newValue);
            break;
        case 'URI':
            if (newValue instanceof iotcs.device.impl.StorageObject) {
                if ((newValue.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC) ||
                    (newValue.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING))
                {
                    storageObject._setValue(newValue);
                }

                newValue._setSyncEventInfo(this, attributeName);
            }

            dataMessage.dataItem(attributeName, newValue.getUri());
            break;
        case 'DATETIME':
            if (newValue instanceof Date) {
                dataMessage.dataItem(attributeName, newValue.getTime());
            } else if (newValue instanceof Number) {
                dataMessage.dataItem(attributeName, newValue);
            }

            break;
        default:
            console.log('Unknown attribute type: ' + deviceModelAttribute.getType());
            throw new Error("Unknown attribute type " + deviceModelAttribute.getType());
        }
    }

    /**
     *
     * @ignore
     *
     * @param {Message} message
     * @param {StorageObject} storageObject
     */
    _queueMessage(message, storageObject) {
        /** @type {Pair<Message,StorageObjectImpl>} */
        const pair = new iotcs.device.impl.Pair(message, storageObject);
        /** @type {Array.Pair<Message, StorageObjectImpl>} */
        let pairs = [];
        pairs.push(pair);

        /** @type {string} */
        const deviceModelUrn = this._deviceModel.urn;
        const self = this;

        /** @type {DevicePolicy} */
        this._devicePolicyManager._getPolicy(this._deviceModel.urn, this.endpointId).then(
            devicePolicy =>
        {
            // Handling of device model level policies here...
            if (devicePolicy &&
                devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES))
            {
                // Some policies are negated by an alert of a given severity
                // (batching policies, for example)
                /** @type {AlertMessage.Severity} */
                let alertMessageSeverity = null;

                if (message._properties.type === iotcs.message.Message.Type.ALERT) {
                    /** @type {AlertMessage} */
                    alertMessageSeverity = message.getSeverity();
                }

                /** @type {Set<DevicePolicyFunction>} */
                const pipeline =
                      devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);
                /** @type {Set<Map<string, object>>} */
                const pipelineData =
                      this._getPipelineData(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);

                for (let index = 0, maxIndex = pipeline.size; index < maxIndex; index++) {
                    /** @type {DevicePolicyFunction} */
                    const devicePolicyFunction = pipeline.get(index);
                    /** @type {string} */
                    const id = devicePolicyFunction._getId();
                    /** @type {Map<string, object>} */
                    let parameters = devicePolicyFunction._getParameters();
                    /** @type {DeviceFunction} */
                    const deviceFunction =
                          iotcs.device.impl.DeviceFunction._getDeviceFunction(id);

                    if (!deviceFunction) {
                        continue;
                    }

                    /** @type {boolean} */
                    let alertOverridesPolicy;

                    if (alertMessageSeverity) {
                        /** @type {AlertMessage.Severity} */
                        let configuredSeverity = iotcs.message.Message.Type.ALERT.CRITICAL;
                        /** @type {string} */
                        const criterion = parameters.get("alertSeverity");

                        if (criterion) {
                            try {
                                configuredSeverity =  iotcs.message.Message.AlertMessage.Severity.valueOf(criterion);
                            } catch (error) {
                                configuredSeverity = iotcs.message.Message.Type.ALERT.CRITICAL;
                            }
                        }

                        alertOverridesPolicy =
                            configuredSeverity.compareTo(alertMessageSeverity) <= 0;
                    } else {
                        alertOverridesPolicy = false;
                    }

                    /** @type {Map<string, object>} */
                    let functionData;

                    if (index < pipelineData.size) {
                        functionData = pipelineData.get(index);
                    } else {
                        functionData = new Map();
                        pipelineData.add(functionData);
                    }

                    if (deviceFunction._apply(this, null, parameters, functionData, pair) ||
                        alertOverridesPolicy)
                    {
                        // If the policy was scheduled...
                        /** @type {number} */
                        const window =
                              iotcs.device.impl.DeviceFunction._getWindow(parameters);

                        if (window > 0) {
                            /** @type {number} */
                            const slide =
                                  iotcs.device.impl.DeviceFunction.getSlide(parameters,
                                                                                    window);
                            /** @type {ScheduledPolicyDataKey} */
                            const key =
                                  new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
                            /** @type {ScheduledPolicyData} */
                            const scheduledPolicyData = this._scheduledPolicies.get(key);
                            /** @type {number} */
                            const timeZero = new Date().getTime();

                            if (scheduledPolicyData) {
                                /** @type {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} */
                                const updatedAttributes = new Set();
                                scheduledPolicyData._processExpiredFunction(this,
                                                                            updatedAttributes,
                                                                            timeZero);

                                if (updatedAttributes.size > 0) {
                                    this._updateFields(updatedAttributes);
                                }

                                return;
                            }
                        }

                        /** @type {Set<Pair>} */
                        let value = deviceFunction._get(this, null, parameters, functionData);
                        pairs = Array.from(value);

                        iotcs.impl.Platform._debug('VirtualDevice: ' + endpointId + ' dispatching ' +
                                        pairs.length + ' messages per policy "' +
                                        deviceFunction._getDetails(parameters) + '"');
                    } else {
                        return;
                    }
                }
            }

            try {
                /** @type {Message[]} */
                let messages = new Array(pairs.length);
                // /** @type {MessageDispatcher} */
                // let messageDispatcher = new iotcs.device.util.MessageDispatcher(client);

                for (let n = 0; n < messages.length; n++) {
                    messages[n] = pairs[n].getKey();
                    /** @type {StorageObject} */
                    let storageObject = pairs[n].getValue();

                    if (storageObject) {
                        self.messageDispatcher._addStorageDependency(storageObject,
                                                                     message._properties.clientId);

                        storageObject.sync();
                    }
                }

                this.messages.forEach(message => {
                    iotcs.impl.Platform._debug('VirtualDevice.queueMessage, sending message: ' +
                                    iotcs.impl.Platform._inspect(message));
                    this._messageDispatcher.queue(message);
                });
            } catch (error) {
                console.log('Error: ' + error);
            }
        }).catch(error => {
            console.log('Error getting device policy: ' + error);
        });
    }

    /**
     *
     * @ignore
     *
     * @param {number} slide
     * @param {string} attributeName
     * @param {number} pipelineIndex
     * @param {number} window
     */
    _removeScheduledPolicy(slide, attributeName, pipelineIndex, window) {
        /** @type {ScheduledPolicyDataKey} */
        const key = new iotcs.device.impl.ScheduledPolicyDataKey(window, slide).toString();
        /** @type {ScheduledPolicyData} */
        const scheduledPolicyData = this._scheduledPolicies.get(key);

        if (scheduledPolicyData) {
            scheduledPolicyData._removeAttribute(attributeName, pipelineIndex);

            if (scheduledPolicyData._isEmpty()) {
                this._scheduledPolicies.delete(key);
                this._timedPolicyThread._removeTimedPolicyData(scheduledPolicyData);
            }
        }
    }

    /**
     * Set a callback that is invoked when a specific action, or any action in the device model is
     * received.  To set a callback when any action is received, don't specify the action name.  This
     * may be called multiple times to set multiple callbacks.  If there is a callback for the
     * specific action and for all actions, both callbacks will be invoked, with the specific action
     * invoked first.
     *
     * @param {function} actionCallback A callback to invoke when an action is received.  If
     *        {@code null}, the existing callback will be removed
     *        @see #setOnAction(string, callback).
     * @param {string} [actionName] - The name of the action which will be invoked.
     */
    _setOnAction(actionCallback, actionName) {
        _mandatoryArg(actionCallback, 'function'); 

        if (actionName) {
            /** @type {DeviceModelAction} */
            // DJM: Where is this function?
            // DJM: Where is base defined?
            let deviceModelAction = this._getDeviceModelAction(base.getDeviceModel(), actionName);

            if (!deviceModelAction) {
                iotcs.error("Action not found in model.");
            }

            if (!this._actionCallbackMap) {
                this._actionCallbackMap = new Map();
            }

            this._actionCallbackMap.set(actionName, actionCallback);
        } else {
            if (!this._actionCallbackMap) {
                this._actionCallbackMap = new Map();
            }

            this._actionCallbackMap.set("*", actionCallback);
        }
    }

    /**
     * Updates the attributes for this VirtualDevice.  If an attribute is a StorageObject, kicks off
     * the synchronization process if the storage object is ready to be synchronized.
     *
     * @param {Object.<string, any>} attributes - The attributes to update.
     */
    _updateAttributes(attributes) {
        let message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(this.getEndpointId())
            .format(this._deviceModel.urn + ":attributes");

        let storageObjects = [];

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this) {
                if (value instanceof iotcs.StorageObject) {
                    let syncStatus = value.getSyncStatus();

                    if (syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC ||
                        syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
                        storageObjects.push(value);
                    }

                    value._setSyncEventInfo(attribute, this);
                    value.sync();
                }

                message.dataItem(attribute,value);
            } else {
                iotcs.error('Unknown attribute "' + attribute + '".');
                return;
            }
        }

        storageObjects.forEach(storageObject => {
            this._messageDispatcher._addStorageDependency(storageObject,
                                                    message._properties.clientId);
        });

        this._messageDispatcher.queue(message);
    }

    /**
     * Set all the attributes in an update batch. Errors are handled in the set call, including calling
     * the on error handler.
     *
     * {@inheritDoc}
     * @param {Set<Pair<VirtualDeviceAttribute, object>>} updatedAttributes
     *
     * @ignore
     */
    _updateFields(updatedAttributes) {
        iotcs.impl.Platform._debug('VirtualDevice._updateFields called.');
        /** @type {Set<string>} */
        const updatedAttributesToProcess = new Set();
        let updatedAttributesAry = Array.from(updatedAttributes);

        for (let i = updatedAttributesAry.length - 1; i >= 0; i--) {
            const attribute = updatedAttributesAry[i].getKey();
            /** @type {string} */
            const attributeName = attribute._getDeviceModelAttribute()._getName();

            try {
                // Here, we assume:
                // 1. That attribute is not null. If the attribute were not found
                //    an error would have been thrown from the VirtualDevice
                //    set(string attributeName, T value) method.
                // 2. That the set method validates the value. The call to
                //    update here should not throw an error because the
                //    value is bad.
                // 3. The author of this code knew what he was doing.
                if (!attribute.update(updatedAttributesAry[i].getValue())) {
                    updatedAttributesAry.splice(i, 1);
                } else {
                    updatedAttributesToProcess.add(attributeName);
                }
            } catch (error) {
                console.log('Error updating attributes: ' + error);
            }

            iotcs.device.impl.DeviceFunction._removeInProcessValue(this.endpointId,
                                                                           this._deviceModel.urn,
                                                                           attributeName);
        }

        // Here is the check to see if the updated attributes will trigger computedMetrics.
        // The returned set is the attributes whose computedMetrics resulted in an
        // attribute.update(value). Those attributes are added to the list of updated attributes
        // so that they are included in the resulting data message.
        /** @type {Set<string>} */
        const computedMetrics = this._checkComputedMetrics(updatedAttributesToProcess);

        computedMetrics.forEach(attr => {
            /** @type {VirtualDeviceAttribute} */
            const attribute = this._getAttribute(attr);
            /** @type {object} */
            const value = attribute.get();
            /** @type {Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>} */
            const pair = new iotcs.device.impl.Pair(attribute, value);
            updatedAttributes.add(pair);
        });

        this._processOnChange1(updatedAttributes);
    }

    // Public functions
    /**
     *
     * @ignore
     * @inheritdoc
     */
    close() {
        if (this._client) {
            this._client._removeVirtualDevice(this);
        }

        this._endpointId = null;
        this._onChange = arg => {};
        this._onError = arg => {};
    }

    /**
     * This method returns an Alert object created based on the
     * format given as parameter. An Alert object can be used to
     * send alerts to the server by calling the raise method,
     * after all mandatory fields of the alert are set.
     *
     * @param {string} formatUrn - the urn format of the alert spec
     * as defined in the device model that this virtual device represents
     *
     * @return {iotcs.device.Alert} The Alert instance
     *
     * @memberof iotcs.device.VirtualDevice
     * @function createAlert
     */
    createAlert(formatUrn) {
        return new iotcs.device.Alert(this, formatUrn);
    }

    /**
     * This method returns a Data object created based on the
     * format given as parameter. A Data object can be used to
     * send custom data fields to the server by calling the submit method,
     * after all mandatory fields of the data object are set.
     *
     * @param {string} formatUrn - the urn format of the custom data spec
     * as defined in the device model that this virtual device represents
     *
     * @return {iotcs.device.Data} The Data instance
     *
     * @memberof iotcs.device.VirtualDevice
     * @function createData
     */
    createData(formatUrn) {
        return new iotcs.device.Data(this, formatUrn);
    }

    /**
     * @ignore
     * @inheritdoc
     */
    getDeviceModel() {
        return super.getDeviceModel();
    }

    /**
     * @inheritdoc
     */
    update(attributes) {
        _mandatoryArg(attributes, 'object');

        if (Object.keys(attributes).length === 0) {
            return;
        }

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this) {
                this[attribute]._localUpdate(value, true); //XXX not clean
            } else {
                iotcs.error('Unknown attribute "' + attribute+'".');
                return;
            }
        }

        this._updateAttributes(attributes);
    }

    /**
     * Offer to set the value of an attribute. The attribute value is set depending upon any policy
     * that may have been configured for the attribute. If there is no policy for the given
     * attribute, offer behaves as if the set method were called. The value is validated according to
     * the constraints in the device model. If the value is not valid, an IllegalArgumentException is
     * raised.
     *
     * @param {string} attributeName - The name of an attribute from the device type model.
     * @param {any} value - The value to set.
     */
    offer(attributeName, value) {
        let tmp = {attributeName, value};
        /** @type {VirtualDeviceAttribute} */
        const attribute = this._getAttribute(attributeName);
        iotcs.impl.Platform._debug('VirtualDevice.offer attribute=' + attribute);

        if (!attribute) {
            throw new Error("No such attribute '" + attributeName +
                            "'.\n\tVerify that the URN for the device model you created " +
                            "matches the URN that you use when activating the device in " +
                            "the Java application.\n\tVerify that the attribute name " +
                            "(and spelling) you chose for your device model matches the " +
                            "attribute you are setting in the Java application.");
        }

        if (!attribute._isSettable()) {
            throw new Error("Attempt to modify read-only attribute '" + attributeName + "'.");
        }

        iotcs.impl.Platform._debug('VirtualDevice.offer this._deviceModel.urn=' + this._deviceModel.urn);

        /** @type {DevicePolicy} */
        this._devicePolicyManager._getPolicy(this._deviceModel.urn, this.endpointId).then(
            devicePolicy =>
       {
            iotcs.impl.Platform._debug('VirtualDevice.offer = devicePolicy = ' + devicePolicy);

            if (!devicePolicy) {
                const updateObj = {};
                updateObj[attributeName] = value;
                return this.update(updateObj);
            }

            /** @type {Set<DevicePolicyFunction>} */
            const pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('VirtualDevice.offer pipeline=' + pipeline);

            if (!pipeline || (pipeline.size === 0)) {
                const updateObj = {};
                updateObj[attributeName] = value;
                return this.update(updateObj);
            }

            /** @type {Set<Map<string, object>>} */
            this._getPipelineData(attributeName, pipelineData => {
                iotcs.impl.Platform._debug('VirtualDevice.offer pipelineData=' + pipelineData);
                /** @type {} */
                const policyValue = this.offer0(attribute.getDeviceModelAttribute(), value,
                                                 pipeline, pipelineData);

                iotcs.impl.Platform._debug('VirtualDevice.offer policyValue = ' + policyValue);

                if (policyValue) {
                    iotcs.impl.Platform._debug(this.endpointId + ' : Set   : "' + attributeName + '=' +
                                    policyValue);

                    // Handle calling offer outside of an update when there are computed metrics
                    // involved.  Call updateFields to ensure the computed metrics get run, and
                    // will put this attribute and computed attributes into one data message.
                    /** @type {Pair} */
                    const updatedAttributes = new Set();
                    updatedAttributes.add(new iotcs.device.impl.Pair(attribute, policyValue));
                    this._updateFields(updatedAttributes);
                }
            });
        }).catch(error => {
            console.log('Error offering value: ' + error);
        });
    }

};

// DJM: Fix these
// Callback JSDocs.
/**
 * Callback for iotcs.device.VirtualDevice.onError with the error.
 *
 * @callback iotcs.device.VirtualDevice~onErrorCallback
 *
 * @param {string} error - The error when sending this Alert.
 */


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/DevicePolicyManager.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * A manager for /iot/privateapi/v2/devicePolicies.  This class contains, retrieves, and supports
 * updating device polices.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.device.impl.DevicePolicyManager = class {
    /**
     * Returns the device policy manager for this directly connected device.
     *
     * @param {string} endpointId the endpoint ID of the device this device policy manager is for.
     * @return {iotcs.device.impl.DevicePolicyManager} the device policy manager for this endpoint ID.
     */
    static _getDevicePolicyManager(endpointId) {
        /** @type {iotcs.device.impl.PersistenceStorage} */
        let persistenceStore = iotcs.device.impl.PersistenceStoreManager._get(endpointId);
        /** @type {iotcs.device.impl.DevicePolicyManager} */
        return persistenceStore._getOpaque('DevicePolicyManager', null);
    }

    /**
     * Constructs a DevicePolicyManager.
     *
     * @param {iotcs.device.impl.DirectlyConnectedDevice} dcdImpl - A DirectlyConnectedDevice
     *        associated with this device policy manager.
     */
    constructor(dcdImpl) {
        // DJM: Fix
        /** @type {Set<ChangeListener>} */
        this._changeListeners = new Set();
        this._dcdImpl = dcdImpl;
        /**
         * Map a device id to the policies that are available to it.  The key is the device id.  The
         * value is a map of device model URN to policy id. The policy id gets us to the
         * configuration data.
         * @type {Map<string, Map<string, string>>}
         */
        this._policiesByDeviceId = new Map();
        /**
         * Map of policy ID to policies. The key is a policy id. The value is a map of policy
         * attributes and values.
         * @type {Map<string, iotcs.device.impl.DevicePolicy>}
         */
        this._policiesByPolicyId = new Map();
        /**
         * @type {Map<string, Map<string, Set<string>>>}
         */
        this._policiesByDeviceModelUrn = new Map();
    }

    /**
     * Add a listener for receiving notification of policies being assigned or unassigned.
     * Must have a policyAssigned(DevicePolicy devicePolicy, Set<string> assignedDevices) function.
     * Must have a policyUnassigned(DevicePolicy devicePolicy, Set<string> unassignedDevices)
     * function.
     *
     * @param {object} changeListener the ChangeListener to add.
     */
    _addChangeListener(changeListener) {
        iotcs.impl.Platform._debug('DevicePolicyManager.addChangeListener called.');

        if (!changeListener ||
            typeof(changeListener.policyAssigned) !== 'function' ||
            typeof(changeListener.policyUnassigned) !== 'function')
        {
            return;
        }

        this._changeListeners.add(changeListener);
    }

    /**
     * Assigns the policy with the specified policy ID to the device with the device ID.
     *
     * @param {string} deviceModelUrn - The device model URN associated with the policy.
     * @param {string} policyId - The device policy ID.
     * @param {string} deviceId - The device ID.
     * @param {number} lastModified - The date/time the policy was last modified in milliseconds.
     */
    _assignPolicyToDevice(deviceModelUrn, policyId, deviceId, lastModified) {
        // If the device currently has a policy, it needs to be unassigned.
        /** @type {string} */
        let currentPolicyId;
        /** @type {Map<string, string} */
        const policies = this._policiesByDeviceId.get(deviceId);

        if (policies) {
            currentPolicyId = policies.get(deviceModelUrn);
        } else {
            currentPolicyId = null;
        }

        // If the current policy is the same as the policy that is being
        // assigned, no need to continue.
        if (policyId === currentPolicyId) {
            return;
        }

        // Make sure we have the policy before assigning the new policy.
        /** @type {iotcs.device.impl.DevicePolicy} */
        let devicePolicy = this._policiesByPolicyId.get(policyId);

        if (!devicePolicy) {
            this._downloadPolicy(deviceModelUrn, policyId).then(devicePolicy => {
                if (devicePolicy) {
                    this._policiesByPolicyId.set(policyId, devicePolicy);

                    // replaceAll just fills space where device id should be since
                    // the deviceId here doesn't matter for debug print, but it would
                    // be nice to have the printout line up.
                    iotcs.impl.Platform._debug(deviceId.replace(".", " ") + " : Policy : " +
                                    devicePolicy.getId() + '\n' + devicePolicy.toString());

                    this._assignPolicyToDevice2(devicePolicy);
                }
            });
        } else {
            this._assignPolicyToDevice2(devicePolicy);
        }
    }

    _assignPolicyToDevice2(devicePolicy) {
        if (devicePolicy) {
            /** @type {Map<string, string>} */
            let devicePolicies = this._policiesByDeviceId.get(deviceId);

            if (!devicePolicies) {
                devicePolicies = new Map();
                this._policiesByDeviceId.set(deviceId, devicePolicies);
            }

            devicePolicies.set(deviceModelUrn, policyId);

            /** @type {Map<string, Set<string>>} */
            let deviceModelPolicies = policiesByDeviceModelUrn.get(deviceModelUrn);

            if (!deviceModelPolicies) {
                deviceModelPolicies = new Map();
                policiesByDeviceModelUrn.set(deviceModelUrn, deviceModelPolicies);
            }

            /** @type {Set<string>} */
            let assignedDevices = deviceModelPolicies.get(policyId);

            if (!assignedDevices) {
                assignedDevices = new Set();
                deviceModelPolicies.set(policyId, assignedDevices);
            }

            assignedDevices.add(deviceId);

            if (currentPolicyId) {
                this._removePersistedAssociation(deviceModelUrn, currentPolicyId, deviceId);
            }

            this._persistAssociation(deviceModelUrn, policyId, deviceId);
        }
    }

    /**
     * Get the ids of indirectly connected devices that are assigned to the policy.
     *
     * @param {string} deviceModelUrn the device model urn
     * @param {string} policyId the policy id to query for
     * @param {string} directlyConnectedOwner
     * @return {Promise} that resolves to a Set<string> the set of indirectly connected device IDs
     *          for this policy.
     */
    _getIndirectlyConnectedDeviceIdsForPolicy(deviceModelUrn, policyId, directlyConnectedOwner) {
        return new Promise((resolve, reject) => {
            /** @type {string} */
            let urn;

            try {
                urn = encodeURI(deviceModelUrn);
            } catch (uriError) {
                // UTF-8 is a required encoding.
                // Throw an exception here to make the compiler happy
                console.log('Error encoding device model URN: ' + uriError);
            }

            /** @type {string} */
            let query;

            try {
                /** @type {string} */
                let icdFilter = encodeURI('{"directlyConnectedOwner":"' + directlyConnectedOwner +
                    '"}');

                query = "?q=" + icdFilter + "&fields=id";
            } catch (uriError) {
                // UTF-8 is a required encoding.
                //DJM: Should an error be thrown here?
                // Throw an exception here to make the compiler happy
                console.log('Error encoding ICD filter: ' + uriError);
            }

            let dcd = this._dcdImpl;

            let options = {
                headers: {
                    'Authorization': dcd._bearer,
                    'X-EndpointId': dcd._tam.getEndpointId()
                },
                method: 'GET',
                // GET iot/privateapi/v2/deviceModels/{urn}/devicePolicies/{id}/devices?q={"directlyConnectedOwner" : "GW-endpoint-id"}
                path: iotcs.impl._privateRoot + '/deviceModels/' + urn + '/devicePolicies/' + policyId +
                      '/devices' + query,
                tam: dcd._tam
            };

            iotcs.impl.Platform._debug('path=' + options.path);

            iotcs.impl._protocolReq(options, '', (response, error) => {
                let icdIds = new Set();

                if (error) {
                    console.log('Invalid response getting ICDs: ' + error);
                    reject(icdIds);
                } else {
                    iotcs.impl.Platform._debug('DevicePolicyManager.getIndirectlyConnectedDeviceIdsForPolicy response = ' +
                        response);

                    if (!response || !response.items || response.items.length === 0 ||
                        !(response.items[0].id))
                    {
                        return resolve(icdIds);
                    }

                    response.items.forEach(item => {
                        icdIds.add(item.id);
                    });

                    resolve(icdIds);
                }
            }, null, this._dcdImpl);
        });
    }

    /**
     * Get the {@code DevicePolicy} for the given device model and device ID.
     *
     * @param {string} deviceModelUrn
     * @param {string} deviceId
     * @return {Promise} a Promise which resolves a DevicePolicy.
     */
    _getPolicy(deviceModelUrn, deviceId) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy called.');
            // If we already have the policy for this device model and device, return it.
            // Otherwise, look it up. If there isn't an entry in policiesByDeviceId
            // for the device model urn and device id when this method is called,
            // there will be by the time this method completes.

            // policiesByDeviceId looks like { <device-id> : { <device-model-urn> : <policy-id> }}.
            /** @type {Map<string, string>} */
            const devicePolicies = this._policiesByDeviceId.get(deviceId);
            iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy devicePolicies = ' + devicePolicies);

            // If devicePolicies is null, we drop through and do the lookup.
            if (devicePolicies) {
                // If the deviceModelUrn is not found in the map, we drop through and do the lookup.
                // There may be a mapping for the device model urn, but the value may be null,
                // which means that there is no policy for the combination of device model and device.
                if (devicePolicies.has(deviceModelUrn)) {
                    /** @type {string} */
                    const policyId = devicePolicies.get(deviceModelUrn);
                    /** @type {iotcs.device.impl.DevicePolicy} */
                    let devicePolicy;

                    if (policyId) {
                        // Very important that the client has gotten the policy before we get here!
                        devicePolicy = this._policiesByPolicyId.get(policyId);
                    } else {
                        devicePolicy = null;
                    }

                    iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy returning devicePolicy: ' +
                                    devicePolicy);
                    return resolve(devicePolicy);
                }
            }

            // Add the mapping so the code doesn't try to fetch a policy for this
            // device again. The only way the device will get a policy after this
            // is from an "assigned" policyChanged, or when the client restarts.
            /** @type {Map<string, string>} */
            let policies = this._policiesByDeviceId.get(deviceId);
            iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy policies = ' + policies);

            if (!policies) {
                policies = new Map();
                this._policiesByDeviceId.set(deviceId, policies);
            }

            // Stop policyChanged while doing this lookup.
            // If we get to here, then there was no mapping for the deviceId in policiesByDeviceId,
            // or there was a mapping for the deviceId, but not for the device model. So we need
            // to do a lookup and update policiesByDeviceId
            /** @type {iotcs.device.impl.DevicePolicy} */
            this._lookupPolicyForDevice(deviceModelUrn, deviceId).then(devicePolicy => {
                iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy.lookupPolicyForDevice devicePolicy = ' +
                    iotcs.impl.Platform._inspect(devicePolicy));
                // Add the mapping so the code doesn't try to fetch a policy for this
                // device again. The only way the device will get a policy after this
                // is from an "assigned" policyChanged, or when the client restarts.
                /** @type {Map<string, string>} */
                let policies = this._policiesByDeviceId.get(deviceId);

                if (!policies) {
                    /** @type {Map<string, string>} */
                    policies = new Map();
                    this._policiesByDeviceId.set(deviceId, policies);
                }

                // Note: devicePolicy may be null, but the entry is made anyway.
                // This just means the device has no policy for this device model.
                // Adding null prevents another lookup.
                /** @type {string} */
                const policyId = devicePolicy != null ? devicePolicy.getId() : null;
                iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy.lookupPolicyForDevice policyId = ' +
                                policyId);
                policies.set(deviceModelUrn, policyId);

                if (devicePolicy) {
                    /** @type {Set<string>} */
                    const assignedDevices = new Set();
                    assignedDevices.add(deviceId);
                    iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy.lookupPolicyForDevice calling notifyPolicyAssigned.');
                    this._notifyPolicyAssigned(devicePolicy, assignedDevices);
                }

                iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy returning devicePolicy: ' +
                                devicePolicy);
                resolve(devicePolicy);
            }).catch(error => {
                iotcs.impl.Platform._debug('DevicePolicyManager.getPolicy returning null.');
                resolve(null);
            });
        });
    }

    /**
     * GET iot/privateapi/v2/deviceModels/{urn}/devicePolicies/{policyId}.
     * The policiesByPolicyId map is updated, and an entry is made (if necessary) in the
     * policiesByDeviceModelUrn map.
     *
     * @param {string} deviceModelUrn the device model URN.
     * @param {string} policyId the policy ID.
     * @return {Promise} a Promise which resolves to the DevicePolicy, or null if an error occured.
     */
    downloadPolicy(deviceModelUrn, policyId) {
        return new Promise((resolve, reject) => {
            let tam;
            let bearer;
            let endpointId;

            // DJM: Verify this is correct.
            bearer = this._dcdImpl._bearer;
            tam = this._dcdImpl._tam;
            endpointId = tam.endpointId;

            const fields = encodeURI('id,pipelines,enabled,lastModified');
            const query = '?fields=' + fields;

            let options = {
                headers: {
                    'Authorization': bearer,
                    'X-EndpointId': endpointId
                },
                method: 'GET',
                path: iotcs.impl._privateRoot + '/deviceModels/' + deviceModelUrn + '/devicePolicies/' +
                      policyId + query,
                tam: tam
            };

            iotcs.impl._protocolReq(options, '', (response, error) => {
                if (error) {
                    console.log('Invalid response getting device policy: ' + error);
                    resolve(null);
                } else {
                    if (!response ||
                        !(response.id || response.items) ||
                        (response.items && !(response.items && (response.items.length === 0) && response.items[0].id)) ||
                            error)
                    {
                        return resolve(null);
                    }

                    let devicePolicyJson = JSON.stringify(response, null, 4);
                    let devicePolicy = iotcs.impl.DevicePolicy._fromJson(deviceModelUrn, devicePolicyJson);

                    if (devicePolicy) {
                        Object.freeze(devicePolicy);
                        this._policiesByPolicyId.set(policyId, devicePolicy);
                        resolve(devicePolicy);
                    } else {
                        reject('Error retrieving device policy.');
                    }
                }
            }, this._dcdImpl);
        });
    }

    /**
     * GET iot/privateapi/v2/deviceModels/{urn}/devicePolicies/{policyId}.
     * The policiesByPolicyId map is updated, and an entry is made (if necessary) in the
     * policiesByDeviceModelUrn map.
     *
     * @param {string} deviceModelUrn the device model URN.
     * @param {string} deviceId the device ID.
     * @return {Promise} a Promise which resolves to the DevicePolicy, or null if an error occured.
     */
    _downloadPolicyByDeviceModelDeviceId(deviceModelUrn, deviceId) {
        return new Promise((resolve, reject) => {
            let tam;
            let bearer;
            let endpointId;

            if (this._dcdImpl._internalDev && this._dcdImpl._internalDev._dcdImpl) {
                tam = this._dcdImpl._internalDev._dcdImpl._tam;
                bearer = this._dcdImpl._internalDev._dcdImpl._bearer;
                endpointId = this._dcdImpl._internalDev._dcdImpl._tam._endpointId;
            } else if (this._dcdImpl.__internalDev) {
                tam = this._dcdImpl._internalDev._tam;
                bearer = this._dcdImpl._internalDev._bearer;
                endpointId = this._dcdImpl._internalDev._tam._endpointId;
            } else {
                tam = this._dcdImpl._tam;
                bearer = this._dcdImpl._bearer;
                endpointId = this._dcdImpl._tam._endpointId;
            }

            const devicesDotId = encodeURI('{"devices.id":"' + deviceId + '"}');
            const fields = encodeURI('id,pipelines,enabled,lastModified');
            const query = '?q=' + devicesDotId + '&fields=' + fields;

            let options = {
                headers: {
                    'Authorization': bearer,
                    'X-EndpointId': endpointId
                },
                method: 'GET',
                path: iotcs.impl._privateRoot + '/deviceModels/' + deviceModelUrn + '/devicePolicies' +
                    query,
                tam: tam
            };

            iotcs.impl._protocolReq(options, '', (response, error) => {
                if (error) {
                    console.log('Invalid response getting device policy: ' + error);
                    return resolve(null);
                }

                iotcs.impl.Platform._debug('response = ' + response);

                if (!response || !response.items || response.items.length === 0 ||
                    !(response.items[0].id) || error)
                {
                    return resolve(null);
                }

                let devicePolicyJson = JSON.stringify(response.items[0], null, 4);

                if (devicePolicyJson) {
                    iotcs.impl.Platform._debug('devicePoliciesJson = ' + devicePolicyJson);
                    // The response is an array of items, get the first one.
                    let devicePolicy = iotcs.impl.DevicePolicy._fromJson(deviceModelUrn, devicePolicyJson);

                    if (devicePolicy) {
                        Object.freeze(devicePolicy);
                        resolve(devicePolicy);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }, this._dcdImpl);
        });
    }

    /**
     * Lookup the policy for the combination of device model and device ID on the server.
     * Should only be called from getPolicy when there is no policy for the device.
     *
     * @param {string} deviceModelUrn the device model urn
     * @param {string} deviceId the device id to query for
     * @return {Promise} a Promise which resolves to the JSON policy, or {@code null} if there is no
     *         policy for the combination of deviceModelUrn and deviceId.
     */
    _lookupPolicyForDevice(deviceModelUrn, deviceId) {
        return new Promise((resolve, reject) => {
            // Do we already have the policy?
            /** @type {Map<string, Set<string>>} */
            let policies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

            if (policies) {
                policies.forEach((deviceIds, policyId) => {
                    if (deviceIds.has(deviceId)) {
                        /** @type {iotcs.device.impl.DevicePolicy} */
                        const devicePolicy = this._policiesByPolicyId.get(policyId);

                        if (devicePolicy) {
                            return resolve(devicePolicy);
                        }
                    }
                });
            }

            this._downloadPolicyByDeviceModelDeviceId(deviceModelUrn, deviceId) .then(devicePolicy => {
                iotcs.impl.Platform._debug('DevicePolicyManager.lookupPolicyForDevice devicePolicy = ' +
                    devicePolicy);

                // If we found a device policy, update our local state
                if (!devicePolicy) {
                    return resolve(null);
                }

                /** @type {string} */
                const policyId = devicePolicy._getId();

                // Only put the policy in policiesByPolicyId if it isn't there already.
                // This prevents putting a changed policy, which should be processed
                // through policyChanged.
                if (!this._policiesByPolicyId.has(policyId)) {
                    this._policiesByPolicyId.set(policyId, devicePolicy);

                    // replaceAll just fills space where device ID should be since
                    // the device id here doesn't matter for debug print, but it would
                    // be nice to have the printout line up.
                    iotcs.impl.Platform._debug(policyId.replace(".", " ") + ' : Policy : ' +
                        devicePolicy._getId() + '\n' + devicePolicy._toString());
                }

                // Remember this policy maps to this device model.
                // Do not add the device ID to the set of device IDs here.
                // Do that in getPolicy (just to keep all of the device
                // ID state updates in one place).
                policies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

                if (!policies) {
                    /** @type {Map<string, Set<string>>} */
                    policies = new Map();
                    this._policiesByDeviceModelUrn.set(deviceModelUrn, policies);
                }

                /** @type {Set<string>} */
                let deviceIds = policies.get(policyId);

                if (!deviceIds) {
                    deviceIds = new Set();
                    policies.set(policyId, deviceIds);
                }

                deviceIds.add(deviceId);
                resolve(devicePolicy);
            });
        });
    }

    /**
     * Invoke {@code policyAssigned} method on change listeners.
     *
     * @param {DevicePolicy} devicePolicy the assigned policy.
     * @param {Set<string>} assignedDevices the devices to which the policy was assigned.
     */
    _notifyPolicyAssigned(devicePolicy, assignedDevices) {
        iotcs.impl.Platform._debug('DevicePolicyManager.notifyPolicyAssigned called.');
        if (!devicePolicy || assignedDevices.size === 0) {
            return;
        }

        iotcs.impl.Platform._debug('DevicePolicyManager.notifyPolicyAssigned changeListeners = ' +
            iotcs.impl.Platform._inspect(this.changeListeners));

        this._changeListeners.forEach(changeListener => {
            try {
                iotcs.impl.Platform._debug('DevicePolicyManager.notifyPolicyAssigned calling changeListener.');
                changeListener.policyAssigned(devicePolicy, assignedDevices);
            } catch (error) {
                // The ChangeListener may throw an error.
                console.log(error);
            }
        });
    }

    /**
     * Invoke {@code policyAssigned} method on change listeners.
     *
     * @param {DevicePolicy} devicePolicy the assigned policy.
     * @param {Set<string>} unassignedDevices the devices to which the policy was assigned.
     */
    _notifyPolicyUnassigned(devicePolicy, unassignedDevices) {
        if (!devicePolicy || unassignedDevices.size === 0) {
            return;
        }

        this._changeListeners.forEach(changeListener => {
            try {
                changeListener._policyUnassigned(devicePolicy, unassignedDevices);
            } catch (error) {
                // The ChangeListener may throw an error.
                console.log(error);
            }
        });
    }

    /**
     * Handle {@code deviceModels/urn:oracle:iot:dcd:capability:device_policy/policyChanged}
     *
     * @param {DirectlyConnectedDevice} directlyConnectedDevice.
     * @param {RequestMessage} requestMessage the RequestMessage from the server.
     * @return {iotcs.message.Message} a ResponseMessage.
     */
    _policyChanged(directlyConnectedDevice, requestMessage) {
        //
        // The server will not send a policyChanged to a device for which the policy is not intended.
        // If this is a DCD, then the policy  is meant for this DCD.
        // If this is a GW, then the policy is meant for one or more of its ICDs.
        //
        // RequestMessage body looks like:
        // [{
        //    "deviceModelUrn": "urn:com:oracle:iot:device:humidity_sensor",
        //    "id": "547B66F3-5DC8-4F60-835F-7B7773C8EE7A",
        //    "lastModified": 1511805927387,
        //    "op": "changed"
        // }]
        //
        // Where op is:
        //   "changed"    - The policy pipeline was changed. The client needs to GET the policy.
        //   "assigned"   - The policy was assigned to device(s). The policy pipeline itself
        //                  has not changed. The server will not send this to the client
        //                  unless the client has the device(s). A gateway client needs to get
        //                  a list of devices the policy applies to, but a directly connected
        //                  device can assume the policy is for it. If necessary, the client
        //                  will GET the policy.
        //   "unassigned" - The policy was unassigned from device(s). The policy pipeline itself
        //                  has not changed. The server will not send this to the client
        //                  unless the client has the device(s). A gateway client needs to get
        //                  a new list of devices the policy applies to, but a directly connected
        //                  device can assume the policy is for it.
        //
        let responseMessage = null;

        /** @type {boolean} */
        const dcdIsGatewayDevice = true; //directlyConnectedDevice instanceof GatewayDevice;
        /** @type {string} */
        const endpointId = directlyConnectedDevice.getEndpointId();

        try {
            /** @type {object} */
            const body = JSON.parse(forge.util.decode64(requestMessage.payload.body));

            for (let n = 0, nMax = body.length; n < nMax; n++) {
                let item = body[n];
                /** @type {string} */
                const op = item.op !== null ? item.op : 'changed';
                /** @type {string} */
                const deviceModelUrn = item.deviceModelUrn;
                /** @type {string} */
                const policyId = item.id;
                /** @type {number} */
                const lastModified = item.lastModified;

                iotcs.impl.Platform._debug('policyChanged notification received: deviceModelUrn=' + deviceModelUrn +
                    ', operation=' + op + ', policyId=' + policyId + ', lastModified=' +
                    lastModified);

                if ('unassigned' === op) {
                    this._processUnassign(deviceModelUrn, policyId, endpointId, dcdIsGatewayDevice,
                        lastModified);
                } else if ('assigned' === op) {
                    this._processAssign(deviceModelUrn, policyId, endpointId, dcdIsGatewayDevice,
                        lastModified);
                } else if ('changed' === op) {
                    /** @type {iotcs.device.impl.DevicePolicy} */
                    const policyBeforeChange = this._policiesByPolicyId.get(policyId);

                    // If device policy is null, then something is wrong in our mappings.
                    // Remove the references to this device model URN an policy ID.
                    if (!policyBeforeChange) {
                        /** @type {Map<string, Set<string>>} */
                        const policies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

                        if (policies) {
                            /** @type {Set<string>} */
                            const assignedDevices = policies.delete(policyId);

                            if (assignedDevices) {
                                assignedDevices.forEach(deviceId => {
                                    /** @type {Map<string, string>} */
                                    const devicePolicies = this._policiesByDeviceId.get(deviceId);

                                    if (devicePolicies != null) {
                                        devicePolicies.delete(policyId);
                                    }
                                });
                            }
                        }

                        return responseMessage; // continue
                    }

                    // Before updating the policy, notify the devices the policy is unassigned.
                    // This gives the code in VirtualDeviceImpl or MessagingPolicyImpl a chance
                    // to clean up the existing pipeline before the new pipeline comes in.
                    /** @type {Set<string>} */
                    let assignedDevices;
                    /** @type {Map<string, Set<string>>} */
                    const policies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

                    if (policies) {
                        assignedDevices = policies.get(policyId);
                    } else {
                        assignedDevices = null;
                    }

                    if (assignedDevices) {
                        if (policyBeforeChange) {
                            this._notifyPolicyUnassigned(policyBeforeChange, assignedDevices);
                        }
                    }

                    this._processPipelineChanged(directlyConnectedDevice, deviceModelUrn, policyId,
                        lastModified).then(() =>
                    {
                        if (assignedDevices) {
                            /** @type {iotcs.device.impl.DevicePolicy} */
                            const policyAfterChange = this._policiesByPolicyId.get(policyId);

                            if (policyAfterChange) {
                                this._notifyPolicyAssigned(policyAfterChange, assignedDevices);
                            }
                        }
                    });
                } else {
                    console.log(requestMessage.payload.url + ' invalid operation: ' + item);
                }
            }
        } catch (error) {
            console.log('Error processing policyChanged notification: ' + error);
            /** @type {iotcs.message.Message} */
            return iotcs.message.Message.buildResponseMessage(requestMessage,
                iotcs.StatusCode.FORBIDDEN, {}, error, '');
        }

        /** @type {iotcs.message.Message} */
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {},
                                                          '', '');
    }

    /**
     * Process the "assign" operation from policyChanged.
     * The method needs to notify listeners that the policy was assigned,
     * then update data structures and persistence to add the association
     * of the policy to the device.
     *
     * @param {string} deviceModelUrn the device model urn of the policy that is unassigned.
     * @param {string} policyId the ID of the policy that is unassigned.
     * @param {string} endpointId the endpointId of the device that called the policyChanged method.
     * @param {boolean} dcdIsGatewayDevice whether or not that device is a gateway device
     * @param {number} lastModified
     */
    _processAssign(deviceModelUrn, policyId, endpointId, dcdIsGatewayDevice, lastModified) {
        return new Promise((resolve, reject) => {
            // Get the set of devices to which this policy is assigned.
            // If the directly connected device is a gateway, then get
            // the assigned devices from the server. Otherwise, the
            // assigned device is the directly connected device with endpointId.
            //
            // Note that if the call to get the ICD ids that are assigned
            // to the policy throws an exception, unassign every device
            // with that device model urn. In such a case, we  remove the
            // mapping from device id the device-model urn from
            // policiesByDeviceId. If there is no mapping, getPolicy
            // will try to create a new mapping by getting the policy
            // for the device from the server.
            /** @type {Set<string} */
            let assignedDevices = null;

            if (dcdIsGatewayDevice) {
                assignedDevices = this._getIndirectlyConnectedDeviceIdsForPolicy(deviceModelUrn,
                    policyId, endpointId).then((assignedDevices, error) =>
                {
                    this._processAssignCouldNotGetIcds(false, deviceModelUrn, policyId);

                    if (!assignedDevices || assignedDevices.size === 0) {
                        return resolve();
                    }

                    this._processAssignHandleAssignedDevices(assignedDevices, deviceModelUrn,
                        policyId, lastModified);
                }).catch(error => {
                    this._processAssignCouldNotGetIcds(true, deviceModelUrn, policyId);
                    resolve();
                });
            } else {
                /** @type {Set<string>} */
                assignedDevices = new Set();
                assignedDevices.add(endpointId);

                if (!assignedDevices || assignedDevices.size === 0) {
                    return resolve();
                }

                this._processAssignHandleAssignedDevices(assignedDevices, deviceModelUrn, policyId,
                    lastModified);
            }
        });
    }

    _processAssignHandleAssignedDevices(assignedDevices, deviceModelUrn, policyId, lastModified) {
        // Download the policy. The reason we have to download again on assign is that the policy
        // may have been modified while it was not assigned to this device or ICDs.
        /** @type {iotcs.device.impl.DevicePolicy} */
        this._downloadPolicy(deviceModelUrn, policyId).then(newPolicy => {
            this._policiesByPolicyId.set(policyId, newPolicy);

            /** @type {string} */
            assignedDevices.forEach(deviceId => {
                this._assignPolicyToDevice(deviceModelUrn, policyId, deviceId, lastModified);
            });

            /** @type {iotcs.device.impl.DevicePolicy} */
            const devicePolicy = this._policiesByPolicyId.get(policyId);

            if (devicePolicy != null) {
                this._notifyPolicyAssigned(devicePolicy, assignedDevices);
            }
        });
    }

    /**
     *
     * @param {boolean} couldNotGetIcds
     * @param {string} deviceModelUrn
     * @param {string} policyId
     */
    _processAssignCouldNotGetIcds(couldNotGetIcds, deviceModelUrn, policyId) {
        if (couldNotGetIcds) {
            // Remove the mappings for all devices that reference this policy
            // since we no longer know which policy they refer to. On next call
            // to getPolicy, this should self-correct.
            /** @type {Map<string, Set<string>>} */
            const deviceModelPolicies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

            if (deviceModelPolicies) {
                /** @type {Set<string>} */
                const assignedDeviceIds = deviceModelPolicies.delete(policyId);

                if (assignedDeviceIds) {
                    assignedDeviceIds.forEach(deviceId => {
                        /** @type {Map<string, string>} */
                        const assignedPolicies = this._policiesByDeviceId.get(deviceId);

                        if (assignedPolicies) {
                            assignedPolicies.delete(deviceModelUrn);
                        }

                        //this.removePersistedAssociation(deviceModelUrn, policyId, deviceId);
                    });
                }
            }
        }
    }

    /**
     * Process the "change" operation from policyChanged. The method needs to fetch the policy.
     *
     * @param {DirectlyConnectedDevice} directlyConnectedDevice
     * @param {string} deviceModelUrn the device model URN of the policy that is unassigned.
     * @param {string} policyId the ID of the policy that is unassigned.
     * @param {number} lastModified
     * @return {Promise} a Promise which resolves to nothing.
     */
    _processPipelineChanged(directlyConnectedDevice, deviceModelUrn, policyId, lastModified) {
        return new Promise((resolve, reject) => {
            // First, check to see if we have a copy, and if so, whether or not it is more recent.
            /** @type {iotcs.device.impl.DevicePolicy} */
            const currentDevicePolicy = this._policiesByPolicyId.get(policyId);

            if (currentDevicePolicy) {
                if (lastModified < currentDevicePolicy.getLastModified()) {
                    // Our copy is more recent, return.
                    return;
                }
            }

            // Our copy is older, download the policy.
            // Block getPolicy from accessing policiesByDeviceId while the policy is being updated.
            /** @type {iotcs.device.impl.DevicePolicy} */
            this._downloadPolicy(deviceModelUrn, policyId).then(devicePolicy => {
                if (devicePolicy) {
                    iotcs.impl.Platform._debug(directlyConnectedDevice._internalDev._tam.endpointId +
                        ' : Policy changed : "' + devicePolicy._toString());
                }

                resolve();
                // Nothing else to do here...
            });
        });
    }

    /**
     * Process the "unassign" operation from policyChanged.
     * The method updates the data structures and persistence to remove the association
     * of the policy to the device.
     *
     * @param {string} deviceModelUrn the device model URN of the policy that is unassigned.
     * @param {string} policyId the ID of the policy that is unassigned.
     * @param {string} endpointId the endpointId of the device that called the policyChanged method.
     * @param {boolean} dcdIsGatewayDevice whether or not that device is a gateway device.
     * @param {number} lastModified is the time the policy was last modified on the server.
     */
    _processUnassign(deviceModelUrn, policyId, endpointId, dcdIsGatewayDevice, lastModified) {
        // Get the set of devices to which this policy is assigned.
        // This will be the difference of the set of devices the client
        // says are assigned and the set of devices the server says are
        // assigned (the server doesn't say who was unassigned, we can
        // only ask who is assigned).
        /** @type {Set<string>} */
        let unassignedDevices;
        /** @type {Map<string, Set<string>>} */
        const policies = this._policiesByDeviceModelUrn.get(deviceModelUrn);

        if (policies) {
            unassignedDevices = policies.get(policyId);

            if (!unassignedDevices) {
                return;
            }
        } else {
            // The client doesn't have any devices assigned to this policy.
            return;
        }

        // If we aren't a gateway device, then make sure the
        // assigned devices contains the directly connected device
        // endpoint ID, and ensure that the only element of
        // unassignedDevices is the directly connected device
        // endpont ID.
        if (!dcdIsGatewayDevice) {
            if (!unassignedDevices.has(endpointId)) {
                // This endpoint is not currently assigned to the policy.
                return;
            }

            unassignedDevices.clear();
            unassignedDevices.add(endpointId);
        }

        // Now get the set of devices to which this policy is assigned,
        // according to the server. Remove the set of server-assigned
        // devices from the client assigned devices so that
        // unassignedDevices is now the set of devices that have
        // been unassigned from this policy.
        //
        // If the directly connected device is not a gateway, then we
        // know that the subject of the unassign is the directly connected
        // device and there is no need to make a call to the server for
        // the assigned devices.
        //
        // Note that if the call to get the set of ICD ids that are assigned
        // to the policy might fail, throwing an exception. In this case,
        // there is no way to tell what devices belong to the policy or not.
        // To handle this situation, every device on the client that has
        // this policy will be be will unassign from the policy _and_
        // the device's mapping to the device model urn in policiesByDeviceId
        // will be removed. Removing the mapping ensures that getPolicy
        // will fetch the policy anew and the mapping will self correct.
        // The flag "couldNotGetIcds" lets us know that the call failed.
        /** @type {boolean} */
        let couldNotGetIcds = dcdIsGatewayDevice;

        if (dcdIsGatewayDevice) {
            try {
                /** @type {Set<string>} */
                const serverAssignedDevices =
                    this._getIndirectlyConnectedDeviceIdsForPolicy(deviceModelUrn, policyId,
                        endpointId);

                // Returned without error...couldNotGetIcds is false.
                couldNotGetIcds = false;
                unassignedDevices.clear(serverAssignedDevices);

                // If unassignedDevices is empty now that we removed
                // all the ICD ids from the server, we should return
                // since there are no devices on the client affected
                // by the change.
                if (unassignedDevices.size === 0) {
                    return;
                }
            } catch (error) {
                // ignored
            }
        }

        /** @type {iotcs.device.impl.DevicePolicy} */
        const devicePolicy = this._policiesByPolicyId.get(policyId);

        if (!devicePolicy) {
            throw new Error('Device policy is null.');
        }

        this._notifyPolicyUnassigned(devicePolicy, unassignedDevices);

        // Now unassignedDevices is the set of device IDs that have been unassigned from this policy.
        unassignedDevices.forEach(deviceId => {
            if (couldNotGetIcds) {
                // unassignPolicyFromDevice takes care of the entry in policiesByDeviceModelUrn
                // and takes care of un-persisting the device to policy association.
                /** @type {Map<string, string} */
                const devicePolicies = this._policiesByDeviceId.get(deviceId);

                if (devicePolicies != null) {
                    devicePolicies.delete(deviceModelUrn);
                }
            }
        });

        this._unassignPolicyFromDevice(deviceModelUrn, policyId, deviceId, lastModified);
}

    /**
     * Remove a listener from receiving notification of policies being added or removed.
     *
     * @param {object} changeListener the ChangeListener to remove.
     */
    _removeChangeListener(changeListener) {
        if (!changeListener) {
            return;
        }

        this._changeListeners.delete(changeListener);
    }

    /**
     *
     * @param {string} deviceModelUrn
     * @param {string} policyId
     * @param {string} deviceId
     */
    _removePolicy(deviceModelUrn, policyId, deviceId) {
        this._policiesByDeviceModelUrn.delete(deviceModelUrn);
        this._policiesByPolicyId.delete(policyId);
        this._policiesByDeviceId.delete(deviceId);
    }

    /**
     * Handle the logic for unassigning a policy from a device. The only reason for this
     * method to return false is if the client has a more recent change than what it
     * was told by the server.
     *
     * @param {string} deviceModelUrn the device model urn from which the policy is unassigned
     * @param {string} policyId the policy id of the policy that is unassigned
     * @param {string} deviceId the device from which the policy is unassigned
     * @param {number} lastModified the lastModification time from the change request on the server
     * @return {boolean} whether or not the policy was unassigned.
     */
    _unassignPolicyFromDevice(deviceModelUrn, policyId, deviceId, lastModified) {
        // Sanity check... does this device have the unassigned policy?
        /** @type {string} */
        let currentPolicyId;
        // policiesByDeviceId is { <device-id> : { <device-model-urn> : <policy-id> } }
        /** @type {Map<string, string>} */
        const policies = this._policiesByDeviceId.get(deviceId);

        if (policies) {
            currentPolicyId = policies.get(deviceModelUrn);
        } else {
            currentPolicyId = null;
        }

        if (!currentPolicyId) {
            // Device doesn't have a policy ID right now, move on.
            return true;
        }

        // If badMapping is set to true, the policiesByDeviceId entry for
        // the device-model URN of this device is removed. On the next
        // call to getPolicy, the map will auto-correct.
        /** @type {boolean} */
        let badMapping = false;

        if (policyId !== currentPolicyId) {
            // Server is telling me to unassign a policy ID
            // that the client doesn't have assigned. If
            // the policy that is assigned is newer than
            // lastModified, then the client is right and
            // we move on. Otherwise, unassign whatever
            // policy the device has and let the state
            // auto-correct on the next call to getPolicy.
            /** @type {iotcs.device.impl.DevicePolicy} */
            const devicePolicy = this._policiesByPolicyId.get(currentPolicyId);

            if (devicePolicy) {
                if (devicePolicy._getLastModified() > lastModified) {
                    // Client info is newer, move on to the next device ID.
                    return false;
                }

                // Else, server info is newer so indicate that
                // this device has a bad mapping and let the
                // code fall through to continue processing
                // this device ID.
                badMapping = true;
            } else {
                // Oh my. The device maps to some policy that
                // the client doesn't know about. Remove the mapping
                // and policiesByPolicyId will self correct for this
                // device the next time getPolicy is called.
                // Note that since devicePolicy is null, getPolicy
                // will return null for this device and device model anyway,
                // so taking an axe to policiesByPolicyId is okay here.
                //
                // policiesByDeviceId is { <device-id> : { <device-model-urn> : <policy-id> } }
                /** @type {Map<string, string>} */
                const devicePolicies = this._policiesByDeviceId.get(deviceId);

                if (devicePolicies) {
                    devicePolicies.delete(deviceModelUrn);
                }

                //this.removePersistedAssociation(deviceModelUrn, currentPolicyId, deviceId);
                return true;
            }
        }

        // If the sanity check passes, then we are good to remove
        // the mapping to the device-model-urn from policiesByDeviceId
        // for this device.
        if (policies) {
            if (!badMapping) {
                // If nothing is wrong in our mapping, then
                // set the current policy for this device and
                // device model urn to null. This state causes
                // getPolicy to return null without further lookup.
                policies.set(deviceModelUrn, null);
            } else {
                // if there was something bad in our mapping,
                // the remove the deviceModelUrn entry altogether.
                // On the next call to getPolicy for this device
                // and device model, the map will be corrected.
                policies.delete(deviceModelUrn);
            }
        }

        //this.removePersistedAssociation(deviceModelUrn, policyId, deviceId);
        return true;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/PersistenceStoreManager.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * PersistenceStoreManager
 */
iotcs.device.impl.PersistenceStoreManager = class {
    /**
     *
     * @param {string} name
     * @return {InMemoryPersistenceStore}
     */
    static _get(name) {
        if (!iotcs.device.impl.PersistenceStoreManager._persistentStores) {
            /**
             * Map from name to a PersistenceStore instance.
             *
             * @type {Map<string, PersistenceStore>}
             */
            iotcs.device.impl.PersistenceStoreManager._persistentStores = new Map();
        }

        let persistentStore =
            iotcs.device.impl.PersistenceStoreManager._persistentStores.get(name);

        if (!persistentStore) {
            persistentStore = new iotcs.device.impl.InMemoryPersistenceStore(name);

            iotcs.device.impl.PersistenceStoreManager._persistentStores.set(name,
                persistentStore);
        }

        return persistentStore;
    }

    static _has(name) {
        if (!iotcs.device.impl.PersistenceStoreManager._persistentStores) {
            /**
             * Map from name to a PersistenceStore instance.
             *
             * @type {Map<string, PersistenceStore>}
             */
            iotcs.device.impl.PersistenceStoreManager._persistentStores = new Map();
            return false;
        }

        return iotcs.device.impl.PersistenceStoreManager._persistentStores.has(name);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/PersistenceStoreTransaction.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * Class for modifying values in a PersistenceStore. The PersistenceStore itself is not updated
 * until commit() is called.
 */
iotcs.device.impl.PersistenceStoreTransaction = class {
    constructor(inMemoryPersistenceStore) {
        this._inMemoryPersistenceStore = inMemoryPersistenceStore;

        /**
         * @type {Map<string, object>}
         */
        this._transactions = new Map();
    }

    // Private/protected functions
    /**
     * Mark all values to be removed from the PersistenceStore object.  When commit is called,
     * values are removed before put methods are processed.
     *
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _clear() {
        this._transactions.clear();
        return this;
    }

    /**
     * Commit this transaction. This method persists the values to the backing store and
     * replaces the values in the {@code PersistenceStore} object.
     *
     * @return {boolean} true if the values were persisted.
     */
    _commit() {
        this._transactions.forEach((v, k) => {
            this._inMemoryPersistenceStore._items.set(k, v);
        });

        return true;
    }

    /**
     * Set an opaque value for the key, which is written back to the PersistenceStore object when
     * commit() is called.
     *
     * @param {string} key a key to be used to retrieve the value.
     * @param {object} value the value.
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _putOpaque(key, value) {
        this._transactions.set(key, value);
        return this;
    }

    /**
     * Mark all values to be removed from the PersistenceStore object.  When commit is called,
     * values are removed before put methods are processed.
     *
     * @param {string} key a key whose value is to be removed.
     * @return {PersistenceStoreTransaction} this Transaction object.
     */
    _remove(key) {
        this._transactions.delete(key);
        return this;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/ExternalObject.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * ExternalObject represents the value of a URI type in a device model.  The application is
 * responsible for uploading/downloading the content referred to by the URI.
 *
 * @alias iotcs.ExternalObject
 * @class iotcs.ExternalObject
 * @memberof iotcs
 *
 * @param {string} uri - The URI.
 */
iotcs.ExternalObject = class {
    constructor(uri) {
        _optionalArg(uri, "string");
        this._uri = uri || null;
    }

    // Public functions
    /**
     * Get the URI value.
     *
     * @function getURI
     * @memberof iotcs.ExternalObject
     *
     * @returns {string} The external object's URI.
     */
    getURI() {
        return this._uri;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Stack.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.Stack = class {
    constructor() {
        this._count = 0;
        this._items = [];
    }

    _get(idx) {
        return this._items[idx];
    }

    _getLength() {
        return this._count;
    }

    _peek() {
        return this._items.slice(-1) [0];
    }

    _push(item) {
        this._items.push(item);
        this._count++;
    }

    _pop() {
        if (this._count > 0) {
            this._count--;
        }

        return this._items.pop();
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/StorageObject.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This StorageObject is the base class for the device and enterprise StorageObject's.
 *
 * StorageObject provides information about content in cloud storage.  For creation use
 * {@link iotcs.device.util.DirectlyConnectedDevice#createStorageObject}.
 *
 * @param {?string} uri - The full URI of the object in the Storage Cloud.
 * @param {?string} name - The name of the object used in the Storage Cloud.
 * @param {?string} type - The type of the object, if <code>null</code> then
 *        {@link iotcs.StorageObject.MIME_TYPE}.
 * @param {?string} encoding - The encoding of the object, or <code>null</code> if none.
 * @param {?Date} date - The last-modified date of the object.
 * @param {number} [length = -1] - The length of the object.
 *
 * @alias iotcs.StorageObject
 * @class
 * @extends iotcs.ExternalObject
 * @memberof iotcs
 */
iotcs.StorageObject = class extends iotcs.ExternalObject {
    constructor(uri, name, type, encoding, date, length) {
        super(uri);
        _optionalArg(uri, 'string');
        _optionalArg(name, 'string');
        _optionalArg(type, 'string');
        _optionalArg(encoding, 'string');
        _optionalArg(date, Date);
        _optionalArg(length, 'number');

        // DJM: Can the _spec contents be _ prefixed also?
        this._spec = {
            /** @type {object} */
            metadata: {},
            name: name || null,
            type: type || iotcs.StorageObject.MIME_TYPE,
            encoding: encoding || null,
            date: date || null,
            length: length || -1
        };

        /**
         * "New" storage authentication information.  The storageContainerUrl contains the storage
         * object name, therefore it needs to be associated with the storage object.  Storage object
         * authentication data specification:
         *
         * {
         *    'authToken': {string}
         *    'authStartTime': {date}
         *    'storageContainerUrl': {string}
         *    'headers': {object}
         * }
         */
        this._storageAuthenticationData = null;
        this._dcdUtil = null;
        this._date = this._spec.date;
        this._encoding = this._spec.encoding;
        this._inputStream = null;
        /** @type {object} */
        this._metadata = this._spec.metadata;
        this._name = this._spec.name;
        this._outputStream = null;
        this._progressState = iotcs.StorageDispatcher.Progress.State.INITIATED;
        this._type = this._spec.type;
    }

    // Private/protected functions
    get _length() {
        return this._spec.length;
    }

    _isCancelled() {
        return this._progressState === iotcs.StorageDispatcher.Progress.State.CANCELLED;
    }

    set _length(newLength) {
        this._spec.length = newLength;
    }

    _setAttributes(date, length) {
        this._date = date;
        this._length = length;
    }

    _setDevice(device) {
        if (device instanceof iotcs.device.util.DirectlyConnectedDevice) {
            this._dcdUtil = device;
        } else {
            iotcs.error("Invalid device type.");
        }
    }

    _setProgressState(state) {
        this._progressState = state;
    }

    _setURI(uri) {
        this._uri = uri;
    }

    // Public functions
    /**
     * Returns the metadata.
     *
     * @returns {?object} The custom metadata for this storage object, or <code>null</code>.
     *
     * @function getCustomMetadata
     * @memberof iotcs.StorageObject
     *
     */
    getCustomMetadata() {
        return this._metadata;
    }

    /**
     * Get the date and time the content was created or last modified in cloud storage.
     *
     * @function getDate
     * @memberof iotcs.StorageObject

     * @returns {?Date} The date the content was last modified in cloud storage, or <code>null</code>
     *          if the content has not been uploaded.
     */
    getDate() {
        return this._date;
    }

    /**
     * Get the compression scheme of the content.
     *
     * @function getEncoding
     * @memberof iotcs.StorageObject
     *
     * @returns {?string} The compression scheme of the content, or <code>null</code> if the content
     *          is not compressed.
     */
    getEncoding() {
        return this._encoding;
    }

    /**
     * Get the length of the content in bytes.  This is the number of bytes required to upload or
     * download the content.
     *
     * @function getLength
     * @memberof iotcs.StorageObject
     *
     * @returns {number} The length of the content in bytes, or <code>-1</code> if unknown.
     */
    getLength() {
        return this._length;
    }

    /**
     * Get the the name of this object in the storage cloud.  This is name and path of the file that
     * was uploaded to the storage cloud.
     *
     * @function getName
     * @memberof iotcs.StorageObject
     *
     * @returns {string} The name of this object in the storage cloud.
     */
    getName() {
        return this._name;
    }

    /**
     * Get the mime-type of the content.
     *
     * @function getType
     * @memberof iotcs.StorageObject
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     *
     * @returns {string} the mime-type of the content.
     */
    getType() {
        return this._type;
    }

    /**
     * Get the input file path when uploading content.
     *
     * @function getInputStream
     * @memberof iotcs.StorageObject
     *
     * @returns {?stream.Readable} The input stream, or <code>null</code> if not set.
     */
    getInputStream() {
        return this._inputStream;
    }

    /**
     * Get the output file path when downloading content.
     *
     * @function getOutputStream
     * @memberof iotcs.StorageObject
     *
     * @returns {?stream.Writable} The output stream, or <code>null</code> if not set.
     */
    getOutputStream() {
        return this._outputStream;
    }

    /**
     * Get the URI value.
     *
     * @function getURI
     * @memberof iotcs.StorageObject
     *
     * @returns {?string} The URI, or <code>null</code> if unknown.
     */
    getURI() {
        if (this._storageAuthenticationData && this._storageAuthenticationData.storageUrl) {
            this._uri = this._storageAuthenticationData.storageUrl;
        }

        return this._uri;
    }

    /**
     * Adds this metadata to the StorageObject.
     *
     * @param key {string} - The metadata key.
     * @param value {string} - The metadata value.
     * @throws Error - If key or value are <code>undefined</code>, <code>null</code>, or empty.
     *
     * @function setCustomMetadata
     * @memberof iotcs.StorageObject
     */
    setCustomMetadata(key, value) {
        if (!key || (key.length < 1) || !value || (value.length < 1)) {
            iotcs.error('key and value must be non-empty strings.');
        }

        this._metadata[key] = value;
    }

    /**
     * Set an input stream for content to be uploaded.  The implementation allows for either the
     * input stream to be set, or the output stream to be set, but not both.  If the input stream
     * parameter is not null, the output stream will be set to null.
     *
     * @function setInputStream
     * @memberof iotcs.StorageObject
     *
     * @param {stream.Readable} stream - A readable stream to which the content will be read.
     */
    setInputStream(stream) {
        _mandatoryArg(stream, require('stream').Readable);

        switch (this._progressState) {
        case iotcs.StorageDispatcher.Progress.State.QUEUED:
        case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            iotcs.error("Can't set input stream during transfer process.");
            return;
        case iotcs.StorageDispatcher.Progress.State.COMPLETED:
            this._progressState = iotcs.StorageDispatcher.Progress.INITIATED;
        }

        let fs = require('fs');
        let stats = fs.statSync(stream.path);
        this._length = stats.size;
        this._inputStream = stream;
        this._outputStream = null;
    }

    /**
     * Set an output stream for content to be downloaded.  The implementation allows for either the
     * output stream to be set, or the input stream to be set, but not both.  If the output stream
     * parameter is not null, the input stream will be set to null.
     *
     * @function setOutputStream
     * @memberof iotcs.StorageObject
     *
     * @param {stream.Writable} stream - A writable stream to which the content will be written.
     */
    setOutputStream(stream) {
        _mandatoryArg(stream, require('stream').Writable);

        switch (this._progressState) {
        case iotcs.StorageDispatcher.Progress.State.QUEUED:
        case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
            iotcs.error("Can't set output stream during transfer process.");
            return;
        case iotcs.StorageDispatcher.Progress.State.COMPLETED:
            this._progressState = iotcs.StorageDispatcher.Progress.INITIATED;
        }

        this._outputStream = stream;
        this._inputStream = null;
    }

    /**
     * Synchronize content with the Storage Cloud Service.
     *
     * @function sync
     * @memberof iotcs.StorageObject
     *
     * @param {function(storage, error)} callback - The callback function.
     */
    sync(callback) {
        _mandatoryArg(callback, 'function');
        this._dcdUtil._syncStorage(this, callback, callback);
    }
};

/**
 * @constant MIME_TYPE
 * @memberof iotcs.StorageObject
 * @type {string}
 * @default "application/octet-stream"
 */
// DJM: Is this an un-changeable constant?
iotcs.StorageObject.MIME_TYPE = "application/octet-stream";
Object.freeze(iotcs.StorageObject.MIME_TYPE);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageObject.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @classdesc
 * StorageObject provides information about content in cloud storage.  For creation use
 * {@link iotcs.device.DirectlyConnectedDevice#createStorageObject}.
 *
 * <b>Monitor sync completions:</b><br>
 * <code>storageObject.onSync = function (syncEvent);</code><br>
 * where syncEvent is a  iotcs.device.Sync.SyncEvent.
 * <p>
 *
 * @param {?string} uri - The full URI of the object in the Storage Cloud.
 * @param {?string} name - The name of the object used in the Storage Cloud.
 * @param {?string} type - The type of the object, if <code>null</code> then
 *        {@link iotcs.device.StorageObject.MIME_TYPE}.
 * @param {?string} encoding - The encoding of the object, or <code>null</code> if none.
 * @param {?Date} date - The last-modified date of the object.
 * @param {number} [length = -1] - The length of the object.
 *
 * @alias iotcs.device.StorageObject
 * @class iotcs.device.StorageObject
 * @extends iotcs.ExternalObject
 * @memberof iotcs.device
 */
iotcs.device.StorageObject = class extends iotcs.StorageObject {
    constructor(uri, name, type, encoding, date, length) {
        super(uri, name, type, encoding, date, length);

        this._deviceForSync = null;
        this._inputPath = null;
        this._nameForSyncEvent = null;
        this._outputPath = null;
        this._syncEvents = [];
        this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
        this._onSync = arg => {};
    }

    // "Private" functions
    _createSyncEvent() {
        return new iotcs.device.StorageObject.SyncEvent(this, this._nameForSyncEvent,
            this._deviceForSync);
    }

    _addSyncEvent(syncEvent) {
        switch (this.getSyncStatus()) {
        case iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC:
        case iotcs.device.StorageObject.SyncStatus.SYNC_PENDING:
            this._syncEvents.push(syncEvent);
            break;
        case iotcs.device.StorageObject.SyncStatus.IN_SYNC:
        case iotcs.device.StorageObject.SyncStatus.SYNC_FAILED:
            this._onSync(syncEvent);
            break;
        }
    }

    _handleStateChange() {
        if (this._deviceForSync) {
            this._deviceForSync._handleStorageObjectStateChange(this);
        }
    }

    _setDevice(device) {
        if (device instanceof iotcs.device.util.DirectlyConnectedDevice) {
            this._dcdUtil = device;
        } else {
            iotcs.error("Invalid device type.");
        }
    }

    _setSyncEventInfo(name, virtualDevice) {
        this._nameForSyncEvent = name;
        this._deviceForSync = virtualDevice;
    }

    // "Public" functions
    get onSync() {
        return this._onSync;
    }

    /**
     * Returns an unmodifiable copy of the custom metadata of this storage object.
     *
     * @returns {?object} The custom metadata for this storage object, or <code>null</code>.
     *
     * @function getCustomMetadata
     * @memberof iotcs.device.StorageObject
     */
    getCustomMetadata() {
        return this._metadata;
    }

    /**
     * Get the date and time the content was created or last modified in cloud storage.
     *
     * @returns {?Date} date the content was last modified in cloud storage,
     * or <code>null</code> if the content has not been uploaded
     * @memberof iotcs.device.StorageObject
     * @function getDate
     */
    getDate() {
        return this._date;
    }

    /**
     * Get the compression scheme of the content.
     *
     * @returns {?string} the compression scheme of the content,
     * or <code>null</code> if the content is not compressed
     * @memberof iotcs.device.StorageObject
     * @function getEncoding
     */
    getEncoding() {
        return this._encoding;
    }

    /**
     * Get the input file path when uploading content.
     *
     * @returns {string} input file path
     * @memberof iotcs.device.StorageObject
     * @function getInputPath
     */
    getInputPath() {
        return this._inputPath;
    }

    /**
     * Get the length of the content in bytes.
     * This is the number of bytes required to upload or download the content.
     *
     * @returns {number} the length of the content in bytes, or <code>-1</code> if unknown
     * @memberof iotcs.device.StorageObject
     * @function getLength
     */
    getLength() {
        return this._length;
    }

    /**
     * Get the the name of this object in the storage cloud.
     * This is name and path of the file that was uploaded to the storage cloud.
     *
     * @returns {string} name
     * @memberof iotcs.device.StorageObject
     * @function getName
     */
    getName() {
        return this._name;
    }

    /**
     * Get the output file path when downloading content.
     *
     * @returns {string} output file path
     * @memberof iotcs.device.StorageObject
     * @function getOutputPath
     */
    getOutputPath() {
        return this._outputPath;
    }

    /**
     * Get the status of whether or not the content is in sync with the storage cloud.
     *
     * @see {@link iotcs.device.StorageObject.SyncStatus}
     * @memberof iotcs.device.StorageObject
     * @function getSyncStatus
     */
    getSyncStatus() {
        return this._syncStatus;
    }

    /**
     * Get the mime-type of the content.
     *
     * @returns {string} type
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     * @memberof iotcs.device.StorageObject
     * @function getType
     */
    getType() {
        return this._type;
    }

    /**
     * Get the URI value.
     *
     * @returns {?string} A URI, or <code>null</code> if unknown.
     * @memberof iotcs.device.StorageObject.
     * @function getURI
     */
    getURI() {
        return this._uri;
    }

    set onSync(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onSync that is not a function!');
            return;
        }

        this._onSync = newFunction;
    }

    /**
     * Adds this metadata to the StorageObject.
     *
     * @param key {string} - The metadata key.
     * @param value {string} - The metadata value.
     * @throws Error - If key or value are <code>undefined</code>, <code>null</code>, or empty.
     *
     * @function setCustomMetadata
     * @memberof iotcs.device.StorageObject
     */
    setCustomMetadata(key, value) {
        if (!key || (key.length < 1) || !value || (value.length < 1)) {
            iotcs.error('Key and value must be non-empty strings.');
        }

        this._metadata[key] = value;
    }

    /**
     * Set an input file path for content to be uploaded.
     * The implementation allows for either the input path to be set,
     * or the output path to be set, but not both.
     * If the input path parameter is not null, the output path will be set to null.
     *
     * @param {string} path - input file path to which the content will be read.
     *
     * @memberof iotcs.device.StorageObject
     * @function setInputPath
     */
    setInputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.device.StorageObject.SyncStatus.SYNC_PENDING");
            return;
        }

        if (this._inputPath === null || this._inputPath !== path) {
            this._inputPath = path;
            this._outputPath = null;
            this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
            super.setInputStream(fs.createReadStream(path));
        }
    }

    /**
     * Set an output file path for content to be downloaded.
     * The implementation allows for either the output path to be set,
     * or the input path to be set, but not both.
     * If the output path parameter is not null, the input path will be set to null.
     *
     * @param {string} path - output file path to which the content will be written.
     *
     * @memberof iotcs.device.StorageObject
     * @function setOutputPath
     */
    setOutputPath(path) {
        _mandatoryArg(path, "string");

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.SYNC_PENDING) {
            iotcs.error("Illegal state: iotcs.device.StorageObject.SyncStatus.SYNC_PENDING");
            return;
        }

        if (this._outputPath === null || this._outputPath !== path) {
            this._outputPath = path;
            this._inputPath = null;
            this._syncStatus = iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC;
            super.setOutputStream(this, fs.createWriteStream(path));
        }
    }

    /**
     * Notify the library to sync content with the storage cloud.
     *
     * @memberof iotcs.device.StorageObject
     * @function sync
     */
    sync() {
        let syncEvent = this._createSyncEvent();

        if (this._syncStatus === iotcs.device.StorageObject.SyncStatus.NOT_IN_SYNC) {
            if (this._inputStream || this._outputStream) {
                this._syncStatus = iotcs.device.StorageObject.SyncStatus.SYNC_PENDING;
            } else {
                iotcs.error("Input path or output path must be set.");
                return;
            }

            this._addSyncEvent(syncEvent);
            new iotcs.device.util.StorageDispatcher(this._dcdUtil).queue(this);
        } else {
            this._addSyncEvent(syncEvent);
        }
    }
};


/**
 * Callback function called when sync is complete.
 *
 * @callback iotcs.device.StorageObject~onSyncCallback
 *
 * @param {iotcs.device.Sync.SyncEvent} event - A SyncEvent with the result of the sync.
 */


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageObjectSyncEvent.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An event passed to the onSync callback when content referred to by an attribute value has been
 * successfully synchronized, or has failed to be synchronized.
 *
 * @param {iotcs.device.StorageObject} storageObject - The storage object to synchronize.
 * @param {string} [name] - The name of the storage object.
 * @param {iotcs.device.VirtualDevice} [virtualDevice]
 *
 * @alias iotcs.device.StorageObject.SyncEvent
 * @class iotcs.device.StorageObject.SyncEvent
 * @memberof iotcs.device.StorageObject
 */
iotcs.device.StorageObject.SyncEvent = class {
    constructor(storageObject, name, virtualDevice) {
        _mandatoryArg(storageObject, iotcs.device.StorageObject);
        _optionalArg(name, "string");
        _optionalArg(virtualDevice, iotcs.device.VirtualDevice);

        this._properties= {
            _storage: storageObject,
            _name: name,
            _virtualDevice: virtualDevice
        };
    }

    /**
     * Get the name of the attribute, action, or format that this event is associated with.
     *
     * @function getName
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {string} The name, or <code>null</code> if sync was called independently.
     */
    getName() {
        return this._properties._name;
    }

    /**
     * Get the StorageObject that is the source of this event.
     *
     * @function getSource
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {iotcs.device.StorageObject} The storage object.
     */
    getSource() {
        return this._properties._storage;
    }

    /**
     * Get the virtual device that is the source of the event.
     *
     * @function getVirtualDevice
     * @memberof iotcs.device.StorageObject.SyncEvent
     *
     * @returns {iotcs.device.VirtualDevice} the virtual device, or <code>null</code> if sync was
     *          called independently.
     */
    getVirtualDevice() {
        return this._properties._virtualDevice;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageObjectSyncStatus.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Enumeration of the status of whether or not the content is in sync with the storage cloud.
 *
 * @alias iotcs.device.StorageObject.SyncStatus
 * @class iotcs.device.StorageObject.SyncStatus
 * @enum {string}
 * @memberof iotcs.device.StorageObject
 * @readonly
 */
iotcs.device.StorageObject.SyncStatus = {
    /**
     * The content is not in sync with the storage cloud.
     */
    NOT_IN_SYNC: "NOT_IN_SYNC",
    /**
     * The content is not in sync with the storage cloud, but a
     * sync is pending.
     */
    SYNC_PENDING: "SYNC_PENDING",
    /**
     * The content is in sync with the storage cloud.
     */
    IN_SYNC: "IN_SYNC",
    /**
     * The content is not in sync with the storage cloud because the upload or download failed.
     */
    SYNC_FAILED: "SYNC_FAILED"
};

Object.freeze(iotcs.device.StorageObject.SyncStatus);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/StorageDispatcher.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.StorageDispatcher = class {
    constructor(device) {
        // TODO: device appears to never be used, but it's in the public API.
        _mandatoryArg(device, "object");

        this._priorityQueue =
            new iotcs.impl.PriorityQueue(iotcs.oracle.iot.client.maximumStorageObjectsToQueue);

        this._onProgress = (arg, error) => {};
        device.storageDispatcher = this;
    }

    // Private/protected functions
    _push(storage) {
        this._priorityQueue._push(storage);
    }

    _remove(storage) {
        return this._priorityQueue._remove(storage);
    }

    // Public functions
    /**
     * Cancel the transfer of content to or from storage. This call has no effect if the transfer
     * is completed, already cancelled, has failed, or the storageObject is not queued.
     *
     * @param {iotcs.StorageObject} The content storageObject to be cancelled.
     */
    cancel(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        let cancelled = false;

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.QUEUED) {
            cancelled = (this._remove(storageObject) !== null);
        }

        if (cancelled ||
            storageObject._progressState === iotcs.StorageDispatcher.Progress.State.IN_PROGRESS)
        {
            storageObject._setProgressState(iotcs.StorageDispatcher.Progress.State.CANCELLED);
        }

        if (cancelled) {
            this._onProgress(new iotcs.StorageDispatcher.Progress(storageObject));
        }
    }

    // DJM: Should this be public or private?
    get onProgress() {
        return this._onProgress;
    }

    /**
     * Add a StorageObject to the queue to upload/download content to/from the Storage Cloud.
     *
     * @param {iotcs.StorageObject} The content storageObject to be queued.
     */
    queue(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.COMPLETED) {
            return;
        }

        if (storageObject._progressState === iotcs.StorageDispatcher.Progress.State.QUEUED ||
            storageObject._progressState === iotcs.StorageDispatcher.Progress.State.IN_PROGRESS)
        {
            iotcs.error("Can't queue storage during transfer process.");
            return;
        }

        storageObject._setProgressState(iotcs.StorageDispatcher.Progress.State.QUEUED);
        this._push(storageObject);
        this._onProgress(new iotcs.StorageDispatcher.Progress(storageObject));
    }

    // DJM: Should this be public or private?
    set onProgress(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trrying to set something to onProgress that is not a function!');
            return;
        }

        this._onProgress = newFunction;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/StorageDispatcherProgress.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */
/**
 * An object for receiving progress via the Progress callback.
 *
 * @param {StorageObject} storageObject - The storage object which progress will be tracked.
 * @ignore
 *
 * @alias iotcs.StorageDispatcher.Progress
 * @class iotcs.StorageDispatcher.Progress
 * @memberof iotcs.StorageDispatcher
 */
iotcs.StorageDispatcher.Progress = class {
    /**
     * @ignore
     */
    constructor(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);

        this._storageObject = storageObject;
        this._progressState = storageObject._progressState;
        this._bytesTransferred = 0;
    }

    // Private/protected functions
    /**
     * @ignore
     */
    getBytesTransferred() {
        return this._bytesTransferred;
    }

    /**
     * @ignore
     */
    getState() {
        return this._progressState;
    }

    /**
     * @ignore
     */
    getStorageObject() {
        return this._storageObject;
    }

    /**
     * @ignore
     */
    _setBytesTransferred(bytes) {
        this._bytesTransferred = bytes;
    }
};

iotcs.StorageDispatcher.Progress.State = {
    /** Up/download was cancelled before it completed */
    CANCELLED: "CANCELLED",
    /** Up/download completed successfully */
    COMPLETED: "COMPLETED",
    /** Up/download failed without completing */
    FAILED: "FAILED",
    /** Up/download is currently in progress */
    IN_PROGRESS: "IN_PROGRESS",
    /** Initial state */
    INITIATED: "INITIATED",
    /** Up/download is queued and not yet started */
    QUEUED: "QUEUED"
};

Object.freeze(iotcs.StorageDispatcher.Progress.State);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageDispatcher.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The StorageDispatcher queues content for automatic upload to, or download from, the Oracle
 * Storage Cloud Service.
 * <p>
 * There can be only one StorageDispatcher instance per DirectlyConnectedDevice at a time and it is
 * created at first use.  To close an instance of a StorageDispatcher the
 * <code>DirectlyConnectedDevice.close</code> method must be used.
 * <p>
 * The onProgress function can be used to set handlers that are used for notifying as the transfer
 * progresses:
 * <p>
 * <code>storageDispatcher.onProgress = function (progress, error);</code><br>
 * where {@link Progress|iotcs.device.util.StorageDispatcher.Progress} progress is an object
 * represents the transfer progress of storage object.
 *
 * @param {iotcs.device.util.DirectlyConnectedDevice} device - The directly connected device
 *        (Messaging API) associated with this storage dispatcher.
 *
 * @alias iotcs.device.util.StorageDispatcher
 * @class iotcs.device.util.StorageDispatcher
 * @extends iotcs.StorageDispatcher
 * @memberof iotcs.device.util
 */
iotcs.device.util.StorageDispatcher = class extends iotcs.StorageDispatcher {
    constructor(device) {
        _mandatoryArg(device, iotcs.device.util.DirectlyConnectedDevice);

        if (device.storageDispatcher) {
            return device.storageDispatcher;
        }

        super(device);

        _mandatoryArg(device, iotcs.device.util.DirectlyConnectedDevice);

        this._dcdUtil = device;
        this._poolingInterval = iotcs.oracle.iot.client.device.defaultMessagePoolingInterval;
        this._startPooling = null;

        let deliveryCallback = (storage, error, bytes) => {
            storage._setProgressState(iotcs.StorageDispatcher.Progress.State.COMPLETED);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress, error);
        };

        let errorCallback = (storage, error, bytes) => {
            storage._setProgressState(iotcs.StorageDispatcher.Progress.State.FAILED);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress, error);
        };

        let processCallback = (storage, state, bytes) => {
            storage._setProgressState(state);
            let progress = new iotcs.device.util.StorageDispatcher.Progress(storage);
            progress._setBytesTransferred(bytes);
            this._onProgress(progress);
        };

        let self = this;

        this._sendMonitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (self._startPooling + self._poolingInterval)) {
                if (!device.isActivated() ||
                    device._activating ||
                    device._refreshing ||
                    device._storageRefreshing)
                {
                    self._startPooling = currentTime;
                    return;
                }

                let storage = self._priorityQueue._pop();

                while (storage !== null) {
                    storage._setProgressState(iotcs.StorageDispatcher.Progress.State.IN_PROGRESS);
                    self.onProgress(new iotcs.device.util.StorageDispatcher.Progress(storage));
                    self._dcdUtil._syncStorage(storage, deliveryCallback, errorCallback,
                                               processCallback);
                    storage = self._priorityQueue._pop();
                }

                self._startPooling = currentTime;
            }
        });

        self._startPooling = Date.now();
        self._sendMonitor._start();
    }

    // Private/protected functions
    _stop() {
        this._sendMonitor._stop();
    }

    // Public functions
    /**
     * Cancel the transfer of content to or from storage.  This call has no effect if the transfer is
     * completed, already cancelled, has failed, or the storageObject is not queued.
     *
     * @function cancel
     * @memberof iotcs.device.util.StorageDispatcher
     *
     * @param {iotcs.StorageObject} storageObject - The content storageObject to be cancelled.
     */
    cancel(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);
        super.cancel(this, storageObject);
    }

    /**
     * Add a StorageObject to the queue to upload/download content to/from the Storage Cloud.
     *
     * @function queue
     * @memberof iotcs.device.util.StorageDispatcher
     *
     * @param {iotcs.StorageObject} storageObject - The content storageObject to be queued.
     */
    queue(storageObject) {
        _mandatoryArg(storageObject, iotcs.StorageObject);
        super.queue(storageObject);
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageDispatcherProgress.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An object for receiving progress via the Progress callback.
 *
 * @param {StorageObject} storageObject - The storage object which progress will be tracked.
 *
 * @alias iotcs.device.util.StorageDispatcher.Progress
 * @class iotcs.device.util.StorageDispatcher.Progress
 * @extends iotcs.StorageDispatcher.Progress
 * @memberof iotcs.device.util.StorageDispatcher
 */
iotcs.device.util.StorageDispatcher.Progress = class extends iotcs.StorageDispatcher.Progress {
    constructor(storageObject) {
        super(storageObject);
        _mandatoryArg(storageObject, iotcs.StorageObject);
    }

    // Public functions
    /**
     * Get the number of bytes transferred.  This can be compared to the length of content obtained
     * by calling {@link iotcs.StorageObject#getLength}.
     *
     * @function getBytesTransferred
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {number} The number of bytes transferred.
     */
    getBytesTransferred() {
        return super.getBytesTransferred();
    }

    /**
     * Get the state of the transfer.
     *
     * @function getState
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {iotcs.device.util.StorageDispatcher.Progress.State} The state of the transfer.
     */
    getState() {
        return super.getState();
    }

    /**
     * Get the StorageObject that was queued for which this progress event pertains.
     *
     * @function getStorageObject
     * @memberof iotcs.device.util.StorageDispatcher.Progress
     *
     * @returns {iotcs.StorageObject} A StorageObject.
     */
    getStorageObject() {
        return super.getStorageObject();
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/StorageDispatcherProgressState.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * Enumeration of progress states.
 *
 * @alias State
 * @enum {string}
 * @memberof iotcs.device.util.StorageDispatcher.Progress
 * @readonly
 * @static
 */
iotcs.device.util.StorageDispatcher.Progress.State = {
    /**The upload or download was cancelled before it completed. */
    CANCELLED: "CANCELLED",
    /** The upload or download completed successfully. */
    COMPLETED: "COMPLETED",
    /** The upload or download failed without completing. */
    FAILED: "FAILED",
    /** The upload or download is currently in progress. */
    IN_PROGRESS: "IN_PROGRESS",
    /** Initial state of the upload or download. */
    INITIATED: "INITIATED",
    /** The upload or download is queued and not yet started. */
    QUEUED: "QUEUED",
};

Object.freeze(iotcs.device.util.StorageDispatcher.Progress.State);


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/MessagingPolicyImpl.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Cpyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.MessagingPolicyImpl = class {
    /**
     *
     * @param {iotcs.device.impl.DirectlyConnectedDeviceImpl} directlyConnectedDevice
     */
    constructor(dcdImpl) {
        /**
         * Key is device model urn, value is attribute -> trigger attributes
         * (a trigger attribute is a referenced attribute in a computedMetric formula).
         *
         * @type {Map<string, Map<string, Set<string>>>}
         */
        this._computedMetricTriggers = new Map();
        /**
         * Map from deviceModelUrn -> iotcs.device.impl.DeviceAnalog
         * We need more than one DeviceAnalog because the DCD can have more than one device model.
         *
         * @type {Map<string, iotcs.device.impl.DeviceAnalog>}
         */
        this._deviceAnalogMap = new Map();
        this._dcdImpl = dcdImpl;
        /**
         * {Set<iotcs.message.Message>}
         */
        this._messagesFromExpiredPolicies = new Set();
        /**
         * Data pertaining to this virtual device and its attributes for computing policies. The key
         * is attribute name (or null for the device model policies), value is a list. Each element
         * in the list corresponds to a function in the pipeline for the attribute, and the map is
         * used by the function to hold data between calls.  Note that there is a 1:1 correspondence
         * between the pipeline configuration data for the attribute, and the pipeline data for the
         * attribute.
         *
         * @type {Map<string, Set<Map<string, object>>>}
         */
        this._pipelineDataCache = new Map();

        this._deviceFunctionHelper = null;
        let num = 100000;
        let a = 1, b = 0, temp;

        while (num >= 0) {
            temp = a;
            a = a + b;
            b = temp;
            num--;
        }
    }

    // Private/protected functions
    // Apply policies that are targeted to an attribute
    /**
     * @param {iotcs.message.Message} dataMessage a data message to apply attribute polices to.
     * @param {number} currentTimeMillis the current time in milliseconds, use for expiring policies.
     * @resolve iotcs.message.Message} an attribute-processed data message.
     * @return Promise
     */
    _applyAttributePolicies(dataMessage, currentTimeMillis) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('_applyAttributePolicies called.');
            // A data message format cannot be null or empty (enforced in DataMessage(Builder) constructor.
            let format = dataMessage._properties.payload.format;
            // A data message format cannot be null or empty.
            let deviceModelUrn = format.substring(0, format.length - ":attributes".length);
            // Use var so we can reference it from within the callbacks.
            var messagingPolicyImpl = this;
            let dataMessageVar = dataMessage;
            let self = this;

            this._dcdImpl.getDeviceModel(deviceModelUrn, (response, error) => {
                iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel response = ' + response +
                    ', error = ' + error);

                if (error) {
                    console.log('-------------Error getting humidity sensor device model-------------');
                    console.log(error.message);
                    console.log('--------------------------------------------------------------------');
                    return;
                }

                let deviceModelJson = JSON.stringify(response, null, 4);
                let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);
                iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel deviceModel = ' + deviceModel);

                if (!deviceModel) {
                    resolve(dataMessageVar);
                    return;
                }

                let endpointId = dataMessage._properties.source;

                let devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(
                    messagingPolicyImpl._dcdImpl.getEndpointId());

                if (!devicePolicyManager) {
                    devicePolicyManager =
                        new iotcs.device.impl.DevicePolicyManager(messagingPolicyImpl._dcdImpl);
                }

                devicePolicyManager._getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                    iotcs.impl.Platform._debug('_applyAttributePolicies.getPolicy devicePolicy = ' +
                                    devicePolicy);
                    let deviceAnalog;

                    if (messagingPolicyImpl._deviceAnalogMap.has(endpointId)) {
                        deviceAnalog = messagingPolicyImpl._deviceAnalogMap.get(endpointId);
                    } else {
                        deviceAnalog = new iotcs.device.impl.DeviceAnalog(messagingPolicyImpl._dcdImpl,
                            deviceModel, endpointId);

                        messagingPolicyImpl._deviceAnalogMap.set(endpointId, deviceAnalog);
                    }

                    let triggerMap;

                    if (!self._computedMetricTriggers.has(deviceModelUrn)) {
                        triggerMap = new Map();
                        self._computedMetricTriggers.set(deviceModelUrn, triggerMap);
                        /** @type {Map<string, iotcs.impl.DeviceModelAttribute>} */
                        let deviceModelAttributeMap = deviceModel.getDeviceModelAttributes();

                        deviceModelAttributeMap.forEach(deviceModelAttribute => {
                            let attributeName = deviceModelAttribute.name;

                            if (!devicePolicy) {
                                return; // continue
                            }

                            /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                            let pipeline = devicePolicy._getPipeline(attributeName);
                            iotcs.impl.Platform._debug('_applyAttributePolicies getDeviceModel.getPolicy pipeline = '
                                + pipeline);

                            if (!pipeline || pipeline.size === 0) {
                                return; // continue
                            }

                            // If a computedMetric is the first function in the pipeline,
                            // then see if the formula refers to other attributes. If so,
                            // then try this pipeline after all others.
                            /** @type {iotcs.device.impl.DevicePolicy.Function} */
                            let devicePolicyFunction = pipeline.values().next().value;
                            let deviceFunctionId = devicePolicyFunction._getId();
                            /** @type {Map<string, ?>} */
                            let parameters = devicePolicyFunction._getParameters();

                            if ('computedMetric' === deviceFunctionId) {
                                let formula = parameters.get('formula');
                                /** @type {Set<string>} */
                                let triggerAttributes = new Set();
                                let pos = formula.indexOf('$(');

                                while (pos !== -1) {
                                    let end = formula.indexOf(')', pos + 1);

                                    if (pos === 0 || formula.charAt(pos - 1) !== '$') {
                                        let attr = formula.substring(pos + '$('.length, end);

                                        if (attr !== attributeName) {
                                            triggerAttributes.add(attr);
                                        }
                                    }

                                    pos = formula.indexOf('$(', end + 1);
                                }

                                if (triggerAttributes.size > 0) {
                                    triggerMap.set(attributeName, triggerAttributes);
                                }
                            }
                        });

                        iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicies about to call applyAttributePolicies2.');

                        let message = messagingPolicyImpl._applyAttributePolicies2(dataMessage,
                            deviceModel, devicePolicy, deviceAnalog, triggerMap, format,
                            messagingPolicyImpl, currentTimeMillis);

                        iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicies message = ' +
                            message);

                        resolve(message);
                    } else {
                        triggerMap = self._computedMetricTriggers.get(deviceModelUrn);

                        let message = messagingPolicyImpl._applyAttributePolicies2(dataMessage,
                            deviceModel, devicePolicy, deviceAnalog, triggerMap, format,
                            messagingPolicyImpl, currentTimeMillis);

                        resolve(message);
                    }
                }).catch(error => {
                    console.log('Error getting device policy: ' + error);
                });
            });
        });
    }

    /**
     *
     * @param dataMessage
     * @param deviceModel
     * @param devicePolicy
     * @param deviceAnalog
     * @param triggerMap
     * @param messagingPolicyImpl
     * @param currentTimeMillis
     * @return {iotcs.message.Message} a message.
     */
    _applyAttributePolicies2(dataMessage, deviceModel, devicePolicy, deviceAnalog, triggerMap,
                            format, messagingPolicyImpl, currentTimeMillis)
    {
        iotcs.impl.Platform._debug('_applyAttributePolicies2 called.');
        /** @type {[key] -> value} */
        let dataMessageDataItemsKeys = Object.keys(dataMessage._properties.payload.data);

        // DataItems resulting from policies. {Set<DataItem<?>>}
        let policyDataItems = new Set();

        // DataItems that have no policies. {Set<DataItem<?>>}
        let skippedDataItems = new Set();

        // If no policies are found, we will return the original message.
        let noPoliciesFound = true;

        dataMessageDataItemsKeys.forEach(attributeName => {
            iotcs.impl.Platform._debug('_applyAttributePolicies2 attributeName = ' + attributeName);
            let attributeValue = dataMessage._properties.payload.data[attributeName];

            if (!attributeName) {
                skippedDataItems.add(attributeName);
                return; // continue
            }

            if (!devicePolicy) {
                deviceAnalog._setAttributeValue(attributeName, attributeValue);
                skippedDataItems.add(new iotcs.device.DataItem(attributeName, attributeValue));
                return; // continue
            }

            /** @type {List<iotcs.device.impl.DevicePolicy.Function>} */
            let pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('_applyAttributePolicies2 pipeline = ' + pipeline);

            // No policies for this attribute?  Retain the data item.
            if (!pipeline || pipeline.size === 0) {
                deviceAnalog._setAttributeValue(attributeName, attributeValue);
                skippedDataItems.add(new iotcs.device.DataItem(attributeName, attributeValue));
                return; // continue
            }

            noPoliciesFound = false;

            // If this is a computed metric, skip it for now.
            if (triggerMap.has(attributeValue)) {
                return; // continue
            }

            let policyDataItem = messagingPolicyImpl._applyAttributePolicy(deviceAnalog,
                attributeName, attributeValue, pipeline, currentTimeMillis);

            iotcs.impl.Platform._debug('_applyAttributePolicies2 policyDataItem from applyAttributePolicy = ' +
                iotcs.impl.Platform._inspect(policyDataItem));

            if (policyDataItem) {
                policyDataItems.add(policyDataItem);
            }
        });

        // If no policies were found, return the original message.
        if (noPoliciesFound) {
            return dataMessage;
        }

        // If policies were found, but there are no policyDataItem's and no skipped data items, then return null.
        if (policyDataItems.size === 0 && skippedDataItems.size === 0) {
            return null;
        }

        // This looks like a good place to check for computed metrics too.
        if (policyDataItems.size > 0) {
            messagingPolicyImpl._checkComputedMetrics(policyDataItems, deviceAnalog,
                triggerMap, currentTimeMillis);

                iotcs.impl.Platform._debug('_applyAttributePolicies2 after checkComputedMetrics, policyDataItems = ' +
                    iotcs.impl.Platform._inspect(policyDataItems));
        }

        let message = new iotcs.message.Message();

        message
               .format(format)
               .priority(dataMessage._properties.priority)
               .source(dataMessage._properties.source)
               .type(iotcs.message.Message.Type.DATA);

        policyDataItems.forEach(dataItem => {
            let dataItemKey = dataItem.getKey();
            let dataItemValue = dataItem.getValue();

            // For Set items, we need to get each value.
            if (dataItemValue instanceof Set) {
                dataItemValue.forEach(value => {
                    message.dataItem(dataItemKey, value);
                });
            } else {
                message.dataItem(dataItemKey, dataItemValue);
            }
        });

        skippedDataItems.forEach(dataItem => {
            let dataItemKey = dataItem.getKey();
            let dataItemValue = dataItem.getValue();

            // For Set items, we need to get each value.
            if (dataItemValue instanceof Set) {
                dataItemValue.forEach(value => {
                    message.dataItem(dataItemKey, value);
                });
            } else {
                message.dataItem(dataItemKey, dataItemValue);
            }
        });

        return message;
    }

    /**
     *
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {DataItem} dataItem
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {number} currentTimeMillis
     * @return {DataItem}
     */
    _applyAttributePolicy(deviceAnalog, attributeName, attributeValue, pipeline, currentTimeMillis) {
        iotcs.impl.Platform._debug('_applyAttributePolicy called, attributeName = ' + attributeName +
                        ', attributeValue = ' + attributeValue);
        let deviceModel = deviceAnalog._getDeviceModel();
        // Get or create the pipeline data for this attribute.
        /** @type {Set<Map<string, object>>} */
        let pipelineData = this._pipelineDataCache.get(attributeName);

        if (!pipelineData) {
            /** @type {List<Map<string, object>>} */
            pipelineData = new Set();
            this._pipelineDataCache.set(attributeName, pipelineData);
        }

        iotcs.device.impl.DeviceFunction._putInProcessValue(deviceAnalog._getEndpointId(),
            deviceModel.getUrn(), attributeName, attributeValue);

        // Convert the pipeline and pipeline data Sets to arrays so we can index from them.
        let pipelineDataAry = Array.from(pipelineData);
        let pipelineAry = Array.from(pipeline);

        // Process each pipeline "function".
        for (let index = 0; index < pipelineAry.length; index++) {
            /** @type {iotcs.device.impl.DevicePolicyFunction} */
            let pipelineFunction = pipelineAry[index];
            /** @type {Map<string, object>} */
             let functionData;

            if (index < pipelineDataAry.length) {
                functionData = pipelineDataAry[index];
            } else {
                functionData = new Map();
                pipelineData.add(functionData);
                pipelineDataAry.push(functionData);
            }

            /** @type {string} */
            let functionId = pipelineFunction._getId();
            /** @type {Map<string, ?>} */
            let parameters = pipelineFunction._getParameters();
            /** @type {iotcs.device.impl.DeviceFunction} */
            let deviceFunction =
                iotcs.device.impl.DeviceFunction._getDeviceFunction(functionId);

            if (!deviceFunction) {
                continue;
            }

            /** @type {boolean} */
            let windowExpired;
            /** @type {number} */
            let window = iotcs.device.impl.DeviceFunction._getWindow(parameters);
            iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyAttributePolicy window = ' + window);

            if (window > 0) {
                // This could be more succinct, but it makes the key easy to read in the debugger.
                /** @type {string} */
                let k = deviceModel.getUrn() + ':' + attributeName + ':' + deviceFunction._getId();
                /** @type {number} */
                let t0 = iotcs.device.impl.MessagingPolicyImpl._windowMap.get(k);

                if (!t0) {
                    t0 = currentTimeMillis;
                    iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, t0);
                }

                windowExpired = (t0 + window) <= currentTimeMillis;

                if (windowExpired) {
                    iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k,
                        currentTimeMillis);
                }
            } else {
                windowExpired = false;
            }

            iotcs.impl.Platform._debug('_applyAttributePolicy applying device function: ' + deviceFunction);

            if (deviceFunction._apply(deviceAnalog, attributeName, parameters, functionData,
                    attributeValue) || windowExpired)
            {
                iotcs.impl.Platform._debug('_applyAttributePolicy windowExpired');
                const valueFromPolicy = deviceFunction._get(deviceAnalog, attributeName, parameters,
                    functionData);

                iotcs.impl.Platform._debug('_applyAttributePolicy valueFromPolicy = ' +
                                iotcs.impl.Platform._inspect(valueFromPolicy));

                if (valueFromPolicy) {
                    iotcs.impl.Platform._debug('_applyAttributePolicy in valueFromPolicy.');
                    attributeValue = valueFromPolicy;

                    iotcs.impl.Platform._debug('_applyAttributePolicy in valueFromPolicy attributeValue = ' +
                        attributeValue);

                    iotcs.device.impl.DeviceFunction._putInProcessValue(
                        deviceAnalog._getEndpointId(), deviceModel.getUrn(), attributeName,
                        attributeValue);
                } else {
                    console.log(attributeName + " got null value from policy" +
                        deviceFunction._getDetails(parameters));

                    break;
                }
            } else {
                // apply returned false.
                attributeValue = null;
                break;
            }
        }

        // After the policy loop, if the attributeValue is null, then the policy
        // either filtered out the attribute, or the policy parameters have not
        // been met (e.g., sampleQuality rate is not met). If it is not null,
        // then create a new DataItem to replace the old in the data message.
        /** @type {DataItem} */
        let policyDataItem;
        iotcs.impl.Platform._debug('_applyAttributePolicy attributeValue = ' + attributeValue);

        if (attributeValue) {
            deviceAnalog._setAttributeValue(attributeName, attributeValue);
            policyDataItem = new iotcs.device.DataItem(attributeName, attributeValue);
        } else {
            policyDataItem = null;
        }

        iotcs.device.impl.DeviceFunction._removeInProcessValue(deviceAnalog._getEndpointId(), deviceModel.getUrn(),
            attributeName);

        iotcs.impl.Platform._debug('_applyAttributePolicy attributeName = ' + attributeName);
        iotcs.impl.Platform._debug('_applyAttributePolicy attributeValue = ' + attributeValue);
        iotcs.impl.Platform._debug('_applyAttributePolicy returning policyDataItem = ' + policyDataItem);
        return policyDataItem;
    }

    /**
     * Apply policies that are targeted to a device model
     *
     * @param {iotcs.message.Message} message
     * @param {number} currentTimeMillis (long)
     * @return {Promise} resolves to iotcs.message.Message[]
     */
    _applyDevicePolicies(message, currentTimeMillis) {
        return new Promise((resolve, reject) => {
            // A data message or alert format cannot be null or empty
            // (enforced in Data/AlertMessage(Builder) constructor)
            /** @type {string} */
            let format;
            /** @type {string} */
            let deviceModelUrn;
            /** @type {string} */
            const endpointId = message._properties.source;

            if (message._properties.type === iotcs.message.Message.Type.DATA) {
                format = message._properties.payload.format;
                deviceModelUrn = format.substring(0, format.length - ":attributes".length);
            } else if (message._properties.type === iotcs.message.Message.Type.ALERT) {
                format = message._properties.payload.format;
                deviceModelUrn = format.substring(0, format.lastIndexOf(':'));
            } else {
                resolve([message]);
                return;
            }

            /** @type {iotcs.device.impl.DeviceAnalog} */
            let deviceAnalog = this._deviceAnalogMap.get(endpointId);

            if (!deviceAnalog) {
                this.dcdImpl._getDeviceModel(deviceModelUrn, deviceModelJson => {
                    if (deviceModelJson) {
                        let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);

                        if (deviceModel instanceof iotcs.device.impl.DeviceModel) {
                            deviceAnalog = new iotcs.device.impl.DeviceAnalog(this._dcdImpl,
                                                            deviceModel, endpointId);

                            this._deviceAnalogMap.set(endpointId, deviceAnalog);
                        }

                        // TODO: what to do if deviceAnalog is null?
                        if (!deviceAnalog) {
                            resolve([message]);
                        } else {
                            this._applyDevicePolicies2(message, deviceModelUrn, endpointId,
                                currentTimeMillis, deviceAnalog).then(messages =>
                            {
                                resolve(messages);
                            }).catch(error => {
                                console.log('Error applying device policies: ' + error);
                                reject();
                            });
                        }
                    } else {
                        // TODO: what to do if deviceModel is null?
                        resolve([message]);
                    }
                });
            } else {
                this._applyDevicePolicies2(message, deviceModelUrn, endpointId, currentTimeMillis,
                    deviceAnalog).then(messages =>
                {
                    resolve(messages);
                }).catch(error => {
                    console.log('Error applying device policies: ' + error);
                    reject();
                });
            }
        });
    }

    /**
     * @param {iotcs.message.Message} message
     * @param {string} deviceModelUrn
     * @param {string} endpointId
     * @param {number} currentTimeMillis
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Promise} (of iotcs.message.Message[])
     */
    _applyDevicePolicies2(message, deviceModelUrn, endpointId, currentTimeMillis, deviceAnalog) {
        return new Promise((resolve, reject) => {
            /** @type {iotcs.device.impl.DevicePolicyManager} */
            const devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(
                this._dcdImpl.getEndpointId());

            devicePolicyManager._getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                if (!devicePolicy) {
                    resolve([message]);
                    return;
                }

                /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                const pipeline = devicePolicy._getPipeline(iotcs.device.impl.DevicePolicy.ALL_ATTRIBUTES);

                // No policies for this device model, retain the data item.
                if (!pipeline || (pipeline.size === 0)) {
                    resolve([message]);
                    return;
                }

                // Create the pipeline data for this device model
                /** @type {Set<Map<string, object>>} */
                let pipelineData = this._pipelineDataCache.get(null);

                if (!pipelineData) {
                    pipelineData = new Set();
                    this._pipelineDataCache.set(null, pipelineData);
                }

                /** @type {iotcs.device.impl.DevicePolicyFunction[]} */
                let pipelineAry = Array.from(pipeline);
                let pipelineDataAry = Array.from(pipelineData);

                // Handle pipeline for device policy
                for (let index = 0, maxIndex = pipeline.size; index < maxIndex; index++) {
                    /** @type {iotcs.device.impl.DevicePolicyFunction} */
                    const devicePolicyFunction = pipelineAry[index];
                    /** @type {Map<string, object>} */
                    let functionData;

                    if (index < pipelineData.size) {
                        functionData = pipelineDataAry[index];
                    } else {
                        functionData = new Map();
                        pipelineData.add(functionData);
                    }

                    /** @type {string} */
                    const key = devicePolicyFunction._getId();
                    /** @type {Map<string, object>} */
                    const parameters = devicePolicyFunction._getParameters();
                    /** @type {iotcs.device.impl.DeviceFunction} */
                    const deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(key);

                    if (!deviceFunction) {
                        continue;
                    }

                    /** @type {boolean} */
                    let windowExpired;
                    /** @type {number} */
                    const window = iotcs.device.impl.DeviceFunction._getWindow(parameters);
                    iotcs.impl.Platform._debug('iotcs.device.impl.MessagingPolicyImpl.applyDevicePolicies2 window = ' + window);

                    if (window > 0) {
                        /** @type {string} */
                        const k = deviceModelUrn.concat("::".concat(deviceFunction._getId()));
                        /** @type {number} */
                        let t0 = iotcs.device.impl.MessagingPolicyImpl._windowMap.get(k);

                        if (!t0) {
                            t0 = currentTimeMillis;
                            iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, t0);
                        }

                        windowExpired = (t0 + window) <= currentTimeMillis;

                        if (windowExpired) {
                            iotcs.device.impl.MessagingPolicyImpl._windowMap.set(k, currentTimeMillis);
                        }
                    } else {
                        windowExpired = false;
                    }

                    /** @type {boolean} */
                    let alertOverridesPolicy;

                    if (message instanceof iotcs.message.Message &&
                        message._properties.type === iotcs.message.Message.Type.ALERT)
                    {
                        /** @type {iotcs.message.Message.AlertMessage} */
                        const alertMessage = message;
                        /** @type {iotcs.message.Message.AlertMessage.Severity} */
                        const alertMessageSeverity = alertMessage.payload.severity;
                        /** @type {iotcs.message.Message.AlertMessage.Severity} */
                        let configuredSeverity = iotcs.message.Message.AlertMessage.Severity.CRITICAL;
                        /** @type {string} */
                        const criterion = parameters.get("alertSeverity");

                        if (criterion) {
                            try {
                                configuredSeverity = criterion;
                            } catch (e) {
                                configuredSeverity =
                                    iotcs.message.Message.AlertMessage.Severity.CRITICAL;
                            }
                        }

                        // TODO: Fix this compareTo
                        alertOverridesPolicy = configuredSeverity.compareTo(alertMessageSeverity) <= 0;
                    } else {
                        alertOverridesPolicy = false;
                    }

                    if (deviceFunction._apply(deviceAnalog, null, parameters, functionData, message)
                        || windowExpired || alertOverridesPolicy) {
                        /** @type {object} */
                        const valueFromPolicy = deviceFunction._get(
                            deviceAnalog,
                            null,
                            parameters,
                            functionData
                        );

                        if (valueFromPolicy) {
                            /** @type {iotcs.message.Message[]} */
                            resolve(Array.from(valueFromPolicy));
                            return;
                        }
                    }

                    resolve([]);
                    return;
                }

                resolve([]);
            }).catch(error => {
                console.log('Error getting device policy. error=' + error);
                reject();
            });
        });
    }

    /**
     * This is the method that applies whatever policies there may be to the message. The
     * method returns zero or more messages, depending on the policies that have been
     * applied to the message. The caller is responsible for sending or queuing the
     * returned messages. The data items in the returned are messages are possibly modified
     * by some policy; for example, a message with a temperature value goes in, a copy of
     * the same message is returned with the temperature value replaced by the
     * average temperature. A returned message may also be one that is created by a
     * policy function (such as a computedMetric). Or the returned messages may be messages
     * that have been batched. If no policy applies to the message, the message itself
     * is returned.
     *
     * @param {iotcs.device.util.DirectlyConnectedDevice} dcd
     * @param {iotcs.message.Message} message a message of any kind.
     * @return {Promise} a Promise which will resolve with a {iotcs.message.Message[]} of {@link iotcs.message.Message}s to be
     *         delivered.
     */
    _applyPolicies(message) {
        return new Promise((resolve, reject) => {
            if (!message) {
                resolve(new iotcs.message.Message([]));
                return;
            }

            let currentTimeMillis = new Date().getTime();

            if (message._properties.type === iotcs.message.Message.Type.DATA) {
                this._applyAttributePolicies(message, currentTimeMillis).then(dataMessage => {
                    // Changes from here to the resolve method must also be made in the else
                    // statement below.
                    /** @type {Set<iotcs.message.Message>} */
                    const messageList = new Set();

                    if (this._messagesFromExpiredPolicies.size > 0) {
                        this._messagesFromExpiredPolicies.forEach(v => messageList.add(v));
                        this._messagesFromExpiredPolicies.clear();
                    }

                    if (dataMessage) {
                        this._applyDevicePolicies(dataMessage, currentTimeMillis).then(
                            messagesFromDevicePolicy =>
                       {
                            messagesFromDevicePolicy.forEach(v => messageList.add(v));
                            resolve(Array.from(messageList));
                        }).catch(error => {
                            console.log('Error applying device policies: ' + error);
                            reject();
                        });
                    }
                }).catch(error => {
                    console.log('Error applying attribute policies: ' + error);
                    reject();
                });
            } else {
                // Changes from here to the resolve method must also be made in the if
                // statement above.
                /** @type {Set<iotcs.message.Message>} */
                const messageList = new Set();

                if (this._messagesFromExpiredPolicies.size > 0) {
                    this._messagesFromExpiredPolicies.forEach(v => messageList.add(v));
                    this._messagesFromExpiredPolicies.clear();
                }

                /** @type {iotcs.message.Message[]} */
                this._applyDevicePolicies(message, currentTimeMillis).then(
                    messagesFromDevicePolicy =>
                {
                    resolve(messageList);
                }).catch(error => {
                    console.log('Error applying device policies: ' + error);
                    reject();
                });
            }
        }).catch(error => {
            console.log('Error applying policies: ' + error);
        });
    }

    //      * @return {Promise} which resolves to void.
    /**
     * @param {Set<DataItem<?>>} dataItems
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @param {Map<string, Set<string>>} triggerMap
     * @param {number} currentTimeMillis
     */
    _checkComputedMetrics(dataItems, deviceAnalog, triggerMap, currentTimeMillis) {
        iotcs.impl.Platform._debug('checkComputeMetrics called.');
        // TODO: This function should return a Promise and call devicePolicyManager.getPolicy.
        // return new Promise((resolve, reject) => {
            if (triggerMap.size === 0 || dataItems.size === 0) {
                // resolve();
                return;
            }

            /** @type {Set<string>} */
            let updatedAttributes = new Set();

            dataItems.forEach((value, key) => {
                updatedAttributes.add(key);
            });

            let endpointId = deviceAnalog._getEndpointId();
            let deviceModel = deviceAnalog._getDeviceModel();
            /** @type {Map<string, iotcs.impl.DeviceModelAttribute>} */
            let deviceModelAttributes = deviceModel.getDeviceModelAttributes();
            let deviceModelUrn = deviceModel.getUrn();

            /** @type {<string, Set<string>>}  */
            // Map from  attributeName -> triggerAttributes.
            // triggerAttributes is the set of attributes that the formula refers to.
            triggerMap.forEach((triggerAttributes, attributeName) => {
                let updatedAttributesAry = Array.from(updatedAttributes);
                let triggerAttributesAry = Array.from(triggerAttributes);
                // If the set of attributes that the formula refers to is a subset of the updated attributes, then compute
                // the value of the computedMetric.
                //if (updatedAttributes.containsAll(attributeName)) {
                if (updatedAttributesAry.some(r => r.size === triggerAttributesAry.length &&
                        r.every((value, index) => triggerAttributesAry[index] === value)))
                {
                    let deviceModelAttribute = deviceModelAttributes._get(attributeName);
                    let attributeValue = deviceAnalog._getAttributeValue(attributeName);

                    if (!attributeValue) {
                        attributeValue = deviceModelAttribute.defaultValue;
                    }

                    /** @type {DataItem} */
                    let dataItem;

                    switch (deviceModelAttribute.type) {
                        // TODO: We don't need all of these types in JavaScript.
                        case 'BOOLEAN':
                        case 'NUMBER':
                        case 'STRING':
                        case 'URI': {
                            let dataItem = new iotcs.device.DataItem(attribute, value);
                            break;
                        }
                        case 'DATETIME': {
                            let value;

                            if (typeof attributeValue === 'date') {
                                value = attributeValue.getTime();
                            } else {
                                value = attributeValue ? attributeValue : 0;
                            }

                            dataItem = new iotcs.device.DataItem(attribute, value);
                            break;
                        }
                        default:
                            console.log('Unknown device model attribute type: ' +
                                deviceModelAttribute.type);

                            return; // continue
                    }

                    let devicePolicyManager =
                        iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(this._dcdImpl.getEndpointId());

                    // This asynchronous call should be used instead of
                    // devicePolicyManager.getPolicy2 below.
                    //
                    // devicePolicyManager.getPolicy(deviceModelUrn, endpointId).then(devicePolicy => {
                    //     if (!devicePolicy) {
                    //         return // continue
                    //     }
                    //
                    //     /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                    //     let pipeline = devicePolicy.getPipeline(attribute);
                    //
                    //     if (!pipeline || pipeline.size === 0) {
                    //         return // continue
                    //     }
                    //
                    //     /** @type {DataItem} */
                    //     let policyDataItem = this._applyAttributePolicy(deviceAnalog, dataItem,
                    //         pipeline, currentTimeMillis);
                    //
                    //     if (policyDataItem) {
                    //         dataItems.add(policyDataItem);
                    //     }
                    //
                    //     resolve();
                    // }).catch(error => {
                    //     console.log('Error getting device policy: ' + error);
                    //     reject();
                    // });

                    let devicePolicy = devicePolicyManager._getPolicy(deviceModelUrn, endpointId);

                    if (!devicePolicy) {
                        return; // continue
                    }

                    /** @type {Set<iotcs.device.impl.DevicePolicy.Function>} */
                    let pipeline = devicePolicy._getPipeline(attribute);

                    if (!pipeline || pipeline.size === 0) {
                        return; // continue
                    }

                    /** @type {DataItem} */
                    let policyDataItem = this._applyAttributePolicy(deviceAnalog, dataItem,
                        pipeline, currentTimeMillis);

                    iotcs.impl.Platform._debug('checkComputedMetrics policyDataItem = ' + policyDataItem);

                    if (policyDataItem) {
                        dataItems.add(policyDataItem);
                    }

                    // resolve();
                }
            });
        // });
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy1(devicePolicy) {
        /** @type {Set<iotcs.message.Message>} */
        const messageList = new Set();

        this._deviceAnalogMap.forEach(deviceAnalog => {
            /** @type {Set<iotcs.message.Message>} */
            const messages = this._expirePolicy3(devicePolicy, deviceAnalog);

            if (messages && (messages.size > 0)) {
                messages.forEach(message => {
                    messageList.add(message);
               });
            }
        });

        return messageList;
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {number} currentTimeMillis
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy2(devicePolicy, currentTimeMillis) {
        /** @type {Set<iotcs.message.Message>} */
        const messageList = this._expirePolicy1(devicePolicy);
        /** @type {Set<iotcs.message.Message>} */
        const consolidatedMessageList = new Set();

        if (messageList.size > 0) {
            // Consolidate messages.
            /** @type {Map<string, Set<DataItem>>} */
            const dataItemMap = new Map();

            messageList.forEach(message => {
                if (message.type === iotcs.message.Message.Type.DATA) {
                    /** @type {string} */
                    const endpointId = message.getSource();
                    /** @type {Set<DataItem>} */
                    let dataItems = dataItemMap.get(endpointId);

                    if (!dataItems) {
                        dataItems = new Set();
                        dataItemMap.set(endpointId, dataItems);
                    }

                    message.getDataItems.forEach(dataItem => {
                        dataItems.add(dataItem);
                    });
                } else {
                    consolidatedMessageList.add(message);
                }
            });

            dataItemMap.forEach((value, key) => {
                /** @type {iotcs.device.impl.DeviceAnalog} */
                const deviceAnalog = this._deviceAnalogMap.get(key);

                if (!deviceAnalog) {
                    return; // continue
                }

                /** @type {Set<DataItem>} */
                const dataItems = entry.getValue();
                /** @type {string} */
                const format = deviceAnalog._getDeviceModel()._getUrn();

                if (this._computedMetricTriggers.size > 0) {
                    /** @type {Map<string, Set<string>>} */
                    let triggerMap = this._computedMetricTriggers.get(format);

                    if (triggerMap && triggerMap.size > 0) {
                        try {
                            this._checkComputedMetrics(dataItems, deviceAnalog, triggerMap,
                                currentTimeMillis);
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }

                let message = new iotcs.message.Message();

                message
                    .type(iotcs.message.Message.Type.DATA)
                    .source(deviceAnalog._getEndpointId())
                    .format(deviceAnalog._getDeviceModel().getUrn());

                    dataItems.forEach(dataItem => {
                        message.dataItem(dataItem.getKey(), dataItem.getValue());
                    });

                consolidatedMessageList.add(message);
            });
        }

        return consolidatedMessageList;
    }


    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy3(devicePolicy, deviceAnalog) {
        /** @type {Set<Map<string, Set<iotcs.device.impl.DevicePolicyFunction>>>} */
        const entries = devicePolicy._getPipelines();
        /** @type {Set<iotcs.message.Message>} */
        const messageList = new Set();

        entries.forEach((v, k) => {
            /** @type {Set<iotcs.message.Message>} */
            const messages = this._expirePolicy4(k, v, deviceAnalog);

            if (messages) {
                messages.forEach(message => {
                    messageList.add(message);
                });
            }
        });

        return messageList;
    }

    /**
     * @param {string} attributeName
     * @param {Set<iotcs.device.impl.DevicePolicyFunction>} pipeline
     * @param {iotcs.device.impl.DeviceAnalog} deviceAnalog
     * @return {Set<iotcs.message.Message>}
     */
    _expirePolicy4(attributeName, pipeline, deviceAnalog) {
        if (!pipeline || pipeline.size === 0) {
            return null;
        }

        // attributeName may be null.
        // Note that we are _removing_ the pipeline data cache for this attribute (which may be
        // null).
        /** @type {Set<Map<string, object>>} */
        const pipelineData = this._pipelineDataCache.get(attributeName);
        this._pipelineDataCache.delete(attributeName);

        if (!pipelineData) {
            return null;
        }

        /** @type {iotcs.device.impl.DevicePolicyFunction[]} */
        let pipelineAry = Array.from(pipeline);
        /** @type {Map<string, object>[]} */
        let pipelineDataAry = Array.from(pipelineData);

        for (let index = 0, maxIndex = pipelineAry.length; index < maxIndex; index++) {
            /** @type {DevicePipelineFunction} */
            let devicePolicyFunction = pipelineAry[index];

            if (!devicePolicyFunction) {
                continue;
            }

            /** @type {iotcs.device.impl.DeviceFunction} */
            let deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(devicePolicyFunction._getId());

            if (!deviceFunction) {
                return null;
            }

            // Looking for the first policy function in the pipeline that has a "window".
            // If there isn't one, we'll drop out of the loop and return null.
            // If there is one, we process the remaining pipeline from there.
            /** @type {number} */
            const window = iotcs.device.impl.DeviceFunction._getWindow(devicePolicyFunction._getParameters());

            if (window === -1) {
                continue;
            }

            /** @type {Map<string, object>} */
            let functionData = index < pipelineDataAry.length ? pipelineDataAry[index] : null;

            if (!functionData) {
                // There is no data for this function, so return.
                return null;
            }

            /** @type {object} */
            let valueFromPolicy = deviceFunction._get(deviceAnalog, attributeName,
                devicePolicyFunction._getParameters(), functionData);

            if (!valueFromPolicy) {
                return null;
            }

            for (let next = index + 1; next < maxIndex; next++) {
                devicePolicyFunction = pipelineAry[next];

                if (!deviceFunction) {
                    return null;
                }

                deviceFunction = iotcs.device.impl.DeviceFunction._getDeviceFunction(devicePolicyFunction._getId());

                if (!deviceFunction) {
                    return null;
                }

                functionData = next < pipelineDataAry.length ? pipelineDataAry[next] : null;

                if (deviceFunction._apply(deviceAnalog, attributeName,
                        devicePolicyFunction._getParameters(), functionData, valueFromPolicy))
                {
                    valueFromPolicy = deviceFunction._get(
                        deviceAnalog,
                        attributeName,
                        devicePolicyFunction._getParameters(),
                        functionData
                    );

                    if (!valueFromPolicy) {
                        return null;
                    }
                } else {
                    return null;
                }

            }

            // If we get here, valueFromPolicy is not null.
            if (valueFromPolicy instanceof Set) {
                return valueFromPolicy;
            }

            /** @type {iotcs.device.impl.DeviceModel} */
            const deviceModel = deviceAnalog._getDeviceModel();
            const message = new iotcs.message.Message();

            message
                .source(deviceAnalog._getEndpointId())
                .format(deviceModel.getUrn())
                .dataItem(attributeName, valueFromPolicy);

            /** @type {Set<iotcs.message.Message>} */
            let messages = new Set();
            messages.add(message);

            return messages;
        }

        return null;
    }

    /**
     * Get the DeviceModel for the device model URN. This method may return {@code null} if there is no device model for
     * the URN. {@code null} may also be returned if the device model is a &quot;draft&quot; and the property
     * {@code com.oracle.iot.client.device.allow_draft_device_models} is set to {@code false}, which is the default.
     *
     * @param {string} deviceModelUrn the URN of the device model.
     * @return {iotcs.device.impl.DeviceModel} a representation of the device model or {@code null} if it does not exist.
     */
    _getDeviceModel(deviceModelUrn) {
        /**
         * The high level DirectlyConnectedDevice class has no trusted
         * assets manager and this class gives no access to the one it has,
         * so this method is here.
         * TODO: Find a high level class for this method
         */
        // DJM: Where are secureConnection and deviceModel defined?
        return iotcs.device.impl.DeviceModelFactory._getDeviceModel(secureConnection, deviceModel);
    }


    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {Set<string>} assignedDevices
     */
    _policyAssigned(devicePolicy, assignedDevices) {
        // Do nothing.
    }

    /**
     * @param {iotcs.device.impl.DevicePolicy} devicePolicy
     * @param {Set<string>} unassignedDevices
     */
    _policyUnassigned(devicePolicy, unassignedDevices) {
        /** @type {number} */
        const currentTimeMillis = new Date().getTime();
        /** @type {Set<iotcs.message.Message>} */
        const messages = this._expirePolicy2(devicePolicy, currentTimeMillis);

        if (messages && messages.size > 0) {
            messages.forEach(message => {
                this.messagesFromExpiredPolicies.add(message);
            });
        }

        unassignedDevices.forEach(unassignedDevice => {
            let devicePolicyManager = iotcs.device.impl.DevicePolicyManager._getDevicePolicyManager(unassignedDevice);

            if (devicePolicyManager) {
                devicePolicyManager._removePolicy(devicePolicy._deviceModelUrn,
                                                  devicePolicy._getId(), unassignedDevice);
            }
        });

        // TODO:  Need to figure out how to handle accumulated values.
        //        For now, just clear out the various maps, which
        //        effectively means "start from scratch"
        this._deviceAnalogMap.clear();
        this._pipelineDataCache.clear();
        this._computedMetricTriggers.clear();
        iotcs.device.impl.MessagingPolicyImpl._windowMap.clear();
    }
};

/**
 * deviceModelUrn:attribute:deviceFunctionId -> start time of last window For a window policy, this maps the
 * policy target plus the function to when the window started. When the attribute for a timed function is in
 * the message, we can compare this start time to the elapsed time to determine if the window has expired. If
 * the window has expired, the value computed by the function is passed to the remaining functions in the
 * pipeline.
 *
 * @type {Map<string, number>}
 */
iotcs.device.impl.MessagingPolicyImpl.windowMap = new Map();



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Bucket.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Slide is how much the window moves after the window expires. If there is a window of 5 seconds
 * with a slide of 2 seconds, then at the end of 5 seconds, the window slides over by two seconds.
 * That means that the next window's worth of data would include 3 seconds of data from the previous
 * window, and 2 seconds of new data.
 *
 * To handle this, we divide up the window into buckets. Each bucket represents a period of time,
 * such that the time period is the greatest common factor between the window and the slide. For
 * example, if the window is 60 seconds and the slide is 90 seconds, a bucket would span 30 seconds,
 * and there would be three buckets.
 *
 * When the window expires and the get method is called, the return value of the mean policy
 * function will include the value and number of terms of bucket[0] through bucket[n]. Then the
 * buckets that don't contribute to the next window are emptied (so to speak) and the cycle
 * continues.
 *
 * Best case is that the slide equal to the window. In this case, there is only ever one bucket. The
 * worst case is when greatest common factor between slide and window is small. In this case, you
 * end up with a lot of buckets, potentially one bucket per slide time unit (e.g., 90 seconds, 90
 * buckets). But this is no worse (memory wise) than keeping an array of values and timestamps.
 */
iotcs.device.impl.Bucket = class {
    constructor(initialValue) {
        this._value = initialValue;
        this._terms = 0;
    }

    // Private/protected functions
    /**
     * @return {string} this Bucket represented as a string.
     */
    _toString() {
        return '{"value" : ' + this._value + ', "terms" : ' + this._terms + '}';
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelAction.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * This class represents an action in a device model.
 *
 * @classdesc
 */
iotcs.impl.DeviceModelAction = class {
    /**
     * Constructs a DeviceModelAction.
     *
     * @param {string} name
     * @param {string} description
     * @param {Array<DeviceModelActionArgument>} args
     * @param {string} alias
     *
     * @class
     */
    constructor(name, description, args, alias) {
        /** @type {string} */
        this._alias = alias;
        /** @type {DeviceModelActionArgument[]} */
        this._args = args ? args : [];
        /** @type {string} */
        this._description = description;
        /** @type {string} */
        this._name = name;
    }

    /**
     * Returns the alias of this action, if any.
     *
     * @return {string} The alias of this action, or <code>null</code>.
     */
    _getAlias() {
        return this._alias;
    }

    /**
     * Returns the arguments for this action.
     *
     * return {Array<DeviceModelActionArgument>} The arguments for this action, or
     *        <code>null</code>.
     */
    _getArguments() {
        return this._args;
    }

    /**
     * Returns the description of this action.
     *
     * @return {string} The description of this action, or <code>null</code>.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Returns the name of this action.
     *
     * @return {string} The name of this action.
     */
    _getName() {
        return this._name;
    }

    /**
     * Returns a string representation of this action.
     *
     * @return {string} A string representation of this action.
     */
    _toString() {
       let first = true;
       let argsAsStr;

       this._args.forEach(argument => {
          if (!first || (first === false)) {
             argsAsStr += ',' + iotcs.impl.Platform.Os._lineSeparator;
          }

          argsAsStr += '\t' + argument.toString();
       });

       return `DeviceModelAction[name=${this._name}, description=${this._description}, ' +
              'alias=${this._alias}, args=[argsAsStr]]`;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelActionArgument.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * iotcs.impl.DeviceModelActionArgument
 */
iotcs.impl.DeviceModelActionArgument = class {
    // Static private/protected functions
    /**
     * @param {string} A JSON string.
     * @return {iotcs.impl.DeviceModelActionArgument}
     * @throws Error If the argument type is not one of iotcs.impl.DeviceModelAttribute.Type.
     */
    static _fromJson(jsonObject) {
        /** @type {string} */
        let name = jsonObject.name != null ? jsonObject.name : 'value';
        /** @type {string} */
        let type = jsonObject.type;
        let argType = iotcs.impl.DeviceModelAttribute.getType(type);

        /** @type {string} */
        let range = jsonObject.range ? jsonObject.range : null;
        /** @type {number} */
        let min, max;

        if (range) {
            let ranges = range.split(',');
            min = ranges[0];
            max = ranges[1];
        } else {
            min = null;
            max = null;
        }

        let defaultValue = jsonObject.defaultValue;
        return new iotcs.impl.DeviceModelActionArgument(name, argType, min, max, defaultValue);
    }

    /**
     *
     * @param {string} name
     * @param {string} description
     * @param {iotcs.impl.DeviceModelAttribute.Type} argType
     * @param {number} lowerBound
     * @param {number} upperBound
     * @param {object} defaultValue
     */
    constructor(name, description, argType, lowerBound, upperBound, defaultValue) {
        /** @type {string} */
        this._name = name;
        /** @type {string} */
        this._description = description;

        /** @type {iotcs.impl.DeviceModelAttribute.Type} */
        this._argType = argType;

        if (this._argType === iotcs.impl.DeviceModelAttribute.Type.INTEGER ||
            this._argType === iotcs.impl.DeviceModelAttribute.Type.NUMBER)
        {

        /** @type {number} */
            this._lowerBound = lowerBound;
            /** @type {number} */
            this._upperBound = upperBound;
        } else {
            /** @type {number} */
            this._lowerBound = this._upperBound = null;
        }

        /** @type {object} */
        this._defaultValue = defaultValue;
    }

    // Private/protected functions
    /**
     * The data type of the argument to the action.  If the action does not take an argument, then
     * this method will return {@code null}.
     *
     * @return {iotcs.impl.DeviceModelAttribute.Type} The action argument's data type, or {@code null}.
     */
    _getArgType() {
        return this._argType;
    }

    /**
     * Get the default value of the argument as defined by the device model.  If there is no
     * {@code defaultValue} for the argument in the device model, then this method will return
     * {@code null}.  The value {@code null} is <em>not</em> a default value.
     *
     * @return {object} The default value of the attribute, or {@code null} if no default is
     *         defined.
     */
    _getDefaultValue() {
        return null;
    }

    /**
     * For {@link Type#NUMBER} and {@link Type#INTEGER} only, give the lower bound of the acceptable
     * range of values for the action's argument.  {@code null} is always returned for actions other
     * than {@code NUMBER} or {@code INTEGER} type.
     *
     * @return {number} A number or {@code null} if no lower bound has been set.
     */
    _getLowerBound() {
        return this._lowerBound;
    }

    /**
     * Get the argument name.
     *
     * @return {string} The action name from the device model.
     */
    _getName() {
        return this._name;
    }

    /**
     * For {@link Type#NUMBER} and {@link Type#INTEGER} only, give the upper bound of the acceptable
     * range of values for the action's argument.  {@code null} is always returned for actions other
     * than {@code NUMBER} or {@code INTEGER} type.
     *
     * @return {number} A number, or {@code null} if no upper bound has been set.
     */
    _getUpperBound() {
        return this._upperBound;
    }

    /**
     * Returns a string representation of this instance.
     *
     * @return {string} A string  representation of this instance.
     */
    _toString() {
        return `iotcs.impl.DeviceModelActionArgument[name=${this._name}, type=${this._type}, ' +
               'lowerBound=${this._lowerBound}, upperBound=${this._upperBound}, ' +
               'default=${this._default}]`;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/shared/DeviceModelAttribute.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceModelAttribute is the model of an attribute in a {@link DeviceModel}.
 */
iotcs.impl.DeviceModelAttribute = class {
    // Static private/protected functions
    /**
     * Returns the DeviceModelAttribute.Type for the type specified, or throws an Error if the type
     * specified is not one of the Types.
     *
     * @param {string} type
     * @return {DeviceModelAttribute.Type}
     */
    static _getType(type) {
        switch(type) {
            case 'BOOLEAN':
            case 'boolean':
                return iotcs.impl.DeviceModelAttribute.Type.BOOLEAN;
            case 'DATETIME':
            case 'datetime':
                return iotcs.impl.DeviceModelAttribute.Type.DATETIME;
            case 'INTEGER':
            case 'integer':
                return iotcs.impl.DeviceModelAttribute.Type.INTEGER;
            case 'NUMBER':
            case 'number':
                return iotcs.impl.DeviceModelAttribute.Type.NUMBER;
            case 'STRING':
            case 'string':
                return iotcs.impl.DeviceModelAttribute.Type.STRING;
            case 'URI':
            case 'uri':
                return iotcs.impl.DeviceModelAttribute.Type.URI;
            default:
                throw new Error('Invalid type: ' + type);
        }
    }

    /**
     *
     * @param {string} urn
     * @param {string} name
     * @param {string} description
     * @param {Type} type
     * @param {number} lowerBound
     * @param {number} upperBound
     * @param {Access} access
     * @param {string} alias
     * @param {object} defaultValue
     * @constructor
     */
    constructor(urn, name, description, type, lowerBound, upperBound, access, alias, defaultValue) {
        /**
         *
         *
         * @type {Access}
         */
        this._access = access;
        /**
         * The attribute's name.
         *
         * @type {string}
         * @deprecated
         */
        this._alias = alias;
        /**
         * The attribute's default value.
         *
         * @type {object}
         */
        this._defaultValue = defaultValue;
        /**
         * The attribute's description.
         *
         * @type {string}
         */
        this._description = description;
        /**
         * The name of the attribute
         *
         * @type {string}
         */
        this._name = name;
        /**
         * The attribute's lower bound.
         *
         * @type {number}
         */
        this._lowerBound = lowerBound;
        /**
         * The attribute type.
         *
         * @type {Type}
         */
        this._type = type;
        /**
         * The URN of the attribute.
         *
         * @type {string}
         */
        this._urn = urn;
        /**
         * The attribute's upper bound.
         *
         * @type {number}
         */
        this._upperBound = upperBound;
    }

    // Private/protected functions
    /**
     * Return the access rules for the attribute. The default is READ-ONLY
     *
     * @return {Access} the access rule for the attribute
     */
    _getAccess() {
        return this._access;
    }

    /**
     * Get the attribute name.
     *
     * @return {string} an alternative name for the attribute.
     * @deprecated Use {@link #getName()}
     */
    _getAlias() {
        return this._alias;
    }

    /**
     * Get the default value of the attribute as defined by the device model. If there is no
     * {@code defaultValue} for the attribute in the device model, then this method will return
     * {@code null}. The value {@code null} is <em>not</em> a default value.
     *
     * @return {object} the default value of the attribute, or {@code null} if no default is
     *         defined.
     */
    _getDefaultValue() {
        return this._defaultValue;
    }

    /**
     * A human friendly description of the attribute. If the model does not
     * contain a description, this method will return an empty string.
     *
     * @return {string} the attribute description, or an empty string.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Get the URN of the device type model this attribute comes from.
     *
     * @return {string} the URN of the device type model.
     */
    _getModel() {
        return this._urn;
    }

    /**
     * Get the attribute name.
     *
     * @return {string} the attribute name from the device model.
     */
    _getName() {
        return this._name;
    }

    /**
     * The data type of the attribute. If the access type of the attribute is
     * executable, this method will return null.
     *
     * @return {Type} the attribute's data type, or null.
     */
    _getType() {
        return this._type;
    }

    /**
     * For {@link Type#NUMBER} only, give the lower bound of the
     * acceptable range of values. Null is always returned for attributes
     * other than {@code NUMBER} type.
     *
     * @return {number} a Number, or null if no lower bound has been set.
     */
    _getLowerBound() {
        return this._lowerBound;
    }

    /**
     * For {@link Type#NUMBER} only, give the upper bound of the
     * acceptable range of values. Null is always returned for attributes
     * other than {@code NUMBER} type.
     *
     * @return {number} a Number, or null if no upper bound has been set
     */
    _getUpperBound() {
        return this._upperBound;
    }
};

iotcs.impl.DeviceModelAttribute.Access = {
    EXECUTABLE: 'EXECUTABLE',
    READ_ONLY: 'READ_ONLY',
    READ_WRITE: 'READ_WRITE',
    WRITE_ONLY: 'WRITE_ONLY'
};

Object.freeze(iotcs.impl.DeviceModelAttribute.Access);

iotcs.impl.DeviceModelAttribute.Type = {
    BOOLEAN: 'BOOLEAN',
    DATETIME: 'DATETIME',
    INTEGER: 'INTEGER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    URI: 'URI'
};

Object.freeze(iotcs.impl.DeviceModelAttribute.Type);



//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/NetworkCost.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * DeviceFunction is an abstraction of a policy device function.
 */
iotcs.device.impl.NetworkCost = class {
    /**
     * Get the cost of the NetworkCost given by the string value. The "property" parameter is just
     * used for logging. The defaultValue is the value returned if the value is null or not a valid
     * NetworkCost.
     *
     * @param {string} value
     * @param {string} property
     * @param {string} defaultValue @type {NetworkCost.Type}
     * @return {number}
     */
    static _getCost(value, property, defaultValue) {
        /** @type {NetworkCost} */
        let networkCost = null;

        if (value) {
            try {
                /** @type {string} */
                let upperValue = value.toUpperCase();
                upperValue = upperValue.replace('\\(.*', '');
                networkCost = upperValue.valueOf();
            } catch (error) {
                console.log('Invalid "' + property + '", value: "' + value + '"');
            }
        }

        if (!networkCost) {
            // Not given or illegal value.
            networkCost = defaultValue;
            console.log('Defaulting "' + property + '" to: "' + networkCost + '"');
        }

        return NetworkCost.ordinal(networkCost);
    }

    /**
     * Returns the ordinal value of the given type in the list of NetworkCost.Type's.
     *
     * @param {string} type the NetworkCost.Type.
     * @return {number} the ordinal value of the type in the NetworkCost.Type list.
     */
    static ordinal(type) {
        switch(type) {
            case NetworkCost.Type.ETHERNET:
                return 1;
            case NetworkCost.Type.CELLULAR:
                return 2;
            case NetworkCost.Type.SATELLITE:
                return 3;
            default:
                throw new Error(type + ' is not one of NetworkCost.Type.');
        }
    }
};

/**
 * The order of these is in increasing network cost.  For example, the cost of data over ethernet is
 * much lower then the cost of data over satellite.
 *
 * Note: The order of these is important - DO NOT CHANGE THE ORDER.  If you do changed the order,
 * also updte the getTypeOrdinal function.
 *
 * @type {{ETHERNET: string, CELLULAR: string, SATELLITE: string}}
 */
iotcs.device.impl.NetworkCost.Type = {
    ETHERNET: 'ETHERNET',
    CELLULAR: 'CELLULAR',
    SATELLITE: 'SATELLITE'
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/Pair.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * A convenience class to represent name-value pairs.
 */
iotcs.device.impl.Pair = class {
    /**
     * Creates a new pair
     *
     * @param {object} key The key for this pair.
     * @param {object} value The value to use for this pair.
     */
    constructor(key, value) {
        /**
         * Name of this Pair.
         */
        this._key = key;
        /**
         * Value of this this Pair.
         */
        this._value = value;
    }

    /**
     * Gets the key for this pair.
     *
     * @return {object} key for this pair
     */
    _getKey() {
        return this._key;
    }

    /**
     * Gets the value for this pair.
     *
     * @return {object} value for this pair
     */
    _getValue() {
        return this._value;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/ScheduledPolicyData.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.ScheduledPolicyData = class {
    /**
     *
     * @param {number} window
     * @param {number} slide
     * @param {number} timeZero
     */
    constructor(window, slide, timeZero) {
        // Initial expiry is window milliseconds past time zero.
        // Tenth of a millisecond resolution helps group
        // intersecting slide values (10 second and 20 second,
        // for example).
        this._expiry = ((window + timeZero) / 10) * 10;
        this._slide = slide;
        this._window = window;
        // { attributeName : pipelineIndex }
        /** @type {Map<string, number>} */
        this._pipelineIndices = new Map();
    }

    // Private/protected functions
    /**
     *
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _addAttribute(attributeName, pipelineIndex) {
        this._pipelineIndices.set(attributeName, pipelineIndex);
    }

    /**
     *
     * @param {object} o
     * @return {boolean}
     */
    _equals(o) {
        if (this === o) {return true;}
        if (!o) {return false;}
        return (this._window === o.window) && (this._slide === o.slide);
    }


    /**
     * @return {number}
     */
    _hashCode() {
        return ((this._window ^ (this._window >>> 32)) + (this._slide ^ (this._slide >>> 32)));
    }

    /**
     *
     * @param {number} now
     * @return {number}
     */
    _getDelay(now) {
        /** @type {number} */
        const delay = this._expiry - now;
        return (delay > 0) ? delay : 0;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, object>, object>>} updatedAttributes
     */
    _handleExpiredFunction1(virtualDevice, updatedAttributes) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction1 called.');
            /** @type {DevicePolicy} */
            virtualDevice.devicePolicyManager._getPolicy(virtualDevice.deviceModel.urn,
                virtualDevice.endpointId).then(devicePolicy =>
            {
                iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction1 devicePolicy = ' +
                               devicePolicy);

                if (!devicePolicy) {
                    // TODO: better log message here
                    console.log('Could not find ' + virtualDevice.deviceModel.urn +
                        ' in policy configuration.');

                    return;
                }

                /** @type {Map<string, number} */
                const pipelineIndicesCopy = new Map(this._pipelineIndices);

                this._handleExpiredFunction2(virtualDevice, updatedAttributes, devicePolicy,
                    pipelineIndicesCopy).then(() => {
                        iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction1 updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));
                        resolve();
                    });
            });
        });
    }


    /**
     *
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {DevicePolicy} devicePolicy
     * @param {Map<string, number>} pipelineIndicesTmp
     */
    _handleExpiredFunction2(virtualDevice, updatedAttributes, devicePolicy, pipelineIndicesTmp) {
        iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction2 called, pipelineIndices = ' +
            iotcs.impl.Platform._inspect(pipelineIndicesTmp));

        let pipelineIndicesTmpAry = Array.from(pipelineIndicesTmp);

        let requests = pipelineIndicesTmpAry.map(entry => {
            iotcs.impl.Platform._debug('ScheduledPolicyData._handleExpiredFunction2 calling handleExpiredFunction3.');

            return new Promise((resolve, reject) => {
                this._handleExpiredFunction3(virtualDevice, updatedAttributes, devicePolicy,
                    entry[0], entry[1]).then(() =>
                {
                    iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction2 updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    resolve();
                });
            });
        });

        return Promise.all(requests).then(() => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction2 after Promise.all, updatedAttributes = ' +
                iotcs.impl.Platform._inspect(updatedAttributes));
        });
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {DevicePolicy} devicePolicy
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _handleExpiredFunction3(virtualDevice, updatedAttributes, devicePolicy, attributeName,
                           pipelineIndex)
    {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 called, attributeName = ' +
                attributeName);

            /** @type {Set<DevicePolicyFunction} */
            const pipeline = devicePolicy._getPipeline(attributeName);
            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 pipeline = ' +
                iotcs.impl.Platform._inspect(pipeline));

            if (!pipeline || pipeline.size === 0) {
                return;
            }

            if (pipeline.size <= pipelineIndex) {
                // TODO: better log message here
                console.log('Pipeline does not match configuration.');
                return;
            }

            iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 calling virtualDevice.getPipelineData.');

            /** @type {Set<Map<string, object>>} */
            virtualDevice._getPipelineData(attributeName, pipelineData => {
                if (pipelineData.size <= pipelineIndex) {
                    // TODO: better log message here
                    console.log('Pipeline data does not match configuration.');
                    return;
                }

                /** @type {Set<DevicePolicyFunction} */
                const remainingPipelineConfigs =
                    new Set(Array.from(pipeline).slice(pipelineIndex, pipeline.size));

                /** @type {Set<Map<string, object>>} */
                const remainingPipelineData =
                    new Set(Array.from(pipelineData).slice(pipelineIndex, pipelineData.size));

                let isAllAttributes =
                    iotcs.device.impl.DevicePolicy._ALL_ATTRIBUTES === attributeName;

                if (!isAllAttributes) {
                    virtualDevice._processExpiredFunction2(updatedAttributes, attributeName,
                        remainingPipelineConfigs, remainingPipelineData);

                    iotcs.impl.Platform._debug('ScheduledPolicyData.handleExpiredFunction3 updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    resolve();
                } else {
                    virtualDevice._processExpiredFunction1(remainingPipelineConfigs,
                            remainingPipelineData);

                    resolve();
                }
            });
        }).catch(error => {
            console.log('Error handling expired function: ' + error);
        });
    }

    /**
     *
     * @returns {boolean}
     */
    _isEmpty() {
        return this._pipelineIndices.size === 0;
    }

    /**
     * @param {VirtualDevice} virtualDevice
     * @param {Set<Pair<VirtualDeviceAttribute<VirtualDevice, Object>, Object>>} updatedAttributes
     * @param {number} timeZero
     */
    _processExpiredFunction(virtualDevice, updatedAttributes, timeZero) {
        return new Promise((resolve, reject) => {
            iotcs.impl.Platform._debug('ScheduledPolicyData.processExpiredFunction called.');
            this._handleExpiredFunction1(virtualDevice, updatedAttributes).then(() => {
                iotcs.impl.Platform._debug('ScheduledPolicyData.processExpiredFunction updatedAttributes = ' +
                    iotcs.impl.Platform._inspect(updatedAttributes));

                // Ensure expiry is reset. 1/10th of a millisecond resolution.
                this._expiry = ((this._slide + timeZero) / 10) * 10;
                resolve();
            }).catch(error => {
                // Ensure expiry is reset. 1/10th of a millisecond resolution.
                this._expiry = ((this._slide + timeZero) / 10) * 10;
            });
        });
    }

    /**
     *
     * @param {string} attributeName
     * @param {number} pipelineIndex
     */
    _removeAttribute(attributeName, pipelineIndex) {
        this._pipelineIndices.delete(attributeName);
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/ScheduledPolicyDataKey.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.ScheduledPolicyDataKey = class {
    /**
     *
     * @param {number} window
     * @param {number} slide
     */
    constructor(window, slide) {
        this._window = window;
        this._slide = slide;
    }

    // Private/protected functions
    _toString() {
        return 'ScheduledPolicyDataKey[{"window": ' + this._window + ', "slide": ' + this._slide +
            '}]';
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/TimedPolicyThread.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: can we have only one of these threads for all virtual devices?
iotcs.device.impl.TimedPolicyThread = class {
    constructor(virtualDevice) {
        this._virtualDevice = virtualDevice;
        this._canceled = false;
        // Timer interval.
        this._interval = 1000;
        /** @type {ScheduledPolicyData[]} */
        this._scheduledPolicyData = [];

        this._interval = 1000;
        this._i = 0;

        /**
         *
         */
        this.run = () => {
            iotcs.impl.Platform._debug('TimedPolicyThread.run called.');
            this._timer = null;

            /** @type {number} */
            const now = new Date().getTime();
            /** @type {Set<Pair<VirtualDeviceAttribute, object>>} */
            const updatedAttributes = new Set();
            iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData = ' +
                iotcs.impl.Platform._inspect(self.scheduledPolicyData));

            if (this._scheduledPolicyData) {
                const scheduledPolicyDataAry = Array.from(this._scheduledPolicyData);

                let requests = scheduledPolicyDataAry.map(policyData => {
                    iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData delay = ' +
                        policyData.getDelay(now));

                    // Run through all the timed function data
                    if (policyData.getDelay(now) <= 0) {
                        iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData calling processExpiredFunction, updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));

                        policyData._processExpiredFunction(this._virtualDevice, updatedAttributes,
                            now);

                        iotcs.impl.Platform._debug('TimedPolicyThread.run scheduledPolicyData after calling processExpiredFunction, updatedAttributes = ' +
                            iotcs.impl.Platform._inspect(updatedAttributes));
                    }
                });

                this._start(now);

                return Promise.all(requests).then(() => {
                    iotcs.impl.Platform._debug('TimedPolicyThread.run after Promise.all, updatedAttributes = ' +
                        iotcs.impl.Platform._inspect(updatedAttributes));

                    if (updatedAttributes.size > 0) {
                        // Call updateFields to ensure the computed metrics get run,
                        // and will put all attributes into one data message.
                        this._virtualDevice._updateFields(updatedAttributes);
                    }
                });
            }
        };
    }

    /**
     *
     * @param {ScheduledPolicyData} data
     */
    _addTimedPolicyData(data) {
        iotcs.impl.Platform._debug('TimedPolicyThread.addTimedPolicyData called, data = ' + data._window);
        /** @type {number} */
        let index = this._scheduledPolicyData.findIndex(element => {
            return element.equals(data);
        });

        if (index === -1) {
            this._scheduledPolicyData.push(data);
        } else {
            this._scheduledPolicyData.splice(index, 0, data);
        }

        /** @type {number} */
        const now = new Date().getTime();

        // Sort the set by delay time.
        this._scheduledPolicyData.sort((o1, o2) => {
            /** @type {number} */
            const x = o1._getDelay(now);
            /** @type {number} */
            const y = o2._getDelay(now);
            return (x < y) ? -1 : ((x === y) ? 0 : 1);
        });

        // Is the one we're adding the first in the list?  If yes, cancel and re-start.
        /** @type {number} */
        index = this._scheduledPolicyData.findIndex(element => {
            return element.equals(data);
        });

        if (index === 0) {
            this._cancel();
            this._start(now);
        }
    }

    // TODO: never used. Do we need cancelled and cancel()?
    /**
     *
     */
    _cancel() {
        iotcs.impl.Platform._debug('TimedPolicyThread.cancel called.');
        this._cancelled = true;

        if (this._timer) {
            _clearInterval(this._timer.id);
        }
    }

    /**
     * @return {boolean} {@code true} if the timer is alive.
     */
    _isAlive() {
        if (this._timer) {
            return true;
        }

        return false;
    }

    /**
     *
     * @return {boolean}
     */
    _isCancelled() {
        return this._cancelled;
    }


    /**
     *
     * @param {ScheduledPolicyData} data
     */
    _removeTimedPolicyData(data) {
        iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData called, data = ' + data._window);

        // TODO: Optimize this.
        for (let i = 0; i < this._scheduledPolicyData.length; i++) {
            iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData checking item #' + i +
                            ' for removal.');
            if (data.toString() === this._scheduledPolicyData[i].toString()) {
                iotcs.impl.Platform._debug('TimedPolicyThread.removeTimedPolicyData removing item #' + i);
                this._scheduledPolicyData.splice(i, 1);
            }
        }

        this._cancel();
        this._start(new Date().getTime());
    }

    /**
     *
     * @param {number} now
     */
    _start(now) {
        iotcs.impl.Platform._debug('TimedPolicyThread.start called.');

        // Sort the timers by time.
        if (this._scheduledPolicyData.length > 0) {
            const interval = this._scheduledPolicyData[0]._getDelay(now);
            this._timer = _setTimeout(this.run, interval);
        }
    }
};

/** @type {number} */
iotcs.device.impl.TimedPolicyThread.timed_policy_thread_count = 0;


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/VirtualDeviceAttribute.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * VirtualDeviceAttribute is an attribute in the device model.
 */
iotcs.device.impl.VirtualDeviceAttribute = class {
    /**
     *
     * @param {VirtualDevice} virtualDevice
     * @param {DeviceModelAttribute} deviceModelAttribute
     */
    constructor(virtualDevice, deviceModelAttribute) {
        this._virtualDevice = virtualDevice;
        this._deviceModelAttribute = deviceModelAttribute;
        this._lastKnownValue = null;
    }

    // Private/protected functions
    /**
     *
     * @returns {DeviceModelAttribute}
     */
    _getDeviceModelAttribute() {
        return this._deviceModelAttribute;
    }

    /**
     *
     * @returns {string}
     */
    _getName() {
        return this._name;
    }

    /**
     * @return {boolean}
     */
    _isSettable() {
        // An attribute is always settable on the device-client side
        return true;
    }

    /**
     * @param {object} value
     * @return {boolean} 
     */
    _update(value) {
        // Validate throws an Error if value is not valid.
        this._validate(this._deviceModelAttribute, value);

        iotcs.impl.Platform._debug('\nVirtualDevice: ' + this._virtualDevice.toString() +
            '\n\t attributeName ' + this._deviceModelAttribute._getName() +
            // '\n\t attributeValue ' + this.deviceModelAttribute.value +
            '\n\t newValue ' + value +
            '\n'
        );

        this._lastKnownValue = this._value = value;
        return true;
    }

    /**
     * TODO: implement.
     * @param {DeviceModelAttribute} deviceModelAttribute
     * @param {object} value
     * @throws Error if the value is not valid for the attribute.
     */ 
    _validate(attribute, value) {
        // if (!value) {
        //     return;
        // }

        // final DeviceModelAttribute.Type type = attribute.getType();

        // // block assumes value is not null
        // switch (type) {
        //     case INTEGER:
        //         if (!(value instanceof Integer)) {
        //             throw new IllegalArgumentException("value is not INTEGER");
        //         }
        //         break;
        //     case NUMBER:
        //         if (!(value instanceof Number)) {
        //             throw new IllegalArgumentException("value is not NUMBER");
        //         }
        //         break;
        //     case STRING:
        //         if (!(value instanceof String)) {
        //             throw new IllegalArgumentException("value is not STRING");
        //         }
        //         break;
        //     case BOOLEAN:
        //         if (!(value instanceof Boolean)) {
        //             throw new IllegalArgumentException("value is not BOOLEAN");
        //         }
        //         break;
        //     case DATETIME:
        //         if (!(value instanceof Date) && !(value instanceof Long)) {
        //             throw new IllegalArgumentException("value is not DATETIME");
        //         }
        //         break;
        //     case URI:
        //         if (!(value instanceof oracle.iot.client.ExternalObject)) {
        //             throw new IllegalArgumentException("value is not an ExternalObject");
        //         }
        //         break;
        // }

        // if (((type == DeviceModelAttribute.Type.INTEGER) || (type == DeviceModelAttribute.Type.NUMBER))) {
        //     // Assumption here is that lowerBound <= upperBound
        //     final double val = ((Number) value).doubleValue();
        //     if (attribute.getUpperBound() != null) {
        //         final double upper = attribute.getUpperBound().doubleValue();
        //         if (Double.compare(val, upper) > 0) {
        //             throw new IllegalArgumentException(val + " > " + upper);
        //         }
        //     }
        //     if (attribute.getLowerBound() != null) {
        //         final double lower = attribute.getLowerBound().doubleValue();
        //         if(Double.compare(val, lower) < 0) {
        //             throw new IllegalArgumentException(val + " < " + lower);
        //         }
        //     }
        // }
    }


// /** {@inheritDoc} */
// @Override
// public void set(T value) {
//
//     // validate throws IllegalArgumentException if value is not valid
//     validate(model, value);
//
//     if (getLogger().isLoggable(Level.FINEST)) {
//         getLogger().log(Level.FINEST,
//             "\nVirtualDevice: " + virtualDevice.toString() +
//             "\n\t attributeName " + getDeviceModelAttribute().getName() +
//             "\n\t attributeValue " + this.value +
//             "\n\t newValue " + value  +
//             "\n"
//         );
//     }
//
//     this.lastKnownValue = this.value = value;
//
//     // This may set up an infinite loop!
//     ((VirtualDeviceImpl) virtualDevice).processOnChange(this, this.value);
// }
//
// @Override
// public boolean equals(Object obj) {
//     if (obj == null) return false;
//     if (this == obj) return true;
//     if (obj.getClass() != this.getClass()) return false;
//     VirtualDeviceAttributeImpl other = (VirtualDeviceAttributeImpl)obj;
//
//     if (this.value != null ? !this.value.equals(other.value) : other.value != null) return false;
//     return this.getDeviceModelAttribute().equals(((VirtualDeviceAttributeImpl) obj).getDeviceModelAttribute());
// }
//
// @Override
// public int hashCode() {
//     int hash = 37;
//     hash = 37 * hash + (this.value != null ? this.value.hashCode() : 0);
//     hash = 37 *  this.getDeviceModelAttribute().hashCode();
//     return hash;
// }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/device/WritableValue.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * WritableValue is a wrapper around a value that can be read or written.
 */
iotcs.device.impl.WritableValue = class {
    constructor() {
        this._value = null;
    }

    // Private/protected functions
    /**
     * Get the value.
     *
     * @return {object} the value.
     */
    _getValue() {
        return this._value;
    }

    /**
     * Set the value
     *
     * @param {object} value the value.
     */
    _setValue(value) {
        this._value = value;
    }
};



// END
////////////////////////////////////////////////////////////////////////////////////////////////////
iotcs.log(iotcs.description+' v' + iotcs.version + ' loaded!');
return iotcs;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Module initialization
if (typeof window !== 'undefined') {
    iotcs = function iotcs(iotcs) {
        return init(iotcs);
    };

    iotcs(iotcs);
}
})();
