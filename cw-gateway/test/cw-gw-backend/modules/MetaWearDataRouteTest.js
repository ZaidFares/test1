/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
jest.mock('ref');

const { MetaWearDataRoute } = require('@cw-gw-backend/modules/MetaWearDataRoute');
const MetaWear = require('metawear');
const ref = require('ref');

describe('MetaWearDataRoute', () => {
    let route = undefined;
    const SIGNAL = 'signal';
    const SAMPLES_NUM = 4;
    const MODE = 'mode';
    const VALUE = 5;

    beforeEach(() => {
        route = new MetaWearDataRoute();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('applies rss', () => {
        route.rss().applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_dataprocessor_rss_create).toBeCalledWith(SIGNAL, ref.NULL,
            expect.any(Function));
    });

    it('applies rss with subscriber', () => {
        const SUBSCRIBER = () => {};
        route.rss().subscribe(SUBSCRIBER).applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_datasignal_subscribe).toBeCalledWith(
                MetaWear.ProcessorType.RSS, ref.NULL, SUBSCRIBER);
    });

    it('applies lowpass', () => {
        route.lowpass(SAMPLES_NUM).applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_dataprocessor_lowpass_create).toBeCalledWith(SIGNAL, SAMPLES_NUM,
            ref.NULL, expect.any(Function));
    });

    it('applies threshold', () => {
        route.threshold(MODE, VALUE).applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_dataprocessor_threshold_create).toBeCalledWith(SIGNAL, MODE, VALUE,
            0, ref.NULL, expect.any(Function));
    });

    it('applies chain in a correct order', () => {
        route
            .rss()
            .lowpass(SAMPLES_NUM)
            .threshold(MODE, VALUE)
            .applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_dataprocessor_rss_create)
                .toHaveBeenCalledBefore(MetaWear.mbl_mw_dataprocessor_lowpass_create);
        expect(MetaWear.mbl_mw_dataprocessor_lowpass_create)
                .toHaveBeenCalledBefore(MetaWear.mbl_mw_dataprocessor_threshold_create);
        expect(MetaWear.mbl_mw_dataprocessor_threshold_create).toBeCalled();
    });
    it('applies chain with correct subscribers', () => {
        const SUBSCRIBER_1 = () => {};
        const SUBSCRIBER_2 = () => {};
        const SUBSCRIBER_3 = () => {};
        route
            .rss()
            .subscribe(SUBSCRIBER_1)
            .lowpass(SAMPLES_NUM)
            .subscribe(SUBSCRIBER_2)
            .threshold(MODE, VALUE)
            .subscribe(SUBSCRIBER_3)
            .applyTo(SIGNAL);
        expect(MetaWear.mbl_mw_datasignal_subscribe).toBeCalledWith(MetaWear.ProcessorType.RSS,
            ref.NULL, SUBSCRIBER_1);
        expect(MetaWear.mbl_mw_datasignal_subscribe).toBeCalledWith(MetaWear.ProcessorType.LOWPASS,
            ref.NULL, SUBSCRIBER_2);
        expect(MetaWear.mbl_mw_datasignal_subscribe).toBeCalledWith(
            MetaWear.ProcessorType.THRESHOLD, ref.NULL, SUBSCRIBER_3);
    });
});