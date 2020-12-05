/**
 * Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the legal
 * directory for license terms.  You may choose either license, or both.
 *
 */

const math = require('mathjs')

class Triangulation {
    // Ref: https://gist.github.com/dav-/bb7103008cdf9359887f
    // Created by Derrick Cohodas (dav-)
    // Based on the Python example by StackExchange user wwnick from http://gis.stackexchange.com/a/415/41129 
    /**
     * Perform a trilateration calculation to determine a location
     * based on 3 beacons and their respective distances (in kilometers) to the desired point.
     *
     * @param  {Array} beacons Array of 3 Beacon objects
     * @return {Array}         Array of the format [latitude, longitude]
     */
    trilaterate(beacons) {
        if (beacons.length !== 3) {
            return [0,0]
        }

        var earthR = 6371
        var rad = function(deg) {
            return deg * (math.pi/180)
        }
        var deg = function(rad) {
            return rad * (180/math.pi)
        }
    
        // #using authalic sphere
        // #Convert geodetic Lat/Long to ECEF xyz
        var P1 = [ 
            earthR *(math.cos(rad(beacons[0].lat)) * math.cos(rad(beacons[0].lon))),
            earthR *(math.cos(rad(beacons[0].lat)) * math.sin(rad(beacons[0].lon))),
            earthR *(math.sin(rad(beacons[0].lat)))
        ]
    
        var P2 = [ 
            earthR *(math.cos(rad(beacons[1].lat)) * math.cos(rad(beacons[1].lon))),
            earthR *(math.cos(rad(beacons[1].lat)) * math.sin(rad(beacons[1].lon))),
            earthR *(math.sin(rad(beacons[1].lat)))
        ]
    
        var P3 = [ 
            earthR *(math.cos(rad(beacons[2].lat)) * math.cos(rad(beacons[2].lon))),
            earthR *(math.cos(rad(beacons[2].lat)) * math.sin(rad(beacons[2].lon))),
            earthR *(math.sin(rad(beacons[2].lat)))
        ]
    
        // Transform to get circle 1 at origin
        // Transform to get circle 2 on x axis
        var ex = math.divide(math.subtract(P2, P1), math.norm(math.subtract(P2, P1)))
        var i =  math.dot(ex, math.subtract(P3, P1))
    
        var ey = math.divide(
               	math.subtract(math.subtract(P3, P1), math.multiply(i, ex)),
               	math.norm( math.subtract(math.subtract(P3, P1), math.multiply(i, ex))))
    
        var ez = math.cross(ex, ey)
        var d =  math.norm(math.subtract(P2, P1))
        var j =  math.dot(ey, math.subtract(P3, P1))
    
        // #plug and chug using above values
        var x =  (math.pow(beacons[0].dist, 2) - math.pow(beacons[1].dist,2) + 
            math.pow(d,2))/(2*d)
        var y = ((math.pow(beacons[0].dist, 2) - math.pow(beacons[2].dist,2) + 
            math.pow(i,2) + math.pow(j,2))/(2*j)) - ((i/j)*x)
    
        var z = math.sqrt(math.abs(math.pow(beacons[0].dist, 2) - math.pow(x, 2) - math.pow(y, 2)))
    
        var triPt = math.add(
                math.add(math.add(P1, math.multiply(x, ex)), math.multiply(y, ey)),
                math.multiply(z, ez)
        	)
    
        // #convert back to lat/long from ECEF
        // #convert to degrees
        var lat = deg(math.asin(math.divide(triPt[2], earthR)))
        var lon = deg(math.atan2(triPt[1], triPt[0]))
    
        return [lat, lon]
    }
}

module.exports.Triangulation = Triangulation;
