/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

/*global define $ */
define(['ojs/ojcore', 'knockout', 'moment', 'services',  'jquery','ojs/ojknockout',
	'ojs/ojarraydataprovider','ojs/ojdialog', 'ojs/ojbutton',
	'ojs/ojtabs', 'ojs/ojinputtext', 'ojs/ojaccordion', 'ojs/ojselectcombobox',
	'ojs/ojcheckboxset', 'ojs/ojinputnumber', 'ojs/ojinputtext', 'ojs/ojformlayout', 'ojs/ojlabel' ],
function (oj, ko, moment, services) {

	function SettingsViewModel() {
		var self = this;

		self.nodeSettingsTabSelectedItem = ko.observable('bluetoothSettingsTab');

		self.projects = ko.observableArray();
		self.projectDP = new oj.ArrayDataProvider(self.projects, {idAttribute: 'value'});
		self.sshURL = ko.observable(`https://${document.location.hostname}:9003/`);

		self.bleDeviceModes = [
			{ value: 'full', label: 'Use all capabilities' },
			{ value: 'basic', label: 'Use only for proximity detection' },
			{value : 'off', label:'Ignore this device type'}
		];

		self.errorMessage = {
			text: ko.observable(''),
			details: ko.observable('')
		};

		self.confirm = {
			text: ko.observable(),
			details: ko.observable()
		};

		self.serverSettings = {
			host: ko.observable(),
			listenPort: ko.observable(),
		};

		self.nodeSettings = {
			rssiSampleSize: ko.observable(10),
			outOfRangeTimeoutMsecs: ko.observable(1000),
			txPower: ko.observable(-68),
			watchLoopInterval: ko.observable(1000),
			maxOutOfRangeMessages: ko.observable(3),
			rssiUpdateInterval: ko.observable(1000),
			maxRange: ko.observable(5),
			bleDeviceTypes: {
				metawear: {
					name: ko.observable('MetaWear'),
					mode: ko.observable('full'),
					serviceId: ko.observable('326a900085cb9195d9dd464cfbbae75a'),
					temperatureUpdateFreq: ko.observable(60),
					batteryUpdateFreq: ko.observable(600),
					motionDetectionFreq: ko.observable(30),
					motionSampleSize: ko.observable(4),
					motionThreshold: ko.observable(0.25),
					fallDownSampleSize: ko.observable(4),
					fallDownThreshold: ko.observable(0.5),
					fallDownHeight: ko.observable(2)
				},
				generic: {
					name: ko.observable('Generic'),
					mode: ko.observable('full'),
					serviceId: ko.observable('B0702880-A295-A8AB-F734-031A98A512DE')
				},
				ibeacon: {
					name: ko.observable('Estimote'),
					mode: ko.observable('off'),
					serviceId: ko.observable()
				}
			}
		};

		self.iotcsSettings = {
			debug: ko.observable('false'),
			provisioningFile: ko.observable('metawear-gw-1.csv'),
			provisioningPassword: ko.observable('Welcome1'),
			username: ko.observable('iot'),
			password: ko.observable('welcome1'),
			cwProjectId: ko.observable(),
			cwManDownWhen: {
				noMotionMinutes: ko.observable(2),
				alertFrequency: ko.observable(10)
			}
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
			// Implement if needed
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
			loadData();
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
			// loadData();
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

		};

		self.handleOKClose = function () {
			$('#settingsErrorDialog').ojDialog('close');
		};

		self.handleDownloadClicked = function () {

		};

		self.handleConfirmOK = function () {
			$('#confirmModal').ojDialog('close');
			if (self.confirm.okHandler) {
				self.confirm.okHandler(self.confirm.okHandlerParam);
			}

		};

		self.handleRefreshButtonClicked = function () {
			loadData();
		};

		self.handleRestartClicked = function() {
			showConfirmDialog('Restart Gateway', 'Click OK to proceed with the server restart', restartServer);
		};

		self.handleRebootClicked = function() {
			showConfirmDialog('Reboot Gateway', 'Click OK to proceed with the OS reboot', rebootServer);
		};

		self.handlePowerOffClicked = function() {
			showConfirmDialog('Power Off Gateway', 'Click OK to proceed with the gateway shutdown', powerOffGateway);
		};

		self.handleShellClicked = function() {
			window.open(self.sshURL());
			//$('#sshModal').ojDialog('open');
		};

		self.handleSaveClicked = function () {
			var newSettings = {
				server: {},
				client: {},
				iotcs: {}
			};

			toValueObject(self.serverSettings, newSettings.server);
			toValueObject(self.nodeSettings, newSettings.client);
			toValueObject(self.iotcsSettings, newSettings.iotcs);
			console.log(newSettings);
			services.updateSettings(newSettings).
				then (() => showMessageDialog('Settings saved successfully', '')).
				catch((err) => {
					console.error(err);
					showError('Failed to update settings', err);
				});
		};

		self.handleCancelClicked = function () {
			// reload data
			loadData();
		};

    	function toValueObject(koObject, obj) {
			for (let k in koObject) {
				if (typeof (koObject[k]) === 'object') {
					obj[k] = {};
					toValueObject(koObject[k], obj[k]);
				} else {
					obj[k]=koObject[k]();
				}

			}
			return obj;
		}
		function showError(errorText, err) {
			console.error(err);
			self.errorMessage.text(errorText);
			if (err.responseJSON === undefined) {
				self.errorMessage.details(err.statusText);
			} else {
				self.errorMessage.details(err.responseJSON.title);
			}
			$('#settingsErrorDialog').ojDialog('open');
		}

		function showMessageDialog (text, details, handler) {
			self.confirm.text(text);
			self.confirm.details(details);
			self.confirm.clickHandler = handler;
			$('#messageModal').ojDialog('open');
		}

		function showConfirmDialog (text, details, okHandler, handlerParam) {
			self.confirm.text(text);
			self.confirm.details(details);
			self.confirm.okHandler = okHandler;
			self.confirm.okHandlerParam = handlerParam;
			$('#confirmModal').ojDialog('open');
		}

		function restartServer(){
			services.restartServer().
				then(() => showMessageDialog('Server restart initiated', 'Refresh your browser in a few minutes')).
				catch((err) => {
					console.error(err);
					showError('Failed to restart server', err);
				});
		}

		function rebootServer() {
			services.rebootGateway().
				then(() => showMessageDialog('Gateway reboot initiated', 'Refresh your browser in a few minutes')).
				catch((err) => {
					console.error(err);
					showError('Failed to reboot gateway', err);
				});

		}

		function powerOffGateway() {
			services.powerOffGateway().
				then(() => showMessageDialog('Server power down initiated', '')).
				catch((err) => {
					console.error(err);
					showError('Failed to power off the gateway hardware', err);
				});

		}
		/**
		*
		* @returns {undefined}
		*/
		function loadData() {
			services.getSettings().
				then( (data) => {
					loadSettingsData(data);
					return services.getProjects();
				}).
				then((projects) => {
					loadProjects(projects);
				}).
				catch((err) => {
					console.error(err);
					showError('Failed to fetch data', err);
				}
				);

		}

		function loadProjects(projects) {
			let selectProjects = [];
			projects.forEach((project) => {
				if (project.status === 'ACTIVE') {
					selectProjects.push({ value: project.id, label: project.name });
				}
			});
			//console.log(selectProjects);
			self.projects(selectProjects);
		}

		function loadSettingsData(data) {
			self.serverSettings.host(data.server.host);
			self.serverSettings.listenPort(data.server.listenPort);

			self.nodeSettings.rssiSampleSize(data.client.rssiSampleSize);
			self.nodeSettings.outOfRangeTimeoutMsecs(data.client.outOfRangeTimeoutMsecs);
			self.nodeSettings.txPower(data.client.txPower);
			self.nodeSettings.watchLoopInterval(data.client.watchLoopInterval);
			self.nodeSettings.maxOutOfRangeMessages(data.client.maxOutOfRangeMessages);
			self.nodeSettings.rssiUpdateInterval(data.client.rssiUpdateInterval);
			self.nodeSettings.maxRange(data.client.maxRange);

			self.nodeSettings.bleDeviceTypes.metawear.name(data.client.bleDeviceTypes.metawear.name);
			self.nodeSettings.bleDeviceTypes.metawear.mode(data.client.bleDeviceTypes.metawear.mode);
			self.nodeSettings.bleDeviceTypes.metawear.serviceId(data.client.bleDeviceTypes.metawear.serviceId);
			self.nodeSettings.bleDeviceTypes.metawear.temperatureUpdateFreq(data.client.bleDeviceTypes.metawear.temperatureUpdateFreq);
			self.nodeSettings.bleDeviceTypes.metawear.batteryUpdateFreq(data.client.bleDeviceTypes.metawear.batteryUpdateFreq);
			self.nodeSettings.bleDeviceTypes.metawear.motionDetectionFreq(data.client.bleDeviceTypes.metawear.motionDetectionFreq);
			self.nodeSettings.bleDeviceTypes.metawear.motionSampleSize(data.client.bleDeviceTypes.metawear.motionSampleSize);
			self.nodeSettings.bleDeviceTypes.metawear.motionThreshold(data.client.bleDeviceTypes.metawear.motionThreshold);
			self.nodeSettings.bleDeviceTypes.metawear
				.fallDownSampleSize(data.client.bleDeviceTypes.metawear.fallDownSampleSize);
			self.nodeSettings.bleDeviceTypes.metawear
				.fallDownThreshold(data.client.bleDeviceTypes.metawear.fallDownThreshold);
			self.nodeSettings.bleDeviceTypes.metawear
				.fallDownHeight(data.client.bleDeviceTypes.metawear.fallDownHeight);

			self.nodeSettings.bleDeviceTypes.generic.name(data.client.bleDeviceTypes.generic.name);
			self.nodeSettings.bleDeviceTypes.generic.mode(data.client.bleDeviceTypes.generic.mode);
			self.nodeSettings.bleDeviceTypes.generic.serviceId(data.client.bleDeviceTypes.generic.serviceId);

			self.nodeSettings.bleDeviceTypes.ibeacon.name(data.client.bleDeviceTypes.ibeacon.name);
			self.nodeSettings.bleDeviceTypes.ibeacon.mode(data.client.bleDeviceTypes.ibeacon.mode);
			self.nodeSettings.bleDeviceTypes.ibeacon.serviceId(data.client.bleDeviceTypes.ibeacon.serviceId);

			self.iotcsSettings.debug(data.iotcs.debug);
			self.iotcsSettings.provisioningFile(data.iotcs.provisioningFile);
			self.iotcsSettings.provisioningPassword(data.iotcs.provisioningPassword);
			self.iotcsSettings.username(data.iotcs.username);
			self.iotcsSettings.password(data.iotcs.password);
			self.iotcsSettings.cwProjectId(data.iotcs.cwProjectId);
			self.iotcsSettings.cwManDownWhen.noMotionMinutes(data.iotcs.cwManDownWhen.noMotionMinutes);
			self.iotcsSettings.cwManDownWhen.alertFrequency(data.iotcs.cwManDownWhen.alertFrequency);
		}
	}

	/*
	* Returns a constructor for the ViewModel so that the ViewModel is constrcuted
	* each time the view is displayed.  Return an instance of the ViewModel if
	* only one instance of the ViewModel is needed.
	*/
	return new SettingsViewModel();
}
);
