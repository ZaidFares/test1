/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

/* global define  $  */
define(['ojs/ojcore', ''],
	function () {
		var servicesInstance = null;
		function Services() {
			let self = this;
			self.getNodes = getNodes;
			self.getSettings = getSettings;
			self.updateSettings = updateSettings;
			self.restartServer = restartServer;
			self.rebootGateway	= rebootGateway;
			self.powerOffGateway = powerOffGateway;
			self.restartNode = restartNode;
			self.rebootNode	= rebootNode;
			self.powerOffNode = powerOffNode;
			self.getProjects = getProjects;
			self.getLocations = getLocations;
			self.updateConfigData = updateConfigData;
			self.getCachedNodes = getCachedNodes;
			self._nodesCache = {};

			self.setSocket = function(socket) {
				self.socket = socket;
			};
			/**
			 * Get all connected nodes
			 *
			 * @returns {Promise}   List of nodes
			 */
			function getNodes() {
				return new Promise((resolve, reject) => {
					$.getJSON('/api/nodes', (data) => {
						// Save the node info for ssh and logs.
						data.forEach(node => {
							self._nodesCache[node.clientId] = {
								id: node.clientId,
								name: node.identity.configData.id,
								location: node.identity.configData.location,
								ipAddress: node.identity.ipAddress.address
							};
						});
						resolve(data);
					}).
						fail((err) => reject(err));
				});
			}

			/**
			 * Get the cached nodes
			 */
			function getCachedNodes() {
				return self._nodesCache;
			}

			function getSettings() {
				return new Promise((resolve, reject) => {
					$.getJSON('/api/settings', (data) => {
						resolve(data);
					}).
						fail((err) => reject(err));
				});
			}

			function getProjects() {
				return new Promise((resolve, reject) => {
					$.getJSON('/api/projects', (data) => resolve(data.items)).fail((err) => reject(err));
				});
			}

			function getLocations() {
				return new Promise((resolve, reject) => {
					$.getJSON('/api/locations', (data) => resolve(data)).fail((err) => reject(err));
				});
			}

			function updateConfigData(data) {
				return new Promise((resolve, reject) => {
					$.ajax({
						type: 'PUT',
						contentType: 'application/json',
						dataType: 'json',
						data: JSON.stringify(data),
						url: `/api/nodes/${encodeURIComponent(data.clientId)}/config`
					}).
						done((data) => resolve(data)).
						fail((err) => reject(err));
				});
			}
			function _gatewayControl(action) {
				return new Promise((resolve, reject) => {
					$.ajax({
						type: 'POST',
						contentType: 'application/json',
						dataType: 'json',
						url: `/api/control/gw?action=${action}`
					}).
						done((data) => resolve(data)).
						fail((err) => reject(err));
				});
			}

			function _nodeControl(action, clientId) {
				return new Promise((resolve, reject) => {
					$.ajax({
						type: 'POST',
						contentType: 'application/json',
						dataType: 'json',
						url: `/api/control/node/${encodeURIComponent(clientId)}?action=${action}`
					}).
						done((data) => resolve(data)).
						fail((err) => reject(err));
				});
			}

			function restartServer() {
				return _gatewayControl('restart');
			}

			function rebootGateway() {
				return _gatewayControl('reboot');
			}

			function powerOffGateway() {
				return _gatewayControl('poweroff');
			}

			function restartNode(clientId) {
				return _nodeControl('restart', clientId);
			}

			function rebootNode(clientId) {
				return _nodeControl('reboot', clientId);
			}

			function powerOffNode(clientId) {
				return _nodeControl('poweroff', clientId);
			}

			function updateSettings(settings) {
				return new Promise((resolve, reject) => {
					$.ajax({
						type: 'PUT',
						contentType: 'application/json',
						dataType: 'json',
						data: JSON.stringify(settings),
						url: '/api/settings'
					}).
						done((data) => resolve(data)).
						fail((err) => reject(err));
				});
			}

		}
		if (servicesInstance === null) {
			servicesInstance = new Services();
		}
		return servicesInstance;
	});
