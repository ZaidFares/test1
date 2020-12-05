/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The <code>TrustedAssetsManager</code> interface defines methods for handling trust
 * material used for activation and authentication to the IoT CS. Depending on
 * the capability of the client or device as well as on the security
 * requirements implementations of this interface may simply store sensitive
 * trust material in a plain persistent store, in some keystore or in a secure
 * token.
 * <dl>
 * <dt>Authentication of Devices with the IoT CS</dt>
 * <dd>
 * <dl>
 * <dt>Before/Upon Device Activation</dt>
 * <dd>
 * A device must use client secret-based authentication to authenticate with the
 * OAuth service and retrieve an access token to perform activation with the IoT
 * CS server. This is done by using an activation ID and a shared secret.
 * </dd>
 * <dt>After Device Activation</dt>
 * <dd>
 * A device must use client assertion-based authentication to authenticate with
 * the OAuth service and retrieve an access token to perform send and retrieve
 * messages from the IoT CS server. This is done by using the assigned endpoint ID
 * and generated private key.</dd>
 * </dl>
 * </dd>
 * <dt>Authentication of <em>Pre-activated</em> Enterprise Applications with the
 * IoT CS</dt>
 * <dd>
 * <dl>
 * <dt>Before/After Application Activation</dt>
 * <dd>
 * An enterprise integration must use client secret-based authentication to authenticate with the
 * OAuth service and retrieve an access token to perform any REST calls with the IoT
 * CS server. This is done by using the integration ID and a shared secret.</dd>
 * </dd>
 * </dl>
 *
 * @param {string} [taStoreFile] - The trusted assets store file path to be used for trusted assets
 *        manager creation. This is optional.  If none is given the default global library parameter
 *        is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation. This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.device.TrustedAssetsManager
 * @class iotcs.device.TrustedAssetsManager
 * @memberof iotcs.device
 */
iotcs.device.TrustedAssetsManager = class {
    // Static private functions
    /**
     * @ignore
     */
    static _decryptSharedSecret (encryptedSharedSecret, password) {
	      let key = _pbkdf(password);
	      let cipher = forge.cipher.createDecipher('AES-CBC', key);
	      cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
	      cipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedSharedSecret),
                                              'binary'));
	      cipher.finish();
	      return cipher.output.toString();
    }

    /**
     * @ignore
     */
    static _encryptSharedSecret (sharedSecret, password) {
	      let key = _pbkdf(password);
	      let cipher = forge.cipher.createCipher('AES-CBC', key);
	      cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
	      cipher.update(forge.util.createBuffer(sharedSecret, 'utf8'));
	      cipher.finish();
	      return cipher.output.toHex();
    }

    /**
     * @ignore
     */
    static _generateSelfSignedCert (privateKey, publicKey, clientId) {
        let cert = forge.pki.createCertificate();
        cert.publicKey = publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        let attrs = [{
            name: 'commonName',
            value: clientId
        }];

        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(privateKey);
        return cert;
    }

    /**
     * @ignore
     */
    static _isSelfSigned (certificate) {
        return certificate.isIssuer(certificate);
    }

    /**
     * @ignore
     */
    static _loadTrustAnchors (truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => {
                return ((elem.length > 1) && (elem.indexOf('M') > -1));
            })
        //.filter(elem => elem.length > 0)
            .map(elem => {
                return '-----BEGIN CERTIFICATE-----' +
                    elem.replace(new RegExp('\r\n', 'g'),'\n') + '-----END CERTIFICATE-----';
            });
        //.map(elem => elem = '-----BEGIN CERTIFICATE-----' + elem + '-----END CERTIFICATE-----');
    }

    /**
     * @ignore
     */
    //PBKDF2 (RFC 2898)
    static _pbkdf (password) {
        return forge.pkcs5.pbkdf2(password, '', 1000, 16);
    }

    /**
     * @ignore
     */
    static _signTaStoreContent (taStoreEntries, password) {
        let data = '{' + taStoreEntries.clientId + '}'
            + '{' + taStoreEntries.serverHost + '}'
            + '{' + taStoreEntries.serverPort + '}'
            + '{' + taStoreEntries.serverScheme + '}'
            + '{' + taStoreEntries.sharedSecret + '}'
            + '{' + taStoreEntries.trustAnchors + '}'
            + '{' + (taStoreEntries.keyPair ? taStoreEntries.keyPair : null) + '}'
            + '{' + (taStoreEntries.connectedDevices ? taStoreEntries.connectedDevices : {}) + '}';

        let key = _pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);

        return {
            clientId: taStoreEntries.clientId,
            serverHost: taStoreEntries.serverHost,
            serverPort: taStoreEntries.serverPort,
            serverScheme: taStoreEntries.serverScheme,
            sharedSecret: taStoreEntries.sharedSecret,
            trustAnchors: taStoreEntries.trustAnchors,
            keyPair: (taStoreEntries.keyPair ? taStoreEntries.keyPair : null),
            connectedDevices: (taStoreEntries.connectedDevices ?
                               taStoreEntries.connectedDevices : {}),
            signature: hmac.digest().toHex()
        };
    }

    /**
     * @ignore
     */
    static _verifyTaStoreContent (taStoreEntries, password) {
        let data = '{' + taStoreEntries.clientId + '}'
	          + '{' + taStoreEntries.serverHost + '}'
	          + '{' + taStoreEntries.serverPort + '}'
            + (taStoreEntries.serverScheme ? ('{' + taStoreEntries.serverScheme + '}') : '')
	          + '{' + taStoreEntries.sharedSecret + '}'
	          + '{' + taStoreEntries.trustAnchors + '}'
	          + '{' + (taStoreEntries.keyPair ? taStoreEntries.keyPair : null) + '}'
            + (taStoreEntries.connectedDevices ? '{' + taStoreEntries.connectedDevices + '}' : '');

        let key = _pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
	      return taStoreEntries.signature && hmac.digest().toHex() === taStoreEntries.signature;
    }

    // Static public functions
    /**
     * Provisions the designated Trusted Assets Store with the provided provisioning assets.  The
     * provided shared secret will be encrypted using the provided password.
     *
     * @alias iotcs.device.TrustedAssetsManager
     * @function provision
     * @memberof iotcs.device.TrustedAssetsManager
     * @static
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverScheme - The scheme used to communicate with the server. Possible values
     *        are http(s) or mqtt(s).
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {string} clientId - The ID of the client.
     * @param {string} sharedSecret - The client's shared secret.
     * @param {string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     * @param {object} connectedDevices - The indirect connect devices.
     */
    static provision(taStoreFile, taStorePassword, serverScheme, serverHost, serverPort, clientId,
               sharedSecret, truststore, connectedDevices)
    {
        if (!taStoreFile) {
            throw 'No TA Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No TA Store password provided.';
        }

        let entries = {
            'clientId' : clientId,
            'serverHost' : serverHost,
            'serverPort' : serverPort,
            'serverScheme' : (serverScheme ? serverScheme : 'https'),
            'sharedSecret' : this._encryptSharedSecret(sharedSecret, taStorePassword),
            'trustAnchors' : (truststore ? (Array.isArray(truststore) ?
                                            truststore : this._loadTrustAnchors(truststore)) : []),
            'connectedDevices': (connectedDevices ? connectedDevices : {})
	      };

	      entries = this._signTaStoreContent(entries, taStorePassword);
	      let output = JSON.stringify(entries);
	      iotcs.impl.Platform.File._store(taStoreFile, output);
    }

    constructor(taStoreFile, taStorePassword) {
        //DJM: Need to figure out which of these is public and which is _private.
        this._clientId = null;
        this._sharedSecret = null;
        this._serverHost = null;
        this._serverPort = null;
        this._endpointId = null;
        this._serverScheme = 'https';
        this._taStoreFile = null;

        this._privateKey = null;
        this._publicKey = null;
        this._certificate = null;
        this._trustAnchors = [];
        this._connectedDevices = {};

        let _taStoreFile = taStoreFile || iotcs.oracle.iot.tam.store;
        let _taStorePassword = taStorePassword || iotcs.oracle.iot.tam.storePassword;

        if (!_taStoreFile) {
            iotcs.error('No trusted assets store file defined.');
            return;
        }

        if (!_taStorePassword) {
            iotcs.error('No trusted assets store password defined.');
            return;
        }

        if (!_taStoreFile.endsWith('.json')) {
            this._unifiedTrustStore =
                new iotcs.UnifiedTrustStore(_taStoreFile, _taStorePassword, false);
            this._unifiedTrustStore._setPrivateValues(this);
            this._taStoreFile = _taStoreFile;
        } else {
            this._load = () => {
                let input = iotcs.impl.Platform.File._load(_taStoreFile);
                let entries = JSON.parse(input);

                if (!_verifyTaStoreContent(entries, _taStorePassword)) {
                    iotcs.error('TA Store not signed or tampered with');
                    return;
                }

                this._clientId = entries.clientId;
                this._serverHost = entries.serverHost;
                this._serverPort = entries.serverPort;
                this._serverScheme = entries.serverScheme;
                this._sharedSecret = this._decryptSharedSecret(entries.sharedSecret, _taStorePassword);
                this._trustAnchors = entries.trustAnchors;
                this._connectedDevices = entries.connectedDevices;

                {
                    let keyPair = entries.keyPair;

                    if (keyPair) {
                        let p12Der = forge.util.decode64(entries.keyPair);
                        let p12Asn1 = forge.asn1.fromDer(p12Der, false);
                        let p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, _taStorePassword);

                        let bags = p12.getBags({
                            bagType: forge.pki.oids.certBag
                        });

                        this._certificate = bags[forge.pki.oids.certBag][0].cert;

                        bags = p12.getBags({
                            bagType: forge.pki.oids.pkcs8ShroudedKeyBag
                        });

                        let bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
                        this._privateKey = bag.key;
                        this._endpointId = bag.attributes.friendlyName[0];
                    }
                }
            };

            this._store = () => {
                iotcs.log('Store ' + ((this._privateKey !== null) ? 'true' : 'false') + ' ' +
                        this._endpointId + '.');
                let keyPairEntry = null;

                if (this._privateKey) {
                    let p12Asn1 = forge.pkcs12.toPkcs12Asn1(
                        this._privateKey,
                        this._certificate,
                        _taStorePassword, {
                            'friendlyName': this._endpointId
                        });

                    let p12Der = forge.asn1.toDer(p12Asn1).getBytes();
                    keyPairEntry = forge.util.encode64(p12Der);
                }

                let entries = {
                    'clientId': this._clientId,
                    'serverHost': this._serverHost,
                    'serverPort': this._serverPort,
                    'serverScheme': this._serverScheme,
                    'sharedSecret': this._encryptSharedSecret(this._sharedSecret, _taStorePassword),
                    'trustAnchors': this._trustAnchors,
                    'keyPair': keyPairEntry,
                    'connectedDevices': this._connectedDevices
                };

                entries = this._signTaStoreContent(entries, _taStorePassword);

                let output = JSON.stringify(entries);
                iotcs.impl.Platform.File._store(_taStoreFile, output);
            };

            this._load();
        }
    }

    // Private/protected functions
    _buildClientAssertion() {
        let id = (!this.isActivated() ? this.getClientId() : this.getEndpointId());
        let now = ((typeof this._serverDelay === 'undefined') ?
                   Date.now() : (Date.now() + this._serverDelay));
        let exp = parseInt((now + 900000)/1000);

        let header = {
            typ: 'JWT',
            alg: (!this.isActivated() ? 'HS256' : 'RS256')
        };

        let claims = {
            iss: id,
            sub: id,
            aud: 'oracle/iot/oauth2/token',
            exp: exp
        };

        let inputToSign = iotcs.impl.Platform.Util._btoa(JSON.stringify(header)) + '.' +
            iotcs.impl.Platform.Util._btoa(JSON.stringify(claims));

        let signed;

        try {
            if (!this.isActivated()) {
                let digest = this.signWithSharedSecret(inputToSign, "sha256", null);
                signed = forge.util.encode64(forge.util.hexToBytes(digest.toHex()));
            } else {
                let signatureBytes = this.signWithPrivateKey(inputToSign, "sha256");
                signed = forge.util.encode64(signatureBytes);
            }
        } catch (e) {
            let error = iotcs.createError('Error on generating oauth signature: ', e);
            return null;
        }

        inputToSign = inputToSign + '.' + signed;
        inputToSign = inputToSign.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
        return inputToSign;
    }

    /**
     * Generates the key pair to be used for assertion-based client authentication with the IoT CS.
     * This function is asynchronous and will use native APIs, which can be significantly faster
     * than using the non-native version.
     *
     * @function generateKeyPair
     * @ignore
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} algorithm The key algorithm.
     * @param {number} keySize The key size.
     * @param {function(boolean, error)} callback The callback to call with the results.
     * @returns {boolean} {@code true} if the key pair generation succeeded.
     */
    _generateKeyPairNative(algorithm, keySize, callback) {
        if (!algorithm) {
            callback(false, iotcs.createError('Algorithm cannot be null.'));
        }

        if (keySize <= 0) {
            callback(false, iotcs.createError('Key size cannot be negative or 0.'));
        }

        if (this._privateKey) {
            callback(false, iotcs.createError('Key pair already generated.'));
        }

        let keypair;
        let self = this;

        forge.rsa.generateKeyPair({bits: keySize, workers: -1}, (err, keypair) => {
            if (err) {
                callback(false, iotcs.createError('Could not generate key pair: ' + err));
            } else {
                self._keypair = keypair;
                self._privateKey = keypair.privateKey;
                self._publicKey = keypair.publicKey;
                callback(true);
            }
        });
    }

    // Public functions
    /**
     * Generates the key pair to be used for assertion-based client authentication with the IoT CS.
     *
     * @function generateKeyPair
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} algorithm - The key algorithm.
     * @param {number} keySize - The key size.
     * @returns {boolean} <code>true</code> if the key pair generation succeeded.
     */
    generateKeyPair(algorithm, keySize) {
        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return false;
        }

        if (keySize <= 0) {
            iotcs.error('Key size cannot be negative or 0.');
            return false;
        }

        if (this._privateKey) {
            iotcs.error('Key pair already generated.');
            return false;
        }

        try {
            let keypair = forge.rsa.generateKeyPair({
                bits : keySize
                //, e: 0x10001
            });

            this._privateKey = keypair.privateKey;
            this._publicKey = keypair.publicKey;
        } catch (e) {
            iotcs.error('Could not generate key pair: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Retrieves the ID of this client.  If the client is a device the client ID is the device
     * activation ID; if the client is a pre-activated enterprise application the client ID
     * corresponds to the assigned integration ID. The client ID is used along with a client secret
     * derived from the shared secret to perform secret-based client authentication with the IoT CS
     * server.
     *
     * @function getClientId
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The ID of this client or <code>null</code> if any error occurs retrieving
     *          the client ID.
     */
    getClientId() {
        return this._clientId;
    }

    /**
     * Retrieves the IoT CS connected devices.
     *
     * @function getConnectedDevices
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?object} The IoT CS connected devices or <code>null</code> if any error occurs
     *          retrieving connected devices.
     */
    getConnectedDevices() {
        return this._connectedDevices;
    }

    /**
     * Retrieves the assigned endpoint certificate.
     *
     * @function getEndpointCertificate
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The PEM-encoded certificate or <code>null</code> if no certificate was
     *          assigned, or if any error occurs retrieving the endpoint certificate.
     */
    getEndpointCertificate() {
        let certificate = null;

        if (!this._certificate) {
            iotcs.error('Endpoint certificate not assigned.');
            return null;
        }

        try {
            if (!this._isSelfSigned(this._certificate)) {
                certificate = forge.pki.certificateToPem(this._certificate);
            }
        } catch (e) {
            iotcs.error('Unexpected error retrieving certificate encoding: ' + 2);
            return null;
        }

        //XXX ??? is it an array or a string
        return certificate;
    }

    /**
     * Retrieves the assigned endpoint ID.
     *
     * @function getEndpointId
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @return {?string} The assigned endpoint ID or <code>null</code> if any error occurs retrieving
     *         the endpoint ID.
     */
    getEndpointId() {
        if (!this._endpointId) {
            throw new Error('EndpointId not assigned.');
        }

        return this._endpointId;
    }

    /**
     * Retrieves the public key to be used for certificate request.
     *
     * @function getPublicKey
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The device public key as a PEM-encoded string or <code>null</code> if any
     *          error occurs retrieving the public key.
     */
    getPublicKey() {
        if ((!this._publicKey) && (!this._certificate)) {
            throw new Error('Key pair not yet generated or certificate not yet assigned');
        }

        let key = (this._publicKey) ? this._publicKey : this._certificate.publicKey;
        return forge.pki.publicKeyToPem(key);
    }

    /**
     * Retrieves the IoT CS server host name.
     *
     * @function getServerHost
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server host name or <code>null</code> if any error occurs
     *          retrieving the server host name.
     */
    getServerHost() {
        return this._serverHost;
    }

    /**
     * Retrieves the IoT CS server port.
     *
     * @function getServerPort
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?number} The IoT CS server port (a positive integer) or <code>null</code> if any
     *          error occurs retrieving the server port.
     */
    getServerPort() {
        return this._serverPort;
    }

    /**
     * Retrieves the IoT CS server scheme.
     *
     * @function getServerScheme
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server scheme, or <code>null</code> if any error occurs
     *          retrieving the server scheme.
     */
    getServerScheme() {
        return this._serverScheme;
    }

    /**
     * Retrieves the trust anchor or most-trusted Certification Authority (CA) to be used to validate
     * the IoT CS server certificate chain.
     *
     * @function getTrustAnchorCertificates
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {?Array} The PEM-encoded trust anchor certificates, or <code>null</code> if any error
     *          occurs retrieving the trust anchor.
     */
    getTrustAnchorCertificates() {
        return this._trustAnchors;
    }

    /**
     * Returns whether the client is activated.  The client is deemed activated if it has at least
     * been assigned endpoint ID.
     *
     * @function isActivated
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @returns {boolean} <code>true</code> if the device is activated.
     */
    isActivated() {
        //DJM:...why can't you just return the if part?...why a ternary here?
        return (this._endpointId && (this._endpointId !== null) && (this._endpointId !== '')) ?
            true : false;
    }

    /**
     * Resets the trust material back to its provisioning state; in particular, the key pair is
     * erased.  The client will have to go, at least,through activation again; depending on the
     * provisioning policy in place, the client may have to go through registration again.
     *
     * @function reset
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @return {boolean} <code>true</code> if the operation was successful.
     */
    reset() {
        this._endpointId = null;
        this._privateKey = null;
        this._publicKey = null;
        this._certificate = null;

        try {
            if (this._unifiedTrustStore) {
                this._unifiedTrustStore._updatePrivate(this);
            } else {
                this._store();
            }
        } catch (e) {
            iotcs.error('Error resetting the trust assets: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Sets the assigned endpoint ID and certificate as returned by the activation procedure.  Upon a
     * call to this method, a compliant implementation of the <code>TrustedAssetsManager</code>
     * interface must ensure the persistence of the provided endpoint credentials.  This method can only
     * be called once; unless the <code>TrustedAssetsManager</code> has been reset.
     * <p>
     * If the client is a pre-activated enterprise application, the endpoint ID has already been
     * provisioned and calling this method MUST fail with an <code>IllegalStateException</code>.
     * </p>
     *
     * @function setEndpointCredentials
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {string} endpointId - The assigned endpoint ID.
     * @param {string} certificate - The PEM-encoded certificate issued by the server or
     *        <code>null</code> if no certificate was provided by the server.
     * @returns {boolean} whether setting the endpoint credentials succeeded.
     */
    setEndpointCredentials(endpointId, certificate) {
        /*if (!endpointId) {
          iotcs.error('EndpointId cannot be null');
          return false;
          }
          if (this._endpointId) {
          iotcs.error('EndpointId already assigned');
          return false;
          }*/
        if (!this._privateKey) {
            iotcs.error('Private key not yet generated.');
            return false;
        }

        if (endpointId) {
            this._endpointId = endpointId;
        } else {
            this._endpointId = '';
        }

        try {
            if (!certificate || certificate.length <= 0) {
                this._certificate = iotcs.device.TrustedAssetsManager._generateSelfSignedCert(this._privateKey, this._publicKey,
                                                            this._clientId);
            } else {
                this._certificate = forge.pki.certificateFromPem(certificate);
            }
        } catch (e) {
            iotcs.error('Error generating certificate: ' + e);
            return false;
        }

        try {
            if (this._unifiedTrustStore) {
                this._unifiedTrustStore._updatePrivate(this);
            } else {
                this._store();
            }
        } catch (e) {
            iotcs.error('Error storing the trust assets: ' + e);
            return false;
        }

        return true;
    }

    /**
     * Signs the provided data using the specified algorithm and the private key.  This method is only
     * use for assertion-based client authentication with the IoT CS.
     *
     * @function signWithPrivateKey
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {Array|string} data - A byte string to sign.
     * @param {string} algorithm - The algorithm to use.
     * @returns {?Array} The signature bytes or <code>null</code> if any error occurs retrieving the
     *          necessary key material or performing the operation.
     */
    signWithPrivateKey(data, algorithm) {
        let signature = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        if (!this._privateKey) {
            iotcs.error('Private key not yet generated.');
            return null;
        }

        try {
            let md = null;

            switch (algorithm) {
            case 'md5': {
                md = forge.md.md5.create();
                break;
            }
            case 'sha1': {
                md = forge.md.sha1.create();
                break;
            }
            case 'sha256': {
                md = forge.md.sha256.create();
                break;
            }
            case 'sha512': {
                md = forge.md.sha512.create();
                break;
            }
            case 'sha512/224': {
                md = forge.md.sha512.sha224.create();
                break;
            }
            case 'sha512/256': {
                md = forge.md.sha512.sha256.create();
                break;
            }
            }
            if (md) {
                md.update(data);
                signature = this._privateKey.sign(md);
            }
        } catch (e) {
            iotcs.error('Error signing with private key: ' + e);
            return null;
        }

        return signature;
    }

    /**
     * Signs the provided data using the specified algorithm and the shared secret of the device
     * indicated by the given hardware id.  Passing <code>null</code> for <code>hardwareId</code> is
     * identical to passing {@link #getClientId()}.
     *
     * @function signWithSharedSecret
     * @memberof iotcs.device.TrustedAssetsManager
     *
     * @param {Array} data - The bytes to be signed.
     * @param {string} algorithm - The hash algorithm to use.
     * @param {?string} hardwareId - The hardware id of the device whose shared secret is to be used
     *        for signing.
     * @return {?Array} The signature bytes or <code>null</code> if any error occurs retrieving the
     *         necessary key material or performing the operation.
     */
    signWithSharedSecret(data, algorithm, hardwareId) {
        let digest = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        let secretKey;

        if (hardwareId === null || hardwareId == this._clientId) {
            secretKey = this._sharedSecret;
        } else {
            secretKey = this._connectedDevices[hardwareId];
        }

        if (secretKey === null || (typeof secretKey === "undefined")) {
            iotcs.log("Shared secret is not provisioned for " +
                    (hardwareId ? hardwareId : this._clientId) + " device");
            return null;
        }

        try {
            let hmac = forge.hmac.create();
            hmac.start(algorithm, secretKey);
            hmac.update(data);
            digest = hmac.digest();
            // iotcs.log(digest.toHex());
        } catch (e) {
            iotcs.error('Error signing with shared secret: ' + e);
            return null;
        }

        return digest;
    }
};
