/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

/*global define   */

define(['ojs/ojcore', 'knockout', 'services', 'ojs/ojlistview', 'ojs/ojarraydataprovider'],
	function (oj, ko, services) {

		function LogsViewModel() {
			let self = this;

			self.logItems = ko.observableArray([]);
			self.selectedItem = ko.observable('gateway');
			self.nodeUrls = {
				'gateway':  `http://${document.location.hostname}:9004/`,
			};

			self.logviewUrl = ko.observable(self.nodeUrls['gateway']);


			self.handleSelectionChange = function (event) {
				self.logviewUrl(self.nodeUrls[event.detail.value]);
			};
			/**
       * Optional ViewModel method invoked when this ViewModel is about to be
       * used for the View transition.  The application can put data fetch logic
       * here that can return a Promise which will delay the handleAttached function
       * call below until the Promise is resolved.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       * @return {Promise|undefined} - If the callback returns a Promise, the next phase (attaching DOM) will be delayed until
       * the promise is resolved
       */
			self.handleActivated = function () {
				self.logItems.removeAll();
				self.logItems.push({
					id: 'gateway',
					label: 'Gateway'
				});
				let cachedNodes = services.getCachedNodes();
				for (let key in cachedNodes) {
					self.nodeUrls[cachedNodes[key].name] =  `http://${cachedNodes[key].ipAddress}:9004/`;
					self.logItems.push({
						id: cachedNodes[key].name,
						label: cachedNodes[key].name
					});
				}


			};

			/**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       * @param {boolean} info.fromCache - A boolean indicating whether the module was retrieved from cache.
       */
			self.handleAttached = function () {
				// Implement if needed
			};


			/**
       * Optional ViewModel method invoked after the bindings are applied on this View.
       * If the current View is retrieved from cache, the bindings will not be re-applied
       * and this callback will not be invoked.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       */
			self.handleBindingsApplied = function () {
				// Implement if needed
			};

			/*
      * Optional ViewModel method invoked after the View is removed from the
      * document DOM.
      * @param {Object} info - An object with the following key-value pairs:
      * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
      * @param {Function} info.valueAccessor - The binding's value accessor.
      * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
      */
			self.handleDetached = function () {
				// Implement if needed
			};
		}

		/*
    * Returns a constructor for the ViewModel so that the ViewModel is constructed
    * each time the view is displayed.  Return an instance of the ViewModel if
    * only one instance of the ViewModel is needed.
    */
		return new LogsViewModel();
	}
);
