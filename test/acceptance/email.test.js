/*global describe,it*/
var server = require('../../source/server'),
    validation = require('../support/data-validation'),
    schemas = require('../../source/model/schema.responses'),
    request = require('superagent');

require('readyness/wait/mocha');

describe('POST /email/check', function () {

  var path = '/email/check/';

  it('reserved', function (done) {
    request.post(server.url + path).send({email: 'wactiv@pryv.io'}).end(function (res) {
      validation.check(res, {
        status: 200,
        text: 'false'
      }, done);
    });
  });

  it('available', function (done) {
    request.post(server.url + path).send({email: 'abcd.efg_ijkl@bobby.com'})
      .end(function (res) {
      validation.check(res, {
        status: 200,
        text: 'true'
      }, done);
    });
  });

});

describe('GET /:email/check_email', function () {

  function getPath(email) {
    return '/' + email + '/check_email';
  }

  it('too short', function (done) {
    request.get(server.url + getPath('abcd')).end(function (res) {
      validation.checkError(res, {
        status: 400,
        id: 'INVALID_EMAIL'
      }, done);
    });
  });

  it('does not exist', function (done) {
    request.get(server.url + getPath('abcd.efg_ijkl@bobby.com')).end(function (res) {
      validation.check(res, {
        status: 200,
        schema: schemas.checkExists,
        body: {exists: false}
      }, done);
    });
  });

  it('does exist', function (done) {
    request.get(server.url + getPath('wactiv@pryv.io')).end(function (res) {
      validation.check(res, {
        status: 200,
        schema: schemas.checkExists,
        body: {exists: true}
      }, done);
    });
  });

});

