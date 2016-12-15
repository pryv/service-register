/*global describe, it*/
require('../config-test');
var server = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var request = require('superagent');
var async = require('async');

require('readyness/wait/mocha');

describe('POST /access/invitationtoken/check', function () {

  var path = '/access/invitationtoken/check/';

  it('invalid', function (done) {
    var invalid = { invitationtoken: 'facebook', status: 200, value: 'false' };
    request.post(server.url + path).send(invalid.invitationtoken).end(function(err,res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(invalid.status);

      dataValidation.jsonResponse(res, invalid, done);
    });
  });

  it('valid', function (done) {
    var valid = { invitationtoken: 'enjoy', status: 200, value: 'true' };
    request.post(server.url + path).send(valid.invitationtoken).end(function(err,res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(valid.status);

      dataValidation.jsonResponse(res, valid, done);
    });
  });

  });


// TODO complete tests with real devID
describe('POST /access', function () {

  var path = '/access';

  it('valid', function (done) {
    var valid = {
      data: {
        requestingAppId: 'reg-test', languageCode: 'en', returnURL: false,
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: {some: 'json', data: 'to request access'}
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST,
      nextStep: chainedPoll
    };

    var result;

    async.series([
      function makeRequest(stepDone) {
        request.post(server.url + path).send(valid).end(function (err, res) {
          should.not.exists(err);
          should.exists(res);
          res.should.have.status(valid.status);
          result = res;

          dataValidation.jsonResponse(res, valid, stepDone);
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
    var invalid = {
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

    request.post(server.url + path).send(invalid).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(invalid.status);

      dataValidation.jsonResponse(res, invalid, done);
    });
  });
});