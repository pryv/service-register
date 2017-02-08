/*global describe, it*/
var server = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var request = require('superagent');
var async = require('async');

require('readyness/wait/mocha');

describe('POST /access/invitationtoken/check', function () {

  var path = '/access/invitationtoken/check/';

  it('invalid', function (done) {
    var test = { invitationtoken: 'facebook', status: 200, value: 'false', restype:'text/plain' };
    request.post(server.url + path).send(test).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('valid', function (done) {
    var test = { invitationtoken: 'enjoy', status: 200, value: 'true', restype:'text/plain' };
    request.post(server.url + path).send(test).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  });


// TODO complete tests with real devID
describe('POST /access', function () {

  var path = '/access';

  it('valid', function (done) {
    var test = {
      data: {
        requestingAppId: 'reg-test', languageCode: 'en', returnURL: false,
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: {some: 'json', data: 'to request access'}
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    var result;

    async.series([
      function makeRequest(stepDone) {
        request.post(server.url + path).send(test.data).end(function (err, res) {
          result = res;
          dataValidation.jsonResponse(err, res, test, stepDone);
        });
      },
      function validate(stepDone) {
        var test = {
          url: result.poll,
          data : {},
          status: 201,
          JSchema : schema.accessGET
        };

        request.get(server.url + test.url).end(function(err,res) {
          dataValidation.jsonResponse(err, res, test, stepDone);
        });
      }
    ], done);
  });

  it('invalid', function (done) {
    var test = {
      url: '/access',
      method: 'POST',
      data: {
        requestingAppId: 'a', languageCode: 'en', returnURL: 'http://BlipBlop.com',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: {some: 'json', data: 'to request access'}
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
});