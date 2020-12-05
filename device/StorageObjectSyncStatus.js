/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Enumeration of the status of whether or not the content is in sync with the storage cloud.
 *
 * @alias iotcs.device.StorageObject.SyncStatus
 * @class iotcs.device.StorageObject.SyncStatus
 * @enum {string}
 * @memberof iotcs.device.StorageObject
 * @readonly
 */
iotcs.device.StorageObject.SyncStatus = {
    /**
     * The content is not in sync with the storage cloud.
     */
    NOT_IN_SYNC: "NOT_IN_SYNC",
    /**
     * The content is not in sync with the storage cloud, but a
     * sync is pending.
     */
    SYNC_PENDING: "SYNC_PENDING",
    /**
     * The content is in sync with the storage cloud.
     */
    IN_SYNC: "IN_SYNC",
    /**
     * The content is not in sync with the storage cloud because the upload or download failed.
     */
    SYNC_FAILED: "SYNC_FAILED"
};

Object.freeze(iotcs.device.StorageObject.SyncStatus);
