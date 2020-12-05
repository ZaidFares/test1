/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This sample demonstrates the iotcs.device.StorageObject and related API.
 *
 * The sample uses the messaging API to simulate a motion activated camera.
 * An image is uploaded to the storage cloud every 5 seconds.
 * The sample also handles the "recording" action.
 */

iotcs = require("device-library.node");
iotcs = iotcs({debug: true});

var fs = require('fs');
var EOL = require('os').EOL;
var path = require('path');

var MOTION_ACTIVATED_CAMERA_MODEL_URN = 'urn:com:oracle:iot:device:motion_activated_camera';
var IMAGE_ATTRIBUTE = 'image';
var IMAGE_TIME_ATTRIBUTE = 'imageTime';
var MESSAGE_TIMEOUT = 5;

var storeFile = (process.argv[2]);
var storePassword = (process.argv[3]);

var resourcesFolder = process.argv[1].substring(0, process.argv[1].lastIndexOf(path.sep));
var imagesFolder = path.join(resourcesFolder, 'images');
var videosFolder = path.join(resourcesFolder, 'videos');

var images = [];
var videos = [];

var motionActivatedCameraModel;

function showUsage() {
    console.log(EOL + 'Usage:');
    console.log(' run-device-node-sample.[sh,bat] MotionActivatedCameraSample.js <trusted assets file> <trusted assets password>');
    console.log('Note:');
    console.log(' Images and videos used by sample are expected to be in ' + path.join('iotcs', 'csl', 'js') + ' samples folder' + EOL);
}

function getMilliseconds(sec) {
    return sec * 1000;
}

function startMotionActivatedCamera(device, id) {
    var imageIndex = 0;
    var motionActivatedCamera = {};
    motionActivatedCamera[IMAGE_ATTRIBUTE] = null;
    motionActivatedCamera[IMAGE_TIME_ATTRIBUTE] = null;

    var virtualMotionActivatedCamera = device.createVirtualDevice(id, motionActivatedCameraModel);

    virtualMotionActivatedCamera.onChange = function (tuples) {
        tuples.forEach( function (tuple) {
            var show = {
                name: tuple.attribute.id,
                lastUpdate: tuple.attribute.lastUpdate,
                oldValue: tuple.oldValue,
                newValue: tuple.newValue
            };
            console.log('---------------------ON CHANGE CAMERA-----------------------');
            console.log(JSON.stringify(show, null, 4));
            console.log('------------------------------------------------------------');
            motionActivatedCamera[tuple.attribute.id] = tuple.newValue;
        });
    };

    virtualMotionActivatedCamera.onError = function (tuple) {
        var show = {
            newValues: tuple.newValues,
            tryValues: tuple.tryValues,
            errorResponse: tuple.errorResponse.message
        };
        console.log('-----------------------ON ERROR CAMERA---------------------');
        console.log(JSON.stringify(show,null,4));
        console.log('-----------------------------------------------------------');
        for (var key in tuple.newValues) {
            motionActivatedCamera[key] = tuple.newValues[key];
        }
    };

    var dataOnErrorCallback = function(error) {
        console.log('------------------Error sending data!---------------------');
        console.log(error);
        console.log('-----------------------------------------------------------');
    };

    var syncCallback = function (event) {
        var virtualDevice = event.getVirtualDevice();
        var storage = event.getSource();
        var eventName = event.getName();

        var consoleMsg = EOL + new Date() + ' : ' + virtualDevice.getEndpointId()
            + ' : onSync : ' + eventName + ' : ' + storage.getURI() + ' = "' +
              storage.getSyncStatus() + '"';

        if (storage.getSyncStatus() === iotcs.device.StorageObject.SyncStatus.IN_SYNC) {
            consoleMsg += ' (' + storage.getLength() + ' bytes)';
        }

        console.log(consoleMsg);
    };

    var sendVideo = function (virtDev, duration, startTime) {
        // assumes videos.length > 0 and videos are 15 second increments.
        var video = videos[Math.min(duration/15 - 1, videos.length - 1)];
        // The name of video will be automatically prefixed with the device's endpoint ID and "/".
        // If the com.oracle.iot.client.disable_storage_object_prefix property is set to true, you
        // may want to include the endpoint ID in the video name like so:
        // virtualMotionActivatedCamera.getEndpointId() + "/" + video, "video/mp4");
        var storage = device.createStorageObject(video, 'video/mp4');
        storage.setInputPath(path.join(videosFolder, video));
        storage.onSync = syncCallback;
        storage.setCustomMetadata('duration', duration);

        var data = virtDev.createData(MOTION_ACTIVATED_CAMERA_MODEL_URN + ':recording');
        data.fields.video = storage;
        data.fields.startTime = startTime ? startTime : new Date();
        data.fields.duration = duration;
        data.onError = dataOnErrorCallback;
        data.submit();

        console.log(EOL + new Date() + ' : ' + virtDev.getEndpointId()
            + ' : DATA : "recording"=' + storage.getName());
    };

    /**
     * Executes the recording action when this device is called to record.  This demonstrates
     * handling an action with a single argument.
     *
     * @param {ActionEvent} event An ActionEvent.
     */
    virtualMotionActivatedCamera.record.onAction = function (event) {
        let virtDev = event.getVirtualDevice();
        let args = event.getNamedValue();
        let d = args.getValue();   // @type {number}

        if ((typeof d !== 'number') || (d <= 0)) {
            return;
        }

        // Round to nearest increment of 15.
        let duration = Math.ceil(d / 15) * 15;

        console.log(EOL + new Date() + ' : ' + virtDev.getEndpointId() + ' : Call : record ' +
            duration);

        setTimeout(sendVideo, getMilliseconds(duration), virtDev, duration);
    };

    /**
     * Executes the scheduleRecording action when this device is called to schedule a recording.
     * This demonstrates handling an action with multiple arguments.
     *
     * @param {ActionEvent} event - An ActionEvent.
     */
    virtualMotionActivatedCamera.scheduleRecording.onAction = function (event) {
        let virtDev = event.getVirtualDevice();
        let duration;
        let startTime;

        for (let argument = event.getNamedValue(); argument != null; argument = argument.next()) {
            if ('duration' == argument.getName()) {
                let d = argument.getValue();

                if ((typeof d == 'number') && (d > 0)) {
                    // Round to nearest increment of 15.
                    duration = Math.ceil(d / 15) * 15;
                }
            } else if ('startTime' == argument.getName()) {
                startTime = argument.getValue();
            }
        }

        console.log(EOL + new Date() + ' : ' + virtDev.getEndpointId() +
            ' : Call : scheduleRecording "startTime"=' + startTime +
            ', "duration"=' + duration);

        setTimeout(sendVideo, getMilliseconds(duration), virtDev, duration, startTime);
    };

    var sendImage = function () {
        var image = images[imageIndex++ % images.length];
        // The name of image will be automatically prefixed with the device's endpoint ID and "/".
        // If the com.oracle.iot.client.disable_storage_object_prefix property is set to true, you
        // may want to include the endpoint ID in the image name like so:
        // virtualMotionActivatedCamera.getEndpointId() + "_" + image, "image/jpeg");
        var storage = device.createStorageObject(image, 'image/jpeg');
        storage.setInputPath(path.join(imagesFolder, image));
        storage.onSync = syncCallback;

        motionActivatedCamera[IMAGE_ATTRIBUTE] = storage;
        motionActivatedCamera[IMAGE_TIME_ATTRIBUTE] = new Date().getTime();
        virtualMotionActivatedCamera.update(motionActivatedCamera);

        console.log(EOL + new Date() + ' : ' + virtualMotionActivatedCamera.getEndpointId() + ' : Set : '
            + '"' + IMAGE_ATTRIBUTE + '"=' + storage.getName());
    };

    console.log(EOL + 'Press Ctr + C to exit...');
    setInterval(sendImage, getMilliseconds(MESSAGE_TIMEOUT));
}

function getModelCamera(device){
    device.getDeviceModel(MOTION_ACTIVATED_CAMERA_MODEL_URN, function (response, error) {
        if (error) {
            console.log('------------------ERROR ON GET CAMERA DEVICE MODEL----------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            process.exit(1);
        }
        console.log('----------------------CAMERA DEVICE MODEL-------------------');
        console.log(JSON.stringify(response,null,4));
        console.log('------------------------------------------------------------');
        motionActivatedCameraModel = response;
        startMotionActivatedCamera(device, device.getEndpointId());
    });
}

try {
    var dcd = new iotcs.device.DirectlyConnectedDevice(storeFile, storePassword);

    fs.readdirSync(imagesFolder).forEach(function(file) {
        images.push(file);
    });
    fs.readdirSync(videosFolder).forEach(function(file) {
        videos.push(file);
    });
} catch (err) {
    console.log(err);
    showUsage();
    process.exit(1);
}

if (dcd.isActivated()) {
    console.log('Started Motion Activated Camera with endpoint ID: ' + dcd.getEndpointId());
    getModelCamera(dcd);
} else {
    dcd.activate([MOTION_ACTIVATED_CAMERA_MODEL_URN], function (device, error) {
        if (error) {
            console.log('-----------------ERROR ON ACTIVATION------------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            process.exit(1);
        }
        dcd = device;
        if (dcd.isActivated()) {
            getModelCamera(dcd);
        }
    });
}
