/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

'use strict';

var Enum = require('enum');

const metawear = {
    "LedColor": new Enum({
        'GREEN': 0,
        'RED': 1,
        'BLUE': 2
    }),
    ProcessorType: new Enum({
        'RSS': 1,
        'THRESHOLD': 2,
        'LOWPASS': 3
    }),
    ThresholdMode: new Enum({
        'BINARY': 1
    })
}

metawear.DATA_SIGNAL = 'signal';

metawear.dataPtr = function(data) {
    this.deref = () => {
        return this;
    }
    this.parseValue = () => {
        return data;
    }
}

metawear.mbl_mw_acc_get_acceleration_data_signal = jest.fn((board) => metawear.DATA_SIGNAL);
metawear.mbl_mw_acc_set_range = jest.fn();
metawear.mbl_mw_acc_write_acceleration_config = jest.fn();
metawear.mbl_mw_acc_enable_acceleration_sampling = jest.fn();
metawear.mbl_mw_acc_start= jest.fn();

metawear.mbl_mw_dataprocessor_rss_create = jest.fn((signal, context, callback) => {
    callback(context, metawear.ProcessorType.RSS);
});
metawear.mbl_mw_dataprocessor_threshold_create = jest.fn(
    (signal, mode, value, i, context, callback) => {
        callback(context, metawear.ProcessorType.THRESHOLD);
    });
metawear.mbl_mw_dataprocessor_lowpass_create = jest.fn(
    (signal, value, context, callback) => {
        callback(context, metawear.ProcessorType.LOWPASS)
    });

metawear.mbl_mw_datasignal_subscribe = jest.fn();

metawear.FnVoid_VoidP_DataProcessorP = {};
metawear.FnVoid_VoidP_DataProcessorP.toPointer = jest.fn((fun) => fun);

metawear.FnVoid_VoidP_DataP = {};
metawear.FnVoid_VoidP_DataP.toPointer = jest.fn((fun) => fun);

module.exports = metawear;