var express = require('express');
var router = express.Router();

const restClient = require('superagent-bluebird-promise');
const path = require('path');
const url = require('url');
const util = require('util');
const Promise = require('bluebird');
const _ = require('lodash');
const querystring = require('querystring');
const securityHelper = require('../lib/security/security');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname+'/../views/html/index.html'));
});

router.get('/empty', function(req, res, next) {

  res.jsonp({});
});

router.get('/callback', function(req, res, next) {

  res.sendFile(path.join(__dirname+'/../views/html/callback.html'));
});

router.post('/get', function(req, res, next) {
  var url = req.body.url;
  var strParams = req.body.params;
  var strHeaders = req.body.headers;
  var strAuth = req.body.auth;
  var strReturn = req.body.return;
  var strSecurities = req.body.security;

  var params = querystring.parse(strParams);
  var headers = querystring.parse(strHeaders);
  var auth = querystring.parse(strAuth);
  var securities = querystring.parse(strSecurities);

  console.log(url);
  console.log(params);
  console.log(headers);
  console.log(securities);

  // Update headers based on security_level
  var strAdditionalSecurityHeader = "";
  if(!_.isUndefined(securities.security_level) && !_.isEmpty(securities.security_level)) {
    strAdditionalSecurityHeader = securityHelper.generateAuthorizationHeader(url, params, "GET", securities.security_level, securities.client_id, securities.certificate_content, securities.passphrase);
    if(!_.isEmpty(strAdditionalSecurityHeader)) {
      var originalAuthHeader = _.get(headers, "Authorization", "");
      if(!_.isEmpty(originalAuthHeader)) originalAuthHeader = "," + originalAuthHeader;
      _.set(headers, "Authorization", strAdditionalSecurityHeader + originalAuthHeader);

      console.log(headers);
    }
  }

  var request = restClient.get(url);

  // Set headers
  if(!_.isUndefined(headers) && !_.isEmpty(headers)) request.set(headers);

  // Set Queries
  if(!_.isUndefined(params) && !_.isEmpty(params)) request.query(params);

  if(!_.isUndefined(auth.username) && !_.isEmpty(auth.username)
    && !_.isUndefined(auth.password) && !_.isEmpty(auth.password)) {
    request.auth(auth.username, auth.password);
  }

  request.end(function (callErr, callRes) {
    console.log("callErr");
    console.log(callErr);
    console.log("callRes");
    console.log(callRes);
    if (callErr) {
      res.jsonp(callErr);
    } else {
      var result = callRes.body;

      if(!_.isUndefined(strReturn) && !_.isEmpty(strReturn)) result = _.get(callRes, strReturn);

      res.jsonp(result);
    }
  });

});


router.post('/post', function(req, res, next) {
  var url = req.body.url;
  var strParams = req.body.params;
  var strHeaders = req.body.headers;
  var strAuth = req.body.auth;
  var strReturn = req.body.return;
  var strSecurities = req.body.security;

  var params = querystring.parse(strParams);
  var headers = querystring.parse(strHeaders);
  var auth = querystring.parse(strAuth);
  var securities = querystring.parse(strSecurities);

  console.log(url);
  console.log(params);
  console.log(headers);
  console.log(securities);

  var request = restClient.post(url);

  // Update headers based on security_level
  var strAdditionalSecurityHeader = "";
  if(!_.isUndefined(securities.security_level) && !_.isEmpty(securities.security_level)) {
    strAdditionalSecurityHeader = securityHelper.generateAuthorizationHeader(url, params, "POST", securities.security_level, securities.client_id, securities.certificate_content, securities.passphrase);
    if(!_.isEmpty(strAdditionalSecurityHeader)) {
      var originalAuthHeader = _.get(headers, "Authorization", "");
      if(!_.isEmpty(originalAuthHeader)) originalAuthHeader = "," + originalAuthHeader;
      _.set(headers, "Authorization ", strAdditionalSecurityHeader + originalAuthHeader);
    }
  }

  // Set headers
  if(!_.isUndefined(headers) && !_.isEmpty(headers)) request.set(headers);

  // Set body
  if(!_.isUndefined(params) && !_.isEmpty(params)) request.send(params);

  if(!_.isUndefined(auth.username) && !_.isEmpty(auth.username)
      && !_.isUndefined(auth.password) && !_.isEmpty(auth.password)) {
    request.auth(auth.username, auth.password);
  }

  request.end(function (callErr, callRes) {
    console.log("callErr");
    console.log(callErr);
    console.log("callRes");
    console.log(callRes);
    if (callErr) {
      res.jsonp(callErr);
    } else {
      var result = callRes.body;

      if(!_.isUndefined(strReturn) && !_.isEmpty(strReturn)) result = _.get(callRes, strReturn);

      res.jsonp(result);
    }
  });
});



module.exports = router;
