/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */
jest.mock('log4js');
const log4js = require('log4js');
log4js.getLogger.mockReturnValue({
    debug: () => {}
});

jest.mock('ref');
jest.mock('@cw-gw-backend/modules/MetaWearDataRoute', () => {
    return {
        MetaWearDataRoute: jest.fn(require('@mocks/classes/MetaWearDataRoute'))
    };
});
jest.mock('@cw-gw-backend/modules/convert');

const convert = require('@cw-gw-backend/modules/convert')
const { MetaWearDataRoute } = require('@cw-gw-backend/modules/MetaWearDataRoute');
const { MetaWearFallDownMonitor } = require('@cw-gw-backend/modules/MetaWearFallDownMonitor');

const MetaWear = require('metawear');

describe('MetaWearFallDownMonitor', () => {
    const METAWEAR_DEVICE = {
        board: 'board'
    };
    const SUBSCRIBER = jest.fn(() => {});
    let monitor = undefined;
    beforeEach(() => {
        monitor = new MetaWearFallDownMonitor(METAWEAR_DEVICE);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('is created with defaults', () => {
        monitor
            .start();

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];
        expect(route.rss).toBeCalled();
        expect(route.lowpass).toBeCalledWith(MetaWearFallDownMonitor.DEFAULT_SAMPLES_NUM);
        expect(route.threshold).toBeCalledWith(MetaWear.ThresholdMode.BINARY,
            MetaWearFallDownMonitor.DEFAULT_THRESHOLD);
        expect(MetaWear.mbl_mw_acc_get_acceleration_data_signal)
            .toBeCalledWith(METAWEAR_DEVICE.board);
        expect(route.applyTo).toBeCalledWith(MetaWear.DATA_SIGNAL);
    });

    it('is created with the provided setup settings', () => {
        const settings = {
            fallDownSampleSize: 5,
            fallDownThreshold: 0.75
        }
        monitor
            .setup(settings)
            .start();
        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];
        expect(route.rss).toBeCalled();
        expect(route.lowpass).toBeCalledWith(settings.fallDownSampleSize);
        expect(route.threshold).toBeCalledWith(MetaWear.ThresholdMode.BINARY,
            settings.fallDownThreshold)
    });

    it('writes an accelerator config and starts it', () => {
        monitor
            .start();
        expect(MetaWear.mbl_mw_acc_set_range).toBeCalledWith(METAWEAR_DEVICE.board,
            MetaWearFallDownMonitor.ACCELERATION_RANGE);
        expect(MetaWear.mbl_mw_acc_write_acceleration_config).toBeCalledWith(METAWEAR_DEVICE.board);
        expect(MetaWear.mbl_mw_acc_enable_acceleration_sampling)
            .toBeCalledWith(METAWEAR_DEVICE.board);
        expect(MetaWear.mbl_mw_acc_start).toBeCalledWith(METAWEAR_DEVICE.board);
    });

    it('does not call subscriber when a fall happens from insufficient height', () => {
        monitor
            .subscribe(SUBSCRIBER)
            .start();
        convert.freeFallMsToCm.mockReturnValue(MetaWearFallDownMonitor.DEFAULT_HEIGHT - 1);

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];
        route.putData('context', new MetaWear.dataPtr(-1));
        route.putData('context', new MetaWear.dataPtr(1));

        expect(SUBSCRIBER).not.toBeCalled();
    });

    it('does not call subscriber when monitor stops but a fall registered so far is insufficient',
            () => {
        monitor
        .subscribe(SUBSCRIBER)
        .start();
        convert.freeFallMsToCm.mockReturnValue(MetaWearFallDownMonitor.DEFAULT_HEIGHT - 1);

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];

        route.putData('context', new MetaWear.dataPtr(-1));
        monitor.stop();
        route.putData('context', new MetaWear.dataPtr(1));

        expect(SUBSCRIBER).not.toBeCalled();
    });

    it('calls subscriber when monitor stops but a fall registered so far is sufficient', () => {
        monitor
        .subscribe(SUBSCRIBER)
        .start();
        convert.freeFallMsToCm.mockReturnValue(MetaWearFallDownMonitor.DEFAULT_HEIGHT);

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];

        route.putData('context', new MetaWear.dataPtr(-1));
        monitor.stop();
        route.putData('context', new MetaWear.dataPtr(1));

        expect(SUBSCRIBER).toBeCalledWith(MetaWearFallDownMonitor.DEFAULT_HEIGHT / 100);
    });

    it('calls subscriber when a fall happens from default height', () => {
        monitor
            .subscribe(SUBSCRIBER)
            .start();
        convert.freeFallMsToCm.mockReturnValue(MetaWearFallDownMonitor.DEFAULT_HEIGHT);

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];
        route.putData('context', new MetaWear.dataPtr(-1));
        route.putData('context', new MetaWear.dataPtr(1));

        expect(SUBSCRIBER).toBeCalledWith(MetaWearFallDownMonitor.DEFAULT_HEIGHT / 100);
    });

    it('calls subscriber when a fall happens from configured height', () => {
        const FALL_DOWN_HEIGHT = 3;
        monitor
            .setup({
                fallDownHeight: 3,
            })
            .subscribe(SUBSCRIBER)
            .start();
        convert.freeFallMsToCm.mockReturnValue(FALL_DOWN_HEIGHT * 100);

        expect(MetaWearDataRoute).toBeCalledTimes(1);
        const route = MetaWearDataRoute.mock.instances[0];
        route.putData('context', new MetaWear.dataPtr(-1));
        route.putData('context', new MetaWear.dataPtr(1));

        expect(SUBSCRIBER).toBeCalledWith(FALL_DOWN_HEIGHT);
    });
});