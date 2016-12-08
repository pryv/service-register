/*global describe,it,after */

var server = require('../../source/server'),
    validation = require('../support/data-validation'),
    schemas = require('../../source/model/schema.responses'),
    request = require('superagent');

require('readyness/wait/mocha');

// TODO: this file is meant to contain all /users routes tests, after routes are changed to
//       REST-like structure, cf. https://trello.com/c/NVdNVqMN/53

describe('/users', function () {

  var basePath = '/users',
      defaultUsername = 'wactiv',
      defaultEmail = 'wactiv@pryv.io',
      defaultAuth = 'test-system-key';

  describe('POST /:username/change-email', function () {

    function getPath(username) {
      return basePath + '/' + (username || defaultUsername) + '/change-email';
    }

    it('must change the username\'s email', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
          .set('Authorization', defaultAuth)
          .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.success,
          body: {success : true}
        }, done);
      });
    });

    it('must return an error if the username is unknown', function (done) {
      request.post(server.url + getPath('baduser')).send({email: 'toto@pryv.io'})
          .set('Authorization', defaultAuth)
          .end(function (err, res) {
        validation.checkError(res, {
          status: 404,
          id: 'UNKNOWN_USER_NAME'
        }, done);
      });
    });

    it('must return an error if the email is invalid', function (done) {
      request.post(server.url + getPath()).send({email: 'bad@email'})
          .set('Authorization', defaultAuth)
          .end(function (err, res) {
        validation.checkError(res, {
          status: 400,
          id: 'INVALID_EMAIL'
        }, done);
      });
    });

    it('must return an error if the request auth key is missing or unknown', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
          .end(function (err, res) {
        validation.checkError(res, {
          status: 401,
          'id': 'unauthorized'
        }, done);
      });
    });

    it('must return an error if the request auth key is unauthorized', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
          .set('Authorization', 'test-admin-key')
          .end(function (err, res) {
        validation.checkError(res, {
          status: 403,
          'id': 'forbidden'
        }, done);
      });
    });

    after(function (done) {
      // reset test user (could be optimized by directly calling into the DB)
      request.post(server.url + getPath()).send({email: defaultEmail})
          .set('Authorization', defaultAuth)
          .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.success
        }, done);
      });
    });

  });

});
