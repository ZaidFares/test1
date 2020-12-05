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
