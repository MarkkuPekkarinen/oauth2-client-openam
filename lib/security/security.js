/**
 * Created by robincher on 12/12/16.
 */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const nonce = require('nonce')();
const crypto = require('crypto');
const qs = require('querystring');

var security = {};

// Sorts a JSON object based on the key value in alphabetical order
function sortJSON(json) {
    if (_.isNil(json)) {
        return json;
    }

    var newJSON = {};
    var keys = Object.keys(json);
    keys.sort();

    for (key in keys) {
        newJSON[keys[key]] = json[keys[key]];
    }

    return newJSON;
};

/**
 * Generate basic header authorization header without signing
 * @returns {string}
 */
function generateBasicHeader(appId) {

    return "Apex apex_app_id=\"" + appId + "\"";
};

/**
 * @param appId Akana API ClientId
 * @param passphrase Key Certificate Passphrase
 * @returns {string}
 */
function generateSHA1Header(appId, passphrase) {
    var nonceVal = nonce();
    var timestamp = (new Date).getTime();

    // construct base string and hash it using crypto
    var baseString = nonceVal.toString() + timestamp.toString() + passphrase;
    var hash = crypto.createHash('sha1').update(baseString).digest('base64');

    return "Apex realm=\"http://localhost:3000\",apex_timestamp=\"" + timestamp +
        "\",apex_nonce=\"" + nonceVal + "\",apex_app_id=\"" + appId +
        "\",apex_digest_method=\"SHA1\",apex_secret_digest=\"" + hash +
        "\",apex_version=\"1.0\"";
};

/**
 * @param url Full akana API URL
 * @param params JSON object of params sent, key/value pair.
 * @param method
 * @param appId Akana API ClientId
 * @param keyCertContent Private Key Certificate content
 * @param keyCertPassphrase Private Key Certificate Passphrase
 * @returns {string}
 */
function generateSHA256withRSAHeader(url, params, method, strContentType, appId, keyCertContent, keyCertPassphrase) {
    var nonceValue = nonce();
    var timestamp = (new Date).getTime();

    var defaultAtmosphereHeaders = {
        "apex_app_id": appId,
        "apex_nonce": nonceValue,
        "apex_signature_method": "SHA256withRSA",
        "apex_timestamp": timestamp,
        "apex_version": "1.0"
    };

    // Remove params unless Content-Type is "application/x-www-form-urlencoded"
    if(method == "POST" && strContentType!="application/x-www-form-urlencoded") {
        params = {};
    }

    // merge default headers with query/body params and sort alphabetically.
    var baseParams = sortJSON(_.merge(defaultAtmosphereHeaders, params));

    // base string required by crypto to hash and sign the signature token for API gateway
    var baseString = method.toUpperCase() + "&" + url + "&" +
        qs.stringify(baseParams);

    var signWith = {
        key: keyCertContent
    };
    if (!_.isUndefined(keyCertPassphrase) && !_.isEmpty(keyCertPassphrase)) _.set(signWith, "passphrase", keyCertPassphrase);

    // Load pem file containing the x509 cert & private key & sign the base string with it.
    // var keyCertContent = fs.readFileSync(path.resolve(process.cwd(), keyCertFilepath)).toString('ascii');
    var signature = crypto.createSign('RSA-SHA256')
        .update(baseString)
        .sign(signWith, 'base64');


    var strApexHeader = "Apex realm=\"http://localhost:3000\",apex_timestamp=\"" + timestamp +
        "\",apex_nonce=\"" + nonceValue + "\",apex_app_id=\"" + appId +
        "\",apex_signature_method=\"SHA256withRSA\",apex_signature=\"" + signature +
        "\",apex_version=\"1.0\"";

    return strApexHeader;
};

/**
 * @param url API URL
 * @param params JSON object of params sent, key/value pair.
 * @param method
 * @param appId API ClientId
 * @param passphrase API Secret or certificate passphrase
 * @returns {string}
 */
security.generateAuthorizationHeader = function (url, params, method, strContentType, authType, appId, keyCertContent, passphrase) {
    if (authType == "L1") {
        return generateBasicHeader(appId);
    } else if (authType == "L1-SHA") {
        return generateSHA1Header(appId, passphrase);
    } else if (authType == "L2") {
        return generateSHA256withRSAHeader(url, params, method, strContentType, appId, keyCertContent, passphrase);
    } else {
        return "";
    }

};

module.exports = security;