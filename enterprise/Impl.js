/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Implementation functions and classes for the enterprise namespace.
 */

//General TODOs:

//@TODO: all iotcs.impl.Https._req(...,...,(response=>{ /*HERE*/})); do not handle error cases consistently: some are iotcs.error(), while others are callback(null) @DONE
//@TODO: all conditions should be defensively parenthesized e.g. "if (a==b && !c && d)" => if ((a==b) && (!c) && (d))"
//@TODO: there should be more iotcs.oracle.iot.XXX.defaultLimit and every Pageable instanciation should use its own explicitly for maximum configurability: e.g. "new iotcs.enterprise.Pageable({},,,iotcs.oracle.iot.XXX.defaultLimit);"

//@TODO: code as flat as possible: e.g. instead of if(ok) { } => use if(!ok) {error | return ...} ... } @DONE
//@TODO: error message case should be consistent: all lowercase or w first letter Uppercase ...etc... @DONE
//@TODO: if/while/catch/... are not functions e.g. conventionally "if(XX)" should be "if (X)"
//@TODO: "function(" => "function ("
//@TODO: "){" => ") {"
//@TODO: "}\nelse {\n" => "} else {\n"

//@TODO: we probably need a few global (lib-private) functions to do advanced parameter value checking (e.g. check that appid has no "/" (or %XX equivalent ...etc...) ... this depends on needs from other classes/functions...
//@TODO: iotcs.error() is currently not satisfactory; related: callbacks (especially not in timeout/intervals) should not throw any exceptions ...etc...


//@TODO (last) align DCL to ECL for all sibling definitions (use winmerge ...)

//////////////////////////////////////////////////////////////////////////////

/** @ignore */
iotcs.impl._reqRoot = '/iot/webapi/v2';

iotcs.impl.Https._bearerReq = (options, payload, callback, retryCallback, eClientImpl) => {
    if (eClientImpl && eClientImpl._tam && eClientImpl._tam.getClientId()) {
        options.path = options.path.replace('webapi','api');

        if (!options.headers) {
            options.headers = {};
        }

        options.headers.Authorization = eClientImpl._bearer;
        options.headers['X-EndpointId'] = eClientImpl._tam.getClientId();
        options.tam = eClientImpl._tam;

        iotcs.impl.Https._req(options, payload, (responseBody, error) => {
            if (error) {
                var exception = null;

                try {
                    exception = JSON.parse(error.message);

                    if (exception.statusCode &&
                        (exception.statusCode === iotcs.StatusCode.UNAUTHORIZED))
                    {
                        eClientImpl._refreshBearer(error => {
                            if (error) {
                                callback(responseBody, error);
                                return;
                            }

                            retryCallback();
                        });

                        return;
                    }
                } catch (e) {
                   // Do notrhing. 
                }
            }
            callback(responseBody, error);
        });
    } else {
        iotcs.impl.Https._req(options, payload, callback);
    }
};
