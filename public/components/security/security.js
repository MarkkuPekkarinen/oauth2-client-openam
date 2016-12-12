/**
 * Created by robincher on 12/12/16.
 */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const nonce = require('nonce')();
const crypto = require('crypto');
const qs = require('querystring');

const config = require('../config/config');

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

function generateSHA1Header(){
    var nonceVal = nonce();
    var timestamp = (new Date).getTime();

    // construct base string and hash it using crypto
    var baseString = nonceVal.toString() + timestamp.toString() +  config.auth.sha1.secret;
    var hash = crypto.createHash('sha1').update(baseString).digest('base64');

    return "Atmosphere realm=\"http://localhost\",atmosphere_timestamp=\"" + timestamp +
        "\",atmosphere_nonce=\"" + nonceVal + "\",atmosphere_app_id=\"" + config.auth.sha1.appId +
        "\",atmosphere_digest_method=\"SHA1\",atmosphere_secret_digest=\"" + hash +
        "\",atmosphere_version=\"1.0\"";
};

function generateSHA256withRSAHeader(url, params, method) {
    var nonceValue = nonce();
    var timestamp = (new Date).getTime();

    var defaultAtmosphereHeaders = {
        "atmosphere_app_id": config.auth.sha256withRSA.appId,
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

    console.log(baseString);

    // Load pem file containing the x509 cert & private key & sign the base string with it.
    var pk = fs.readFileSync(path.resolve(process.cwd(), config.auth.sha256withRSA.pem)).toString('ascii');
    var signature = crypto.createSign('RSA-SHA256')
        .update(baseString)
        .sign({
            key: pk,
            passphrase: config.auth.sha256withRSA.pw
        }, 'base64');

    var string =  "Atmosphere realm=\"http://localhost\",atmosphere_timestamp=\"" + timestamp +
        "\",atmosphere_nonce=\"" + nonceValue + "\",atmosphere_app_id=\"" + config.auth.sha256withRSA.appId +
        "\",atmosphere_signature_method=\"SHA256withRSA\",atmosphere_signature=\"" + signature +
        "\",atmosphere_version=\"1.0\"";

    console.log(string);
    return string;
};

security.generateAuthorizationHeader = function(url, params, method) {
    if(process.env.AUTH_TYPE == "L1") {
        return generateSHA1Header();
    } else if(process.env.AUTH_TYPE == "L2") {
        return generateSHA256withRSAHeader(url, params, method);
    } else {
        return "";
    }
};

module.exports = security;