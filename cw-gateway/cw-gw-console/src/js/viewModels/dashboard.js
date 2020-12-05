/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

/*global define $*/

define(['ojs/ojcore', 'knockout',  'services', 'moment', 'jquery',  'ojs/ojlistview',
	'ojs/ojbutton', 'ojs/ojcollapsible', 'ojs/ojdialog', 'ojs/ojselectcombobox',
	'ojs/ojinputtext', 'ojs/ojinputnumber', 'ojs/ojformlayout', 'ojs/ojlabel',
	'ojs/ojarraydataprovider'],
function (oj, ko, services, moment) {

	function DashboardViewModel() {
		var self = this;

		self.SRStatusIcons = {NEW: 'icon-star', CLOSED: 'icon-tick', WITHDRAWN: 'icon-cross', ASSIGNED: 'icon-spanner'};
		self.projectLocations = [];
		self.projectLocationSelections = ko.observableArray();
		self.projectLocationsDP = new oj.ArrayDataProvider(self.projectLocationSelections, {idAttribute: 'id'});
		self.sshURL =  ko.observable();

		self.selectedNode = {
			id: ko.observable('ttttt'),
			lat: ko.observable(),
			lon: ko.observable(),
			ledColor: ko.observable(),
			location: {
				id: ko.observable(),
				name: ko.observable(),
				hazardous: ko.observable(false)
			}
		};



		self.errorMessage = {
			text: ko.observable(''),
			details: ko.observable('')
		};

		self.confirm = {
			text: ko.observable(),
			details: ko.observable(),
			okHandler: undefined
		};

		self.nodes = ko.observableArray();
		self.alerts = ko.observableArray();
		self.nodeListDP = new oj.ArrayDataProvider(self.nodes, {idAttribute: 'clientId'});

		self.currentSelection = null;


		self.refreshButtonClicked = function() {
			loadData();
		};

		self.handleNodeEditCancel = function() {
			startRefreshTimer(true);
			$('#nodeEditModal').ojDialog('close');
		};

		self.handleNodeEditSave = function()  {
			let updateNode = self.nodes().find((elem) => elem.identity.configData.id() === self.selectedNode.id());
			if (!updateNode) {
				console.error('Unable to find node details in list.');
				startRefreshTimer(true);
				return;
			}

			// Build the object for updating the node
			let updatedConfig = {
				clientId: updateNode.clientId,
				configData: {
					id: self.selectedNode.id(),
					lat: self.selectedNode.lat(),
					lon: self.selectedNode.lon(),
					ledColor: self.selectedNode.ledColor(),
					location: {
						id: self.selectedNode.location.id(),
						name: self.selectedNode.location.name(),
						hazardous: self.selectedNode.location.hazardous()
					}
				}
			};

			startRefreshTimer(true);
			services.updateConfigData(updatedConfig).
				then(() => {
					// Update the node card view
					updateNode.identity.configData.lat(self.selectedNode.lat());
					updateNode.identity.configData.lon(self.selectedNode.lon());
					updateNode.identity.configData.ledColor(self.selectedNode.ledColor());
					updateNode.identity.configData.location.id(self.selectedNode.location.id());
					updateNode.identity.configData.location.name(self.selectedNode.location.name());
					updateNode.identity.configData.location.hazardous(self.selectedNode.location.hazardous);
					$('#nodeEditModal').ojDialog('close');
				}).
				catch((err) => showError('Failed to update node configuration', err));
		};



		self.showDetails = function () {
		};

		self.count = function(arr) {
			return arr.length;
		};

		self.timeAgo = function (dateTime) {
			return moment(dateTime).fromNow();
		};

		self.handleEditClicked = function (event, ui) {
			self.selectedNode.id(ui.identity.configData.id());
			self.selectedNode.lat(ui.identity.configData.lat());
			self.selectedNode.lon(ui.identity.configData.lon());
			self.selectedNode.ledColor(ui.identity.configData.ledColor());
			self.selectedNode.location.id(ui.identity.configData.location.id());
			//stop refreshing while the user is editing
			startRefreshTimer(false);

			$('#nodeEditModal').ojDialog('open');
		};


		self.locationSelectionHandler = function (event) {
			// console.log(event, data);
			let locationDetails = self.projectLocations.find((loc) => loc.id === event.detail.value);
			if (locationDetails) {
				self.selectedNode.location.hazardous(locationDetails.hazardous);
				self.selectedNode.location.name(locationDetails.name);
			}
		};
		self.handleRestartClicked = function (event, ui) {
			showConfirmDialog('Confirm Restart', 'Click OK to proceed with restarting the node', restartNode, ui.clientId);
		};



		self.handleRebootClicked = function (event, ui) {
			showConfirmDialog('Confirm Reboot', 'Click OK to proceed with a OS reboot', rebootNode, ui.clientId);
		};

		self.handlePowerOffClicked = function (event, ui) {
			showConfirmDialog('Confirm Power Off', 'Click OK to proceed powering down the node', powerOffNode, ui.clientId);
		};

		self.handleConfirmOK = function(){
			$('#confirmModal').ojDialog('close');
			if (self.confirm.okHandler) {
				self.confirm.okHandler(self.confirm.okHandlerParam);
			}
		};

		self.handleSSHClicked = function(event, ui) {
			// self.sshURL(`https://${ui.identity.ipAddress.address()}:9003/`);
			// $('#sshModal').ojDialog('open');
			window.open(`https://${ui.identity.ipAddress.address()}:9003/`);
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
			loadData();
			//services.socket.on('nodelist', nodesListListener);
			startRefreshTimer(true);
			return null;
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
			// Implement if needed'

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

		/**
    * Optional ViewModel method invoked after the View is removed from the
    * document DOM.
    * @param {Object} info - An object with the following key-value pairs:
    * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
    * @param {Function} info.valueAccessor - The binding's value accessor.
    * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
    */
		self.handleDetached = function () {
			// Implement if needed
			//services.socket.removeListener('nodeslist', nodesListListener);
			startRefreshTimer(false);
		};


		function startRefreshTimer(start) {
			if (start) {
				self.reloadInterval = setInterval(() => loadData(), 10000);
			} else if (self.reloadInterval) {
				clearInterval(self.reloadInterval);
			}
		}

		/**
		 *
		 * Load devices
		 */
		function loadData() {
			//self.nodes.removeAll();
			services.getNodes().
				then((nodesList) => {
					nodesList.forEach(node => {
						let deviceArray = [];
						for (let devAddress in node.devices) {
							deviceArray.push(node.devices[devAddress]);

						}
						// Find if there a row already for this node
						self.nodeListDP.fetchByKeys({keys:[node.clientId]}).
							then((data) => {
								if (data.results.get(node.clientId) === undefined) {
								// Add a new entry
									if (node.identity.ipAddress) {
										node.identity.ipAddress.address = ko.observable(node.identity.ipAddress.address);
									} else {
										node.identity.ipAddress.address = ko.observable('Not Available');
									}
									node.identity.configData.id = ko.observable(node.identity.configData.id);
									node.identity.configData.ledColor = ko.observable(node.identity.configData.ledColor);
									node.identity.configData.lat = ko.observable(node.identity.configData.lat);
									node.identity.configData.lon = ko.observable(node.identity.configData.lon);
									node.identity.configData.location.id = ko.observable(node.identity.configData.location.id);
									node.identity.configData.location.name = ko.observable(node.identity.configData.location.name);
									node.identity.configData.location.hazardous = ko.observable(node.identity.configData.location.hazardous);
									node.deviceList = ko.observableArray(deviceArray);
									node.deviceCount = ko.observable(deviceArray.length);

									self.nodes.push(node);
								} else {
								// Update the existing data
									let currentNode = data.results.get(node.clientId).data;
									currentNode.identity.ipAddress.adress = ko.observable(node.identity.ipAddress.address);
									currentNode.identity.configData.id = ko.observable(node.identity.configData.id);
									currentNode.identity.configData.ledColor = ko.observable(node.identity.configData.ledColor);
									currentNode.identity.configData.lat = ko.observable(node.identity.configData.lat);
									currentNode.identity.configData.lon = ko.observable(node.identity.configData.lon);
									currentNode.identity.configData.location.id = ko.observable(node.identity.configData.location.id);
									currentNode.identity.configData.location.name = ko.observable(node.identity.configData.location.name);
									currentNode.identity.configData.location.hazardous = ko.observable(node.identity.configData.location.hazardous);
									currentNode.deviceList.removeAll();
									currentNode.deviceList(deviceArray);
									currentNode.deviceCount(deviceArray.length);

								}
							}).
							catch (err => {
								showError('Error fetching by key from ArrayDataProvider', err);
								console.error(err);
							});
					});
					// Remove nodes that have disconnected
					self.nodes.remove((item) => {
						let deleteNode = nodesList.find((elem) => elem.clientId === item.clientId);
						return deleteNode === undefined;
					});
					return services.getLocations();
				}).
				then ((locations) => {
					let selectLocations = [];
					locations.forEach((location) => {
						selectLocations.push({ value: location.id, label: location.path });
					});
					self.projectLocations = locations;
					self.projectLocationSelections(selectLocations);
				}).
				catch((error) => {
					console.error(error);
				});

		}

		function showError(errorText, err) {
			console.error(err);
			self.errorMessage.text(errorText);
			if (err.responseJSON === undefined) {
				self.errorMessage.details(err.statusText);
			} else {
				self.errorMessage.details(err.responseJSON.title);
			}
			$('#errorMessageModal').ojDialog('open');
		}

		function showMessageDialog (text, details) {
			self.confirm.text(text);
			self.confirm.details(details);
			$('#messageModal').ojDialog('open');
		}

		function showConfirmDialog (text, details, okHandler, handlerParam) {
			self.confirm.text(text);
			self.confirm.details(details);
			self.confirm.okHandler = okHandler;
			self.confirm.okHandlerParam = handlerParam;
			$('#confirmModal').ojDialog('open');
		}

		function restartNode(clientId){
			services.restartNode(clientId).
				then(() => {
					showMessageDialog('Node client restarted', '');

				}).
				catch((err) => {
					console.error(err);
					showError('Failed to restart node client', err);
				});
		}

		function rebootNode(clientId) {
			services.rebootNode(clientId).
				then(() => {
					showMessageDialog('Node reboot initiated', '');

				}).
				catch((err) => {
					console.error(err);
					showError('Failed to reboot node', err);
				});

		}

		function powerOffNode(clientId) {
			services.powerOffNode(clientId).
				then(() => {
					showMessageDialog('Node power off initiated', '');

				}).
				catch((err) => {
					console.error(err);
					showError('Failed to power off node', err);
				});

		}
	}
	/*
    * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
    * each time the view is displayed.  Return an instance of the ViewModel if
    * only one instance of the ViewModel is needed.
    */
	return new DashboardViewModel();
}
);
