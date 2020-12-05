/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */


/**
 * Enumeration of progress states.
 *
 * @alias State
 * @enum {string}
 * @memberof iotcs.device.util.StorageDispatcher.Progress
 * @readonly
 * @static
 */
iotcs.device.util.StorageDispatcher.Progress.State = {
    /**The upload or download was cancelled before it completed. */
    CANCELLED: "CANCELLED",
    /** The upload or download completed successfully. */
    COMPLETED: "COMPLETED",
    /** The upload or download failed without completing. */
    FAILED: "FAILED",
    /** The upload or download is currently in progress. */
    IN_PROGRESS: "IN_PROGRESS",
    /** Initial state of the upload or download. */
    INITIATED: "INITIATED",
    /** The upload or download is queued and not yet started. */
    QUEUED: "QUEUED",
};

Object.freeze(iotcs.device.util.StorageDispatcher.Progress.State);
