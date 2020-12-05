/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This class provides an implementation of the trusted assets format as values of the
 * tag-length-value form in a Base64 encoded AES encrypted file.
 * <p>
 * Unified client provisioning format:
 * <p>
 * format = version & blob & *comment<br>
 * version = 1 byte, value 33<br>
 * blob = MIME base64 of encrypted & new line<br>
 * encrypted = IV & AES-128/CBC/PKCS5Padding of values<br>
 * IV = 16 random bytes<br>
 * values = *TLV<br>
 * TLV = tag & length & value<br>
 * tag = byte<br>
 * length = 2 byte BE unsigned int<br>
 * value = length bytes<br>
 * comment = # & string & : & string & new line<br>
 * string = UTF-8 chars<br>
 * <p>
 * The password based encryption key is the password processed by 10000 interations of
 * PBKDF2WithHmacSHA1 with the IV as the salt.
 * <p>
 * This class is internally used by the trusted assets store managers to read/write files in the
 * unified format.
 *
 * @alias iotcs.UnifiedTrustStore
 * @class iotcs.UnifiedTrustStore
 * @memberof iotcs
 */
iotcs.UnifiedTrustStore = class {
    constructor(taStoreFileExt, taStorePasswordExt, forProvisioning) {
        this._trustStoreValues = {
            _certificate: null,
            _clientId: null,
            _connectedDevices: null,
            _endpointId: null,
            _serverHost: null,
            _serverPort: null,
            _serverScheme: null,
            _sharedSecret: null,
            _privateKey: null,
            _publicKey: null,
            _trustAnchors: null
        };

        this._taStoreFile = taStoreFileExt || iotcs.oracle.iot.tam.store;
        this._taStorePassword = taStorePasswordExt || iotcs.oracle.iot.tam.storePassword;
        this._userInfo = "#";

        if (!this._taStoreFile) {
            iotcs.error('No Trusted Assets Store file defined.');
            return;
        }

        if (!this._taStorePassword) {
            iotcs.error('No Trusted Assets Store password defined.');
            return;
        }

        if (!forProvisioning) {
            this._load();
        }
    }

    // Private/protected functions
    _load() {
        let input = iotcs.impl.Platform.File._load(this._taStoreFile);

        if (input.charCodeAt(0) != iotcs.UnifiedTrustStore.constants.version) {
            iotcs.error('Invalid unified trust store version');
            return;
        }

        let base64BlockStr = input.substring(1, input.indexOf('#'));
        this._userInfo = input.substring(input.indexOf('#')) || this._userInfo;
        let encryptedData = forge.util.decode64(base64BlockStr);

        if (encryptedData.length <= 0) {
            iotcs.error('Invalid unified trust store.');
            return;
        }

        let iv = forge.util.createBuffer();
        let encrypted = forge.util.createBuffer();

        for (let i = 0; i < iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE; i++) {
            iv.putInt(encryptedData.charCodeAt(i), 8);
        }

        iv = iv.getBytes();

        for (let i = iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE;
             i < encryptedData.length;
             i++)
        {
            encrypted.putInt(encryptedData.charCodeAt(i), 8);
        }

        let key = forge.pkcs5.pbkdf2(this._taStorePassword, iv,
                                     iotcs.UnifiedTrustStore.constants.PBKDF2_ITERATIONS,
                                     iotcs.UnifiedTrustStore.constants.AES_KEY_SIZE);
        
        let decipher = forge.cipher.createDecipher('AES-CBC', key);
        decipher.start({iv: iv});
        decipher.update(encrypted);
        decipher.finish();
        let output = decipher.output;
        
        while (!output.isEmpty()) {
            let tag = output.getInt(8);
            let length = (output.getInt(16) >> 0);
            let buf = output.getBytes(length);

            switch (tag) {
            case iotcs.UnifiedTrustStore.constants.TAGS.serverUri:
                let urlObj = forge.util.parseUrl(buf);
                this._trustStoreValues._serverHost = urlObj.host;
                this._trustStoreValues._serverPort = urlObj.port;
                this._trustStoreValues._serverScheme = urlObj.scheme;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.clientId:
                this._trustStoreValues._clientId = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret:
                this._trustStoreValues._sharedSecret = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.endpointId:
                this._trustStoreValues._endpointId = buf;
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.trustAnchor:
                if (!this._trustStoreValues._trustAnchors) {
                    this._trustStoreValues._trustAnchors = [];
                }

                this._trustStoreValues._trustAnchors.push(forge.pki.certificateToPem(
                    forge.pki.certificateFromAsn1(forge.asn1.fromDer(buf))));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.privateKey:
                this._trustStoreValues._privateKey =
                    forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(buf));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.publicKey:
                this._trustStoreValues._publicKey =
                    forge.pki.publicKeyFromAsn1(forge.asn1.fromDer(buf));
                break;
            case iotcs.UnifiedTrustStore.constants.TAGS.connectedDevice:
                if (!this._trustStoreValues._connectedDevices) {
                    this._trustStoreValues._connectedDevices = {};
                }

                let _data = { error: false };
                let _output = new forge.util.ByteStringBuffer().putBytes(buf);
                connectedDeviceLoop:

                while (!_output.isEmpty()) {
                    let _tag = _output.getInt(8);
                    let _length = (_output.getInt(16) >> 0);
                    let _buf = _output.getBytes(_length);

                    switch (_tag) {
                    case iotcs.UnifiedTrustStore.constants.TAGS.clientId:
                        _data.deviceId = _buf;
                        break;
                    case iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret:
                        _data.sharedSecret = _buf;
                        break;
                    default:
                        iotcs.error("Invalid TAG inside indirect connected device data.");
                        _data.error = true;
                        break connectedDeviceLoop;
                    }
                }

                if (!_data.error && _data.deviceId && _data.sharedSecret) {
                    this._trustStoreValues._connectedDevices[_data.deviceId] = _data.sharedSecret;
                }

                break;
            default:
                iotcs.error('Invalid unified trust store TAG.');
                return;
            }
        }
    }

    /** @ignore */
    _loadTrustAnchorsBinary(truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => {
                return ((elem.length > 1) && (elem.indexOf('M') > -1));
            })
            .map(elem => {
                return '-----BEGIN CERTIFICATE-----' + elem.replace(new RegExp('\r\n', 'g'),'\n') +
                    '-----END CERTIFICATE-----';
            });
    }

    //// DJM: setPrivateValues should be used for code in setPrivateValues...Need to have both until
    ////      all code is converted to ES6.
    //_setValues(otherManager) {
    //    Object.keys(otherManager).forEach(function (key) {
    //        if (this._trustStoreValues[key]) {
    //            otherManager[key] = this._trustStoreValues[key];
    //        }
    //    });
    //}
    _setPrivateValues(otherManager) {
        Object.keys(otherManager).forEach(key => {
            if (this._trustStoreValues[key]) {
                otherManager[key] = this._trustStoreValues[key];
            }
        });
    }

    _store(values) {
        if (values) {
            Object.keys(values).forEach(function (key) {
                this._trustStoreValues[key] = values[key];
            });
        }

        let buffer = forge.util.createBuffer();
        let serverUri = this._trustStoreValues._serverScheme + '://' +
            this._trustStoreValues._serverHost + ':' +
            this._trustStoreValues._serverPort;

        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.serverUri, 8);
        buffer.putInt(serverUri.length, 16);
        buffer.putBytes(serverUri);
        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.clientId, 8);
        buffer.putInt(this._trustStoreValues._clientId.length, 16);
        buffer.putBytes(this._trustStoreValues._clientId);
        buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret, 8);
        buffer.putInt(this._trustStoreValues._sharedSecret.length, 16);
        buffer.putBytes(this._trustStoreValues._sharedSecret);

        if (this._trustStoreValues._endpointId) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.endpointId, 8);
            buffer.putInt(this._trustStoreValues._endpointId.length, 16);
            buffer.putBytes(this._trustStoreValues._endpointId);
        }

        if (Array.isArray(this._trustStoreValues._trustAnchors)) {
            this._trustStoreValues._trustAnchors.forEach(function (trustAnchor) {
                let trust = forge.asn1.toDer(forge.pki.certificateToAsn1(
                    forge.pki.certificateFromPem(trustAnchor))).getBytes();
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.trustAnchor, 8);
                buffer.putInt(trust.length, 16);
                buffer.putBytes(trust);
            });
        }

        if (this._trustStoreValues._privateKey) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.privateKey, 8);
            let tempBytes = forge.asn1.toDer(forge.pki.wrapRsaPrivateKey(
                forge.pki.privateKeyToAsn1(this._trustStoreValues._privateKey))).getBytes();
            buffer.putInt(tempBytes.length, 16);
            buffer.putBytes(tempBytes);
        }

        if (this._trustStoreValues._publicKey) {
            buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.publicKey, 8);
            let tempBytes1 = forge.asn1.toDer(forge.pki.publicKeyToAsn1(
                this._trustStoreValues._publicKey)).getBytes();
            buffer.putInt(tempBytes1.length, 16);
            buffer.putBytes(tempBytes1);
        }

        if (this._trustStoreValues._connectedDevices) {
            for (let deviceId in this._trustStoreValues._connectedDevices) {
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.connectedDevice, 8);
                // deviceId.length + sharedSecret.length + 6
                // where 6 bytes contains [ACTIVATION_ID_TAG|<icd activation id length> and
                //[SHARED_SECRET_TAG|<icd shared secret length>
                buffer.putInt(deviceId.length +
                              this._trustStoreValues._connectedDevices[deviceId].length + 6, 16);
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.clientId, 8);
                buffer.putInt(deviceId.length, 16);
                buffer.putBytes(deviceId);
                buffer.putInt(iotcs.UnifiedTrustStore.constants.TAGS.sharedSecret, 8);
                buffer.putInt(this._trustStoreValues._connectedDevices[deviceId].length, 16);
                buffer.putBytes(this._trustStoreValues._connectedDevices[deviceId]);
            }
        }

        let iv = forge.random.getBytesSync(iotcs.UnifiedTrustStore.constants.AES_BLOCK_SIZE);
        let key = forge.pkcs5.pbkdf2(this._taStorePassword, iv,
                                     iotcs.UnifiedTrustStore.constants.PBKDF2_ITERATIONS,
                                     iotcs.UnifiedTrustStore.constants.AES_KEY_SIZE);
        let cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({iv: iv});
        cipher.update(buffer);
        cipher.finish();
        let finalBuffer = forge.util.createBuffer();
        finalBuffer.putInt(iotcs.UnifiedTrustStore.constants.version, 8);
        finalBuffer.putBytes(forge.util.encode64(iv + cipher.output.getBytes()));
        finalBuffer.putBytes("\n" + this._userInfo);
        iotcs.impl.Platform.File._store(this._taStoreFile, finalBuffer.getBytes());
    }

    //// DJM: updatePrivate should be used for code in update...Need to have both until
    ////      all code is converted to ES6.
    //_update(otherManager) {
    //    Object.keys(otherManager).forEach(function (key) {
    //        if (otherManager[key] && (typeof this._trustStoreValues[key] !== 'undefined')) {
    //            this._trustStoreValues[key] = otherManager[key];
    //        }
    //    });
    //    this._store();
    //}

    _updatePrivate(otherManager) {
        Object.keys(otherManager).forEach(key => {
            if (otherManager[key] && (typeof this._trustStoreValues[key] !== 'undefined')) {
                this._trustStoreValues[key] = otherManager[key];
            }
        });

        this._store();
    }

    // Public functions
    /**
     * This is a helper method for provisioning files used by the trusted assets store managers in the
     * unified trust store format.
     *
     * @function provision
     * @memberof iotcs.UnifiedTrustStore
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverScheme - The scheme used to communicate with the server. Possible values
     *        are http(s) or mqtt(s).
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {string} clientId - The activation ID for devices or client ID for application
     *        integrations.
     * @param {string} sharedSecret - The client's shared secret.
     * @param {string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     * @param {string} connectedDevices - An array of indirect connect devices.
     */
    provision(taStoreFile, taStorePassword, serverScheme, serverHost, serverPort, clientId,
              sharedSecret, truststore, connectedDevices)
    {
        if (!taStoreFile) {
            throw 'No Trusted Assets Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No Trusted Assets Store password provided.';
        }

        let entries = {
            clientId: clientId,
            serverHost: serverHost,
            serverPort: serverPort,
            serverScheme: (serverScheme ? serverScheme : 'https'),
            sharedSecret: sharedSecret,
            trustAnchors: (truststore ?
                           (Array.isArray(truststore) ?
                            truststore : this._loadTrustAnchorsBinary(truststore)) : []),
            connectedDevices: (connectedDevices ? connectedDevices : {})
        };

        new iotcs.UnifiedTrustStore(taStoreFile, taStorePassword, true).store(entries);
    }
};

/**
 * Enumeration of unified trust store format constants.
 *
 * @alias constants
 * @class
 * @memberof iotcs.UnifiedTrustStore
 * @readonly
 * @enum {Integer}
 * @static
 */
iotcs.UnifiedTrustStore.constants = {
    version: 33,
    AES_BLOCK_SIZE: 16,
    AES_KEY_SIZE: 16,
    PBKDF2_ITERATIONS: 10000,
    TAGS: {}
};

iotcs.UnifiedTrustStore.constants.TAGS = {
    /**
     * The URI of the server, e.g., https://iotinst-mydomain.iot.us.oraclecloud.com:443
     */
    serverUri: 1,
    /** A client id is either an integration id (for enterprise clients), or an
     * activation id (for device clients). An activation id may also be
     * referred to a hardware id.
     */
    clientId: 2,
    /**
     * The shared secret as plain text
     */
    sharedSecret: 3,
    /**
     * For devices, the endpoint id TLV is omitted from the provisioning file
     * (unless part of a CONNECTED_DEVICE_TAG TLV).
     * For enterpise integrations, the endpoint id is set in the provisioning file
     * by the inclusion of the second ID argument.
     */
    endpointId: 4,
    /**
     * The trust anchor is the X509 cert
     */
    trustAnchor: 5,
    privateKey: 6,
    publicKey: 7,
    /**
     * The client id and shared secret of a device that can connect
     * indirectly through the device client
     *
     * Connected device TLV =
     * [CONNECTED_DEVICE_TAG|<length>|[CLIENT_ID_TAG|<icd activation id length>|<icd activation id>][SHARED_SECRET_TAG|<icd shared secrect length>|<icd shared secret>]]
     */
    connectedDevice: 8
};

Object.freeze(iotcs.UnifiedTrustStore.constants);
Object.freeze(iotcs.UnifiedTrustStore.constants.TAGS);
