/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This sample demonstrates the iotcs.StorageObject and related API.
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
var MESSAGE_TIMEOUT = 5;

var storeFile = (process.argv[2]);
var storePassword = (process.argv[3]);

var resourcesFolder = process.argv[1].substring(0, process.argv[1].lastIndexOf(path.sep + 'advanced'));
var imagesFolder = path.join(resourcesFolder, 'images');
var videosFolder = path.join(resourcesFolder, 'videos');

var images = [];
var videos = [];

function showUsage() {
    console.log(EOL + 'Usage:');
    console.log(' run-device-node-sample.[sh,bat] ' + path.join('advanced', 'MotionActivatedCameraSample.js') + ' <trusted assets file> <trusted assets password>');
    console.log('Note:');
    console.log(' Images and videos used by sample are expected to be in ' + path.join('iotcs', 'csl', 'js') + ' samples folder' + EOL);
}

function getMilliseconds(sec) {
    return sec * 1000;
}

function _getMethodForRequestMessage(requestMessage){
    var method = null;
    if (requestMessage.payload && requestMessage.payload.method) {
        method = requestMessage.payload.method.toUpperCase();
    }
    if (requestMessage.payload.headers &&
        Array.isArray(requestMessage.payload.headers['x-http-method-override']) &&
        (requestMessage.payload.headers['x-http-method-override'].length > 0)) {
        method = requestMessage.payload.headers['x-http-method-override'][0].toUpperCase();
    }
    return method;
}

function startMotionActivatedCamera(device) {
    var imageIndex = 0;
    var messageDispatcher = new iotcs.device.util.MessageDispatcher(device);

    var handleSend = function (messages, error) {
        if (error) {
            console.log('-----------------ERROR ON SENDING MESSAGES------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
        }
    };
    var uploadCallback = function (storage, error) {
        if (error) {
            console.log('-----------------ERROR ON UPLOADING IMAGE-------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }

        var message = new iotcs.message.Message();

        message
            .type(iotcs.message.Message.Type.DATA)
            .source(device.getEndpointId())
            .format(MOTION_ACTIVATED_CAMERA_MODEL_URN + ':attributes')
            .dataItem('image', storage)
            .dataItem('imageTime', new Date().getTime());

        device.send([message], handleSend);

        console.log(EOL + new Date() + ' : ' + device.getEndpointId() + ' : DATA : '
            + '"image"=' + storage.getURI()
            + ' (' + storage.getLength() + ' bytes) from ' + storage.getInputStream().path);
    };

    var sendImage = function () {
        var image = images[imageIndex++ % images.length];
        var storage = device.createStorageObject(image, 'image/jpeg');
        storage.setInputStream(fs.createReadStream(path.join(imagesFolder, image)));
        storage.sync(uploadCallback);
    };

    var actionsHandler = function (requestMessage) {
        var method = _getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'POST')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 405, {},
                'Method Not Allowed', '');
        }

        var actionName =
           requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

        var data = null;

        try {
            data = JSON.parse(new Buffer(requestMessage.payload.body, 'base64').toString());
        } catch (e) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {},
                'Bad Request', '');
        }

        var startRecordingTime;
        var duration;

        var recordingCallback = function (storage, error) {
            if (error) {
                console.log('-----------------ERROR ON RECORDING VIDEO-------------------');
                console.log(error);
                console.log('------------------------------------------------------------');
                // Send response message for server request with 400 status.
                messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage,
                      400, {}, 'OK', ''));
                return;
            }

            // Send response message for server request with 200 status.
            messageDispatcher.queue(iotcs.message.Message.buildResponseMessage(requestMessage, 200,
                  {}, 'OK', ''));

            var message = new iotcs.message.Message();

            message
                .type(iotcs.message.Message.Type.DATA)
                .source(device.getEndpointId())
                .format(MOTION_ACTIVATED_CAMERA_MODEL_URN + ':recording')
                .dataItem('video', storage)
                .dataItem('startTime', startRecordingTime)
                .dataItem('duration', duration);

            device.send([message], handleSend);

            console.log(EOL + new Date() + ' : ' + device.getEndpointId() + ' : DATA : '
                + ' "duration"=' + duration + ' : "video"=' + storage.getURI()
                + ' (' + storage.getLength() + ' bytes) from ' + storage.getInputStream().path);
        };

        var sendVideo = function () {
            // assumes videos.length > 0 and videos are 15 second increments.
            var video = videos[Math.min(duration/15 - 1, videos.length - 1)];
            var storage = device.createStorageObject(video, 'video/mp4');
            storage.setInputStream(fs.createReadStream(path.join(videosFolder, video)));
            storage.setCustomMetadata("duration", duration.toString());
            storage.sync(recordingCallback);
        };

        var method = _getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'POST')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, 405, {}, 'Method Not Allowed', '');
        }

        var actionName = requestMessage.payload.url.substring(requestMessage.payload.url.lastIndexOf('/') + 1);

       if (actionName === 'record') {
          // record action takes one unnamed argument which is delivered as {"value":15}.
          if (!data || (typeof data.value !== 'number') || (data.value <= 0)) {
             return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {},
                   'Bad Request', '');
          }

          // Round to nearest increment of 15.
          duration = Math.ceil(data.value / 15) * 15;
          startRecordingTime = new Date();
          console.log(EOL + new Date() + ' : ' + device.getEndpointId() + ' : Call : record : ' +
                data.value);

          // Simulate the time it takes to record the video by timeout.
          setTimeout(sendVideo, getMilliseconds(duration));
          // The real response will be sent later in recordingCallback.
          return iotcs.message.Message.buildResponseWaitMessage();
        } else if (actionName === 'scheduleRecording') {
            // scheduleRecording action takes two arguments, duration and startTime which is
            // delivered as {"duration":15,"startTime":946684860000} For the purposes of the sample,
            // startTime is just echoed back in the data message (see below).
            if (!data ||
                (typeof data.duration !== 'number') || (data.duration <= 0) ||
                (typeof data.startTime !== 'string'))
            {
                return iotcs.message.Message.buildResponseMessage(requestMessage, 400, {},
                    'Bad Request', '');
            }

            var startTime = new Date(data.startTime);
            // Round to nearest increment of 15.
            duration = Math.ceil(data.duration / 15) * 15;
            startRecordingTime = new Date();

            console.log(EOL + new Date() + ' : ' + device.getEndpointId() +
                ' : Call : scheduleRecording : duration : ' + data.duration +
                ' : startTime ' + startTime);

            // Simulate the time it takes to record the video by timeout.
            setTimeout(sendVideo, getMilliseconds(duration));
            // real response will be sent later in recordingCallback
            return iotcs.message.Message.buildResponseWaitMessage();
        } else {
            return new ResponseMessage.Builder(requestMessage)
                .statusCode(StatusCode.BAD_REQUEST)
                .build();
        }
    };

    messageDispatcher.getRequestDispatcher().registerRequestHandler(device.getEndpointId(),
        'deviceModels/' + MOTION_ACTIVATED_CAMERA_MODEL_URN + '/actions/record', actionsHandler);

    messageDispatcher.getRequestDispatcher().registerRequestHandler(device.getEndpointId(),
        'deviceModels/' + MOTION_ACTIVATED_CAMERA_MODEL_URN + '/actions/scheduleRecording',
        actionsHandler);

    console.log(EOL + 'Press Ctr + C to exit...');
    setInterval(sendImage, getMilliseconds(MESSAGE_TIMEOUT));
}

try {
    var dcd = new iotcs.device.util.DirectlyConnectedDevice(storeFile, storePassword);

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
    startMotionActivatedCamera(dcd);
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
            startMotionActivatedCamera(dcd);
        }
    });
}

