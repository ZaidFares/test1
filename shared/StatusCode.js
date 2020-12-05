/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * List of HTTP status codes and messages.
 *
 * @alias iotcs.StatusCode
 * @class
 */
iotcs.StatusCode = {
    /**
     * Indicates HTTP status code 200 - OK
     */
    OK: 200,
    OK_MESSAGE: 'OK',
    /**
     * Indicates HTTP status code 201 - Created
     */
    CREATED: 201,
    CREATED_MESSAGE: 'Created',
    /**
     * Indicates HTTP status code 202 - Accepted
     */
    ACCEPTED: 202,
    ACCEPTED_MESSAGE: 'Accepted',
    /**
     * Indicates HTTP status code 204 - No Content
     */
    NO_CONTENT: 204,
    NO_CONTENT_MESSAGE: 'No Content',
    /**
     * Indicates HTTP status code 205 - Finished
     */
    FINISHED: 205,
    FINISHED_MESSAGE: 'Finished',
    /**
     * Indicates HTTP status code 206 - Data Finished
     */
    DATA_FINISHED: 206,
    DATA_FINISHED_MESSAGE: 'Data Finished',
    /**
     * Indicates HTTP status code 302 - Found
     */
    FOUND: 302,
    FOUND_MESSAGE: 'Found',
    /**
     * Indicates HTTP status code 400 - Bad Request
     */
    BAD_REQUEST: 400,
    BAD_REQUEST_MESSAGE: 'Bad Request',
    /**
     * Indicates HTTP status code 401 - Unauthorized
     */
    UNAUTHORIZED: 401,
    UNAUTHORIZED_MESSAGE: 'Unauthorized',
    /**
     * Indicates HTTP status code 402 - Payment Required
     */
    PAYMENT_REQUIRED: 402,
    PAYMENT_REQUIRED_MESSAGE: 'Payment Required',
    /**
     * Indicates HTTP status code 403 - Forbidden
     */
    FORBIDDEN: 403,
    FORBIDDEN_MESSAGE: 'Forbidden',
    /**
     * Indicates HTTP status code 404 - Not Found
     */
    NOT_FOUND: 404,
    NOT_FOUND_MESSAGE: 'Not Found',
    /**
     * Indicates HTTP status code 405 - OK
     */
    METHOD_NOT_ALLOWED: 405,
    METHOD_NOT_ALLOWED_MESSAGE: 'Method Not Allowed',
    /**
     * Indicates HTTP status code 406 - Not Acceptable
     */
    NOT_ACCEPTABLE: 406,
    NOT_ACCEPTABLE_MESSAGE: 'Not Acceptable',
    /**
     * Indicates HTTP status code 408 - Request Timeout
     */
    REQUEST_TIMEOUT: 408,
    REQUEST_TIMEOUT_MESSAGE: 'Request Timeout',
    /**
     * Indicates HTTP status code 409 - Conflict
     */
    CONFLICT: 409,
    CONFLICT_MESSAGE: 'Conflict',
    /**
     * Indicates HTTP status code 412 - Precondition Failed
     */
    PRECOND_FAILED: 412,
    PRECOND_FAILED_MESSAGE: 'Precondition Failed',
    /**
     * Indicates HTTP status code 500 - Internal Server Error
     */
    INTERNAL_SERVER_ERROR: 500,
    INTERNAL_SERVER_ERROR_MESSAGE: 'Internal Server Error',
    /**
     * Indicates HTTP status code 501 - Not implemented
     */
    NOT_IMPLEMENTED: 501,
    NOT_IMPLEMENTED_MESSAGE: 'Not Implemented',
    /**
     * Indicates HTTP status code 502 - Bad Gateway
     */
    BAD_GATEWAY: 502,
    BAD_GATEWAY_MESSAGE: 'Bad Gateway',
    /**
     * Indicates HTTP status code 503 - Service Unavailabl
     */
    SERVICE_UNAVAILABLE: 503,
    SERVICE_UNAVAILABLE_MESSAGE: 'Service Unavailable',
    /**
     * Indicates HTTP status code -1 - Other
     */
    OTHER: -1,
    OTHER_MESSAGE: 'Other',
};

Object.freeze(iotcs.StatusCode);
