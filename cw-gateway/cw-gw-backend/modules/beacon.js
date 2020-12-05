/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

class Beacon {

    /**
     * Represents a coordinate with a distance
     * @param {Number} lat  Latitude
     * @param {Number} lon  Longitude
     * @param {Number} dist Distance from [lat, lon] to some point in kilometers
     */
    constructor(lat, lon, dist) {
        this.lat  = lat;
        this.lon  = lon;
        this.dist = dist;   
    }
}

const _Beacon = Beacon;
export { _Beacon as Beacon };
