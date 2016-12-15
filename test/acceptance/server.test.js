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
    var tooShort = { uid: 'abcd', status: 400, desc : 'too short ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME' } };

    request.post(server.url + '/' + tooShort.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(tooShort.status);

      dataValidation.jsonResponse(res, tooShort, done);
    });
  });

  it('unknown', function (done) {
    var unknown = { uid: 'abcdefghijkl', status: 404, desc : 'unknown',
      JSchema: schema.error,
      JValues: {'id': 'UNKNOWN_USER_NAME' } };

    request.post(server.url + '/' + unknown.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(unknown.status);

      dataValidation.jsonResponse(res, unknown, done);
    });
  });

  it('known', function (done) {
    var known = { uid: 'wactiv', status: 200, desc : 'known',
      JSchema: schema.server,
      JValues: {'server': domain, 'alias': 'wactiv.' + domain } };

    request.post(server.url + '/' + known.uid + path).send({}).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(known.status);

      dataValidation.jsonResponse(res, known, done);
    });
  });

});


// TODO check the returned URL
describe('GET /:uid/server', function () {

  it('too short', function (done) {
    var tooShort = { uid: 'abcd', status: 302, desc : 'too short '};

    request.get(server.url + '/' + tooShort.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(tooShort.status);

      dataValidation.jsonResponse(res, tooShort, done);
    });
  });

  it('unknown', function (done) {
    var unknown = { uid: 'abcdefghijkl', status: 302, desc : 'unknown'};

    request.get(server.url + '/' + unknown.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(unknown.status);

      dataValidation.jsonResponse(res, unknown, done);
    });
  });

  it('unknown', function (done) {
    var known = { uid: 'wactiv', status: 302, desc : 'known' };

    request.get(server.url + '/' + known.uid + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(known.status);

      dataValidation.jsonResponse(res, known, done);
    });
  });

});
