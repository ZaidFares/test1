/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs = require("enterprise-library.node");
iotcs = iotcs({debug: true});

var EOL = require('os').EOL;
var fs = require('fs');
var path = require("path");

models = {
    'urn:com:oracle:iot:device:humidity_sensor': null,
    'urn:com:oracle:iot:device:temperature_sensor': null,
    'urn:com:oracle:iot:device:motion_activated_camera': null
};

var args = process.argv.slice(2);
var client = null;
var command = '';
let deviceIds = [];
var trustFile = args[0];
var trustPass = args[1];

function showUsage(){
    console.log("Usage:");
    console.log("node " + process.argv[1] + " <trusted assets file> <trusted assets password>" + EOL);

    console.log("  List all devices or all device-applications." + EOL);

    console.log(" <deviceId>[,<deviceId>]");
    console.log("  Monitor virtual device(s) & print its measurements every");
    console.log("  time it changes, until return key is pressed" + EOL);

    console.log(" <deviceId> <reset|on|off>");
    console.log("  Reset the thermometer or turn on thermometer or ");
    console.log("  turn off the thermometer." + EOL);

    console.log(" <deviceId> <maxThreshold>");
    console.log("  Set the maximum threshold." + EOL);

    console.log(" <deviceId> <maxThreshold> <minThreshold>");
    console.log("  Set the maximum and minimum temperature thresholds." + EOL);

    console.log(" <deviceId> record <duration>");
    console.log("  Record at least <duration> seconds of video from a motion activated camera." + EOL);

    console.log(" <deviceId> scheduleRecording <duration> <delay>");
    console.log("  Record at least <duration> seconds of video from a motion activated camera beginning <delay> seconds from now." + EOL);
}

if (args.length < 2) {
   showUsage();
   return;
} else if (args.length === 2) {
   command = 'listDevices';
} else {
   // The third arg is a comma separated list of endpoint ids,
   // e.g., <endpointId-1>[,<endpointId-2>]*
   deviceIds = args[2].split(',');

   if (args.length === 3) {
      command = 'monitorDevices';
   } else if (args.length === 4) {
      // The fourth arg is either an action or the max threshold setting.
      if (args[3] === 'reset') {
         command = 'reset';
      } else if (args[3] === 'on') {
         command = 'on';
      } else if (args[3] === 'off') {
         command = 'off';
      } else if (isNaN(Number(args[3]))) {
          showUsage();
          return;
      } else {
         command = 'setMaxThreshold';
      }
   } else if (args.length === 5) {
      if (args[3] === 'record') {
         command = 'record';
      } else if (isNaN(Number(args[4]))) {
          showUsage();
          return;
      } else {
         command = 'setMinMaxThreshold';
      }
   } else if (args.length === 6) {
      command = 'scheduleRecording';
   } else {
      showUsage();
      return;
   }
}

function getSupportedDeviceModel(response) {
    if (Array.isArray(response.items)
        && response.items.length
        && Array.isArray(response.items[0].deviceModels)
        && response.items[0].deviceModels.length) {
        var deviceModelUrn = "";

        for (var index in response.items[0].deviceModels) {
            if (Object.keys(models).indexOf(response.items[0].deviceModels[index].urn) > -1) {
                deviceModelUrn = response.items[0].deviceModels[index].urn;
                break;
            }
        }

        return deviceModelUrn;
    }

    return "";
}

function syncCallback (event) {
    var virtualDevice = event.getVirtualDevice();
    var storage = event.getSource();
    var eventName = event.getName();
    var consoleMsg = EOL + new Date().toISOString() + " : " + virtualDevice.getEndpointId() +
          " : onSync : " + eventName + " : "+ storage.getURI() + " = \"" + storage.getSyncStatus() +
          "\"";

    if (storage.getSyncStatus() === iotcs.enterprise.StorageObject.SyncStatus.IN_SYNC) {
        consoleMsg += " (" + storage.getLength() + " bytes)";
    }

    consoleMsg += " into " + storage.getOutputPath();
    console.log(consoleMsg);
}

function getDeviceModels(client, callback) {
    client.getDeviceModel('urn:com:oracle:iot:device:humidity_sensor', function (response, error) {
        if (error) {
            console.log('-------------ERROR ON GET HUMIDITY DEVICE MODEL-------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            client.close();
        }

        models['urn:com:oracle:iot:device:humidity_sensor'] = response;

        client.getDeviceModel('urn:com:oracle:iot:device:temperature_sensor', function (response, error){
            if (error) {
                console.log('-------------ERROR ON GET TEMPERATURE DEVICE MODEL----------');
                console.log(error.message);
                console.log('------------------------------------------------------------');
                client.close();
            }

            models['urn:com:oracle:iot:device:temperature_sensor'] = response;

            client.getDeviceModel('urn:com:oracle:iot:device:motion_activated_camera', function (response, error) {
                if (error) {
                    console.log('-------------ERROR ON GET MOTION ACTIVATED CAMERA DEVICE MODEL----------');
                    console.log(error.message);
                    console.log('------------------------------------------------------------');
                    client.close();
                }

                models['urn:com:oracle:iot:device:motion_activated_camera'] = response;

                if (callback) {
                    callback();
                }
            });
        });
    });
}

iotcs.enterprise.EnterpriseClient.newClient(function (entClient, error) {
    if (error) {
        console.log('-------------ERROR ON CREATING CLIENT-----------------------');
        console.log(error.message);
        console.log('------------------------------------------------------------');
        return;
    }

    client = entClient;

    if (command === 'listDevices') {
        var finish = 0;
        var recursive;

        recursive = function (pageable, sensorName, first) {
            pageable.page(first ? 'first' : 'next').then(function (response) {
                if (Array.isArray(response.items)) {
                    response.items.forEach(function (item) {
                        console.log(item.id + " " + sensorName);
                    });
                }

                if (response.hasMore) {
                    recursive(pageable, sensorName, false);
                } else {
                    finish++;

                    if (finish === 2) {
                        client.close();
                    }
                }
            }, function (error) {
                if (error) {
                    console.log('-------------ERROR ON LISTING DEVICES-----------------------');
                    console.log(error.message);
                    console.log('------------------------------------------------------------');
                }

                client.close();
                process.exit(0);
            });
        };

        recursive(client.getActiveDevices('urn:com:oracle:iot:device:humidity_sensor'),
            "[Humidity Sensor]", true);
        recursive(client.getActiveDevices('urn:com:oracle:iot:device:temperature_sensor'),
            "[Temperature Sensor]", true);
        recursive(client.getActiveDevices('urn:com:oracle:iot:device:motion_activated_camera'),
            "[Motion Activated Camera]", true);
    } else {
        getDeviceModels(client, function () {
            deviceIds.forEach(function (deviceId) {
                var filter = new iotcs.enterprise.Filter();
                filter = filter.eq('id', deviceId);

                client.getDevices(filter).page('first').then(function (response) {
                    var deviceModelUrn;

                    if ((deviceModelUrn = getSupportedDeviceModel(response))) {
                        var device = client.createVirtualDevice(response.items[0].id,
                           models[deviceModelUrn]);

                        if (command === 'monitorDevices') {
                            device.onChange = function (tupples) {
                                tupples.forEach(function (tupple) {
                                   var show = {
                                      deviceId: tupple.attribute.device.getEndpointId(),
                                      attribute: tupple.attribute.id,
                                      newValue: null
                                   };

                                   show.newValue = (tupple.newValue instanceof iotcs.StorageObject) ?
                                         tupple.newValue.getURI() : tupple.newValue;

                                   console.log('---------------------ON CHANGE---------------------------');
                                   console.log(JSON.stringify(show, null, 4));
                                   console.log('---------------------------------------------------------');

                                if (tupple.newValue instanceof iotcs.StorageObject) {
                                    var storage = tupple.newValue;
                                    var dir = path.join(".", "downloads");

                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }

                                    storage.setOutputPath(path.join(dir, storage.getName()));
                                    storage.onSync = syncCallback;
                                    storage.sync();
                                }
                            });
                        };

                           device.onAlerts = function (alertsObject) {
                              for (var formatUrn in alertsObject) {
                                 alertsObject[formatUrn].forEach(function (object) {
                                    var show = {
                                       alert: formatUrn,
                                       fields: object.fields
                                    };

                                    console.log('---------------------ON ALERT----------------------------');
                                    console.log(JSON.stringify(show, null, 4));
                                    console.log('---------------------------------------------------------');
                                 });
                              }
                           };
                        } else {
                            switch (command) {
                                case 'reset': {
                                    if (device.reset) {
                                        device.reset.onAction = function (response) {
                                            console.log('---------------------ON RESET----------------------------');
                                            console.log(JSON.stringify(response, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.call('reset');
                                    } else {
                                        console.log('----------------------ERROR ON ACTION--------------------');
                                        console.log('reset action not found in device model.');
                                        console.log('---------------------------------------------------------');
                                    }

                                    break;
                                }
                                case 'on': {
                                    if (device.power) {
                                        device.power.onAction = function (response) {
                                            console.log('---------------------ON POWER ON-------------------------');
                                            console.log(JSON.stringify(response, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.call('power', true);
                                    } else {
                                        console.log('----------------------ERROR ON ACTION--------------------');
                                        console.log('power action not found in device model.');
                                        console.log('---------------------------------------------------------');
                                    }

                                    break;
                                }
                                case 'off': {
                                    if (device.power) {
                                        device.power.onAction = function (response) {
                                            console.log('---------------------ON POWER OFF------------------------');
                                            console.log(JSON.stringify(response, null, 4));
                                            console.log('---------------------------------------------------------');
                                            client.close();
                                        };

                                        device.call('power', false);
                                    } else {
                                        console.log('----------------------ERROR ON ACTION--------------------');
                                        console.log('power action not found in device model.');
                                        console.log('---------------------------------------------------------');
                                        client.close();
                                    }

                                    break;
                                }
                                case 'record': {
                                    // if duration is not set then use minimal duration 1 second
                                    var duration = parseInt(args[4]) || 1;

                                    if (device.record) {
                                        device['urn:com:oracle:iot:device:motion_activated_camera:recording'].onData = function (data) {
                                            var show = data;
                                            var storage = data[0].fields.video;
                                            show[0].fields.video = storage.getURI();
                                            console.log('---------------------ON RECORDING------------------------');
                                            console.log(JSON.stringify(show, null, 4));
                                            console.log('---------------------------------------------------------');

                                            var dir = path.join(".", "downloads");

                                            if (!fs.existsSync(dir)) {
                                                fs.mkdirSync(dir);
                                            }

                                            storage.setOutputPath(path.join(dir, storage.getName()));
                                            storage.onSync = syncCallback;
                                            storage.sync();
                                        };

                                        device.record.onAction = function (response) {
                                            console.log('---------------------ON RECORD---------------------------');
                                            console.log(JSON.stringify(response, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.call('record', duration);
                                    } else {
                                        console.log('----------------------ERROR ON ACTION--------------------');
                                        console.log('record action not found in device model.');
                                        console.log('---------------------------------------------------------');
                                    }

                                    break;
                                }
                                case 'scheduleRecording': {
                                    var duration = parseInt(args[4]);
                                    var delay = parseInt(args[5]);

                                    if (device.scheduleRecording) {
                                        device['urn:com:oracle:iot:device:motion_activated_camera:recording'].onData = function (data) {
                                            var show = data;
                                            var storage = data[0].fields.video;
                                            show[0].fields.video = storage.getURI();
                                            console.log('---------------------ON SCHEDULE RECORDING------------------------');
                                            console.log(JSON.stringify(show, null, 4));
                                            console.log('------------------------------------------------------------------');

                                            var dir = path.join(".", "downloads");

                                            if (!fs.existsSync(dir)) {
                                                fs.mkdirSync(dir);
                                            }

                                            storage.setOutputPath(path.join(dir, storage.getName()));
                                            storage.onSync = syncCallback;
                                            storage.sync();
                                        };

                                        device.scheduleRecording.onAction = function (response) {
                                            console.log('---------------------ON SCHEDULE RECORDING---------------------------');
                                            console.log(JSON.stringify(response, null, 4));
                                            console.log('---------------------------------------------------------------------');
                                        };

                                        const startTime = new Date(new Date().getMilliseconds() +
                                            (delay * 1000));

                                        device.createAction("scheduleRecording")
                                            .set("duration", duration)
                                            .set("startTime", startTime)
                                            .call();
                                    } else {
                                        console.log('----------------------ERROR ON ACTION--------------------');
                                        console.log('scheduleRecording action not found in device model.');
                                        console.log('---------------------------------------------------------');
                                    }

                                    break;
                                }
                                case 'setMaxThreshold': {
                                    var max = args[3];

                                    if (device.maxThreshold) {
                                        device.maxThreshold.onChange = function (tupple) {
                                            var show = {
                                                deviceId: tupple.attribute.device.getEndpointId(),
                                                attribute: tupple.attribute.id,
                                                newValue: tupple.newValue
                                            };
                                            console.log('---------------------ON CHANGE---------------------------');
                                            console.log(JSON.stringify(show, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.maxThreshold.onError = function (tupple) {
                                            console.log('-----ERROR ON UPDATE ATTRIBUTE MAX THRESHOLD-------------');
                                            console.log(JSON.stringify(tupple.errorResponse, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.update({maxThreshold: parseInt(max)});
                                    } else {
                                        console.log('------------ERROR ON UPDATE ATTRIBUTE--------------------');
                                        console.log('maxThreshold attribute not found in device model.');
                                        console.log('---------------------------------------------------------');
                                    }

                                    break;
                                }
                                case 'setMinMaxThreshold': {
                                    var max = args[3];
                                    var min = args[4];

                                    if (device.maxThreshold && device.minThreshold) {
                                        device.maxThreshold.onChange = function (tupple) {
                                            var show = {
                                                deviceId: tupple.attribute.device.getEndpointId(),
                                                attribute: tupple.attribute.id,
                                                newValue: tupple.newValue
                                            };

                                            console.log('---------------------ON CHANGE---------------------------');
                                            console.log(JSON.stringify(show, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.minThreshold.onChange = function (tupple) {
                                            var show = {
                                                deviceId: tupple.attribute.device.getEndpointId(),
                                                attribute: tupple.attribute.id,
                                                newValue: tupple.newValue
                                            };

                                            console.log('---------------------ON CHANGE---------------------------');
                                            console.log(JSON.stringify(show, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.maxThreshold.onError = function (tupple) {
                                            console.log('-----ERROR ON UPDATE ATTRIBUTE MAX THRESHOLD-------------');
                                            console.log(JSON.stringify(tupple.errorResponse, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.minThreshold.onError = function (tupple) {
                                            console.log('-----ERROR ON UPDATE ATTRIBUTE MIN THRESHOLD-------------');
                                            console.log(JSON.stringify(tupple.errorResponse, null, 4));
                                            console.log('---------------------------------------------------------');
                                        };

                                        device.update({
                                            maxThreshold: parseInt(max),
                                            minThreshold: parseInt(min)
                                        });
                                    } else {
                                        console.log('-----------------------ERROR ON UPDATE ATTRIBUTE---------------------');
                                        console.log('minThreshold and/or maxThreshold attribute not found in device model.');
                                        console.log('---------------------------------------------------------------------');
                                    }

                                    break;
                                }
                            }
                        }
                    } else {
                        console.log('-------------ERROR ON GETTING DEVICE DATA-------------------');
                        console.log('Invalid device or invalid device model for device.');
                        console.log('------------------------------------------------------------');
                        client.close();
                        process.exit(0);
                    }
                }, function (response, error) {
                    if (error) {
                        console.log('-------------ERROR ON GETTING DEVICE DATA-------------------');
                        console.log(error.message);
                        console.log('------------------------------------------------------------');
                    }

                    client.close();
                    process.exit(0);
                });
            });

            console.log("Press Ctr + C to exit...");
        });
    }
}, trustFile, trustPass);
