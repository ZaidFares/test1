/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/*
 * This sample presents two sensors (humidity sensor and temperature sensor) to the IoT server.
 *
 * It uses the MessageDispatcher utility to send messages and to handle
 * resource requests from the server. Each sensor is an indirectly connected
 * device registered by the same client (a gateway).
 *
 * The sensors are polled every 3 seconds and the humidity and temperature are sent
 * as DATA messages to the server and ALERT messages are sent if if the alert condition is met.
 *
 * Also the temperature sensor can be powered on or off and the min and max temperature
 * can handle a reset using action handlers registered in the RequestDispatcher.
 *
 * The client is a gateway device using the advanced API.
 */

iotcs = require("device-library.node");
iotcs = iotcs({debug: true});

var temperatureIcdId = '_Sample_TS';
var humidityIcdId = '_Sample_HS';

var humidityPrevMaxThreshold = 0;
var humiditySensorAngle = 0;
var tempPrevMaxThreshold = 0;
var tempPrevMinThreshold = 0;
var temperatureSensorAngle = 0;

var storeFile = (process.argv[2]);
var storePassword = (process.argv[3]);

const LOWER_TEMP_LIMIT = -20;
const UPPER_TEMP_LIMIT = 80;

/**
 * This sample can be used with policies, or without policies. By default, the sample does not use
 * policies. Set the 'com_oracle_iot_sample_use_policy' environment variable to 'true' (without
 * quotes) to use policies.
 */
var usePolicy = (process.env.com_oracle_iot_sample_use_policy || null);

function genICDDetails(hardwareId){
    return {
        manufacturer: 'Sample',
        modelNumber: 'MN-'+hardwareId,
        serialNumber: 'SN-'+hardwareId
    };
}

function showUsage() {
    console.log(EOL + "Usage:");
    console.log(" run-device-node-sample.[sh,bat] advanced/GatewayDeviceSample.js <trusted assets file> <trusted assets password>" + EOL);
    console.log("To run the sample using device policies, supply the true parameter at the end:");
    console.log(" run-device-node-sample.[sh,bat] advanced/GatewayDeviceSample.js <trusted assets file> <trusted assets password> <optional_true>" + EOL);
}

/**
 * Generates a humidity value.
 *
 * @param {number} maxThreshold - The maximum threshold value.
 * @return A humidity value.
 */
function getHumidity(maxThreshold) {
    const hRangeMin = 0;
    const amplitude = (maxThreshold - hRangeMin) / 2;
    const delta = amplitude * Math.sin(humiditySensorAngle * (Math.PI / 180));
    let humidity;

    if (humiditySensorAngle === 90) {
        humidity = maxThreshold + 2;
    } else {
        humidity = Math.round(hRangeMin + amplitude + delta);
    }

    humiditySensorAngle = (humiditySensorAngle + 15) % 360;
    return humidity;
}


/**
 * Generates a temperature value.
 *
 * @param {number} minTemp - The minimum temperature.
 * @param {number} maxTemp - The maximum temperature.
 * @param {number} minThreshold - The minimum threshold value.
 * @param {number} maxThreshold - The maximum threshold value.
 * @return A temperature value.
 */
function getTemp(minTemp, maxTemp, minThreshold, maxThreshold) {
    const amplitude = (maxThreshold - minThreshold) / 2;
    // angle * (Math.PI / 180) is degrees to radians.
    const delta = amplitude * Math.sin(temperatureSensorAngle * (Math.PI / 180));

    let temp;

    if (temperatureSensorAngle === 90) {
        // Violate max threshold when angle is 90 degrees.
        temp = roundToNearest10th(maxThreshold + 2);
    } else if (temperatureSensorAngle == 180) {
        // Violate min threshold when angle is 180 degrees.
        temp = roundToNearest10th(minThreshold - 2);
    } else {
        temp = roundToNearest10th(minThreshold + amplitude + delta);
    }

    temperatureSensorAngle = (temperatureSensorAngle + 15) % 360;

    if (temp < minTemp) {
        minTemp = temp;
    }

    if (maxTemp < temp) {
        maxTemp = temp;
    }

    return temp;
}

/**
 * Round to nearest 10th.
 *
 * @param {number} value - The value to round.
 * @return The value, rounded to the nearest 10th.
 */
function roundToNearest10th(value) {
    if (value === 0) {
        return value;
    }

    return Math.round(value * 100) / 100;
}

function _getMethodForRequestMessage(requestMessage){
    var method = null;
    if (requestMessage.payload && requestMessage.payload.method) {
        method = requestMessage.payload.method.toUpperCase();
    }
    if (requestMessage.payload.headers && Array.isArray(requestMessage.payload.headers['x-http-method-override']) && (requestMessage.payload.headers['x-http-method-override'].length > 0)) {
        method = requestMessage.payload.headers['x-http-method-override'][0].toUpperCase();
    }
    return method;
}

function startHumidity(device, id) {
    var messageDispatcher = new iotcs.device.util.MessageDispatcher(device);

    var sensor = {
        humidity: 0,
        maxThreshold: 80
    };

    humidityPrevMaxThreshold = 80;

    var sendWithDevicePolicy = function () {
        sensor.humidity = getHumidity(sensor.maxThreshold);
        var message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(id)
            .format('urn:com:oracle:iot:device:humidity_sensor' + ":attributes")
            .dataItem('humidity', sensor.humidity);

        if (sensor.maxThreshold != humidityPrevMaxThreshold) {
            humidityPrevMaxThreshold = sensor.maxThreshold;
            message.dataItem('maxThreshold', sensor.maxThreshold);
        }

        messageDispatcher.offer(message);
        console.log('sent humidity DATA: ' + JSON.stringify(sensor));
    };

    var sendWithoutDevicePolicy = function () {
        sensor.humidity = getHumidity(sensor.maxThreshold);

        if (sensor.humidity > sensor.maxThreshold) {
            var message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:humidity_sensor:too_humid',
                'Sample alert when humidity reaches the maximum humidity threshold',
                iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);
            message.source(id);
            message.dataItem('humidity', sensor.humidity);
            messageDispatcher.queue(message);
            console.log('sent HUMIDITY ALERT: ' + sensor.humidity);
        }

        var message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(id)
            .format('urn:com:oracle:iot:device:humidity_sensor' + ":attributes")
            .dataItem('humidity', sensor.humidity);

        if (sensor.maxThreshold != humidityPrevMaxThreshold) {
            humidityPrevMaxThreshold = sensor.maxThreshold;
            message.dataItem('maxThreshold', sensor.maxThreshold);
        }

        messageDispatcher.queue(message);
        console.log('sent humidity DATA: ' + JSON.stringify(sensor));

        if (sensor.humidity > sensor.maxThreshold) {
            message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:humidity_sensor:too_humid',
                'Sample alert when humidity reaches the maximum humidity threshold',
                iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

            message.source(id).reliability('GUARANTEED_DELIVERY')
                .dataItem('humidity', sensor.humidity);

            messageDispatcher.queue(message);
            console.log('sent HUMIDITY ALERT: ' + sensor.humidity);
        }
    };

    if (usePolicy && (usePolicy === 'true')) {
        console.log('Using device policies.');
        setInterval(sendWithDevicePolicy, 5000);
    } else {
        setInterval(sendWithoutDevicePolicy, 5000);
    }

    var humAttributesHandler = function (requestMessage) {
        var method = _getMethodForRequestMessage(requestMessage);

        // The request body of a PUT looks like {"value":70}, and the attribute is suffixed to the
        // path.  The request body of a POST looks like {"minThreshold":-5, "maxThreshold":70}.
        if (!method || ((method !== 'PUT') && (method != 'PATCH'))) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 405, {},
                                                              'Method Not Allowed', '');
        }

        var isHumMaxThresholdValid = function (value) {
            return ((typeof value !== 'number') &&
                (value >= 60) || (value <= 100));
        };

        var hasError = false;
        var data = null;

        try {
            data = JSON.parse(new Buffer(requestMessage.payload.body, 'base64').toString());
            var value;

            if ((data.value !== undefined) && requestMessage.payload.url.endsWith('maxThreshold')) {
                value = data.value;
            } else if (data.maxThreshold !== undefined) {
                value = data.maxThreshold;
            } else {
                console.error('Trying to set attribute which does not exist: ' +
                              requestMessage.payload.body);

                hasError = true;
            }

            if (isHumMaxThresholdValid(value)) {
                console.log('Received UPDATE REQUEST for humidity maxThreshold: ' + value);
                humidityPrevMaxThreshold = sensor.maxThreshold;
                sensor.maxThreshold = value;
            } else {
                hasError = true;
            }
        } catch (e) {
            hasError = true;
        }

        if (!hasError) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 200, {}, 'OK', '');
        } else {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {}, 'Bad Request',
                                                              '');
        }
    };

    messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
        'deviceModels/urn:com:oracle:iot:device:humidity_sensor/attributes', humAttributesHandler);
}

function startTemperature(device, id) {
    var messageDispatcher = new iotcs.device.util.MessageDispatcher(device);

    var sensor = {
        temp: 0,
        minTemp: UPPER_TEMP_LIMIT,
        maxTemp: LOWER_TEMP_LIMIT,
        unit: 'Cel',
        minThreshold: 0,
        maxThreshold: 70,
        startTime: 0
    };

    tempPrevMinThreshold = 0;
    tempPrevMaxThreshold = 70;

    var sendWithDevicePolicy = function () {
        console.log('GatewayDeviceSample send sensor.temp = ' + sensor.temp);
        sensor.temp = getTemp(sensor.minTemp, sensor.maxTemp, sensor.minThreshold,
                              sensor.maxThreshold);

        if (sensor.temp < sensor.minTemp) {
            sensor.minTemp = sensor.temp;
        }

        if (sensor.temp > sensor.maxTemp) {
            sensor.maxTemp = sensor.temp;
        }

        var message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(id)
            .format('urn:com:oracle:iot:device:temperature_sensor' + ":attributes")
            .dataItem('temp', sensor.temp)
            .dataItem('unit', sensor.unit)
            .dataItem('minTemp', sensor.minTemp)
            .dataItem('maxTemp', sensor.maxTemp)
            .dataItem('startTime', sensor.startTime);

        if (sensor.minThreshold != tempPrevMinThreshold) {
            tempPrevMinThreshold = sensor.minThreshold;
            message.dataItem('minThreshold', sensor.minThreshold);
        }

        if (sensor.maxThreshold != tempPrevMaxThreshold) {
            tempPrevMaxThreshold = sensor.maxThreshold;
            message.dataItem('maxThreshold', sensor.maxThreshold);
        }

        messageDispatcher.offer(message);
        console.log('sent temperature DATA: ' + JSON.stringify(sensor));

        if (sensor.temp > sensor.maxThreshold) {
            message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:temperature_sensor:too_hot',
                'Temperature has reached the maximum temperature threshold',
                iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

            message.source(id)
                .reliability('GUARANTEED_DELIVERY')
                .dataItem('temp', sensor.temp)
                .dataItem('maxThreshold', sensor.maxThreshold)
                .dataItem('unit', sensor.unit);

            messageDispatcher.offer(message);
            console.log('sent TOO HOT ALERT: ' + JSON.stringify(sensor));
        }

        if (sensor.temp < sensor.minThreshold) {
            message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:temperature_sensor:too_cold',
                'Temperature has reached the minimum temperature threshold',
                iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

            message.source(id)
                .reliability('GUARANTEED_DELIVERY')
                .dataItem('temp', sensor.temp)
                .dataItem('minThreshold', sensor.minThreshold)
                .dataItem('unit', sensor.unit);

            messageDispatcher.offer(message);
            console.log('sent TOO COLD ALERT: ' + JSON.stringify(sensor));
        }
    };

    var sendWithoutDevicePolicy = function () {
        sensor.temp = getTemp(sensor.minTemp, sensor.maxTemp, sensor.minThreshold,
                              sensor.maxThreshold);

        if (sensor.temp < sensor.minTemp) {
            sensor.minTemp = sensor.temp;
        }

        if (sensor.temp > sensor.maxTemp) {
            sensor.maxTemp = sensor.temp;
        }

        var message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(id)
            .format('urn:com:oracle:iot:device:temperature_sensor' + ":attributes")
            .dataItem('temp', sensor.temp)
            .dataItem('unit', sensor.unit)
            .dataItem('minTemp', sensor.minTemp)
            .dataItem('maxTemp', sensor.maxTemp)
            .dataItem('startTime', sensor.startTime)

        if (sensor.minThreshold != tempPrevMinThreshold) {
            tempPrevMinThreshold = sensor.minThreshold;
            message.dataItem('minThreshold', sensor.minThreshold);
        }

        if (sensor.maxThreshold != tempPrevMaxThreshold) {
            tempPrevMaxThreshold = sensor.maxThreshold;
            message.dataItem('maxThreshold', sensor.maxThreshold);
        }

        messageDispatcher.queue(message);
        console.log('sent temperature DATA: ' + JSON.stringify(sensor));

        if (sensor.temp > sensor.maxThreshold) {
            message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:temperature_sensor:too_hot',
                'Temperature has reached the maximum temperature threshold',
                 iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

            message.source(id)
                .reliability('GUARANTEED_DELIVERY')
                .dataItem('temp', sensor.temp)
                .dataItem('maxThreshold', sensor.maxThreshold)
                .dataItem('unit', sensor.unit)

            messageDispatcher.queue(message);
            console.log('sent TOO HOT ALERT: ' + JSON.stringify(sensor));
        }

        if (sensor.temp < sensor.minThreshold) {
           message = iotcs.message.Message.AlertMessage.buildAlertMessage('urn:com:oracle:iot:device:temperature_sensor:too_cold',
               'Temperature has reached the minimum temperature threshold',
               iotcs.message.Message.AlertMessage.Severity.SIGNIFICANT);

            message.source(id)
                .reliability('GUARANTEED_DELIVERY')
                .dataItem('temp', sensor.temp)
                .dataItem('minThreshold', sensor.minThreshold)
                .dataItem('unit', sensor.unit);

            messageDispatcher.queue(message);
            console.log('sent TOO COLD ALERT: ' + JSON.stringify(sensor));
        }
    };

    sensor.startTime = Date.now();
    var usePolicy = true;
    var timer;

    if (usePolicy && (usePolicy === 'true')) {
        timer = setInterval(sendWithDevicePolicy, 5000);
    } else {
        timer = setInterval(sendWithoutDevicePolicy, 5000);
    }

    var tempAttributesHandler = function (requestMessage) {
        var method = _getMethodForRequestMessage(requestMessage);

        // The request body of a PUT looks like {"value":70}, and the attribute is suffixed to the
        // path.  The request body of a POST looks like {"minThreshold":-5, "maxThreshold":70}.  The
        // only attributes which will make it to this handler are the min/maxThreshold attributes.
        if (!method || ((method !== 'PUT') && (method != 'PATCH'))) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 405, {},
                                                              'Method Not Allowed', '');
        }

        var isTempMaxThresholdValid = function (value) {
            return ((typeof value !== 'number') &&
                (value >= 65) || (value <= 80));
        };

        var isTempMinThresholdValid = function (value) {
            return ((typeof value !== 'number') &&
                (value >= -20) || (value <= 0));
        };

        var hasError = false;
        var data = null;

        try {
            data = JSON.parse(new Buffer(requestMessage.payload.body, 'base64').toString());

            if (data.value !== undefined) {
                if (requestMessage.payload.url.endsWith('minThreshold') &&
                    this.isMinThresholdValid(data.minThreshold))
                {
                    tempPrevMinThreshold = sensor.minThreshold;
                    sensor.minThreshold = data.value;
                } else if (self.isMaxThresholdValid(data.maxThreshold)) {
                    tempPrevMaxThreshold = sensor.maxThreshold;
                    sensor.maxThreshold = data.value;
                }
            } else {
                if (data.minThreshold !== undefined) {
                    if (isTempMinThresholdValid(data.minThreshold)) {
                        console.log('Received UPDATE REQUEST for temperature minThreshold: ' +
                                    data.minThreshold);
                        tempPrevMinThreshold = sensor.minThreshold;
                        sensor.minThreshold = data.minThreshold;
                    } else {
                        hasError = true;
                    }
                }

                if (data.maxThreshold !== undefined) {
                    if (isTempMaxThresholdValid(data.maxThreshold)) {
                        console.log('Received UPDATE REQUEST for temperature maxThreshold: ' +
                                    data.maxThreshold);
                        tempPrevMaxThreshold = sensor.maxThreshold;
                        sensor.maxThreshold = data.maxThreshold;
                    } else {
                        hasError = true;
                    }
                }
            }
        } catch (e) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {}, 'Bad Request',
                                                              '');
        }

        if (!hasError) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 200, {}, 'OK', '');
        } else {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {}, 'Bad Request',
                                                              '');
        }
    };

    messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
        'deviceModels/urn:com:oracle:iot:device:temperature_sensor/attributes',
        tempAttributesHandler);

    var actionsHandler = function (requestMessage) {
        var method = _getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'POST')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 405, {}, 'Method Not Allowed', '');
        }

        var urlAction = requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

        if (urlAction === 'power') {
            var data = null;

            try {
                data = JSON.parse(new Buffer(requestMessage.payload.body, 'base64').toString());
            } catch (e) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {}, 'Bad Request', '');
            }

            if (!data || (data.value === undefined) || (typeof data.value !== 'boolean')) {
                return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {}, 'Bad Request', '');
            }

            console.log('Received POWER ACTION with: ' + data.value);

            if (data.value === true) {
                if (!timer) {
                    sensor.startTime = Date.now();

                    if (usePolicy && (usePolicy === 'true')) {
                        timer = setInterval(sendWithDevicePolicy, 5000);
                    } else {
                        timer = setInterval(sendWithoutDevicePolicy, 5000);
                    }
                }
            } else {
                clearInterval(timer);
                timer = null;
            }
        } else {
            console.log('received RESET ACTION');
            sensor.minTemp = UPPER_TEMP_LIMIT;
            sensor.maxTemp = LOWER_TEMP_LIMIT;
            sensor.startTime = Date.now();
        }

        return iotcs.message.Message.buildResponseMessage(requestMessage, 200, {}, 'OK', '');
    };

    messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
        'deviceModels/urn:com:oracle:iot:device:temperature_sensor/actions/reset',
        actionsHandler);

    messageDispatcher.getRequestDispatcher().registerRequestHandler(id,
        'deviceModels/urn:com:oracle:iot:device:temperature_sensor/actions/power',
        actionsHandler);
}


function deviceEnroll(device) {
    // If the user gave a hardware id for the temperature sensor,
    // then - for the purposes of this sample - the device is
    // considered to be controlled roaming. This allows the sample
    // to be run and implicitly register an ICD and have that ICD
    // be able to roam to other GatewayDeviceSamples - provided the
    // ICD has been provisioned to the gateway device's trusted assets.
    // Please refer to the documentation for registerDevice for
    // more information.

    // If the user gave a hardware id for the temperature sensor,
    // then restrict the sensor to this gateway. This means that
    // the sensor cannot be connected through other gateways.
    var temperatureSensorRestricted = process.argv.length > 4;
    var temperatureSensorHardwareId = temperatureSensorRestricted ? process.argv[4] : device.getEndpointId() + temperatureIcdId;
    device.registerDevice(temperatureSensorRestricted, temperatureSensorHardwareId, genICDDetails(temperatureSensorHardwareId),
        ['urn:com:oracle:iot:device:temperature_sensor'], function (id, error) {
        if (error) {
            console.log('----------------ERROR ON DEVICE REGISTRATION----------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        if (id) {
            console.log('------------------TEMPERATURE DEVICE------------------');
            console.log(id);
            console.log('------------------------------------------------------');
            startTemperature(device, id);
        }
    });

    // If the user gave a hardware id for the humidity sensor,
    // then restrict the sensor to this gateway. This means that
    // the sensor cannot be connected through other gateways.
    var humiditySensorRestricted = process.argv.length > 5;
    var humiditySensorHardwareId = humiditySensorRestricted ? process.argv[5] : device.getEndpointId() + humidityIcdId;
    device.registerDevice(humiditySensorRestricted, humiditySensorHardwareId, genICDDetails(humiditySensorHardwareId),
        ['urn:com:oracle:iot:device:humidity_sensor'], function (id, error) {
        if (error) {
            console.log('----------------ERROR ON DEVICE REGISTRATION----------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        if (id) {
            console.log('------------------HUMIDITY DEVICE---------------------');
            console.log(id);
            console.log('------------------------------------------------------');
            startHumidity(device, id);
        }
    });
}

var gateway = new iotcs.device.util.GatewayDevice(storeFile, storePassword);

if (gateway.isActivated()) {
    deviceEnroll(gateway);
} else {
    gateway.activate([], function (device, error) {
        if (error) {
            console.log('-----------------ERROR ON ACTIVATION------------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            showUsage();
            process.exit(1);
        }

        gateway = device;

        if (gateway.isActivated()) {
            deviceEnroll(gateway);
        }
    });
}
