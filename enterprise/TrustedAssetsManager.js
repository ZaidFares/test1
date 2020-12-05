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
 *        manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.store.
 * @param {string} [taStorePassword] - The trusted assets store file password to be used for trusted
 *        assets manager creation.  This is optional.  If none is given the default global library
 *        parameter is used: iotcs.oracle.iot.tam.storePassword.
 *
 * @alias iotcs.enterprise.TrustedAssetsManager
 * @class iotcs.enterprise.TrustedAssetsManager
 * @memberof iotcs.enterprise
 */
iotcs.enterprise.TrustedAssetsManager = class {
    // Static private/protected functions
    /** @ignore */
    static _decryptSharedSecret (encryptedSharedSecret, password) {
        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let cipher = forge.cipher.createDecipher('AES-CBC', key);
        cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
        cipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedSharedSecret),
                                              'binary'));
        cipher.finish();
        return cipher.output.toString();
    }

    /** @ignore */
    static _encryptSharedSecret (sharedSecret, password) {
        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({iv: forge.util.createBuffer(16).fillWithByte(0, 16)});
        cipher.update(forge.util.createBuffer(sharedSecret, 'utf8'));
        cipher.finish();
        return cipher.output.toHex();
    }

    /** @ignore */
    static _loadTrustAnchors (truststore) {
        return iotcs.impl.Platform.File._load(truststore)
            .split(/\-{5}(?:B|E)(?:[A-Z]*) CERTIFICATE\-{5}/)
            .filter(elem => { return ((elem.length > 1) && (elem.indexOf('M') > -1)); })
            .map(elem => { return '-----BEGIN CERTIFICATE-----' +
                           elem.replace(new RegExp('\r\n', 'g'),'\n') +
                           '-----END CERTIFICATE-----'; });
    }

    /** @ignore */
    //PBKDF2 (RFC 2898)
    static _pbkdf (password) {
        return forge.pkcs5.pbkdf2(password, '', 1000, 16);
    }

    /** @ignore */
    static _signTaStoreContent (taStoreEntries, password) {
        let data = (taStoreEntries.clientId ? ('{' + taStoreEntries.clientId + '}') : '') +
            '{' + taStoreEntries.serverHost + '}' +
            '{' + taStoreEntries.serverPort + '}' +
            (taStoreEntries.sharedSecret ? ('{' + taStoreEntries.sharedSecret + '}') : '') +
            (taStoreEntries.trustAnchors ? ('{' + taStoreEntries.trustAnchors + '}') : '');

        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
        let ret = {};

        if (taStoreEntries.clientId) {
            ret.clientId = taStoreEntries.clientId;
        }
        
        ret.serverHost = taStoreEntries.serverHost;
        ret.serverPort = taStoreEntries.serverPort;

        if (taStoreEntries.sharedSecret) {
            ret.sharedSecret = taStoreEntries.sharedSecret;
        }

        if (taStoreEntries.trustAnchors) {
            ret.trustAnchors = taStoreEntries.trustAnchors;
        }

        ret.signature = hmac.digest().toHex();
        return ret;
    }

    /** @ignore */
    static _verifyTaStoreContent (taStoreEntries, password) {
        let data = (taStoreEntries.clientId ? ('{' + taStoreEntries.clientId + '}') : '') +
            '{' + taStoreEntries.serverHost + '}' +
            '{' + taStoreEntries.serverPort + '}' +
            (taStoreEntries.sharedSecret ? ('{' + taStoreEntries.sharedSecret + '}') : '') +
            (taStoreEntries.trustAnchors ? ('{' + taStoreEntries.trustAnchors + '}') : '');

        let key = iotcs.enterprise.TrustedAssetsManager._pbkdf(password);
        let hmac = forge.hmac.create();
        hmac.start('sha256', key);
        hmac.update(data);
        return taStoreEntries.signature && hmac.digest().toHex() === taStoreEntries.signature;
    }

    constructor(taStoreFile,taStorePassword) {
        this._clientId = null;
        this._serverHost = null;
        this._serverPort = null;
        this._sharedSecret = null;
        this._trustAnchors = null;

        let _taStoreFile = taStoreFile || iotcs.oracle.iot.tam.store;
        let _taStorePassword = taStorePassword || iotcs.oracle.iot.tam.storePassword;

        if (!_taStoreFile) {
            iotcs.error('No Trusted Assetss Store file defined.');
            return;
        }

        if (!_taStorePassword) {
            iotcs.error('No Trusted Assets Store password defined.');
            return;
        }

        if (!_taStoreFile.endsWith('.json')) {
            this._unifiedTrustStore = new iotcs.UnifiedTrustStore(_taStoreFile, _taStorePassword,
                                                                  false);
            this._unifiedTrustStore._setPrivateValues(this);
        } else {
            this._load = () => {
                let input = iotcs.impl.Platform.File._load(_taStoreFile);
                let entries = JSON.parse(input);

                if (!iotcs.enterprise.TrustedAssetsManager._verifyTaStoreContent(entries,
                                                                                 _taStorePassword))
                {
                    iotcs.error('Trusted Assets Store not signed or has been tampered with.');
                    return;
                }

                this._clientId = entries.clientId;
                this._serverHost = entries.serverHost;
                this._serverPort = entries.serverPort;
                this._sharedSecret = (entries.sharedSecret ?
                    iotcs.enterprise.TrustedAssetsManager._decryptSharedSecret(entries.sharedSecret,
                        _taStorePassword) : null);
                this._trustAnchors = entries.trustAnchors;

            };

            this._load();
        }
    }

    // Public functions
    /**
     * Retrieves the ID of this client.  If the client is a device, the client ID is the device ID.  If
     * the client is a pre-activated enterprise application, the client ID corresponds to the assigned
     * endpoint ID.  The client ID is used along with a client secret derived from the shared secret to
     * perform secret-based client authentication with the IoT CS server.
     *
     * @function getClientId
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?string} The ID of this client, or <code>null</code> if any error occurs retrieving the
     *          client ID.
     */
    getClientId() {
        return this._clientId;
    }

    /**
     * Retrieves the IoT CS server host name.
     *
     * @function getServerHost
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?string} The IoT CS server host name, or <code>null</code> if any error occurs
     *          retrieving the server host name.
     */
    getServerHost() {
        return this._serverHost;
    }

    /**
     * Retrieves the IoT CS server port.
     *
     * @function getServerPort
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?number} The IoT CS server port (a positive integer), or <code>null</code> if any error
     *          occurs retrieving the server port.
     */
    getServerPort() {
        return this._serverPort;
    }

    /**
     * Retrieves the trust anchor or most-trusted Certification Authority (CA) to be used to validate
     * the IoT CS server certificate chain.
     *
     * @function getTrustAnchorCertificates
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @returns {?Array} The PEM-encoded trust anchor certificates, or <code>null</code> if any error
     *          occurs retrieving the trust anchor.
     */
    getTrustAnchorCertificates() {
        return this._trustAnchors;
    }

    /**
     * Provisions the designated Trusted Assets Store with the provided provisioning assets.  The
     * provided shared secret will be encrypted using the provided password.
     *
     * @memberof iotcs.enterprise.TrustedAssetsManager
     * @function provision
     *
     * @param {string} taStoreFile - The Trusted Assets Store file name.
     * @param {string} taStorePassword - The Trusted Assets Store password.
     * @param {string} serverHost - The IoT CS server host name.
     * @param {number} serverPort - The IoT CS server port.
     * @param {?string} clientId - The ID of the client.
     * @param {?string} sharedSecret - The client's shared secret.
     * @param {?string} truststore - The truststore file containing PEM-encoded trust anchors
     *        certificates to be used to validate the IoT CS server certificate chain.
     */
    provision(taStoreFile, taStorePassword, serverHost, serverPort, clientId, sharedSecret,
              truststore)
    {
        if (!taStoreFile) {
            throw 'No Trusted Assets Store file provided.';
        }

        if (!taStorePassword) {
            throw 'No Trusted Assets Store password provided.';
        }

        let entries = {};
        entries.serverHost = serverHost;
        entries.serverPort = serverPort;

        if (clientId) {
            entries.clientId = clientId;
        }

        if (sharedSecret) {
            entries.sharedSecret = this._encryptSharedSecret(sharedSecret, taStorePassword);
        }

        if (truststore) {
            entries.trustAnchors = (Array.isArray(truststore) ? truststore :
                iotcs.enterprise.TrustedAssetsManager._loadTrustAnchors(truststore));
        }

        entries = this._signTaStoreContent(entries, taStorePassword);
        let output = JSON.stringify(entries);
        iotcs.impl.Platform.File._store(taStoreFile, output);
    }

    /**
     * Signs the provided data using the specified algorithm and the shared secret.  This method is only
     * use for secret-based client authentication with the IoT CS server.
     *
     * @function signWithSharedSecret
     * @memberof iotcs.enterprise.TrustedAssetsManager
     *
     * @param {Array} data - The bytes to be signed.
     * @param {string} algorithm - The hash algorithm to use.
     * @return {?Array} - The signature bytes, or <code>null</code> if any error occurs retrieving the
     *         necessary key material or performing the operation.
     */
    signWithSharedSecret(data, algorithm) {
        let digest = null;

        if (!algorithm) {
            iotcs.error('Algorithm cannot be null.');
            return null;
        }

        if (!data) {
            iotcs.error('Data cannot be null.');
            return null;
        }

        try {
            let hmac = forge.hmac.create();
            hmac.start(algorithm, this._sharedSecret);
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

