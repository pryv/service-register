/*global describe, it*/
require('../config-test');
var server = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var request = require('superagent');
var async = require('async');
var should = require('should');

require('readyness/wait/mocha');

describe('POST /access/invitationtoken/check', function () {

  var path = '/access/invitationtoken/check/';

  it('invalid', function (done) {
    var test = { invitationtoken: 'facebook', status: 200, value: 'false' };
    request.post(server.url + path).send(test.invitationtoken).end(function(err,res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('valid', function (done) {
    var test = { invitationtoken: 'enjoy', status: 200, value: 'true' };
    request.post(server.url + path).send(test.invitationtoken).end(function(err,res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
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
          should.not.exists(err);
          should.exists(res);
          res.should.have.status(test.status);
          result = res;

          dataValidation.jsonResponse(res, test, stepDone);
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
          should.not.exists(err);
          should.exists(res);
          res.should.have.status(test.status);

          dataValidation.jsonResponse(res, test, stepDone);
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
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });
});