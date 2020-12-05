/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * @ignore
 */
iotcs.device.impl.TestConnectivity  = class {
    constructor(messageDispatcher) {
        this._count = 0;
        this._currentCount = 0;
        this._interval = 0;
        this._messageDispatcher = messageDispatcher;
        this._size = 0;
        this._startPooling = null;

        let self = this;

        this._monitor = new iotcs.impl.Monitor(() => {
            let currentTime = Date.now();

            if (currentTime >= (self._startPooling + self._interval)) {
                if (messageDispatcher._dcdUtil.isActivated()) {
                    let message = new iotcs.message.Message();

                    message
                        .type(iotcs.message.Message.Type.DATA)
                        .source(messageDispatcher._.dcd.getEndpointId())
                        .format("urn:oracle:iot:dcd:capability:diagnostics:test_message")
                        .dataItem("count", self.currentCount)
                        .dataItem("payload", _strRepeat('*', self.size))
                        .priority(iotcs.message.Message.Priority.LOWEST);

                    self.messageDispatcher.queue(message);
                    self._currentCount = self._currentCount + 1;
                }

                self._startPooling = currentTime;

                if (self._currentCount === self.count) {
                    self._count = 0;
                    self._currentCount = 0;
                    self._interval = 0;
                    self._monitor._stop();
                    self._size = 0;
                }
            }
        });
    }

    // Private/protected functions
    /**
     * @ignore
     */
    _startHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'PUT')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        let data = null;

        try {
            data = JSON.parse(port.util.atob(requestMessage.payload.body));
        } catch (e) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.BAD_REQUEST, {}, iotcs.StatusCode.BAD_REQUEST, '');
        }

        if (!data || !data.interval || !data.size || !data.count ||
            (typeof data.interval !== 'number') || (data.interval % 1 !== 0) ||
            (typeof data.size !== 'number') || (data.size < 0) || (data.size % 1 !== 0) ||
            (typeof data.count !== 'number') || (data.count < 0) || (data.count % 1 !== 0))
        {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.BAD_REQUEST, {}, iotcs.StatusCode.BAD_REQUEST, '');
        }

        if (this.monitor.running) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.CONFLICT, {}, iotcs.StatusCode.CONFLICT_MESSAGE, '');
        }

        this._count = data.count;
        this._currentCount = 0;
        this._size = data.size;
        this._interval = (data.interval < iotcs.oracle.iot.client.monitor.pollingInterval ? iotcs.oracle.iot.client.monitor.pollingInterval : data.interval);
        this._startPooling = Date.now();
        this._monitor._start();
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
    }

    /**@ignore*/
    _stopHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'PUT')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                                                            iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        this._monitor._stop();
        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, '', '');
    }

    /**
     * @ignore
     */
    _testHandler(requestMessage) {
        let method = iotcs.device.util.MessageDispatcher._getMethodForRequestMessage(requestMessage);

        if (!method || (method !== 'GET')) {
            return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.METHOD_NOT_ALLOWED, {},
                iotcs.StatusCode.METHOD_NOT_ALLOWED_MESSAGE, '');
        }

        let obj = {
            active: this.monitor.running,
            count: this.count,
            currentCount: this.currentCount,
            interval: this.interval,
            size: this.size
        };

        return iotcs.message.Message.buildResponseMessage(requestMessage, iotcs.StatusCode.OK, {}, JSON.stringify(obj),
            '');
    }
};

// Global functions
/**
 * @ignore
 */
function _strRepeat(str, qty) {
    if (qty < 1) {
    return '';
    }

    let result = '';

    while (qty > 0) {
        if (qty & 1) {
            result += str;
        }

        qty >>= 1;
        str = str + str;
    }

    return result;
}
