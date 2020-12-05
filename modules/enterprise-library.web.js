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
    iotcs.description = "Oracle IoT Cloud Service JavaScript Enterprise Client Software Library";

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
// File: ./src/enterprise/Overview.js
//////////////////////////////////////////////////////////////////////////////
/**
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 * @overview
 * The device and enterprise client libraries simplify working with
 * the Oracle IoT Cloud Service. These client libraries are a
 * higher-level abstraction over top of messages and REST APIs. Device
 * clients are designed to make it easy to expose device functionality
 * to the IoT Cloud Service, while enterprise clients are designed to
 * make it easy to inspect and control a device. The true state of a
 * device is within the device itself (whether the light is on or
 * off). A "virtual" device object is contained within the cloud and
 * enterprise clients that represent the last-known state of that
 * device, and allow enterprise clients to send commands and set
 * attributes of the device model (e.g., "turn the light off"). 
 *
 * <h2>Trusted Assets</h2>
 *
 * Trusted assets are defined as material that contribute to the chain
 * of trust between the client and the server. The client library
 * relies on an implementation of the
 * TrustedAssetsManager to securely manage
 * these assets on the client. The client-library has a default
 * implementation of the TrustedAssetsManager which uses a framework native
 * trust-store to secure the trust assets. To create the trust-store
 * for the default TrustedAssetsManager, the user must run the
 * TrustedAssetsProvisioner tool by using the script provided in the tools
 * depending if the provision is made for the enterprise or device
 * client library. Usage is available by running the tool without
 * arguments.
 *
 * <h2>Device Models</h2>
 *
 * A device model is a predefined specification of the attributes,
 * formats and resources of a device that can be accessed by the
 * client-library. The attributes of a device model represent the
 * basic variables that the device supports, such as temperature,
 * humidity, flow rate, valve position, and so forth. The formats of a
 * device model define the structure of a message payload. A format
 * describes the message attributes by specifying the attribute names,
 * types, optionality, and default values. The resources of a device
 * model define additional, ad-hoc REST resources which provide richer
 * REST support than what is possible with attributes and formats. 
 * <p>
 * The client library has explicit API for obtaining a device model
 * ({@link iotcs.enterprise.EnterpriseClient#getDeviceModel} or
 * {@link iotcs.device.DirectlyConnectedDevice#getDeviceModel}). This will generate for a
 * specified urn the device model associated with it and registered
 * in the cloud as JSON objects that contain all the attributes, actions
 * ant other specific information for a device model. With the generated
 * model a virtual device can be created that encapsulates all the
 * device functionality based on a specific model. If a device has more
 * than one model associated, for each model a different virtual device
 * can be crated and monitored/controlled.
 *
 * <h2>Device Policies</h2>
 *
 * A policy is a set of rules and constraints that can be associated with a
 * device client (see below) to control its basic data transformation and
 * transfer behavior. Device policies are automatically loaded, if they have
 * been configured for the device, and there is no direct API in the library
 * for manipulating the policies. The policies are applied when a value is
 * {@link iotcs.device.VirtualDevice#offer|offered} to a {@link iotcs.device.VirtualDevice}.
 *
 * <h2>Enterprise Client</h2>
 *
 * Both enterprise and device clients share common API for getting and
 * setting values through a user-interface (in the case of an
 * enterprise-client application) and for getting and setting values
 * on a physical device (in the case of a device-client
 * application).
 * <p>
 * An enterprise-client application will create an {@link iotcs.enterprise.EnterpriseClient}
 * based on an application already created on the server using the static method
 * {@link iotcs.enterprise.EnterpriseClient.newClient}. A list of applications that the user has access to can be
 * retrieved by using the static method {@link iotcs.enterprise.EnterpriseClient.getApplications}.
 * From there, the application can list all the device models
 * that are registered with it by using {@link iotcs.enterprise.EnterpriseClient#getDeviceModels}.
 * After selecting models the list of active devices that have the selected
 * models can be retrieved by using {@link iotcs.enterprise.EnterpriseClient#getActiveDevices}.
 * After selecting combination of models/devices, using the device id's and retrieved
 * models the application can create instances of {@link iotcs.enterprise.VirtualDevice}
 * which provides access to monitor and control the devices.
 *
 * <h2>Device Client</h2>
 *
 * A device-client application will create a {@link iotcs.device.DirectlyConnectedDevice} or
 * a {@link iotcs.device.GatewayDevice} (for indirectly connected devices registration)
 * based on a device already registered on the server that has a logical ID already assigned
 * and saved in a {endpointId}.json generated based on that ID and shared secret
 * associated with the device registered by the TrustedAssetsProvisioner. If the device should
 * be checked if is activated and if is not then the activation should be done.
 * In the course of the activation trusted material used for future authentication with
 * the server will be generated by the TrustedAssetsManager and saved in the
 * {endpointId}.json. In the activation method the model URN's (and capabilities) that the client
 * is implementing (if any) must be given as parameters.
 * <p>
 * After activation (done only if needed) the client should retrieve the device models for the
 * URN's that it is implementing or that other indirectly connected device that is registering
 * in the future are implementing by using the {@link iotcs.device.DirectlyConnectedDevice#getDeviceModel}
 * or {@link iotcs.device.GatewayDevice#getDeviceModel} methods.
 * <p>
 * If the client is a {@link iotcs.device.GatewayDevice}, it can use the
 * {@link iotcs.device.GatewayDevice#registerDevice} method to register other indirectly
 * connected devices that it is using. The server will assign logical endpoint id's to
 * these devices and return them to the client.<br>
 * <b>Be aware that all endpoint id's assigned by the server to indirectly connected
 * devices must be persisted and managed by the device application to use them for creating
 * virtual devices. There is no method for retrieving them from the server side and at
 * an eventual device application restart the id's must be reused.</b><br>
 * <p>
 * After selecting combination of logical endpoint id's (including the client own id) and
 * device models, the client can create instances of {@link iotcs.device.VirtualDevice} by
 * using the constructor or the {@link iotcs.device.DirectlyConnectedDevice#createVirtualDevice}
 * and {@link iotcs.device.GatewayDevice#createVirtualDevice} methods which provides
 * access to messaging to/from the cloud for the specific logical devices.
 *
 * @example <caption>Enterprise Client Quick Start</caption>
 *
 * //The following steps must be taken to run an enterprise-client application.
 *
 * var appName;
 * var ec;
 * var model;
 * var deviceId;
 * var device;
 *
 * // 1. Select an application
 *
 * iotcs.enterprise.EnterpriseClient
 *      .getApplications()
 *      .page('first')
 *      .then(response=>{
 *          response.items.forEach(item => {
 *              //select and application and set appName (the application name)
 *          });
 *          initializeEnterpriseClient();
 *      }, error => {
 *          //handle error in enumeration
 *      });
 *
 * // 2. Initialize enterprise client
 *
 * function initializeEnterpriseClient(){
 *      iotcs.enterprise.EnterpriseClient.newClient(appName, (client, error) => {
 *          if (!client || error) {
 *              //handle client creation error
 *          }
 *          ec = client;
 *          selectDeviceModel();
 *      }
 * }
 *
 * // 3. Select a device model available in the app
 *
 * function selectDeviceModel(){
 *      ec.getDeviceModels()
 *          .page('first')
 *          .then(response => {
 *              response.items.forEach(item => {
 *                  //select a device model and set model
 *              });
 *              selectDevice();
 *          }, error => {
 *              //handle error in enumeration
 *          });
 * }
 *
 * // 4. Select an active device implementing the device model
 *
 * function selectDevice(){
 *      ec.getActiveDevices(model)
 *          .page('first')
 *          .then(response => {
 *              response.items.forEach(item => {
 *                  //select a device and set the deviceId
 *              });
 *              createVirtualDevice();
 *          }, error => {
 *              //handle error in enumeration
 *          });
 * }
 *
 * // 5. Create a virtual device for this model
 *
 * function createVirtualDevice(){
 *      device = ec.createVirtualDevice(deviceId, model);
 *      monitorVirtualDevice();
 *      updateVirtualDeviceAttribute();
 *      executeVirtualDeviceAction();
 * }
 *
 * // 6. Monitor the device through the virtual device
 *
 * function monitorVirtualDevice(){
 *      device.onChange = onChangeTuple => {
 *          //print the new value and attribute
 *          console.log('Attribute '+onChangeTuple.attribute.name+' changed to '+onChangeTuple.newValue);
 *          //process change
 *      };
 *      device.onAlerts = alerts => {
 *          for (var key in alerts) {
 *              alerts[key].forEach(alert => {
 *                  //print alert
 *                  console.log('Received time '+alert.eventTime+' with data '+JSON.stringify(alert.fields));
 *                  //process alert
 *              });
 *          }
 *      };
 * }
 *
 * // 7. Update the value of an attribute
 *
 * function updateVirtualDeviceAttribute(){
 *      device.onError = onErrorTuple => {
 *          //handle error case on update
 *      };
 *      device.attributeName.value = someValue;
 * }
 *
 * // 8. Execute action on virtual device
 *
 * function executeVirtualDeviceAction(){
 *      device.someAction.onAction = response => {
 *          //handle execute action response from server
 *      };
 *      device.call('someAction');
 * }
 *
 * // 9. Dispose of the device
 *
 * device.close();
 *
 * // 10. Dispose of the enterprise client
 *
 * ec.close();
 *
 * @example <caption>Device Client Quick Start</caption>
 *
 * //The following steps must be taken to run a device-client application. This
 * //sample is for a gateway device that does not implement any specific model
 * //that registers one indirectly connected device.
 * //The model must be already in the cloud registered.
 *
 * var trustedAssetsFile = '0-SOMEID.json';
 * var trustedAssetsPassword = 'changeit';
 *
 * var gateway;
 * var model;
 * var indirectDeviceId;
 * var indirectDevice;
 * var indirectDeviceSerialNumber = 'someUniqueID' ;
 * var indirectDeviceMetadata = {};
 *
 * // 1. Create the device client (gateway)
 *
 * gateway = new iotcs.device.GatewayDevice(trustedAssetsFile, trustedAssetsPassword);
 *
 * // 2. Activate the device if needed
 *
 * if (!gateway.isActivated()) {
 *      gateway.activate([], (device, error) => {
 *          if (!device || error) {
 *              //handle activation error
 *          }
 *          selectDeviceModel();
 *      });
 * } else {
 *      selectDeviceModel();
 * }
 *
 * // 3. Select the device model
 *
 * function selectDeviceModel(){
 *      gateway.getDeviceModel('urn:myModel', (response, error) => {
 *          if (!response || error) {
 *              //handle get device model error
 *          }
 *          model = response;
 *          enrollDevice();
 *      });
 * }
 *
 * // 4. Register an indirectly connected device
 *
 * function enrollDevice(){
 *      gateway.registerDevice(indirectDeviceSerialNumber, indirectDeviceMetadata, ['urn:myModel'],
 *          (response, error) => {
 *              if (!response || error) {
 *                  //handle enroll error
 *              }
 *              indirectDeviceId = response;
 *              createVirtualDevice();
 *          });
 * }
 *
 * // 5. Create a virtual device for the indirectly connected device
 *
 * function createVirtualDevice(){
 *      device = gateway.createVirtualDevice(deviceId, model);
 *      monitorVirtualDevice();
 *      updateVirtualDeviceAttribute();
 *      sendVirtualDeviceAlert();
 * }
 *
 * // 6. Monitor the device through the virtual device (it has two actions: power and reset)
 *
 * function monitorVirtualDevice(){
 *      device.onChange = onChangeTuple => {
 *          //print the new value and attribute
 *          console.log('Attribute '+onChangeTuple.attribute.name+' changed to '+onChangeTuple.newValue);
 *          //process change
 *          throw new Error('some message'); //if some error occurred
 *      };
 *      device.power.onAction = value => {
 *          if (value) {
 *              //shutdown the device
 *          } else {
 *              //start the device
 *          }
 *      };
 *      device.reset.onAction = () => {
 *          //reset the device
 *          throw new Error('some message'); //if some error occurred
 *      };
 * }
 *
 * // 7. Update the value of an attribute
 *
 * function updateVirtualDeviceAttribute(){
 *      device.onError = onErrorTuple => {
 *          //handle error case on update
 *      };
 *      device.attributeName.value = someValue;
 * }
 *
 * // 8. Raise an alert to be sent to the cloud
 *
 * function sendVirtualDeviceAlert(){
 *      var alert = device.createAlert('urn:myAlert');
 *      alert.fields.mandatoryFieldName = someValue;
 *      alert.fields.optionalFieldName = someValue; //this is optional
 *      alert.raise();
 * }
 *
 * // 9. Dispose of the virtual device
 *
 * device.close();
 *
 * // 10. Dispose of the gateway device client
 *
 * ec.close();
 *
 * @example <caption>Storage Cloud Quick Start</caption>
 *
 * // This shows how to use the Virtualization API to upload content to,
 * // or download content from, the Oracle Storage Cloud Service.
 * // To upload or download content, there must be an attribute, field,
 * // or action in the device model with type URI.
 * // When creating a DataItem for an attribute, field, or action of type URI,
 * // the value is set to the URI of the content in cloud storage.
 *
 * //
 * // Uploading content
 * //
 *
 * // An instance of iotcs.device.StorageObject is first needed to upload a file
 * // from a device client or from an enterprise client.
 * // The StorageObject is created using the createStorageObject API in iotcs.Client,
 * // which is the base class for iotcs.enterprise.EnterpriseClient, iotcs.device.DirectlyConnectedDevice,
 * // and iotcs.device.GatewayDevice. The StorageObject names the object in storage,
 * // and provides the mime-type of the content.
 * // To set the input path, the StorageObject API setInputPath(string path) is used.
 *
 * // This example shows the typical use case from a DirectlyConnectedDevice.
 * // But the code for a GatewayDevice or EnterpriseClient is the same.
 *
 * var storageObjectUpload = gateway.createStorageObject("uploadFileName", "image/jpg");
 * storageObjectUpload.setInputPath("upload.jpg");
 * virtualDevice.attributeName.value = storageObjectUpload;
 * // OR
 * virtualDevice.update({attributeName: storageObjectUpload});
 *
 * // A StorageObject may also be set on an Alert field, or as an Action parameter,
 * // provided the type in the device model is URI
 *
 * //
 * // Downloading content
 * //
 *
 * // In the Virtualization API, the client is notified through an onChange tuple,
 * // onAlert tuple, or a call callback for an action. The value in the tuple is a StorageObject.
 * // To download the content, the output path is set on the StorageObject,
 * // and the content is synchronized by calling the StorageObject sync() API.
 *
 * // This example shows the typical use case from an onChange event.
 * // The code for an onAlert or for an action callback is much the same.
 *
 * virtualDevice.attributeName.onChange = tuple => {
 *     var name = tuple.attribute.id;
 *     var storageObject = tuple.newValue;
 *     // only download if image is less than 4M
 *     if (storageObject.getLength() < 4 * 1024 * 1024) {
 *         storageObject.setOutputPath("download.jpg");
 *         storageObject.sync();
 *     }
 * };
 *
 * //
 * // Checking synchronization status
 * //
 *
 * // A StorageObject is a reference to some content in the Storage Cloud.
 * // The content can be in sync with the storage cloud, not in sync with the storage cloud,
 * // or in process of being sync'd with the storage cloud.
 * // The synchronization can be monitored by setting a SyncCallback with onSync.
 * // For the upload case, set the onSync callback on the storage object
 * // before setting the virtual device attribute.
 * // For the download case, set the onSync callback on the storage object
 * // from within the onChange callback.
 *
 * storageObject.onSync = event => {
 *     var sourceStorageObject = event.getSource();
 *     if (sourceStorageObject.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.IN_SYNC) {
 *         // image was uploaded
 *     } else if (sourceStorageObject.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.FAILED) {
 *         // image was not uploaded, take action!
 *     }
 * }
 */


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Global.js
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
// File: ./src/enterprise/PlatformBrowser.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 */

/**
 * enterprise porting interface for browser.  This file contains enterprise-specific functions when
 * running in a browser environment.  The classes are defined in shared/PlatformBrowser.js and
 * additional functions are added here for the enterprise-browser environment.
 *
 * Since the JavaScript client library runs under both the web browser and NodeJS, we need a porting
 * layer for both.  Platform is defined in the shared namespace, hence the iotcs.impl namespace
 * instead of using iotcs.enterprise.impl.
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// enterprise Https for browser
iotcs.impl.Platform.Https._authWindow = null;

/** TODO: Trial should be used for testing only, not for real POD. */
iotcs.impl.Platform.Https._getTokenAndRequest = (options, payload, trial, callback) => {
    let csrfOptions = {
        // DJM: I think I can remove this.
//        headers: {
//            // DJM: Need to fix these dcd references.
//            'Authorization': dcd._.internalDev._.bearer,
//        },
        hostname: options.hostname,
        method: 'GET',
        port: options.port,
        path: (iotcs.oracle.iot.client.test.auth.activated ? iotcs.oracle.iot.client.test.reqroot :
               iotcs.impl._reqRoot) + '/private/server',
        protocol: options.protocol
    };

    try {
        if (options.headers && options.headers.Authorization) {
            csrfOptions.headers = {};
            csrfOptions.headers.Authorization = options.headers.Authorization;
        //. DJM: Where is client coming from?...test and fix.
        } else if (client) {
            csrfOptions.headers = {};
            csrfOptions.headers.Authorization = client._bearer;
        }
    } catch(doNothing) {
        // Catches "ReferenceError" for client.
    }

    iotcs.impl.Platform.Https._request(csrfOptions, payload, (response, error) => {
        iotcs.impl.Platform.Https.Csrf._inProgress = false;

        if (!response || error) {
            callback(response, error);
            return;
        }

        if ((!iotcs.impl.Platform.Https.Csrf._token) && (trial > 0)) {
            iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, --trial,
                                                      callback);
        } else {
            iotcs.impl.Platform.Https._request(options, payload, callback, true);
        }
    }, true);
};

/**
 * TODO: Validate with server implementation the user auth.
 */
iotcs.impl.Platform.Https._req = (options, payload, callback, oracleIoT) => {
    // DJM: Can remove this.
//    ['family', 'localAddress', 'socketPath', 'agent', 'pfx', 'key', 'passphrase', 'cert', 'ca',
//     'ciphers', 'rejectUnauthorized', 'secureProtocol' ].forEach(key =>
//        {
//            if (key in options) {
//                //iotcs.log('iotcs.impl.Platform.Https.req ignores "' + key + '" option');
//            }
//        });

    if ((options.method === 'GET') && (payload)) {
        iotcs.log('There should be no payload when using GET method; use "path" for passing query.');
    }

    // If this is the first attempt to access IoT-CS...
    if (oracleIoT &&
        !iotcs.impl.Platform.Https.Csrf._token &&
        !iotcs.impl.Platform.Https.Csrf._inProgress)
    {
        iotcs.impl.Platform.Https.Csrf._inProgress = true;
        iotcs.impl.Platform.Https._getTokenAndRequest(options, payload, 1, callback);
    } else {
        iotcs.impl.Platform.Https._request(options, payload, callback, oracleIoT);
    }
};

iotcs.impl.Platform.Https._request = (options, payload, callback, oracleIoT) => {
        let baseUrl =
            (options.protocol || 'https') +
            '://' +
            (options.hostname || options.host || 'localhost') +
            (((options.port) && ((options.protocol === 'https' && options.port !== 443)) ||
              (options.protocol === 'http' && options.port !== 80)) ? (':' + options.port) : '');

        let url = baseUrl + (options.path || '/');
        let authUrl = baseUrl + iotcs.impl.Platform.Https.AuthRequest._path;

        let _onNotAuth = authWindowOpen => {
            if ((!iotcs.impl.Platform.Https._authWindow ||
                 iotcs.impl.Platform.Https._authWindow.closed) && authWindowOpen)
            {
                iotcs.impl.Platform.Https._authWindow = window.open(authUrl, 'auth');
            }

            let authMonitor = null;

            authMonitor = new iotcs.impl.Monitor(() => {
                if (authMonitor) {
                    authMonitor._stop();
                }

                authMonitor = null;
                iotcs.impl.Platform.Https._req(options, payload, callback, oracleIoT);
            });

            authMonitor._start();
        };

        let xhr = new XMLHttpRequest();

        let _onready = req => {
            if (req.readyState === 4) {
                if ((req.status === iotcs.StatusCode.FOUND) || (req.status === 0) ||
                    (req.responseUrl && req.responseUrl.length && (decodeURI(req.responseURL) !== url)))
                {
                    _onNotAuth(true);
                    return;
                } else {
                    if (iotcs.impl.Platform.Https._authWindow &&
                        (!iotcs.impl.Platform.Https._authWindow.closed))
                    {
                        iotcs.impl.Platform.Https._authWindow.close();
                    }
                }

                if (req.status === iotcs.StatusCode.UNAUTHORIZED) {
                    if (!iotcs.impl.Platform.Https.Csrf._inProgress) {
                        iotcs.impl.Platform.Https.Csrf._token = null;
                    }
                    _onNotAuth(false);
                    return;
                }

                if ((req.status === iotcs.StatusCode.OK) || (req.status === iotcs.StatusCode.ACCEPTED)) {
                    if (xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName) &&
                        xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName).length)
                    {
                        iotcs.impl.Platform.Https.Csrf._token =
                            xhr.getResponseHeader(iotcs.impl.Platform.Https.Csrf._tokenName);
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
                xhr.setRequestHeader(iotcs.impl.Platform.Https.Csrf._tokenName,
                                     iotcs.impl.Platform.Https.Csrf._token);
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
// File: ./src/enterprise/Impl.js
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
 * Implementation functions and classes for the enterprise namespace.
 */

//General TODOs:

//@TODO: all iotcs.impl.Https._req(...,...,(response=>{ /*HERE*/})); do not handle error cases consistently: some are iotcs.error(), while others are callback(null) @DONE
//@TODO: all conditions should be defensively parenthesized e.g. "if (a==b && !c && d)" => if ((a==b) && (!c) && (d))"
//@TODO: there should be more iotcs.oracle.iot.XXX.defaultLimit and every Pageable instanciation should use its own explicitly for maximum configurability: e.g. "new iotcs.enterprise.Pageable({},,,iotcs.oracle.iot.XXX.defaultLimit);"

//@TODO: code as flat as possible: e.g. instead of if(ok) { } => use if(!ok) {error | return ...} ... } @DONE
//@TODO: error message case should be consistent: all lowercase or w first letter Uppercase ...etc... @DONE
//@TODO: if/while/catch/... are not functions e.g. conventionally "if(XX)" should be "if (X)"
//@TODO: "function(" => "function ("
//@TODO: "){" => ") {"
//@TODO: "}\nelse {\n" => "} else {\n"

//@TODO: we probably need a few global (lib-private) functions to do advanced parameter value checking (e.g. check that appid has no "/" (or %XX equivalent ...etc...) ... this depends on needs from other classes/functions...
//@TODO: iotcs.error() is currently not satisfactory; related: callbacks (especially not in timeout/intervals) should not throw any exceptions ...etc...


//@TODO (last) align DCL to ECL for all sibling definitions (use winmerge ...)

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.impl._reqRoot = '/iot/webapi/v2';

iotcs.impl.Https._bearerReq = (options, payload, callback, retryCallback, eClientImpl) => {
    if (eClientImpl && eClientImpl._tam && eClientImpl._tam.getClientId()) {
        options.path = options.path.replace('webapi','api');

        if (!options.headers) {
            options.headers = {};
        }

        options.headers.Authorization = eClientImpl._bearer;
        options.headers['X-EndpointId'] = eClientImpl._tam.getClientId();
        options.tam = eClientImpl._tam;

        iotcs.impl.Https._req(options, payload, (responseBody, error) => {
            if (error) {
                var exception = null;

                try {
                    exception = JSON.parse(error.message);

                    if (exception.statusCode &&
                        (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                    {
                        eClientImpl._refreshBearer(error => {
                            if (error) {
                                callback(responseBody, error);
                                return;
                            }

                            retryCallback();
                        });

                        return;
                    }
                } catch (e) {
                   // Do notrhing. 
                }
            }
            callback(responseBody, error);
        });
    } else {
        iotcs.impl.Https._req(options, payload, callback);
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
// File: ./src/enterprise/ActionSpec.js
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
 * @class
 * @ignore
 * @private
 */
iotcs.enterprise.impl.ActionSpec = class extends iotcs.impl.ActionSpecBase {
    /**
     * Constructs an ActionSpec.
     *
     * @param {string} actionSpec - A JSON string which represents the specification of this action.
     */
    constructor(actionSpec) {
        super(actionSpec);
        this._onAction = arg => {};
    }

    // Public functions
    /**
     * Verifies that the argument, based on the Action specification in the device model, is an
     * argument for the Action.
     *
     * @param {*} arg The argument to check.
     * @returns {*} The original argument if it passes validation, the URI if it's an ExternalObject,
     *          or <code>null</code>.
     *
     * @ignore
     * @private
     */
    checkAndGetVarArg(arg) {
        if (!this._spec.argType) {
            if (typeof arg !== 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return null;
            }
        } else {
            if (typeof arg === 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return null;
            }

            if (this._spec.argType === 'URI') {
                if (arg instanceof iotcs.ExternalObject) {
                    arg = arg.getURI();
                } else if (typeof arg === 'string') {
                    // nothing to do
                } else {
                    iotcs.error('Invalid URI parameter.');
                    return null;
                }
            }

            if (!iotcs.enterprise.impl.Attribute._matchType(this._spec.argType, arg)) {
                iotcs.error('Type mismatch; action "' + this._spec.name + '" requires arg type [' +
                    this._spec.argType + '].');
                return null;
            }

            if (this._spec.range &&
                ((arg < this._spec.range.low) || (arg > this._spec.range.high)))
            {
                iotcs.error('Trying to use an argument which is out of range [' +
                    this._spec.range.low + ' - ' + this._spec.range.high + '].');
                return null;
            }
        }
        return arg;
    }

    /**
     * Verifies that the arguments, based on the Action specification in the device model, are
     * arguments for the Action.
     *
     * @param {Map<string, string>} [args] - A <code>Map</code> of action argument names to action
     *        argument values to pass for action execution.  The arguments are specific to the
     *        action.  The description of the arguments is provided in the device model.
     * @return {object} The original arguments, as an object (suitable to JSON.stringify), if they
     *          pass validation or <@code>null</code>.  If an ExternalObject is supplied, it's URI
     *          is stored in the returned args.
     *
     * @ignore
     * @private
     */
    checkAndGetVarArgs(args) {
        if (this._spec.args.length === Object.keys(args).length) {
            // New action arguments
            let newArgs = null;
            let self = this;

            for (const argName in args) {
                let argValue = args[argName];

                if (typeof argValue === 'undefined') {
                    iotcs.error('Invalid number of arguments.');
                    return null;
                }

                let argSpec;

                for (let aSpec of self._spec.args) {
                    if (aSpec.name === argName) {
                        argSpec = aSpec;
                        break;
                    }
                }

                if (argSpec.type === 'URI') {
                    if (argValue instanceof iotcs.ExternalObject) {
                        argValue = argValue.getURI();
                    } else if (typeof argValue === 'string') {
                        // nothing to do
                    } else {
                        iotcs.error('Invalid URI parameter.');
                        return null;
                    }
                }

                let isMatch = iotcs.enterprise.impl.Attribute._matchType(argSpec.type, argValue);

                // DATETIME may be Date/Time or # milliseconds since the epoch.
                if (!isMatch && (argSpec.type === 'DATETIME')) {
                    isMatch = iotcs.enterprise.impl.Attribute._matchType('NUMBER', argValue);
                }

                if (!isMatch) {
                    iotcs.error('Type mismatch for action "' + self._spec.name +
                        '" requires arg type [' + argSpec.type + '].');

                    return null;
                }

                if (argSpec.range &&
                    ((argValue < argSpec.range.low) || (argValue > argSpec.range.high)))
                {
                    iotcs.error('Trying to use an argument which is out of range [' +
                        argSpec.range.low + ' - ' + argSpec.range.high + '].');

                    return null;
                }

                newArgs = newArgs ? newArgs : {};
                newArgs[argName] = argValue;
            }

            return newArgs;
        } else {
            iotcs.error('Invalid number of arguments.');
            return null;
        }
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Alert.js
//////////////////////////////////////////////////////////////////////////////
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
iotcs.enterprise.impl.Alert = class {
    constructor(alertSpec) {
        _mandatoryArg(alertSpec, 'object');

        if (!alertSpec.urn) {
            iotcs.error('alert specification in device model is incomplete');
            return;
        }

        this._spec = {
            _description: (alertSpec.description || ''),
            _fields: (alertSpec.value && alertSpec.value.fields)? alertSpec.value.fields : null,
            _name: (alertSpec.name || null),
            _urn: alertSpec.name
        };

        // This uses __ as the setter for _onAlerts sets this value.
        this.__onAlerts = arg => {};
    }

    // Private/protected functions
    _formatsLocalUpdate(formats, virtualDevice, callback) {
        if (this._spec._fields) {
            let index = 0;

            this._spec._fields.forEach(field => {
                if (field.type === "URI") {
                    let url = formats[0].fields[field.name];

                    if (_isStorageCloudURI(url)) {
                        virtualDevice._enterpriseClient._createStorageObject(url, (storage, error) => {
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

                            if (callback && index === this._spec._fields.length) {
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

    get _description() {
        return this._spec._description;
    }

    get _name() {
        return this._spec._name;
    }

    get _onAlerts() {
        return this.__onAlerts;
    }

    get _urn() {
        return this._spec._urn;
    }

    set _onAlerts(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onAlert that is not a function!');
            return;
        }

        this.__onAlerts = newFunction;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Data.js
//////////////////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Attribute.js
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
 * @class
 */
/** @ignore */
iotcs.enterprise.impl.Attribute = class {
    // Static private functions
    /** @ignore */
    static _checkAndGetNewValue(newValue, spec) {
        if (spec._type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in the date time parameter.');
                return;
            }
        }

        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, newValue)) {
            iotcs.error('type mismatch; attribute "' + spec._name + '" has type [' + spec._type + ']');
            return;
        }

        return newValue;
    }

    /** @ignore */
    static _checkAndGetNewValueCallback(newValue, spec, virtualDevice, callback) {
        let isURICallback = false;

        if (spec._type === 'DATETIME') {
            if (typeof newValue === 'number') {
                let str = '' + newValue;

                if (str.match(/^[-+]?[1-9]\.[0-9]+e[-]?[1-9][0-9]*$/)) {
                    newValue = newValue.toFixed();
                }
            }

            newValue = new Date(newValue);

            if (isNaN(newValue.getTime())) {
                iotcs.error('Invalid date in the date time parameter.');
                return;
            }
        }

        if (spec._type === 'URI') {
            if (newValue instanceof iotcs.ExternalObject) {
                // Nothing to do.
            } else if (typeof newValue === 'string') {
                // Get URI from server.
                if (_isStorageCloudURI(newValue)) {
                    isURICallback = true;

                    virtualDevice._enterpriseClient._createStorageObject(newValue, (storage, error) => {
                        if (error) {
                            iotcs.error('Error during creation storage object: ' + error);
                            return;
                        }

                        let storageObject = new iotcs.enterprise.StorageObject(storage.getURI(),
                            storage.getName(), storage.getType(), storage.getEncoding(),
                            storage.getDate(), storage.getLength());

                        storageObject._setDevice(virtualDevice);
                        storageObject._setSyncEventInfo(spec._name, virtualDevice);

                        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, storageObject)) {
                            iotcs.error('Type mismatch.  Attribute "' + spec._name + '" has type [' +
                                        spec._type + '].');
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

        if (!iotcs.enterprise.impl.Attribute._matchType(spec._type, newValue)) {
            iotcs.error('Type mismatch.  Attribute "' + spec._name + '" has type [' + spec._type +
                        '].');
            return;
        }

        if (!isURICallback) {
            callback(newValue);
        }
    }

    /** @ignore */
    static _equal(newValue, oldValue, spec) {
        if (spec._type === 'DATETIME' && (newValue instanceof Date) && (oldValue instanceof Date)) {
            return (newValue.getTime() === oldValue.getTime());
        } else {
            return (newValue === oldValue);
        }
    }

    /** @ignore */
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
            return;
        }
    }

    /**
     * @param {object} attributeSpec - The attribute specification in JSON format.
     */
    constructor(attributeSpec) {
        _mandatoryArg(attributeSpec, 'object');
        
        if ((!attributeSpec.name) || (!attributeSpec.type)) {
            iotcs.error('Attribute specification in device model is incomplete.');
            return;
        }

        this._spec = {
            _alias: (attributeSpec.alias || null),
            _defaultValue: ((typeof attributeSpec.defaultValue !== 'undefined') ?
                            attributeSpec.defaultValue : null),
            _description: (attributeSpec.description || ''),
            _name: attributeSpec.name,
            _range: (attributeSpec.range ?
                     this._parseRange(attributeSpec.type, attributeSpec.range) : null),
            _type: attributeSpec.type,
            _writable: (attributeSpec.writable || false)
        };
        

        this._lastKnownValue = this._spec._defaultValue;
        this._lastUpdate = null;
        this._localUpdateRequest = false;
        // Using _ here explicitly because we may need to set value to null, which is an invalid
        // value and if we do that, the setter and validation checks will kick in.
        this._value = this._spec._defaultValue;
    }

    // "Private/Protected" functions
    /** @private */
    _getNewValue(newValue, virtualDevice, callback) {
        try {
            if (this._isValidValue(newValue)) {
                iotcs.enterprise.impl.Attribute._checkAndGetNewValueCallback(newValue, this._spec,
                    virtualDevice, attributeValue =>
                {
                    if (callback) {
                        callback(attributeValue);
                    }
                });
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    // @TODO: see comment in AbstractVirtualDevice; this is not clean especially it is supposed to
    // be a private function and yet used in 4 other objects ...etc...; this looks like a required
    // ((semi-)public) API ... or an $impl.XXX or a function ()...
    /** @private */
    _isValidValue(newValue) {
        try {
            newValue = iotcs.enterprise.impl.Attribute._checkAndGetNewValue(newValue, this._spec);
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
            return false;
        }

        if (typeof newValue === 'undefined') {
            iotcs.createError('Trying to set an invalid value.');
            return false;
        }

        if (this._spec._range && ((newValue < this._spec._range.low) ||
                                  (newValue > this._spec._range.high)))
        {
            iotcs.createError('Trying to set a value out of range [' + this._spec._range.low +
                              ' - ' + this._spec._range.high + ']');
            return false;
        }

        return true;
    }

    /** @private */
    _localUpdate(newValue, nosync) {
        if (this._isValidValue(newValue)) {
            newValue = iotcs.enterprise.impl.Attribute._checkAndGetNewValue(newValue, this._spec);

            if (!this._spec._writable) {
                iotcs.error('Illegal write access.  Attribute "' + this._spec._name +
                            '" is read-only."');
                return;
            }

            if (iotcs.enterprise.impl.Attribute._equal(newValue, this._value, this._spec)) {
                return;
            }

            let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                this._value.getURI() : this._value;

            let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                newValue.getURI() : newValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name + '" of type "' +
                this._spec._type + '" from ' + consoleValue + ' to ' + consoleNewValue + '.');
 
            // _value, not value so the setter doesn't execute.
            this._value = newValue;
            this._localUpdateRequest = true;

            if (!nosync) {
                if (!self.device || !(self.device instanceof iotcs.enterprise.VirtualDevice)) {
                    return;
                }

                let attributes = {};
                attributes[this._spec._name] = newValue;
                self.device.controller.updateAttributes(attributes, true);
            }
        }  else {
            iotcs.error('Invalid value.');
        }
    }

    /** @private */
    _onUpdateResponse(error) {
        if (error) {
            let consoleValue =
                (this._value instanceof iotcs.ExternalObject)? this._value.getURI() : this._value;

            let consoleLastValue = (this.lastKnownValue instanceof iotcs.ExternalObject) ?
                this.lastKnownValue.getURI() : this.lastKnownValue;

            iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name + '" of type "' +
                this._spec._type + '" from ' + consoleValue + ' to ' + consoleLastValue + '.');

            this._value = this.lastKnownValue;
        }

        this.lastUpdate = new Date().getTime();
        this._localUpdateRequest = false;
    }

    /** @ignore */
    _parseRange(type, rangeStr) {
        _mandatoryArg(type, 'string');
        _mandatoryArg(rangeStr, 'string');

        if ((type !== 'NUMBER') && (type !== 'INTEGER')) {
            iotcs.error('Device model specification is invalid.');
            return;
        }

        let rangeLimits = rangeStr.split(',');

        if (rangeLimits.length != 2) {
            iotcs.error('Device model specification is invalid.');
            return;
        }

        let first = parseFloat(rangeLimits[0]);
        let second = parseFloat(rangeLimits[1]);

        return {
            low: Math.min(first,second),
            high: Math.max(first,second)
        };
    }

    /** @private */
    _remoteUpdate(newValue) {
        try {
            if (this._isValidValue(newValue)) {
                this.lastUpdate = Date.now();

                if (iotcs.enterprise.impl.Attribute._equal(newValue, this.lastKnownValue,
                                                           this._spec))
                {
                    return;
                }

                this.lastKnownValue = newValue;

                if (!(this._spec._writable && this._localUpdateRequest)) {
                    let consoleValue = (this._value instanceof iotcs.ExternalObject) ?
                        this._value.getURI() : this._value;

                    let consoleNewValue = (newValue instanceof iotcs.ExternalObject) ?
                        newValue.getURI() : newValue;

                    iotcs.impl.Platform._debug('Updating attribute "' + this._spec._name +
                        '" of type "' + this._spec._type + '" from ' + consoleValue + ' to ' +
                        consoleNewValue + '.');

                    this._value = newValue;
                }
            }
        } catch (e) {
            iotcs.createError('Invalid value: ', e);
        }
    }

    // Public functions
    get defaultValue() {
        return this._spec._defaultValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} description - the description
     * of this attribute
     */
    get description() {
        return this._spec._description;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} id - the unique/reproducible
     * id for this attribute (usually its name)
     */
    get id() {
        return this._spec._name;
    }

    get lastKnownValue() {
        return this._lastKnownValue;
    }

    get lastUpdate() {
        return this._lastUpdate;
    }

    get onChange() {
        return this._onChange;
    }

    get onError() {
        return this._onError;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {string} type - one of <code>INTEGER</code>,
     * <code>NUMBER</code>, <code>STRING</code>, <code>BOOLEAN</code>,
     * <code>DATETIME</code>
     */
    get type() {
        return this._spec._type;
    }

    get value() {
        return this._value;
    }

    /**
     * @ignore
     * @memberof iotcs.Attribute
     * @member {boolean} writable - expressing whether
     * this attribute is writable or not
     */
    get writable() {
        return this._spec._writable;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {(number|string|boolean|Date)} lastKnownValue - 
     * used for getting the current value of this attribute 
     */
    set lastKnownValue(newValue) {
        this._lastKnownValue = newValue;
    }

    /**
     * @memberof iotcs.Attribute
     * @member {Date} lastUpdate - the date of the last value update
     */
    set lastUpdate(newValue) {
        this._lastUpdate = newValue;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {function(Object)} onChange - function called
     * back when value as changed on the server side. Callback
     * signature is <code>function (e) {}</code>, where <code>e</code> 
     * is <code>{'attribute':this, 'newFunction':, 'oldValue':}</code>
     */
    set onChange(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set to onChange to something that is not a function!');
            return;
        }

        this._onChange = newFunction;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {function(Object)} onError - function called
     * back when value could not be changed. Callback signature is
     * <code>function (e) {}</code>, where <code>e</code> is 
     * <code>{'attribute':this, 'newFunction':, 'tryValue':}</code>
     */
    set onError(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set onError to something that is not a function!');
            return;
        }

        this._onError = newFunction;
    }

    /**
     * @memberof iotcs.Attribute 
     * @member {(number|string|boolean|Date)} value - used for setting or
     * getting the current value of this attribute (subject to whether it is writable
     * or not).
     */
    set value(newValue) {
        this._localUpdate(newValue, false);
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/AsyncRequestMonitor.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.enterprise.impl.AsyncRequestMonitor = class {
    /**
     * @param {String} requestId - The request ID.
     * @param {function} callback - A callback function.
     * @param {iotcs.enterprise.impl.EnterpriseClientImpl} eClientImpl - An EnterpriseClientImpl.
     *
     * @ignore
     */
    constructor(requestId, callback, eClientImpl) {
        _mandatoryArg(requestId, ['string','number']);
        _mandatoryArg(callback, 'function');

        this._callback = callback;
        this._eClientImpl = eClientImpl;
        this._monitor = null;
        this._requestId = requestId;
        this._startTime = null;
    }

    // Private/protected functions
    /** @ignore */
    _requestMonitor(asyncReqMonitor) {
        if (asyncReqMonitor._startTime &&
            (Date.now() > (asyncReqMonitor._startTime +
                           iotcs.oracle.iot.client.controller.asyncRequestTimeout)))
        {
            asyncReqMonitor._stop();

            let response = {
                complete: true,
                id: asyncReqMonitor._requestId,
                status: 'TIMEOUT'
            };

            asyncReqMonitor._callback(response);
            return;
        }

        iotcs.impl.Https._bearerReq({
            'method': 'GET',
            'path': iotcs.impl._reqRoot + '/requests/' + asyncReqMonitor._requestId
        }, '', (response, error) => {
            try {
                if (!response || error) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response, iotcs.createError('Invalid response: ',error));
                    return;
                }

                if (!(response.status) || (typeof response.complete === 'undefined')) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response, iotcs.createError('Invalid response type: ',
                                                                        error));
                    return;
                }

                if (response.complete) {
                    asyncReqMonitor._stop();
                    asyncReqMonitor._callback(response);
                }
            } catch(e) {
                asyncReqMonitor._stop();
                asyncReqMonitor._callback(response, iotcs.createError('Error on response: ', e));
            }
        }, () => {
            this._requestMonitor(asyncReqMonitor);
        }, asyncReqMonitor._eClientImpl);
    }

    /** @ignore */
    _start () {
        let self = this;

        if (!this._monitor) {
            this._monitor = new iotcs.impl.Monitor(() => {
                this._requestMonitor(this);
            });
        }

        if (!this._monitor.running) {
            this._monitor._start();
            this._startTime = Date.now();
        }
    }

    /** @ignore */
    _stop() {
        if (this._monitor) {
            this._monitor._stop();
        }

        this._startTime = null;
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Controller.js
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
 * The Controller class executes actions and updates attributes on virtual devices by invoking HTTP
 * requests on the server.
 *
 * @class
 * @ignore
 */
iotcs.enterprise.impl.Controller = class {
    // Static private/protected functions
    /**@ignore*/
    static _actionExecuteResponseProcessor(response, device, actionName, error) {
        let action = device[actionName];

        if (action.onAction) {
            action.onAction(response, error);
        }
    }

    /**@ignore*/
    static _attributeUpdateResponseProcessor (response, device, attributeNameValuePairs, extError) {
        let error = false;

        if (!response || extError) {
            error = true;
            response = extError;
        } else {
            error = (response.status === 'FAILED' ||
                     (!response.response) ||
                     (!response.response.statusCode) ||
                     (response.response.statusCode > 299) ||
                     (response.response.statusCode < iotcs.StatusCode.OK));
        }

        let attrObj = {};
        let newValObj = {};
        let tryValObj = {};

        for (let attributeName in attributeNameValuePairs) {
            let attribute = device[attributeName];
            attribute._onUpdateResponse(error);
            attrObj[attribute.id] = attribute;
            newValObj[attribute.id] = attribute.value;
            tryValObj[attribute.id] = attributeNameValuePairs[attributeName];

            if (error && attribute._onError) {
                let onAttributeErrorTuple = {
                    attribute: attribute,
                    newValue: attribute.value,
                    tryValue: attributeNameValuePairs[attributeName],
                    errorResponse: response
                };

                attribute._onError(onAttributeErrorTuple);
            }
        }

        if (error && device.onError) {
            let onDeviceErrorTuple = {
                attributes: attrObj,
                newValues: newValObj,
                tryValues: tryValObj,
                errorResponse: response
            };

            device.onError(onDeviceErrorTuple);
        }
    }

    /** @ignore */
    static _checkIfDeviceIsDeviceApp(virtualDevice, callback) {
        if (virtualDevice._isDeviceApp) {
            callback();
            return;
        }

        let deviceId = virtualDevice.getEndpointId();
        let filter = new iotcs.enterprise.Filter();
        filter = filter.eq('id',deviceId);

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot +
                (virtualDevice._enterpriseClient._appid ?
                 ('/apps/' + virtualDevice._enterpriseClient._appid) : '') +
                '/deviceApps' +
                '?fields=type' +
                '&q=' +
                filter.toString()
        }, '', (response, error) => {
            if (!response || error || !response.items || !Array.isArray(response.items)) {
                iotcs.createError('Invalid response on device app check request - assuming virtual device is a device.');
            } else {
                if ((response.items.length > 0) &&
                    response.items[0].type &&
                    (response.items[0].type === 'DEVICE_APPLICATION'))
                {
                    virtualDevice._isDeviceApp = 2;
                    callback();
                    return;
                }
            }

            virtualDevice._isDeviceApp = 1;
            callback();
        }, () => {
            iotcs.enterprise.impl._checkIfDeviceIsDeviceApp(virtualDevice, callback);
        }, virtualDevice._enterpriseClient._activeEnterpriseClientImpl);
    }

    /**
     * Constructs a Controller.
     *
     * @param {AbstractVirtualDevice} device - The device associated with this controller.
     */
    constructor(device) {
        _mandatoryArg(device, iotcs.AbstractVirtualDevice);

        this._device = device;
        this._requestMonitors = {};
    }

    // Private/protected functions
    /**
     * @TODO MISSING DESCRIPTION
     *
     * @memberof iotcs.util.Controller
     * @function close
     */
    _close() {
        for(let key in this._requestMonitors) {
            this._requestMonitors[key]._stop();
        }

        this._requestMonitors = {};
        this._device = null;
    }

    /**
     * Invokes the action specified in actionName with multiple arguments specified in args.
     *
     * @function invokeMultiArgAction
     * @memberof iotcs.util.Controller
     *
     * @param {string} actionName The name of the action to invoke.
     * @param {Map<string, string>} [args] - A <code>Map</code> of action argument names to action
     *        argument values to pass for action execution.  The arguments are specific to the
     *        action.  The description of the arguments is provided in the device model.
     */
    _invokeMultiArgAction(actionName, args) {
        _mandatoryArg(actionName, 'string');

        if (!this._device[actionName]) {
            iotcs.error('Action: "' + actionName + '" not found in the device model.');
            return;
        }

        /** @type {*} */
        let checkedArgs;

        if ((checkedArgs = this._device[actionName].checkAndGetVarArgs(args)) === null) {
            iotcs.error('Invalid parameters on call to action: "' + actionName + '".');
            return;
        }

        let self = this;
        let deviceModelUrn = self._device.getDeviceModel().urn;
        let endpointId = self._device.getEndpointId();
        let selfDevice = self._device;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: 'POST',
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/actions/' + actionName
            }, ((typeof checkedArgs !== 'undefined') ?
                JSON.stringify(checkedArgs) : JSON.stringify({})), (response, error) => {
                    if (!response || error || !(response.id)) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', error));

                        return;
                    }

                    let reqId = response.id;

                    try {
                        self._requestMonitors[reqId] =
                            new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                        {
                            iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(
                                response, selfDevice, actionName, error);
                        }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                        self._requestMonitors[reqId]._start();
                    } catch (e) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', e));
                    }

                }, () => {
                    self._invokeMultiArgAction(actionName, checkedArgs);
                }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }

    /**
     * Invokes the action specified in actionName with a single argument specified in arg.
     *
     * @function invokeSingleArgAction
     * @memberof iotcs.util.Controller
     *
     * @param {string} actionName The name of the action to invoke.
     * @param {*} [args] - The argument to pass for action execution.  The arguments are specific
     *        to the action.  The description of the argument is provided in the device model.
     */
    _invokeSingleArgAction(actionName, arg) {
        _mandatoryArg(actionName, 'string');

        if (!this._device[actionName]) {
            iotcs.error('Action: "' + actionName + '" not found in the device model.');
            return;
        }

        let checkedValue;

        // If the action has no argument, the checkedValue will still be undefined after this check.
        if ((checkedValue = this._device[actionName].checkAndGetVarArg(arg)) === null) {
            iotcs.error('Invalid parameters on call to action: "' + actionName + '".');
            return;
        }

        let self = this;
        let endpointId = self._device.getEndpointId();
        let deviceModelUrn = self._device.getDeviceModel().urn;
        let selfDevice = self._device;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: 'POST',
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/actions/' + actionName
            }, ((typeof checkedValue !== 'undefined') ?
                JSON.stringify({value: checkedValue}) : JSON.stringify({})), (response, error) =>
                {
                    if (!response || error || !(response.id)) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', error));
                        return;
                    }

                    let reqId = response.id;

                    try {
                        self._requestMonitors[reqId] =
                            new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                        {
                            iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(
                                response, selfDevice, actionName, error);
                        }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                        self._requestMonitors[reqId]._start();
                    } catch (e) {
                        iotcs.enterprise.impl.Controller._actionExecuteResponseProcessor(response,
                            selfDevice, actionName,
                            iotcs.createError('Invalid response on execute async request: ', e));
                    }
                }, () => {
                    self._invokeSingleArgAction(actionName, checkedValue);
                }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }

    /**
     * Updates the specified attributes by checking the attributes against the device model and sending
     * a message to the server to update the attributes.
     *
     * @param {object} attributeNameValuePairs - An object containing attribute names with associated
     *        attribute values. e.g. { name1:value1, name2:value2, ...}.
     * @param {boolean} [singleAttribute] - Indicates if one attribute needs to be updated. Could be
     *        omitted, in which case the value is false.
     *
     * @function updateAttributes
     * @memberof iotcs.util.Controller
     */
    _updateAttributes(attributeNameValuePairs, singleAttribute) {
        _mandatoryArg(attributeNameValuePairs, 'object');

        if (Object.keys(attributeNameValuePairs).length === 0) {
            return;
        }

        for(let attributeName in attributeNameValuePairs) {
            if (!this._device[attributeName]) {
                iotcs.error('Device model attribute mismatch.');
                return;
            }
        }

        let endpointId = this._device.getEndpointId();
        let deviceModelUrn = this._device.getDeviceModel().urn;
        let selfDevice = this._device;
        let self = this;

        iotcs.enterprise.impl.Controller._checkIfDeviceIsDeviceApp(self._device, () => {
            iotcs.impl.Https._bearerReq({
                method: (singleAttribute ? 'PUT' : 'POST'),
                headers: (singleAttribute ? {} : {
                    'X-HTTP-Method-Override': 'PATCH'
                }),
                path: iotcs.impl._reqRoot +
                    '/apps/' + self._device._enterpriseClient._appid +
                    ((self._device._isDeviceApp === 2) ? '/deviceApps/' : '/devices/') +
                    endpointId +
                    '/deviceModels/' + deviceModelUrn +
                    '/attributes' +
                    (singleAttribute ? ('/' + Object.keys(attributeNameValuePairs)[0]) : '')
            }, (singleAttribute ?
                JSON.stringify({value: attributeNameValuePairs[Object.keys(attributeNameValuePairs)[0]]}) :
                JSON.stringify(attributeNameValuePairs)), (response, error) =>
            {
                if (!response || error || !(response.id)) {
                    iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(null,
                        selfDevice, attributeNameValuePairs,
                        iotcs.createError('Invalid response on update async request: ', error));
                    return;
                }

                let reqId = response.id;

                try {
                    self._requestMonitors[reqId] =
                        new iotcs.enterprise.impl.AsyncRequestMonitor(reqId, (response, error) =>
                    {
                        iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(response,
                            selfDevice, attributeNameValuePairs, error);
                    }, self._device._enterpriseClient._activeEnterpriseClientImpl);
                    self._requestMonitors[reqId]._start();
                } catch (e) {
                    iotcs.enterprise.impl.Controller._attributeUpdateResponseProcessor(null,
                        selfDevice, attributeNameValuePairs,
                        iotcs.createError('Invalid response on update async request: ', e));
                }
            }, () => {
                self._updateAttributes(attributeNameValuePairs, singleAttribute);
            }, self._device._enterpriseClient._activeEnterpriseClientImpl);
        });
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Pageable.js
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



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/MessageEnumerator.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

//TODO: jsdoc issue: MessageEnumerator appears in iotcs.* and not at index level (probably due to
//      missing class jsdoc on iotcs.enterprise.MessageEnumerator) @DONE
//TODO: move default value pageSize to iotcs.oracle.iot.... global @DONE
//TODO: move default value messageListenMaxSize to iotcs.oracle.iot.... global @DONE: changed name
//      also

/**
 * A class that implements a way of getting the history of all messages from the cloud and also
 * register listeners to the messages received.
 *
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        application context of the messages that need to be enumerated or listened to.
 *
 * @alias iotcs.enterprise.MessageEnumerator
 * @class iotcs.enterprise.MessageEnumerator
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.MessageEnumerator = class {
    // Static private/protected functions
    /**ignore*/
    static _addMessageMonitor(enumerator, messageType) {
        if (messageType === enumerator._message._allKey) {
            enumerator._message._types.forEach(type => {
                if (!enumerator._message._monitors[type]) {
                    enumerator._message._monitors[type] = new iotcs.impl.Monitor(() => {
                        iotcs.enterprise._messagesMonitor(enumerator, type);
                    });
                }
                if (enumerator._message._monitors[type] &&
                    !enumerator._message._monitors[type]._running)
                {
                    enumerator._message._lastTime[type] = Date.now();
                    enumerator._message._inProgress[type] = false;
                    enumerator._message._monitors[type]._start();
                }
            });
        } else {
            if (!enumerator._message._monitors[messageType]) {
                enumerator._message._monitors[messageType] = new iotcs.impl.Monitor(() => {
                    iotcs.enterprise._messagesMonitor(enumerator, messageType);
                });
            }
            if (enumerator._message._monitors[messageType] &&
                !enumerator._message._monitors[messageType]._running)
            {
                enumerator._message._lastTime[messageType] = Date.now();
                enumerator._message._inProgress[messageType] = false;
                enumerator._message._monitors[messageType]._start();
            }
        }
    }

    /**ignore*/
    static _handleMessagesResponse(enumerator, response, messageType) {
        if (response &&
            response.items &&
            Array.isArray(response.items) &&
            (response.items.length > 0))
        {
            for (var i = 0; i < response.items.length; i++ ){
                if (response.items[i].receivedTime &&
                    (response.items[i].receivedTime === enumerator._message._lastTime[messageType]))
                {
                    continue;
                }

                var key2 = response.items[i].source;
                var key1 = response.items[i].type;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = enumerator._message._allKey;
                key1 = response.items[i].type;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = response.items[i].source;
                key1 = enumerator._message.allKey;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }

                key2 = enumerator._message._allKey;
                key1 = enumerator._message._allKey;

                if (enumerator._message._callbacks[key1] &&
                    enumerator._message._callbacks[key1][key2])
                {
                    enumerator._message._callbacks[key1][key2]([response.items[i]]);
                }
            }

            if (!response.hasMore) {
                if ((response.items.length > 0) &&
                    response.items[response.items.length-1].receivedTime)
                {
                    enumerator._message._lastTime[messageType] =
                        response.items[response.items.length - 1].receivedTime;
                } else {
                    enumerator._message._lastTime[messageType] =
                        enumerator._message._lastTime[messageType] + 1;
                }
            }
        }
    }

    /**ignore*/
    static _messagesMonitor(enumerator, messageType) {
        if (enumerator._message._inProgress[messageType]) {
            return;
        }

        enumerator._message._inProgress[messageType] = true;

        var pageable = enumerator.getMessages(null, messageType, false,
                                              enumerator._message._lastTime[messageType], null);
        var hasMore = false;

        pageable.page('first', enumerator._message._maxLimit).then(response => {
            iotcs.enterprise.MessageEnumerator._handleMessagesResponse(enumerator, response,
                                                                       messageType);
            hasMore = response.hasMore;

            var nextCheck = () => {
                pageable.page('next').then(response => {
                    iotcs.enterprise.MessageEnumerator._handleMessagesResponse(enumerator, response,
                                                                               messageType);
                    hasMore = response.hasMore;

                    if (hasMore) {
                        nextCheck();
                    } else {
                        enumerator._message._inProgress[messageType] = false;
                    }
                }, error => {
                    iotcs.createError('Invalid response on message monitoring.');
                });
            };

            if (hasMore) {
                nextCheck();
            } else {
                enumerator._message._inProgress[messageType] = false;
            }
        }, error => {
            iotcs.createError('Invalid response on message monitoring.');
        });
    }

    /**ignore*/
    static _removeMessageMonitor(enumerator, messageType) {
        if (messageType === enumerator._message._allKey) {
            enumerator._message._types.forEach(type => {
                if (enumerator._message._monitors[type]
                    && enumerator._message._monitors[type]._running
                    && !(type in enumerator._message._callbacks)) {
                    enumerator._message._monitors[type]._stop();
                }
            });
        } else {
            if (enumerator._message._monitors[messageType]
                && enumerator._message._monitors[messageType]._running
                && !(messageType in enumerator._message._callbacks)) {
                enumerator._message._monitors[messageType]._stop();
            }
        }
    }

    constructor(client) {
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);

        this._client = client;

        this._message = {
            _allKey: 'ALL',
            _callbacks: {},
            _inProgress: {},
            _lastTime: {},
            _maxLimit: 1000,
            _monitors: {},
            _types: ['DATA', 'ALERT', 'REQUEST', 'RESPONSE', 'WAKEUP', 'UPDATE_BUNDLE',
                     'RESOURCES_REPORT']
        };
    }


    // Public functions
    //@TODO: (jy) check why model is param,paramValue
    /**
     * Return a list of messages according to the given parameters.  The method will generate a query
     * and make a request to the cloud and a list of messages will be returned based on the query in
     * descendant order of arrival of the messages to the cloud.
     * <p>
     * The query for messages must be made based on one of the following criteria or both:
     * <br>
     * - "device": messages from a specific device<br>
     * - "type": messages of a given type<br>
     *
     * @function getMessages
     * @memberof iotcs.enterprise.MessageEnumerator
     *
     * @param {?string} [deviceId] - The ID of the device as the source of the messages from the
     *        enumerator. If this is <code>null</code> the messages for all devices will be enumerated.
     * @param {?string} [messageType] - The type of the messages to be enumerated.  If this is
     *        <code>null</code> then messages of all types will be enumerated.  The only types are:
     *        ['DATA', 'ALERT', 'REQUEST', 'RESPONSE', 'WAKEUP', 'UPDATE_BUNDLE', 'RESOURCES_REPORT'].
     * @param {?boolean} [expand] - A flag that would say if the messages in the response contains
     *        expanded data. If this is not present the value is false.
     * @param {?number} [since] - The timestamp in milliseconds since EPOC that would represent that
     *        minimum time when the messages were received.
     * @param {?number} [until] - The timestamp in milliseconds since EPOC that would represent that
     *        maximum time when the messages were received.
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain messages as items.
     */
    getMessages(deviceId, messageType, expand, since, until) {
        _optionalArg(deviceId, 'string');
        _optionalArg(messageType, 'string');
        _optionalArg(expand, 'boolean');
        _optionalArg(since, 'number');
        _optionalArg(until, 'number');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        var separator = '&';
        var query = '?orderBy=eventTime:asc';

        if (deviceId) {
            query = query + separator + 'device=' + deviceId;
        }

        if (messageType) {
            query = query + separator + 'type=' + messageType;
        }

        if (expand) {
            query = query + separator + 'expand=true';
        }

        if (since) {
            query = query + separator + 'since=' + since;
        }

        if (until) {
            query = query + separator + 'until=' + until;
        }

        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path:   iotcs.impl._reqRoot +
                '/apps/' + this._client._appid +
                '/messages' +
                query
        }, '', null, this._client);
    }

    /**
     * Registers a callback method to be called when new messages of a given type and/or for a given
     * device are received.
     *
     * @function setListener
     * @memberof iotcs.enterprise.MessageEnumerator
     * @see {@link iotcs.enterprise.MessageEnumerator#getMessages}
     *
     * @param {string} [deviceId] - The ID of the device for which the callback is called when new
     *        messages arrives. If this is null the callback will be called when messages for any device
     *        arrives.
     * @param {string} [messageType] - The type of the messages that the listener listens to.  The types
     *        are described in the getMessages method. If this is <code>null</code> the callback will be
     *        called for all message types.
     * @param {function} callback - The callback function that will be called when a new message from
     *        the associated device is received.
     */
    setListener(deviceId, messageType, callback) {
        if (deviceId && (typeof deviceId === 'function')) {
            callback = deviceId;
            deviceId = null;
        } else if (messageType && (typeof messageType === 'function')) {
            callback = messageType;
            messageType = null;
        }

        _optionalArg(messageType, 'string');
        _optionalArg(deviceId, 'string');
        _mandatoryArg(callback, 'function');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        if (!deviceId) {
            deviceId = this._message._allKey;
        }

        if (!messageType) {
            messageType = this._message._allKey;
        }

        if (!this._message._callbacks[messageType]) {
            this._message._callbacks[messageType] = {};
        }
        this._message._callbacks[messageType][deviceId] = callback;
        this._addMessageMonitor(this, messageType);
    }

    /**
     * The library will no longer monitor messages for the specified device and/or message type.
     *
     * @function unsetListener
     * @memberof iotcs.enterprise.MessageEnumerator
     * @see {@link iotcs.enterprise.MessageEnumerator#getMessages}
     *
     * @param {string} [deviceId] - The ID of the device for which the monitoring of messages will be
     *        stopped.
     * @param {string} [messageType] - The type of messages for which the monitoring will be stopped.
     *        The types are described in the getMessages method.
     */
    unsetListener(deviceId, messageType) {
        _optionalArg(deviceId, 'string');
        _optionalArg(messageType, 'string');

        if (messageType && this._message._types.indexOf(messageType) === -1) {
            iotcs.error('Invalid parameter.');
            return;
        }

        if (!deviceId) {
            deviceId = this._message._allKey;
        }

        if (!messageType) {
            messageType = this._message._allKey;
        }

        if (messageType in this._message._callbacks) {
            if (deviceId in this._message._callbacks[messageType]) {
                delete this._message._callbacks[messageType][deviceId];
            }
            if (Object.keys(this._message._callbacks[messageType]).length === 0) {
                delete this._message._callbacks[messageType];
                this._removeMessageMonitor(this, messageType);
            }
        }
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/ResourceEnumerator.js
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
 * A class that implements a way of getting the custom resources registered by a device and the
 * possibility of invoking them (V1 implementation).
 *
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        application context of the device for which the resources need to be enumerated.
 * @param {string} deviceId - The ID for which the resources are to be enumerated/invoked.
 *
 * @alias iotcs.enterprise.ResourceEnumerator
 * @class iotcs.enterprise.ResourceEnumerator
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.ResourceEnumerator = class {
    constructor(client, deviceId) {
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);
        _mandatoryArg(deviceId, 'string');

        this._client = client;
        this._deviceId = deviceId;
        this._asyncReqMonitors = {};
    }

    // Public functions
    /**
     * Closes the enumerator and will stop any pending resource invocations.
     *
     * @function close
     * @memberof iotcs.enterprise.ResourceEnumerator
     */
    close() {
        for(let key in this._asyncReqMonitors) {
            this._asyncReqMonitors[key].stop();
        }

        this._asyncReqMonitors = {};
        this._deviceId = null;
    }

    /**
     * Return the list of resources that the device associated with the enumerator has registered in the
     * cloud.
     *
     * @memberof iotcs.enterprise.ResourceEnumerator
     * @function getResources
     *
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain resources as items.
     */
    getResources() {
        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path: iotcs.impl._reqRoot +
                '/apps/' + this._client._appid +
                '/devices/' + this._deviceId +
                '/resources'
        }, '', null, this._client);
    }

    /**
     * Invokes the specified resource with defined options, query and payload.
     * <p>
     * Resources can be retrieved by using the getResources method and from the items property of the
     * response the resource objects can be extracted.
     *
     * A resource object must have the following properties:<br>
     * - methods: An array of methods the resource accepts.<br>
     * - endpointId: The device ID.<br>
     * - the self link: This the link that the resource can be accessed with present in the links
     *   array property.
     *
     * @function invokeResource
     * @memberof iotcs.enterprise.ResourceEnumerator
     * @see {@link iotcs.enterprise.ResourceEnumerator#getResources}
     *
     * @param {object} resource -The resource to be invoked as described.
     * @param {{method:string, headers:object}} options - The request options.  The headers are
     *        optional and method is mandatory.
     * @param {object} [query] - The query for the request as JSON object.
     * @param {string} [body] - The payload for the request.
     * @param {function} callback - The callback function that is called when a response arrives.
     *        The *        whole HTTP response as JSON object is given as parameter to the callback
     *        function.  If an error occurs or the response is invalid the error object is passed as
     *        the second parameter in the callback with the reason in error.message:
     *        callback(response, error).
     */
    invokeResource(resource, options, query, body, callback) {
        if (query && (typeof query === 'function')) {
            callback = query;
            query = null;
        }

        if (body && (typeof body === 'function')) {
            callback = body;
            body = null;
        }

        _mandatoryArg(resource, 'object');
        _mandatoryArg(resource.methods, 'array');
        _mandatoryArg(resource.endpointId, 'string');
        _mandatoryArg(resource.links, 'array');
        _mandatoryArg(options, 'object');
        _mandatoryArg(options.method, 'string');
        _optionalArg(options.headers, 'object');
        _optionalArg(query, 'object');
        _optionalArg(body, 'string');
        _mandatoryArg(callback, 'function');

        if (resource.endpointId !== this.deviceId){
            iotcs.error('Invalid resource.');
            return;
        }

        let path = null;

        resource.links.forEach(link => {
            if (link.rel && link.href && (link.rel === 'self')){
                path = link.href;
            }
        });

        if (!path) {
            iotcs.error('Invalid resource.');
            return;
        }

        let method = null;

        resource.methods.forEach(m => {
            if (m === options.method){
                method = options.method;
            }
        });

        if (!method) {
            iotcs.error('Invalid options.');
            return;
        }

        path = decodeURI(path + (query ? ('?=' +
            iotcs.impl.Platform.Query._stringify(query)) : ''));
        let opt = {};
        opt.method = method;
        opt.path = path;

        if (options.headers) {
            opt.headers = options.headers;
        }

        let self = this;

        iotcs.impl.Https._bearerReq(opt, (body ? body : null), (response, error) => {
            if (!response || error || !(response.id)) {
                callback(null,
                    iotcs.createError('Invalid response on async request for resource invocation',
                                      error));
                return;
            }

            let reqId = response.id;

            try {
                self._asyncReqMonitors[reqId] = new iotcs.enterprise.impl.AsyncRequestMonitor(reqId,
                    (response, error)  =>
                    {

                    if (!response || error) {
                        callback(null, iotcs.createError('Invalid response on resource invocation.',
                                                         error));
                        return;
                    }

                    Object.freeze(response);
                    callback(response);
                        // DJM: Is this reference right?
                }, self._client._.internalClient);
                self._asyncReqMonitors[reqId]._start();
            } catch (e) {
                callback(null,
                         iotcs.createError('Invalid response on async request for resource invocation.',
                                           e));
            }
        }, () => {
            self._invokeResource(resource, options, query, body, callback);
            // DJM: Is this reference right?
        }, self._client._.internalClient);
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/DeviceAppEnumerator.js
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


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/EnterpriseClientImpl.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/** @ignore */
iotcs.enterprise.impl.EnterpriseClientImpl = class {
    // Static private/protected functions
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

    constructor(taStoreFile, taStorePassword) {
        this._tam = new iotcs.enterprise.TrustedAssetsManager(taStoreFile, taStorePassword);
        this._bearer = "";
        this._refreshing = false;
        /**
         * The storage authentication REST URL.
         *
         * @type {string}
         */
        this._restStorageAuthentication = new RestApi('v2').getReqRoot() + "/provisioner/storage";
        this._storageAuthenticationData = null;
        this._storageObjectName = null;
        this._storageRefreshing = false;
    }

    // Private/protected functions
    _getCurrentServerTime() {
        if (typeof this._serverDelay === 'undefined') {
            return Date.now();
        } else {
            return (Date.now() + this._serverDelay);
        }
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
    _isPathClassicObjectStore (path) {
        if (path.startsWith("/v1/")) {
            return true;
        }

        if (!path.startsWith("/n/")) {
            throw new Error("path does not start with expected tokens.");
        }

        return false;
    }

    _refreshBearer(callback) {
        this._refreshing = true;
        let id = this._tam.getClientId();
        let exp = parseInt((this._getCurrentServerTime() + 900000)/1000);

        let header = {
            typ: 'JWT',
            alg: 'HS256'
        };

        let claims = {
            iss: id,
            sub: id,
            aud: 'oracle/iot/oauth2/token',
            exp: exp
        };

        let inputToSign =
            iotcs.impl.Platform.Util._btoa(JSON.stringify(header))
            + '.'
            + iotcs.impl.Platform.Util._btoa(JSON.stringify(claims));

        let signed;

        try {
            let digest = this._tam.signWithSharedSecret(inputToSign, "sha256");
            signed = forge.util.encode64(forge.util.hexToBytes(digest.toHex()));
        } catch (e) {
            this._refreshing = false;
            let error1 = iotcs.createError('Error on generating oauth signature: ', e);

            if (callback) {
                callback(error1);
            }

            return;
        }

        inputToSign = inputToSign + '.' + signed;
        inputToSign = inputToSign.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');

        let dataObject = {
            grant_type: 'client_credentials',
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: inputToSign,
            scope: ''
        };

        let payload = iotcs.impl.Platform.Query._stringify(dataObject, null, null,
            {encodeURIComponent: iotcs.impl.Platform.Query._unescape});

        payload = payload.replace(new RegExp(':', 'g'),'%3A');

        let options = {
            path: iotcs.impl._reqRoot.replace('webapi','api') + '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            tam: this._tam
        };

        let self = this;

        iotcs.impl.Https._req(options, payload, (responseBody, error) => {
            // DJM: Can this be used here?
            self._refreshing = false;

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
                            (exception.statusCode === iotcs.StatusCode.BAD_REQUEST) &&
                            (exception.body))
                        {
                            let body = JSON.parse(exception.body);

                            if ((body.currentTime) &&
                                (typeof self._serverDelay === 'undefined') &&
                                (now < parseInt(body.currentTime)))
                            {
                                self._serverDelay = (parseInt(body.currentTime) - now);
                                self._refreshBearer(callback);
                                return;
                            }
                        }
                    } catch (e) {
                        // Do nothing.
                    }
                }

                if (callback) {
                    callback(error);
                }

                return;
            }

            self._bearer = (responseBody.token_type + ' ' + responseBody.access_token);

            if (callback) {
                callback();
            }

        });
    }

    _refreshClassicStorageAuthToken(callback) {
        //TODO: If the storage auth token is not null and it's not expired, simply return.
        this._storageRefreshing = true;

        let options = {
            path: this._restStorageAuthentication,
            method: 'GET',
            headers: {
                'Authorization': this._bearer,
                'X-EndpointId': this._tam.getClientId()
            },
            tam: this._tam
        };

        let self = this;

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

            // DJM: Can this be used here instead of self?
            self._storageAuthToken = response.authToken;
            self._storageContainerUrl = response.storageContainerUrl;
            self._storageAuthTokenStartTime = Date.now();

            if (callback) {
                callback();
            }
        };

        iotcs.impl.Https._req(options, "", refreshFunction, () => {
            self._refreshClassicStorageAuthToken(callback);
        }, self);
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
        let url = iotcs.impl.Platform._createUrl(storageObject.getURI());

        if (this._isPathClassicObjectStore(url.path)) {
            this._refreshClassicStorageAuthToken(callback);
            return;
        } else {
            let payload =
                iotcs.enterprise.impl.EnterpriseClientImpl._createAuthenticationRequestBody(storageObject.getName(),
                                                                                            "PUT");

            let options = {
                agent: false,
                headers: {
                    'Authorization': this._bearer,
                    'X-EndpointId': this._tam.getClientId()
                },
                method: 'POST',
                path: this.restStorageAuthentication,
                rejectUnauthorized: true,
                tam: this._tam
            };

            let self = this;

            iotcs.impl.Platform.Https._req(options, payload, (response, error) => {
                iotcs.impl.Platform._debug();

                if (error) {
                    iotcs.impl.Platform._debug("Error: " + error);
                    let httpStatus = JSON.parse(error.message);

                    if ((httpStatus.statusCode === iotcs.StatusCode.PRECOND_FAILED) ||
                        (httpStatus.statusCode === iotcs.StatusCode.BAD_METHOD))
                    {
                        // These status codes indicate we're using classic storage, so switch to
                        // using classic.
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
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/EnterpriseClient.js
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
 * @classdesc
 * EnterpriseClient is a enterprise application which is a client of the Oracle IoT Cloud Service.
 * <p>
 * This function is meant to be used for constructing EnterpriseClient objects only when the actual
 * ID of the application associated with the object is known.  An actual validation of the
 * application ID with the cloud is not made at construction and if the application ID is incorrect,
 * a NOT FOUND error from the cloud will be given when the object is actually used (e.g. when
 * calling {@link iotcs.enterprise.EnterpriseClient#getDevices}).
 * <p>
 * If the actual application ID is not known is is better to use the
 * {@link iotcs.enterprise.EnterpriseClient#newClient} method for creating EnterpriseClient objects,
 * an asynchronous method that will first make a request at the cloud server for validation and
 * then pass in the callback the validated object.  This will ensure that no NOT FOUND error is
 * given at first usage of the object.
 *
 * @param {string} appid - The application identifier as it is in the cloud.  This is the actual
 *        application ID generated by the server when creating a new application from the cloud UI.
 *        It is different than the integration ID or application mane.
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.  This is used only in the context of endpoint
 *        authentication.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given, the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.  This is used only in the context of
 *        endpoint authentication.
 *
 * @alias iotcs.enterprise.EnterpriseClient
 * @class iotcs.enterprise.EnterpriseClient
 * @extends iotcs.Client
 * @memberof iotcs.enterprise
 * @see {@link iotcs.enterprise.EnterpriseClient.newClient}
 */
iotcs.enterprise.EnterpriseClient = class extends iotcs.Client {
    // Static private/protected functions
    /** @ignore */
    static _deviceMonitorInitialization(virtualDevice) {
        let deviceId = virtualDevice.getEndpointId();
        let urn = virtualDevice.getDeviceModel().urn;
        let postData = {};
        postData[deviceId] = [urn];

        if (!virtualDevice._enterpriseClient._lastUntil) {
            virtualDevice._enterpriseClient._lastUntil =
                Date.now() - iotcs.oracle.iot.client.monitor.pollingInterval;
        }

        iotcs.impl.Https._bearerReq({
            method: 'POST',
            path:   iotcs.impl._reqRoot +
                (virtualDevice._enterpriseClient._appid ?
                    ('/apps/' + virtualDevice._enterpriseClient._appid) : '') +
                '/devices/data' +
                '?formatLimit=' + iotcs.oracle.iot.client.monitor.formatLimit +
                '&formatSince=' + virtualDevice._enterpriseClient._lastUntil
        }, JSON.stringify(postData), (response, error) => {
            if (!response ||
                error ||
                !response.data ||
                !response.until ||
                !(deviceId in response.data) ||
                !(urn in response.data[deviceId]))
            {
                if (error) {
                    iotcs.createError('Error on device initialization data.');
                }
            } else {
                virtualDevice._enterpriseClient._lastUntil = response.until;
                iotcs.enterprise.EnterpriseClient._processMonitorData(response.data, virtualDevice);
            }

            virtualDevice._enterpriseClient._addVirtualDevice(virtualDevice);

        }, () => {
            iotcs.enterprise.EnterpriseClient._deviceMonitorInitialization(virtualDevice);
        }, virtualDevice._enterpriseClient._activeEnterpriseClientImpl);
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

    /** @ignore */
    static _processMonitorData(data, virtualDevice) {
        let deviceId = virtualDevice.getEndpointId();
        let urn = virtualDevice.getDeviceModel().urn;
        let onChangeArray = [];

        if (data[deviceId] && data[deviceId][urn] && data[deviceId][urn].attributes) {
            let attributesIndex = 0;
            let attributes = data[deviceId][urn].attributes;
            let attribute;
            let oldValue;

            let attributeCallback = attributeValue => {
                let isEqual = false;

                if ((attributeValue instanceof Date) && (oldValue instanceof Date)) {
                    isEqual = attributeValue.getTime() === oldValue.getTime();
                } else {
                    isEqual = attributeValue === oldValue;
                }

                if (!isEqual) {
                    let onChangeTuple = {
                        attribute: attribute,
                        newValue: attributeValue,
                        oldValue: oldValue
                    };

                    if (attribute._onChange) {
                        attribute._onChange(onChangeTuple);
                    }

                    attribute._remoteUpdate(attributeValue);

                    if (virtualDevice._onChange) {
                        let onChangeTupleArray = [];
                        onChangeTupleArray.push(onChangeTuple);
                        virtualDevice._onChange(onChangeTupleArray);
                    }
                }
            };

            for (let attributeName in attributes) {
                attribute = virtualDevice[attributeName];

                if (!attribute) {
                    iotcs.createError('Device model attribute mismatch on monitoring.');
                    return;
                }

                oldValue = attribute._value;

                if (!attribute._isValidValue(attributes[attributeName])) {
                    continue;
                }

                attribute._getNewValue(attributes[attributeName], virtualDevice, attributeCallback);
            }
        }

        if (data[deviceId] && data[deviceId][urn] && data[deviceId][urn].formats) {
            let formats = data[deviceId][urn].formats;
            let alerts = {};
            let dataFormats = {};
            let formatsIndex = 0;
            let obj;

            let formatsUpdateCallback = () => {
                if (obj.onAlerts) {
                    alerts[formatUrn] = formats[formatUrn];
                    obj.onAlerts(formats[formatUrn]);
                } else if (obj.onData) {
                    dataFormats[formatUrn] = formats[formatUrn];
                    obj.onData(formats[formatUrn]);
                }

                if (++formatsIndex === Object.keys(formats).length) {
                    // Run after last format handle.
                    if (virtualDevice.onAlerts && (Object.keys(alerts).length > 0)) {
                        virtualDevice.onAlerts(alerts);
                    }

                    if (virtualDevice.onData && (Object.keys(dataFormats).length > 0)) {
                        virtualDevice.onData(dataFormats);
                    }
                }
            };

            for (let formatUrn in formats) {
                obj = virtualDevice[formatUrn];
                if (!obj) {
                    iotcs.createError('Device model alert/data format mismatch on monitoring.');
                    return;
                }

                obj._formatsLocalUpdate(formats[formatUrn], virtualDevice, formatsUpdateCallback);
            }
        }
    }

    /** @ignore */
    static _remoteBulkMonitor(enterpriseClient) {
        if (enterpriseClient._bulkMonitorInProgress) {
            return;
        }

        enterpriseClient._bulkMonitorInProgress = true;

        if (!enterpriseClient._virtualDevices) {
            enterpriseClient._bulkMonitorInProgress = false;
            return;
        }

        let devices = enterpriseClient._virtualDevices;
        let postData = {};

        for (let devId in devices) {
            let deviceModels = devices[devId];
            postData[devId] = [];

            for (let urn in deviceModels) {
                postData[devId].push(urn);
            }
        }

        if (Object.keys(postData).length > 0) {
            iotcs.impl.Https._bearerReq({
                method: 'POST',
                path: iotcs.impl._reqRoot +
                    (enterpriseClient._appid ? ('/apps/' + enterpriseClient._appid) : '') +
                    '/devices/data' +
                    '?since=' + enterpriseClient._lastUntil +
                    '&formatLimit=' + iotcs.oracle.iot.client.monitor.formatLimit
            }, JSON.stringify(postData), (response, error) => {
                enterpriseClient._bulkMonitorInProgress = false;

                if (!response || error || !response.until || !response.data) {
                    iotcs.createError('Invalid response on monitoring.');
                    return;
                }

                enterpriseClient._lastUntil = response.until;
                let data = response.data;

                for (let devId in data) {
                    for (let urn in data[devId]){
                        if (devices[devId] && devices[devId][urn]) {
                            iotcs.enterprise.EnterpriseClient._processMonitorData(data,
                                devices[devId][urn]);
                        }
                    }
                }
            }, () => {
                iotcs.enterprise.EnterpriseClient._remoteBulkMonitor(enterpriseClient);
            }, enterpriseClient._activeEnterpriseClientImpl);
        } else {
            enterpriseClient._bulkMonitorInProgress = false;
        }
    }

    // Static public functions
    /**
     * Get the all the applications that the user has access to.
     *
     * @returns {iotcs.enterprise.Pageable} A pageable instance with
     * which pages can be requested that contain application info
     * objects as items
     *
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function getApplications
     */
    static getApplications() {
        if (!iotcs.impl.Platform._userAuthNeeded()) {
            iotcs.error('Invalid usage.  User authentication framework needed.');
            return null;
        }

        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/apps'
        }, '', null, null);
    }

    /**
     * Creates an enterprise client based on the application name.
     *
     * @function newClient
     * @memberof iotcs.enterprise.EnterpriseClient
     * @see {@link iotcs.enterprise.EnterpriseClient}
     *
     * @param {string} appName - The application name as it is on the cloud server.
     * @param {function} callback - The callback function.  This function is called with an object as
     *        parameter that is a created and initialized instance of an EnterpriseClient with the
     *        application endpoint id associated with the application name given as parameter.  If the
     *        client creation fails the client object will be <code>null</code> and an error object is
     *        passed as the second parameter in the callback: callback(client, error) where the reason
     *        is in error.message.
     * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
     *        manager creation.  This is optional.  If none is given the default global library
     *        parameter is used: iotcs.oracle.iot.tam.store.  Also this is used only in the context of
     *        endpoint authentication.
     * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
     *        assets manager creation.  This is optional.  If none is given the default global library
     *        parameter is used: iotcs.oracle.iot.tam.storePassword.  Also this is used only in the
     *        context of endpoint authentication.
     */
    static newClient(appName, callback, taStoreFile, taStorePassword) {
        switch (arguments.length) {
        case 0:
            break;
        case 1:
            callback = appName;
            break;
        case 2:
            _mandatoryArg(appName, 'string');
            break;
        case 3:
            callback = arguments[0];
            taStoreFile = arguments[1];
            taStorePassword = arguments[2];
            appName = null;
            break;
        }

        _mandatoryArg(callback, 'function');
        _optionalArg(taStoreFile, 'string');
        _optionalArg(taStorePassword, 'string');

        let enterpriseClient = null;
        let f = null;

        if (!iotcs.impl.Platform._userAuthNeeded()) {
            enterpriseClient = new iotcs.enterprise.EnterpriseClient('none', taStoreFile,
                                                                     taStorePassword);
        }

        if (enterpriseClient && enterpriseClient._activeEnterpriseClientImpl._tam.getClientId()) {
            f = (new iotcs.enterprise.Filter()).eq('integrations.id',
                enterpriseClient._activeEnterpriseClientImpl._tam.getClientId());
        } else {
            f = (new iotcs.enterprise.Filter()).eq('name', appName);
        }

        let request = null;

        request = () => {
            iotcs.impl.Https._bearerReq({
                method: 'GET',
                path: iotcs.impl._reqRoot + '/apps' + (f ? ('?q=' + f.toString()) : '')
            }, '', (response, error) => {
                if (!response ||
                    error ||
                    !response.items ||
                    !Array.isArray(response.items) ||
                    (response.items.length !== 1) ||
                    !response.items[0].id)
                {
                    if (typeof callback === 'function')
                        callback(null, iotcs.createError('Invalid response on client creation request: ',
                                                         error));
                    return;
                }

                try {
                    if (appName && (response.items[0].name !== appName)) {
                        if (typeof callback === 'function')
                            callback(null, iotcs.createError('Application name does not match the name parameter.'));
                        return;
                    }

                    if (enterpriseClient) {
                        enterpriseClient.close();
                    }

                    enterpriseClient = new iotcs.enterprise.EnterpriseClient(response.items[0].id,
                                                                             taStoreFile,
                                                                             taStorePassword);
                    if (typeof callback === 'function') {
                        callback(enterpriseClient);
                    }
                } catch (e) {
                    if (typeof callback === 'function')
                        callback(null, iotcs.createError('Invalid response on client creation request: ',
                                                         e));
                }
            }, request, (enterpriseClient ? enterpriseClient._activeEnterpriseClientImpl : null));
        };

        request();
    }

    constructor(appid, taStoreFile, taStorePassword) {
        _mandatoryArg(appid, 'string');
        _optionalArg(taStoreFile, 'string');
        _optionalArg(taStorePassword, 'string');
        super();


        if (appid.indexOf('/') > -1){
            iotcs.error('Invalid app id parameter given.');
            return;
        }

        this._cache = this._cache || {};
        // this._cache.deviceModels is a JSON object.
        this._appid = appid;
        this._bulkMonitorInProgress = false;
        this._lastUntil = null;
        this._virtualDevices = {};

        if (!iotcs.impl.Platform._userAuthNeeded()) {
            this._enterpriseClientImpl =
                new iotcs.enterprise.impl.EnterpriseClientImpl(taStoreFile, taStorePassword);

            if (this._enterpriseClientImpl &&
                this._enterpriseClientImpl._tam &&
                this._enterpriseClientImpl._tam.getClientId())
            {
                this._activeEnterpriseClientImpl = this._enterpriseClientImpl;
            }

            let self = this;

            let storageHandler = (storDisProgress, error) => {
                let storageObject = storDisProgress.getStorageObject();

                if (error) {
                    if (storageObject._deviceForSync && storageObject._deviceForSync.onError) {
                        let tryValues = {};
                        tryValues[storageObject._nameForSyncEvent] = storageObject.getURI();

                        let onDeviceErrorTuple = {
                            newValues: tryValues,
                            tryValues: tryValues,
                            errorResponse: error
                        };

                        storageObject._deviceForSync.onError(onDeviceErrorTuple);
                    }

                    return;
                }

                if (storageObject) {
                    let state = storDisProgress.getState();
                    let oldSyncStatus = storageObject._getSyncStatus();

                    switch (state) {
                    case iotcs.StorageDispatcher.Progress.State.COMPLETED:
                        storageObject._syncStatus =
                            iotcs.enterprise.StorageObject.SyncStatus.IN_SYNC;
                        break;
                    case iotcs.StorageDispatcher.Progress.State.CANCELLED:
                    case iotcs.StorageDispatcher.Progress.State.FAILED:
                        storage._syncStatus =
                            iotcs.enterprise.StorageObject.SyncStatus.SYNC_FAILED;
                        break;
                    case iotcs.StorageDispatcher.Progress.State.IN_PROGRESS:
                    case iotcs.StorageDispatcher.Progress.State.INITIATED:
                    case iotcs.StorageDispatcher.Progress.State.QUEUED:
                        // Do nothing.
                    }

                    if (oldSyncStatus !== storageObject._getSyncStatus()) {
                        if (storageObject._onSync) {
                            let syncEvent;

                            while ((syncEvent = storageObject._syncEvents._pop()) !== null) {
                                storageObject._onSync(syncEvent);
                            }
                        }
                    }
                }
            };

            new iotcs.enterprise.impl.StorageDispatcher(this).onProgress = storageHandler;
        }

        let self = this;

        this._monitor = new iotcs.impl.Monitor(() => {
            iotcs.enterprise.EnterpriseClient._remoteBulkMonitor(self);
        });

        this._monitor._start();
    }

    // Private/protected functions
    _addVirtualDevice(device) {
        this._removeVirtualDevice(device);

        if (!this._virtualDevices[device.getEndpointId()]) {
            this._virtualDevices[device.getEndpointId()] = {};
        }

        this._virtualDevices[device.getEndpointId()][device.getDeviceModel().urn] = device;
    }

       /**
        * Create a new StorageObject.  arg1 and arg2 are one of these:
        *
        * arg1 = storage object name, arg2 = storage object type
        * or
        * arg1 = storage object URI, arg2 = create storage object callback
        *
        * @param {string} arg1 - The first argument.
        * @param {string | function} arg2 - The second argument.
        *
        * @ignore
        */
    _createStorageObject(arg1, arg2) {
        _mandatoryArg(arg1, "string");

        if (arg2 === undefined) {
            console.log('Error: In _createStorageObject, arg2 cannot be undefined.');
        }

        if ((typeof arg2 === "string") || (arg2 === null)) {
            // createStorageObject(name, type)
            let useVirtualStorageDirectories =
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);

            // DJMDJM: I think we don't need to set this._enterpriseCllientImpl._storageObjectName here.
            if (useVirtualStorageDirectories &&
                (this._enterpriseClientImpl._tam.getEndpointId() !== null))
            {
                this._enterpriseClientImpl._storageObjectName =
                    this._enterpriseClientImpl.tam.getEndpointId() + "/" + arg1;
            } else {
                this._enterpriseClientImpl._storageObjectName = arg1;
            }

            return new iotcs.StorageObject(undefined, arg1, arg2, undefined, undefined,
                                           undefined);
        } else {
            // createStorageObject(uri, callback)
            _mandatoryArg(arg2, "function");
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
            const name = this._getObjectNameFromUrl(urlObj);
            /** @type {boolean} */
            let isClassicObjectStorage =
                this._enterpriseClientImpl._isPathClassicObjectStore(urlObj.path);
            /** @type {Uint8Array} */
            let authenticationRequestBody = isClassicObjectStorage ? null :
                iotcs.enterprise.impl.EnterpriseClientImpl._createAuthenticationRequestBody(name,
                                                                                            'HEAD');

            var storageObject = new iotcs.StorageObject(storageUrlStr, name);

            this._enterpriseClientImpl._refreshNewStorageAuthToken(storageObject, () => {
                //                        if (!storageUrlStr.startsWith(storageObject._storageAuthenticationData.storageContainerUrl)) {
                //                            callback(null, new Error('Storage container URL does not match.'));
                //                            return;
                //                        }

                let self = this;

                let options = {
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
                        self._.internalClient._.storage_authToken;
                } else {
                    /** @type {object} */
                    let headers = storageObject._storageAuthenticationData.headers;

                    for(let key in headers) {
                        options.headers[key] = headers[key];
                    }
                }

                iotcs.impl.Platform._debug("Request: " + new Date().getTime());
                iotcs.impl.Platform._debug(options.path);
                iotcs.impl.Platform._debug(options);

                let protocol = require('https');

                let req = protocol.request(options, response => {
                    iotcs.impl.Platform._debug();
                    iotcs.impl.Platform._debug("Response: " + response.statusCode + ' ' +
                                               response.statusMessage);
                    iotcs.impl.Platform._debug(response.headers);

                    let body = '';

                    response.on('data', d => {
                        body += d;
                    });

                    response.on('end', () => {
                        if (response.statusCode === iotcs.StatusCode.OK) {
                            let type = response.headers["content-type"];
                            let encoding = response.headers["content-encoding"];
                            let date = new Date(Date.parse(response.headers["last-modified"]));
                            let len = parseInt(response.headers["content-length"]);
                            let storage = new iotcs.StorageObject(storageUrlStr, name, type,
                                                                  encoding, date, len);
                            callback(storage);
                        } else if (response.statusCode === iotcs.StatusCode.UNAUTHORIZED) {
                            this._enterpriseClientImpl._refreshClassicStorageAuthToken(() => {
                                this._createStorageObject(url, callback);
                            });
                        } else {
                            let e = new Error(JSON.stringify({
                                statusCode: response.statusCode,
                                statusMessage: (response.statusMessage ?
                                                response.statusMessage : null),
                                body: body
                            }));

                            callback(null, e);
                        }
                    });
                });

                req.on('abort', error => {
                    callback(nuill, error);
                });

                req.on('error', error => {
                    callback(null, error);
                });

                req.on('timeout', () => {
                    callback(null, new Error('Connection timeout.'));
                });

                req.end();
            });
        }
    }

   get _storageObjectName() {
       return this._enterpriseClientImpl._storageObjectName;
   }

    _isStorageAuthenticated() {
        return this._enterpriseClientImpl._storageAuthenticationData !== null;
    }

    _isStorageTokenExpired() {
        // Period in minutes recalculated in milliseconds.
        return ((this._enterpriseClientImpl._storageAuthenticationData.authTokenStartTime +
                 iotcs.oracle.iot.client.storageTokenPeriod * 60000) < Date.now());
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

    set _storageObjectName(newName) {
        this._enterpriseClientImpl._storageObjectName = newName;
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
        this._enterpriseClientImpl._refreshNewStorageAuthToken(storageObject, () => {
            /** @type {string} */
            let storageUri;

            if (storageObject._storageAuthenticationData) {
                storageUri = storageObject._storageAuthenticationData.storageUrl;
            } else if (storageObject.getURI()) {
                storageUri = storageObject.getURI();
            } else {
                storageObject._setURI(this._enterpriseClientImpl._storageContainerUrl + "/" +
                                      storageObject.getName());
                /** @type {string} */
                storageUri = storageObject.getURI();
            }

            /** @type {URL} */
            let url = iotcs.impl.Platform._createUrl(storageUri);
            /** @type {string} */
            const name = iotcs.enterprise.EnterpriseClient._getObjectNameFromUrl(url);
            /** @type {boolean} */
            const isClassicObjectStorage =
                  this._activeEnterpriseClientImpl_isPathClassicObjectStore(url.path);

            let options = {
                path: url.path,
                headers: {},
                host: url.host,
                hostname: url.hostname,
                port: url.port || iotcs.oracle.iot.client.storageCloudPort,
                protocol: url.protocol.slice(0, -1)
            };

            if (isClassicObjectStorage) {
                options.headers['X-Auth-Token'] = this._activeEnterpriseClientImpl._storageAuthToken;
            } else {
                // Add OCI headers
                let headers = storageObject._storageAuthenticationData.headers;

                for (const key in headers) {
                    if ("(request-target)" !== key) {
                        options.headers[key] = headers[key];
                    }
                }

                /** type {object} */
                let metadata = storageObject.getCustomMetadata();

                if (metadata) {
                    for (const key in metadata) {
                        options.headers['X-Object-Meta-' + key] = metadata[key];
                    }
                }
            }

            if (storageObject.getInputStream()) {
                // Upload file
                /** @type {Uint8Array} */
                storageObject._storageAuthenticationData = isClassicObjectStorage ?  null : 
                    iotcs.enterprise.impl.EnterpriseClientImpl._createAuthenticationRequestBody(name,
                                                                                                "PUT");

                options.method = "PUT";

                if (storageObject.getLength() == -1) {
                    options.headers['Transfer-Encoding'] = "chunked";
                }

                options.headers['Content-Type'] = storageObject.getType();
                // options.headers['Content-Length'] = contentLength;
                var encoding = storageObject.getEncoding();

                if (encoding) {
                    options.headers['Content-Encoding'] = encoding;
                }

                /** type {object} */
                let metadata = storageObject.getCustomMetadata();

                if (metadata) {
                    for (const key in metadata) {
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
                this._enterpriseClientImpl._storageAuthenticationData = isClassicObjectStorage ?  null :
                    iotcs.enterprise.impl.EnterpriseClientImpl._createAuthenticationRequestBody(name,
                                                                                                "GET");

                options.method = "GET";
            }

            let self = this;

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
                            self._enterpriseClientImpl._refreshNewStorageAuthToken(() => {
                                self._syncStorage(storageObject, deliveryCallback, errorCallback,
                                                  processCallback, timeout);
                            });

                            return;
                        }
                    } catch (error2) {
                        // Do nothing.
                    }

                    errorCallback(storageObject, error, -1);
                }
            }, processCallback);
        });
    }

    // Public functions
    /**
     * Closes the resources used by this Client.
     * This will close all the virtual devices
     * created and associated with this enterprise
     * client.
     *
     * @see {@link iotcs.AbstractVirtualDevice#close}
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function close
     */
    close() {
        this._monitor._stop();
        this._cache.deviceModels = {};

        for (let key in this._virtualDevices) {
            for (let key1 in this._virtualDevices[key]) {
                this._virtualDevices[key][key1].close();
            }
        }
    }

    /**
     * Create a new {@link iotcs.enterprise.StorageObject}.
     *
     * <p>
     * The createStorageObject method works in two modes:
     * </p><p>
     * </p><pre>
     * 1. client.createStorageObject(name, type) - Creates a new
     *    {@link iotcs.enterprise.StorageObject} with the given object name and mime&ndash;type.
     *
     *    Parameters:
     *       {string} name - The unique name to be used to reference the content in storage.
     *       {?string} [type] - The mime-type of the content. If <code>type</code> is <code>null</code>
     *                          or <code>undefined</code>, the mime&ndash;type defaults to
     *                          {@link iotcs.StorageObject.MIME_TYPE}.
     *
     *    Returns:
     *       {iotcs.enterprise.StorageObject} A StorageObject.
     *
     * 2. client.createStorageObject(uri, callback) - Creates a new
     *    {@link iotcs.enterprise.StorageObject} from the URL for a named object in storage and
     *    returns it in a callback. Creates a new {@link iotcs.ExternalObject} if using an external
     *    URI.
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
     *
     * @function createStorageObject
     * @memberof iotcs.enterprise.EnterpriseClient
     * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
     */
    createStorageObject(arg1, arg2) {
        _mandatoryArg(arg1, "string");

        if ((typeof arg2 === "string") || (arg2 === undefined) || (arg2 === null)) {
            // createStorageObject(name, type)
            let name = arg1;
            let type = arg2;

            let useVirtualStorageDirectories =
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== null) &&
                (iotcs.oracle.iot.client.disableStorageObjectPrefix !== false);

            // DJMDJM:  Do we need to set this._storageObjectName here?
            if (useVirtualStorageDirectories &&
                (this._enterpriseClientImpl._tam.getEndpointId() !== null))
            {
                this._storageObjectName = this._enterpriseClientImpl._tam.getEndpointId() + "/" + name;
            } else {
                this._enterpriseClientImpl._storageObjectName = name;
            }

            let storage = new iotcs.enterprise.StorageObject(null,
                                                           this._enterpriseClientImpl._storageObjectName,
                                                           type, undefined, undefined, undefined);
            storage._setDevice(self);
            return storage;
        } else {
            // createStorageObject(uri, callback)
            _mandatoryArg(arg2, "function");
            let url = arg1;
            let callback = arg2;

            if (_isStorageCloudURI(url)) {
                this._createStorageObject(url, (storage, error) => {
                    if (error) {
                        callback(null, error);
                        return;
                    }

                    let storageObject = new iotcs.enterprise.StorageObject(storage.getURI(),
                        storage.getName(), storage.getType(), storage.getEncoding(),
                        storage.getDate(), storage.getLength());

                    storageObject._setDevice(self);
                    callback(storageObject);
                });
            } else {
                callback(new iotcs.ExternalObject(url));
            }
        }
    }

    /**
     * Create a VirtualDevice instance with the given device model
     * for the given device identifier. This method creates a new
     * VirtualDevice instance for the given parameters. The client
     * library does not cache previously created VirtualDevice
     * objects.
     * <p>
     * A device model can be obtained by it's afferent URN with the
     * EnterpriseClient if it is registered on the cloud.
     *
     * @param {string} endpointId - The endpoint identifier of the
     * device being modeled.
     * @param {object} deviceModel - The device model object
     * holding the full description of that device model that this
     * device implements.
     * @returns {iotcs.enterprise.VirtualDevice} The newly created virtual device
     *
     * @see {@link iotcs.enterprise.EnterpriseClient#getDeviceModel}
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function createVirtualDevice
     */
    createVirtualDevice(endpointId, deviceModel) {
        _mandatoryArg(endpointId, 'string');
        _mandatoryArg(deviceModel, 'object');
        return new iotcs.enterprise.VirtualDevice(endpointId, deviceModel, this);
    }

    /**
     * Get the list of all active devices implementing the
     * specified device model and application of the client.
     *
     * @param {string} deviceModelUrn - The device model expected.
     * @returns {iotcs.enterprise.Pageable} A pageable instance with
     * which pages can be requested that contain devices as items.
     * A standard device item would have the "id" property that can
     * be used as endpoint id for creating virtual devices.
     *
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function getActiveDevices
     */
    getActiveDevices(deviceModelUrn) {
        _mandatoryArg(deviceModelUrn, 'string');

        let f = new iotcs.enterprise.Filter();

        f = f.and([f.eq('deviceModels.urn', deviceModelUrn),
                   f.eq('connectivityStatus', 'ONLINE'),
                   f.eq('state','ACTIVATED')]);

        return this.getDevices(f, null);
    }


    /**
     * Get the application information that this enterprise client is associated with.
     *
     * @param {function} callback - The callback function. This function is called with the following argument:
     * an appinfo object holding all data and metadata associated to that appid e.g.
     * <code>{ id:"", name:"", description:"", metadata: { key1:"value1", key2:"value2", ... } }</code>.
     * If an error occurs or the response is invalid an error object is passed in callback
     * as the second parameter with the reason in error.message: callback(response, error)
     *
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function getApplication
     */
    getApplication(callback) {
        _mandatoryArg(callback, 'function');

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/apps/' + this._appid
        }, '', (response, error) => {
            if(!response || error || !response.id){
                callback(null, iotcs.createError('Invalid response on application request: ',
                                                 error));
                return;
            }

            let appinfo = response;
            Object.freeze(appinfo);
            callback(appinfo);
        }, () => {
            self.getApplication(callback);
        }, self._activeEnterpriseClientImpl);
    }

    /**@inheritdoc*/
    getDeviceModel(deviceModelUrn, callback) {
        _mandatoryArg(deviceModelUrn, 'string');
        _mandatoryArg(callback, 'function');

        let deviceModel = this._cache.deviceModels[deviceModelUrn];

        if (deviceModel) {
            callback(deviceModel);
            return;
        }

        let f = (new iotcs.enterprise.Filter()).eq('urn', deviceModelUrn);
        let self = this;

        iotcs.impl.Https._bearerReq({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/apps/' + this._appid + '/deviceModels' + '?q=' + f.toString()
        }, '', (response, error) => {
            if ((!response) ||
                error ||
                (!response.items) ||
                (!Array.isArray(response.items)) ||
                (response.items.length !== 1))
            {
                callback(null, iotcs.createError('Invalid response on get device model request: ',
                                                 error));
                return;
            }

            let deviceModel = response.items[0];
            Object.freeze(deviceModel);
            self._cache.deviceModels[deviceModelUrn] = deviceModel;
            callback(deviceModel);
        }, () => {
            self.getDeviceModel(deviceModelUrn, callback);
        }, self._activeEnterpriseClientImpl);
    }

    /**
     * Get the device models associated with the application of
     * this enterprise client.
     *
     * @returns {iotcs.enterprise.Pageable} A pageable instance with
     * which pages can be requested that contain device models
     * associated with the application as items. An item can be used
     * to create VirtualDevices.
     *
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function getDeviceModels
     */
    getDeviceModels() {
        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/apps/' + this._appid + '/deviceModels'
        }, '', null, this);
    }

    /**
     * Return a list of Devices associated with the application of the client.  The returned fields are
     * limited to the fields defined in fields. Filters forms a query.  Only endpoints that satisfy all
     * the statements in filters are returned.
     *
     * @param {iotcs.enterprise.Filter} filter - A filter as generated by the Filter class.
     * @param {string[]} [fields] - Array of fields for the selected endpoint. Can be null.
     * @returns {iotcs.enterprise.Pageable} A pageable instance with which pages can be requested that
     *          contain devices as items
     *
     * @memberof iotcs.enterprise.EnterpriseClient
     * @function getDevices
     */
    getDevices(filter, fields) {
        _mandatoryArg(filter, iotcs.enterprise.Filter);
        _optionalArg(fields, 'array');

        // TODO: Simplify query builder.
        let query = '?q=' + filter.toString();

        if (fields) {
            query += '&fields=' + fields.toString();
        }

        query = query + '&includeDecommissioned=false&expand=location,metadata';

        return new iotcs.enterprise.Pageable({
            method: 'GET',
            path:   iotcs.impl._reqRoot + '/apps/' + this._appid + '/devices' + query
        }, '', null, this);
    }
};



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Filter.js
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
 * Creates a Filter builder object.  This class allows to easily formulate filter queries and
 * convert straight to Json Queries. 
 *
 * @example
 * let f = new iotcs.enterprise.Filter();
 *
 * f = f.and([
 *     f.eq("name","Andrew"),
 *     f.or([f.not(f.in("maritalStatus", ["MARRIED", "SINGLE"])),
 *           f.gte("children.count", 1)]),
 *     f.gt("salary.rank", 3),
 *     f.lte("salary.rank", 7),
 *     f.like("lastName", "G%")
 * ]);
 *
 * iotcs.log(f.stringify());
 * // '{"$and":[{"name":{"$eq":"Andrew"}},{"$or":[{"$not":{"maritalStatus":{"$in":["MARRIED","SINGLE"]}}},{"children.count":{"$gte":1}}]},{"salary.rank":{"$gt":3}},{"salary.rank":{"$lte":7}},{"lastName":{"$like":"G%"}}]}';
 *
 * @alias iotcs.enterprise.Filter
 * @class iotcs.enterprise.Filter
 * @memberOf iotcs.enterprise
 */
iotcs.enterprise.Filter = class {
    // Static private/protected functions
    /** @ignore */
    static _argIsFilter(arg) {
        return (arg instanceof iotcs.enterprise.Filter);
    }

    /** @ignore */
    static _is(parameter, types) {
        let ptype = typeof parameter;

        for(let index = 0; index < types.length; index++) {
            if (types[index] === ptype) {
                return true;
            }
        }

        iotcs.log('Type is "' + ptype + '" but should be [' + types.toString() + '].');
        iotcs.error('Invalid parameter type for "'+parameter+'".');
        return false;
    }

    constructor(query) {
        this._query = query || {};
    }

    // Private/protected functions
    /**
     * @param args {(object[]|...object)}
     * @ignore
     */
    _argsAreFilters(args) {
        if (Array.isArray(args)) {
            // args are []. 
            return args.every(arg => {
                return (arg instanceof iotcs.enterprise.Filter);
            });
        } else {
            // args are varargs.
            for (let i = 0; i < args.length; i++) {
                if (! (args[i] instanceof iotcs.enterprise.Filter)) {
                    return false;
                }
            }

            return true;
        }
    }

    // Public functions
    /**
     * And operator.
     * <p>
     * Checks if all conditions are true.
     * <p>
     * This function takes either an array of iotcs.enterprise.Filter
     * or an indefinit number of iotcs.enterprise.Filter.
     *
     * @param {(iotcs.enterprise.Filter[]|...iotcs.enterprise.Filter)} args - an array
     * or variable length argument list of filters to AND
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function and
     */
    and(args) {
        let filters = null;

        if (Array.isArray(args)) {
            if (!this._argsAreFilters(args)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = args;
        } else {
            if (!this._argsAreFilters(arguments)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = [];

            for (let i = 0; i < arguments.length; i++) {
                filters.push(arguments[i]);
            }
        }

        let query = {"$and":filters};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Equality operator
     * <p>
     * Note that if the value string does contain a <code>%</code>,
     * then this operation is replaced by the
     * {@link iotcs.enterprise.Filter#like like} operation.
     *
     * @param {string} field - the field name
     * @param {(string|number)} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function eq
     */
    eq(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['string', 'number']))
        {
            let query = {};

            if ((typeof value === 'string') && (value.indexOf('%') >= 0)) {
                iotcs.log('$eq value field contains a "%".  Operation replaced into a $like.');
                query[field] = {"$like":value};
            } else {
                query[field] = {"$eq":value};
            }

            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Exists operator.
     * <p>
     * Checks whether the field's value matches the given boolean state.
     *
     * @param {string} field - the field name
     * @param {boolean} state - the boolean to test field against
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function exists
     */
    exists(field, state) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(state, ['boolean']))
        {
            let query = {};
            query[field] = {"$exists":state};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Greater-than operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function gt
     */
    gt(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$gt":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Greater-than-or-equal operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function gte
     */
    gte(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$gte":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Is-in operator.
     * <p>
     * Checks whether the field's value is one of the proposed values.
     *
     * @param {string} field - the field name
     * @param {(string[]|number[])} valuearray - an array of same typed
     * values to test the field against. Values can only be simple
     * types such as numbers or string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function in
     */
    in(field, valuearray) {
        if (iotcs.enterprise.Filter._is(field, ['string']) && Array.isArray(valuearray)) {
            let type = null;

            for (let index in valuearray) {
                let value = valuearray[index];
                if (!type && iotcs.enterprise.Filter._is(value, ['string', 'number'])) {
                    type = typeof value;
                } else if (typeof value !== type) {
                    iotcs.error('Inconsistent value types in $in valuearray.');
                    return null;
                }
            }

            let query = {};
            query[field] = {"$in":valuearray};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Like operator.
     * <p>
     * Checks whether the field's value matches the search query. Use
     * <code>%</code> in the match string as search jocker, e.g.
     * <code>"jo%"</code>.
     * <p>
     * Note that if the match string does not contain any <code>%</code>,
     * then this operation is replaced by the
     * {@link iotcs.enterprise.Filter#eq eq} operation.
     *
     * @param {string} field - the field name
     * @param {string} match - the pattern matching string to test field against
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function like
     */
    like(field, match) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(match, ['string']))
        {
            let query = {};

            if (match.indexOf('%') < 0) {
                iotcs.log('$eq match field does not contains any "%".  Operation replaced into a $eq.');
                query[field] = {"$eq":match};
            } else {
                query[field] = {"$like":match};
            }

            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Less-than operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function lt
     */
    lt(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$lt":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Less-than-or-equal operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function lte
     */
    lte(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$lte":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Not-equal operator
     *
     * @param {string} field - the field name
     * @param {(string|number)} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function ne
     */
    ne(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['string', 'number']))
        {
            let query = {};
            query[field] = {"$ne":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Not operator
     * <p>
     * Checks if the negative condition is true.
     *
     * @param {iotcs.enterprise.Filter} filter - a filter to negate
     * @memberof iotcs.enterprise.Filter
     * @function not
     */
    not(filter) {
        if (!iotcs.enterprise.Filter._argsIsFilter(filter)) {
            iotcs.error('Invalid type.');
            return;
        }

        let query = {"$not":filter};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Or operator.
     * <p>
     * Checks if at least one of the conditions is true.
     * <p>
     * This function takes either an array of iotcs.enterprise.Filter
     * or an indefinit number of iotcs.enterprise.Filter.
     *
     * @param {(iotcs.enterprise.Filter[]|...iotcs.enterprise.Filter)} args - an array
     * or variable length argument list of filters to OR
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function or
     */
    or(args) {
        let filters = null;

        if (Array.isArray(args)) {
            if (!this._argsAreFilters(args)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = args;
        } else {
            if (!this._argsAreFilters(arguments)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = [];

            for (let i = 0; i < arguments.length; i++) {
                filters.push(arguments[i]);
            }
        }

        let query = {"$or":filters};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Converts this filter into a JSON object
     *
     * @function toJSON
     * @memberof iotcs.enterprise.Filter
     */
    toJSON() {
        return this._query;
    }

    /**
     * Returns a string containing a string-ified version of the current filter.
     *
     * @function toString
     * @memberof iotcs.enterprise.Filter
     */
    toString() {
        return JSON.stringify(this._query);
    }

};

/**
 * Alias for toString.
 *
 * @function stringify
 * @memberof iotcs.enterprise.Filter
 */
iotcs.enterprise.Filter.stringify = iotcs.enterprise.Filter.toString;



//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/Message.js
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
 * @private
 */
iotcs.message = iotcs.message || {}; 
/**
 * @ignore
 * @private
 */
iotcs.message.Message = {};

/**
 * Enumeration of message types.
 *
 * @ignore
 * @private
 */
iotcs.message.Message.Type = {
    DATA: 'DATA',
    ALERT: 'ALERT',
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    RESOURCES_REPORT: 'RESOURCES_REPORT'
};

Object.freeze(iotcs.message.Message.Type);


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
// File: ./src/enterprise/Action.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * An Action to be sent to the server. The action is sent by calling the <code>call()</code> method.
 * <p>
 * The <code>set</code> method returns the <code>Action</code> instance to allow the fields of the
 * action to be set in fluent style.
 * @see VirtualDevice#createAction(string)
 *
 * @alias iotcs.enterprise.impl.Action
 * @class iotcs.enterprise.impl.Action
 * @ignore
 * @private
 */
iotcs.enterprise.impl.Action = class {
    // Static private functions
    /**
     * Returns a DeviceModelAction for the action with the specified name which is associated with
     * the VirtualDevice.
     *
     * @param {iotcs.enterprise.VirtualDevice} virtualDevice - The virtual device associated with
     *        the action.
     * @param {string} actionName - The name of the action.
     * @return {(DeviceModelAction | null)} The device model action or <code>null</code>.
     *
     * @ignore
     */
    static _getDeviceModelAction(virtualDevice, actionName) {
        /** @type {object} */
        let deviceModelJson = virtualDevice.getDeviceModel();
        let deviceModel = iotcs.impl.DeviceModelParser._fromJson(deviceModelJson);
        return deviceModel._getDeviceModelActions().get(actionName);
    }

    /**
     * Constructs an Action.
     *
     * @param {VirtualDevice} virtualDevice - A virtual device.
     * @param {string} actionName - The action name.
     */
    constructor(virtualDevice, actionName) {
        this.deviceModelAction = iotcs.enterprise.impl.Action._getDeviceModelAction(virtualDevice,
                                                                                    actionName);

        if (!this.deviceModelAction) {
            iotcs.error("'" + actionName + "' not found.");
        }

        this.actionName = actionName;
        /** @type {VirtualDevice} */
        this.virtualDevice = virtualDevice;
        this.argumentValues = {};
    }

    // DJM: Why do we have public functions for a private class?
    // Public functions
    call() {
        this.virtualDevice.callMultiArgAction(this.actionName, this.getArguments());
    }

    /**
     * Checks the bounds (upper and lower), if there are any bounds, of the value of the argument.
     *
     * @param {DeviceModelActionArgument} argument - The argument to check.
     * @param {number} value - The value of the argument.
     * @throws error If there are bounds for the argument and the value is outside the bounds.
     */
    checkBounds(argument, value) {
        /** @type {number} */
        const upperBound = argument._getUpperBound();
        /** @type {number} */
        const lowerBound = argument._getLowerBound();

        // Assumption here is that lowerBound <= upperBound
        if (upperBound != null) {
            if (value > upperBound) {
                iotcs.error(this.deviceModelAction._getName() + " '" + argument._getName() +
                    "' out of range: " + value + " > " + upperBound);
            }
        }

        if (lowerBound != null) {
            if (value < lowerBound) {
                iotcs.error(this.deviceModelAction._getName() + " '" + argument._getName() +
                    "' out of range: " + value + " < " + lowerBound);
            }
        }
    }

    /**
     * Returns the argument with the specified name.
     *
     * @param {string} fieldName - The name of the argument.
     * @return {iotcs.impl.DeviceModelActionArgument} The argument or <code>null</code>.
     */
    getArgument(fieldName) {
        if (!this.deviceModelAction) {
            return null;
        }

        /** @type {Array<iotcs.impl.DeviceModelActionArgument>} */
        for (const argument of this.deviceModelAction._getArguments()) {
            if (argument._getName() === fieldName) {
                return argument;
            }
        }

        return null;
    }

    /**
     * Returns the attributes to be updated and their values.
     *
     * @return {Map<string, *>} An object containing the attributes to update.
     */
    getArguments() {
        // @type {object}
        let attributes = {};

        /** @type {iotcs.impl.DeviceModelActionArgument[]} */
        let args = this.deviceModelAction._getArguments();

        /** @type {iotcs.impl.DeviceModelActionArgument} */
        args.forEach(arg => {
            let name = arg._getName();
            let value = this.argumentValues[arg._getName()];

            if (!value) {
                value = arg._getDefaultValue();

                if (!value) {
                    iotcs.error("Missing required argument '" + name + "' to action '" +
                        this.deviceModelAction._getName() + "'");
                }
            }

            attributes[name] = value;
        });

        return attributes;
    }

    /**
     * Sets the value for the argument with the specified name.
     *
     * @param {string} argumentName - The name of the argument.
     * @param {*} value - The value.
     * @return {Action} An Action for the argument.
     * @throws error If the argument is not in the device model or of is the incorrect type.
     */
    set(argumentName, value) {
        /** @type {iotcs.impl.DeviceModelActionArgument} */
        let argument = this.getArgument(argumentName);

        if (!argument) {
            iotcs.error(argumentName + " not in device model.");
        }

        /** @type {string} */
        let typeOfValue = typeof value;

        switch (argument._getArgType()) {
            case iotcs.impl.DeviceModelAttribute.Type.NUMBER:
                if (typeOfValue !== 'number') {
                    iotcs.error("Value for '" + argumentName + "' is not a NUMBER");
                }

                this.checkBounds(argument, value);
                break;
        case iotcs.impl.DeviceModelAttribute.Type.INTEGER:
            if (typeOfValue !== 'number') {
                iotcs.error("Value for '" + argumentName + "' is not an INTEGER");
            }

            this.checkBounds(argument, value);
            break;
        case iotcs.impl.DeviceModelAttribute.Type.DATETIME:
            if (typeof value.getMonth !== 'function') {
                iotcs.error("Value for '" + argumentName + "' is not a DATETIME");
            }

            value = new Date().getTime();
            break;
        case iotcs.impl.DeviceModelAttribute.Type.BOOLEAN:
            if (typeOfValue !== 'boolean') {
                iotcs.error("value for '" + argumentName + "' is not a BOOLEAN");
            }

            break;
        case iotcs.impl.DeviceModelAttribute.Type.STRING:
            if (typeOfValue !== 'string') {
                iotcs.error("value for '" + argumentName + "' is not a STRING");
            }

            break;
        case iotcs.impl.DeviceModelAttribute.Type.URI:
            if (!(value instanceof iotcs.ExternalObject)) {
                iotcs.error("value for '" + argumentName + "' is not an ExternalObject");
            }

            break;
        }

        this.argumentValues[argumentName] = value;
        return this;
    }
};


//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/VirtualDevice.js
//////////////////////////////////////////////////////////////////////////////
/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

// TODO: jsdoc issue: MessageEnumerator appears in iotcs.* and not at index level (probably due to
//       missing class jsdoc on iotcs.enterprise.MessageEnumerator) @DONE

/**
 * VirtualDevice is a representation of a device model
 * implemented by an endpoint. A device model is a
 * specification of the attributes, formats, and resources
 * available on the endpoint.
 * <p>
 * The VirtualDevice API is specific to the enterprise
 * client. Also it implements the device monitoring and
 * control specific to the enterprise client and the call
 * to an action method. Actions are defined in the device
 * model.
 * <p>
 * A device model can be obtained by it's afferent urn with the
 * EnterpriseClient if it is registered on the cloud.
 * <p>
 * The VirtualDevice has the attributes and actions of the device
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
 * <code>device.maxThreshold.onError = function (errorTuple);</code><br>
 * <code>device.maxThreshold.value = 27;</code><br>
 * where errorTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , tryValue: ... , errorResponse: ...}</code>.
 * The library will throw an error in the value to update is invalid
 * according to the device model.
 * <p>
 * <b>Monitor a specific attribute for any value change (that comes from the cloud):</b><br>
 * <code>device.temperature.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object of the form
 * <code>{attribute: ... , newValue: ... , oldValue: ...}</code>.
 * <p>
 * <b>Monitor all attributes for any value change (that comes from the cloud):</b><br>
 * <code>device.onChange = function (changeTuple);</code><br>
 * where changeTuple is an object with array type properties of the form
 * <code>[{attribute: ... , newValue: ... , oldValue: ...}]</code>.
 * <p>
 * <b>Monitor all update errors:</b><br>
 * <code>device.onError = function (errorTuple);</code><br>
 * where errorTuple is an object with array type properties (besides errorResponse) of the form
 * <code>{attributes: ... , newValues: ... , tryValues: ... , errorResponse: ...}</code>.
 * <p>
 * <b>Monitor a specific alert format for any alerts that where generated:</b><br>
 * <code>device.tooHot.onAlerts = function (alerts);</code><br>
 * where alerts is an array containing all the alerts generated of the specific format. An
 * alert is an object of the form:
 * <code>{eventTime: ... , severity: ... , fields: {field1: value1, field2: value2 ... }}</code>.
 * The onAlerts can be set also by urn:
 * <code>device['temperature:format:tooHot'].onAlerts = function (alerts);</code><br>
 * <p>
 * <b>Monitor all alerts generated for all formats:</b><br>
 * <code>device.onAlerts = function (alerts);</code><br>
 * where alerts is an object containing all the alert formats as keys and each has as value the above described array:
 * <code>{formatUrn1: [ ... ], formatUrn2: [ ... ], ... }</code>.
 * <p>
 * <b>Monitor a specific custom message format for any messages that where generated:</b><br>
 * <code>device.rfidDetected.onData = function (data);</code><br>
 * where data is an array containing all the custom data messages generated of the specific format. A
 * data object is an object of the form:
 * <code>{eventTime: ... , severity: ... , fields: {field1: value1, field2: value2 ... }}</code>.
 * The onData can be set also by urn:
 * <code>device['temperature:format:rfidDetected'].onData = function (data);</code><br>
 * <p>
 * <b>Monitor all custom data messages generated for all formats:</b><br>
 * <code>device.onData = function (data);</code><br>
 * where data is an object containing all the custom formats as keys and each has as value the above described array:
 * <code>{formatUrn1: [ ... ], formatUrn2: [ ... ], ... }</code>.
 * <p>
 * A VirtualDevice can also be created with the appropriate
 * parameters from the EnterpriseClient.
 *
 * @param {string} endpointId - The endpoint id of this device.
 * @param {object} deviceModel - The device model object holding the full description of that device
 *        model that this device implements.
 * @param {iotcs.enterprise.EnterpriseClient} client - The enterprise client associated with the
 *        device application context.
 *
 * @alias iotcs.enterprise.VirtualDevice
 * @class iotcs.enterprise.VirtualDevice
 * @extends iotcs.AbstractVirtualDevice
 * @memberof iotcs.enterprise
 * @see {@link iotcs.enterprise.EnterpriseClient#getDeviceModel}
 * @see {@link iotcs.enterprise.EnterpriseClient#createVirtualDevice}
 */
iotcs.enterprise.VirtualDevice = class extends iotcs.AbstractVirtualDevice {
    constructor(endpointId, deviceModel, client) {
        super(endpointId, deviceModel);
        _mandatoryArg(client, iotcs.enterprise.EnterpriseClient);

        this._attributes = this;
        this._controller = new iotcs.enterprise.impl.Controller(this);
        this._enterpriseClient = client;
        this._onAlerts = arg => {};
        this._onData = arg => {};

        let attributes = this._deviceModel.attributes;

        for (let indexAttr in attributes) {
            let attribute = new iotcs.enterprise.impl.Attribute(attributes[indexAttr]);

            if (attributes[indexAttr].alias) {
                iotcs.AbstractVirtualDevice._link(attributes[indexAttr].alias, this, attribute);
            }

            iotcs.AbstractVirtualDevice._link(attributes[indexAttr].name, this, attribute);
        }

        this.actions = this;

        let actions = this._deviceModel.actions;

        for (let indexAction in actions) {
            let actionSpec = new iotcs.enterprise.impl.ActionSpec(actions[indexAction]);

            if (actions[indexAction].alias) {
                iotcs.AbstractVirtualDevice._link(actions[indexAction].alias, this.actions, actionSpec);
            }

            iotcs.AbstractVirtualDevice._link(actions[indexAction].name, this.actions, actionSpec);
        }

        let self = this;

        if (this._deviceModel.formats) {
            this.alerts = this;
            this.dataFormats = this;

            this._deviceModel.formats.forEach(format => {
                if (format.type && format.urn) {
                    if (format.type === 'ALERT') {
                        let alert = new iotcs.enterprise.impl.Alert(format);

                        if (format.name) {
                            iotcs.AbstractVirtualDevice._link(format.name, self.alerts, alert);
                        }

                        iotcs.AbstractVirtualDevice._link(format.urn, self.alerts, alert);
                    }

                    if (format.type === 'DATA') {
                        let data = new iotcs.enterprise.impl.Data(format);

                        if (format.name) {
                            iotcs.AbstractVirtualDevice._link(format.name, self.dataFormats, data);
                        }

                        iotcs.AbstractVirtualDevice._link(format.urn, self.dataFormats, data);
                    }
                }
            });
        }

        this._isDeviceApp = 0;
        Object.preventExtensions(this);
        iotcs.enterprise.EnterpriseClient._deviceMonitorInitialization(this);
    }

    // Private/protected functions
    // Public functions
    /**
     * Execute an action. The library will throw an error if the action is not in the model or if the
     * argument is invalid (or not present when it should be).  The actions are as attributes properties
     * of the virtual device.
     * <p>
     * The response from the cloud to the execution of the action can be retrieved by setting a callback
     * function to the onAction property of the action:<br> <code>device.reset.onAction = function
     * (response);</code><br> <code>device.call('reset');</code><br> where response is a JSON
     * representation of the response from the cloud if any.
     *
     * @function call
     * @memberof iotcs.enterprise.VirtualDevice
     *
     * @param {string} actionName - The name of the action to execute.
     * @param {object} [arg] - An optional unique argument to pass for action execution.  This is
     *        specific to the action and description of it is provided in the device model.
     */
    call(actionName, arg) {
        _mandatoryArg(actionName, 'string');

        if (arg && (arg.length > 2)) {
            iotcs.error('Invalid number of arguments.');
        }

        let action = this[actionName];

        if (!action) {
            iotcs.error('Action "' + actionName + '" is not executable.');
            return;
        }

        this._controller._invokeSingleArgAction(action._name, arg);
    }

    /**
     * Execute an action. The library will throw an error if the action is not in the model or if the
     * arguments are invalid (or not present when they should be).  The actions are as attribute
     * properties of the virtual device.
     * <p>
     * The response from the cloud to the execution of the action can be retrieved by setting a callback
     * function to the onAction property of the action:<br> <code>device.reset.onAction = function
     * (response);</code><br> <code>device.call('reset');</code><br> where response is a JSON
     * representation of the response from the cloud, if any.
     *
     * @function callMultiArgAction
     * @memberof iotcs.enterprise.VirtualDevice
     *
     * @param {string} actionName - The name of the action to execute.
     * @param {object} args - An of action argument names to action argument values to pass for action
     *        execution.  The arguments are specific to the action.  The description of the arguments is
     *        provided in the device model.
     *
     * @ignore
     * @private
     */
    callMultiArgAction(actionName, args) {
        _mandatoryArg(args, 'object');

        let action = this[actionName];

        if (!action) {
            iotcs.error('Action "' + actionName + '" is not executable.');
            return;
        }

        this._controller._invokeMultiArgAction(action._name, args);
    }

    /**
     * @ignore
     * @inheritdoc
     */
    close() {
        if (this._controller) {
            this._controller._close();
        }

        if (this._client) {
            this._client._removeVirtualDevice(this);
        }

        this._controller = null;
        this._endpointId = null;
        this._onChange = arg => {};
        this._onError = arg => {};
        this._onAlerts = arg => {};
    }

    /**
     * Create an Action for this VirtualDevice. The action will be created for the named action in
     * the device model.
     *
     * @param {string} actionName - The name of the action.
     * @return {Action} - A DeviceModelAction.
     */
    createAction(actionName) {
        return new iotcs.enterprise.impl.Action(this, actionName);
    }

    get onAlerts() {
        return this._onAlerts;
    }

    get onData() {
        return this._onData;
    }

    set onAlerts(newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onAlerts that is not a function!');
            return;
        }

        this._onAlerts = newFunction;
    }

    set (newFunction) {
        if (!newFunction || (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onData that is not a function!');
            return;
        }

        this._onData = newFunction;
    }

    /**
     * @ignore
     * @inheritdoc
     */
    update(attributes) {
        _mandatoryArg(attributes, 'object');

        if (Object.keys(attributes).length === 0) {
            return;
        }

        for (let attribute in attributes) {
            let value = attributes[attribute];

            if (attribute in this._attributes) {
                this._attributes[attribute]._localUpdate(value, true); //XXX not clean
            } else {
                iotcs.error('Unknown attribute "' + attribute + '".');
                return;
            }
        }

        if (this._controller) {
            this._controller._updateAttributes(attributes, false);
        }
    }
};




//////////////////////////////////////////////////////////////////////////////
// File: ./src/enterprise/TrustedAssetsManager.js
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
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.enterprise.TrustedAssetsManager
 * @class iotcs.enterprise.TrustedAssetsManager
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.TrustedAssetsManager = class {
    // Static private/protected functions
    /** @ignore */
    static _decryptSharedSecret (encryptedSharedSecret, password) {
        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let cipher = forge.cipher.createDecipher('AES-CBC', key);
        cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
        cipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedSharedSecret),
                                              'binary'));
        cipher.finish();
        return cipher.output.toString();
    }

    /** @ignore */
    static _encryptSharedSecret (sharedSecret, password) {
        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
        cipher.update(forge.util.createBuffer(sharedSecret, 'utf8'));
        cipher.finish();
        return cipher.output.toHex();
    }

    /** @ignore */
    static _loadTrustAnchors (truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => { return ((elem.length > 1) && (elem.indexOf('M') > -1)); })
            .map(elem => { return '-----BEGIN CERTIFICATE-----' +
                           elem.replace(new RegExp('\r\n', 'g'),'\n') +
                           '-----END CERTIFICATE-----'; });
    }

    /** @ignore */
    //PBKDF2 (RFC 2898)
    static _pbkdf (password) {
        return forge.pkcs5.pbkdf2(password, '', 1000, 16);
    }

    /** @ignore */
    static _signTaStoreContent (taStoreEntries, password) {
        let data = (taStoreEntries.clientId ? ('{' + taStoreEntries.clientId + '}') : '') +
            '{' + taStoreEntries.serverHost + '}' +
            '{' + taStoreEntries.serverPort + '}' +
            (taStoreEntries.sharedSecret ? ('{' + taStoreEntries.sharedSecret + '}') : '') +
            (taStoreEntries.trustAnchors ? ('{' + taStoreEntries.trustAnchors + '}') : '');

        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
        let ret = {};

        if (taStoreEntries.clientId) {
            ret.clientId = taStoreEntries.clientId;
        }
        
        ret.serverHost = taStoreEntries.serverHost;
        ret.serverPort = taStoreEntries.serverPort;

        if (taStoreEntries.sharedSecret) {
            ret.sharedSecret = taStoreEntries.sharedSecret;
        }

        if (taStoreEntries.trustAnchors) {
            ret.trustAnchors = taStoreEntries.trustAnchors;
        }

        ret.signature = hmac.digest().toHex();
        return ret;
    }

    /** @ignore */
    static _verifyTaStoreContent (taStoreEntries, password) {
        let data = (taStoreEntries.clientId ? ('{' + taStoreEntries.clientId + '}') : '') +
            '{' + taStoreEntries.serverHost + '}' +
            '{' + taStoreEntries.serverPort + '}' +
            (taStoreEntries.sharedSecret ? ('{' + taStoreEntries.sharedSecret + '}') : '') +
            (taStoreEntries.trustAnchors ? ('{' + taStoreEntries.trustAnchors + '}') : '');

        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
        return taStoreEntries.signature && hmac.digest().toHex() === taStoreEntries.signature;
    }

    constructor(taStoreFile,taStorePassword) {
        this._clientId = null;
        this._serverHost = null;
        this._serverPort = null;
        this._sharedSecret = null;
        this._trustAnchors = null;

        let _taStoreFile = taStoreFile || iotcs.oracle.iot.tam.store;
        let _taStorePassword = taStorePassword || iotcs.oracle.iot.tam.storePassword;

        if (!_taStoreFile) {
            iotcs.error('No Trusted Assetss Store file defined.');
            return;
        }

        if (!_taStorePassword) {
            iotcs.error('No Trusted Assets Store password defined.');
            return;
        }

        if (!_taStoreFile.endsWith('.json')) {
            this._unifiedTrustStore = new iotcs.UnifiedTrustStore(_taStoreFile, _taStorePassword,
                                                                  false);
            this._unifiedTrustStore._setPrivateValues(this);
        } else {
            this._load = () => {
                let input = iotcs.impl.Platform.File._load(_taStoreFile);
                let entries = JSON.parse(input);

                if (!iotcs.enterprise.TrustedAssetsManager._verifyTaStoreContent(entries,
                                                                                 _taStorePassword))
                {
                    iotcs.error('Trusted Assets Store not signed or has been tampered with.');
                    return;
                }

                this._clientId = entries.clientId;
                this._serverHost = entries.serverHost;
                this._serverPort = entries.serverPort;
                this._sharedSecret = (entries.sharedSecret ?
                    iotcs.enterprise.TrustedAssetsManager._decryptSharedSecret(entries.sharedSecret,
                        _taStorePassword) : null);
                this._trustAnchors = entries.trustAnchors;

            };

            this._load();
        }
    }

    // Public functions
    /**
     * Retrieves the ID of this client.  If the client is a device, the client ID is the device ID.  If
     * the client is a pre-activated enterprise application, the client ID corresponds to the assigned
     * endpoint ID.  The client ID is used along with a client secret derived from the shared secret to
     * perform secret-based client authentication with the IoT CS server.
     *
     * @function getClientId
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?string} The ID of this client, or <code>null</code> if any error occurs retrieving the
     *          client ID.
     */
    getClientId() {
        return this._clientId;
    }

    /**
     * Retrieves the IoT CS server host name.
     *
     * @function getServerHost
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server host name, or <code>null</code> if any error occurs
     *          retrieving the server host name.
     */
    getServerHost() {
        return this._serverHost;
    }

    /**
     * Retrieves the IoT CS server port.
     *
     * @function getServerPort
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?number} The IoT CS server port (a positive integer), or <code>null</code> if any error
     *          occurs retrieving the server port.
     */
    getServerPort() {
        return this._serverPort;
    }

    /**
     * Retrieves the trust anchor or most-trusted Certification Authority (CA) to be used to validate
     * the IoT CS server certificate chain.
     *
     * @function getTrustAnchorCertificates
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?Array} The PEM-encoded trust anchor certificates, or <code>null</code> if any error
     *          occurs retrieving the trust anchor.
     */
    getTrustAnchorCertificates() {
        return this._trustAnchors;
    }

    /**
     * Provisions the designated Trusted Assets Store with the provided provisioning assets.  The
     * provided shared secret will be encrypted using the provided password.
     *
     * @memberof iotcs.enterprise.TrustedAssetsManager
     * @function provision
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {?string} clientId - The ID of the client.
     * @param {?string} sharedSecret - The client's shared secret.
     * @param {?string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     */
    provision(taStoreFile, taStorePassword, serverHost, serverPort, clientId, sharedSecret,
              truststore)
    {
        if (!taStoreFile) {
            throw 'No Trusted Assets Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No Trusted Assets Store password provided.';
        }

        let entries = {};
        entries.serverHost = serverHost;
        entries.serverPort = serverPort;

        if (clientId) {
            entries.clientId = clientId;
        }

        if (sharedSecret) {
            entries.sharedSecret = this._encryptSharedSecret(sharedSecret, taStorePassword);
        }

        if (truststore) {
            entries.trustAnchors = (Array.isArray(truststore) ? truststore :
                iotcs.enterprise.TrustedAssetsManager._loadTrustAnchors(truststore));
        }

        entries = this._signTaStoreContent(entries, taStorePassword);
        let output = JSON.stringify(entries);
        iotcs.impl.Platform.File._store(taStoreFile, output);
    }

    /**
     * Signs the provided data using the specified algorithm and the shared secret.  This method is only
     * use for secret-based client authentication with the IoT CS server.
     *
     * @function signWithSharedSecret
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @param {Array} data - The bytes to be signed.
     * @param {string} algorithm - The hash algorithm to use.
     * @return {?Array} - The signature bytes, or <code>null</code> if any error occurs retrieving the
     *         necessary key material or performing the operation.
     */
    signWithSharedSecret(data, algorithm) {
        let digest = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        try {
            let hmac = forge.hmac.create();
            hmac.start(algorithm, this._sharedSecret);
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
