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
    if(_.isNil(json)) {
        return json;
    }

    var newJSON = {};
    var keys = Object.keys(json);
    keys.sort();

    for(key in keys) {
        newJSON[keys[key]] = json[keys[key]];
    }

    return newJSON;
};

/**
 * Generate basic header authorization header without signing
 * @returns {string}
 */
function generateBasicHeader(){
    var nonceVal = nonce();
    var timestamp = (new Date).getTime();

    // construct base string and hash it using crypto
    var baseString = nonceVal.toString() + timestamp.toString() +  config.auth.secret;
    var hash = crypto.createHash('sha1').update(baseString).digest('base64');

    return "Atmosphere atmosphere_app_id=\"" + config.auth.appId + "\"";
};

/**
 * @param appId API ClientId
 * @param passphrase API Client password
 * @returns {string}
 */
function generateSHA1Header(appId, passphrase){
    var nonceVal = nonce();
    var timestamp = (new Date).getTime();

    // construct base string and hash it using crypto
    var baseString = nonceVal.toString() + timestamp.toString() + passphrase;
    var hash = crypto.createHash('sha1').update(baseString).digest('base64');

    return "Atmosphere realm=\"http://localhost:3000\",atmosphere_timestamp=\"" + timestamp +
        "\",atmosphere_nonce=\"" + nonceVal + "\",atmosphere_app_id=\"" + appId +
        "\",atmosphere_digest_method=\"SHA1\",atmosphere_secret_digest=\"" + hash +
        "\",atmosphere_version=\"1.0\"";
};

/**
 * @param url Full API URL
 * @param params JSON object of params sent, key/value pair.
 * @param method
 * @param appId API ClientId
 * @param keyCertContent Private Key Certificate content
 * @param keyCertPassphrase Private Key Certificate Passphrase
 * @returns {string}
 */
function generateSHA256withRSAHeader(url, params, method, appId, keyCertContent, keyCertPassphrase) {
    var nonceValue = nonce();
    var timestamp = (new Date).getTime();

    var defaultAtmosphereHeaders = {
        "atmosphere_app_id": appId,
        "atmosphere_nonce": nonceValue,
        "atmosphere_signature_method": "SHA256withRSA",
        "atmosphere_timestamp": timestamp,
        "atmosphere_version": "1.0"
    };

    // merge default headers with query/body params and sort alphabetically.
    var baseParams = sortJSON(_.merge(defaultAtmosphereHeaders, params));

    // base string required by crypto to hash and sign the signature token for API gateway
    var baseString = method.toUpperCase() + "&" + url + "&" +
        qs.stringify(baseParams);

    var signWith = {
        key: keyCertContent
    };
    if(!_.isUndefined(keyCertPassphrase) && !_.isEmpty(keyCertPassphrase)) _.set(signWith, "passphrase", keyCertPassphrase);

    console.log("signWith");
    console.log(signWith);

    // Load pem file containing the x509 cert & private key & sign the base string with it.
    // var keyCertContent = fs.readFileSync(path.resolve(process.cwd(), keyCertFilepath)).toString('ascii');
    var signature = crypto.createSign('RSA-SHA256')
        .update(baseString)
        .sign(signWith, 'base64');

    console.log("signature");
    console.log(signature);


    var strAtmosphereHeader =  "Atmosphere realm=\"http://localhost:3000\",atmosphere_timestamp=\"" + timestamp +
        "\",atmosphere_nonce=\"" + nonceValue + "\",atmosphere_app_id=\"" + appId +
        "\",atmosphere_signature_method=\"SHA256withRSA\",atmosphere_signature=\"" + signature +
        "\",atmosphere_version=\"1.0\"";

    return strAtmosphereHeader;
};

/**
 * @param url API URL
 * @param params JSON object of params sent, key/value pair.
 * @param method
 * @param appId API ClientId
 * @param passphrase API Secret or certificate passphrase
 * @returns {string}
 */
security.generateAuthorizationHeader = function(url, params, method, authType, appId, keyCertContent, passphrase) {
    if(authType = "L1") {
        return generateBasicHeader()
    } else if(authType == "L1-SHA") {
        return generateSHA1Header(appId, passphrase);
    } else if(authType == "L2") {
        return generateSHA256withRSAHeader(url, params, method, appId, keyCertContent, passphrase);
    } else {
        return "";
    }
};

module.exports = security;