/*global describe, it*/
var config = require('../config-test');

var server = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var request = require('superagent');
var should = require('should');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');
var path = '/server';

describe('POST /:uid/server', function () {

  it('too short', function (done) {
    var test = { uid: 'abcd', status: 400, desc : 'too short ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME' } };

    request.post(server.url + '/' + test.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('unknown', function (done) {
    var test = { uid: 'abcdefghijkl', status: 404, desc : 'unknown',
      JSchema: schema.error,
      JValues: {'id': 'UNKNOWN_USER_NAME' } };

    request.post(server.url + '/' + test.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('known', function (done) {
    var test = { uid: 'wactiv', status: 200, desc : 'known',
      JSchema: schema.server,
      JValues: {'server': domain, 'alias': 'wactiv.' + domain } };

    request.post(server.url + '/' + test.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});


// TODO check the returned URL
describe('GET /:uid/server', function () {

  it('too short', function (done) {
    var test = { uid: 'abcd', status: 302, desc : 'too short '};

    request.get(server.url + '/' + test.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('unknown', function (done) {
    var test = { uid: 'abcdefghijkl', status: 302, desc : 'unknown'};

    request.get(server.url + '/' + test.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('known', function (done) {
    var test = { uid: 'wactiv', status: 302, desc : 'known' };

    request.get(server.url + '/' + test.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});
