/*global require, describe, it*/
require('../config-test');
var server = require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var _ = require('lodash');
var request = require('superagent');
var should = require('should');

require('readyness/wait/mocha');

var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));
var defaults = {
  hosting: 'gandi.net-fr',
  appid :  'pryv-test',
  username : randomuser,
  email : randomuser + '@wactiv.chx', // should not be necessary
  password: 'abcdefgh',
  invitationtoken: 'enjoy',
  referer: 'pryv'
};

describe('POST /user', function () {

  var path = '/user';

  it('invalid invitation', function (done) {
    var test = { data: { invitationtoken: 'aa'},
      status: 400, desc : 'Invalid invitation',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_INVITATION' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid hosting', function (done) {
    var test = { data: { hosting: ''},
      status: 400, desc : 'Invalid hosting',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_HOSTING' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid appid', function (done) {
    var test = { data: { appid: ''},
      status: 400, desc : 'Invalid app Id',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_APPID' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid username', function (done) {
    var test = { data: {  username: 'wa' },
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_USER_NAME' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('reserved username', function (done) {
    var test = { data: { username: 'pryvwa' },
      status: 400, desc : 'Reserved user starting by pryv',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('listed username', function (done) {
    var test = { data: { username: 'facebook' },
      status: 400, desc : 'Reserved user starting from list',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid email', function (done) {
    var test = { data: { email: 'assa'},
      status: 400, desc : 'Invalid email',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_EMAIL' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('existing user', function (done) {
    var test = { data: {  username: 'wactiv'},
      status: 400, desc : 'Existing user',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'EXISTING_USER_NAME' } };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('existing email', function (done) {
    var test = { data: {  email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'EXISTING_EMAIL'     }};

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('existing user and email', function (done) {
    var test = { data: {   username: 'wactiv', email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail & username',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' }, {'id': 'EXISTING_EMAIL' } ]   }};

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('valid random', function (done) {
    var test = { data: { },
      status: 200, desc : 'valid JSON GET', JSchema : schema.userCreated,
      JValues: { username: defaults.username.toLowerCase()}  };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('valid', function (done) {
    var test =  { data: { username: 'recla', email: 'recla@pryv.io'},
      status: 200, desc : 'valid JSON GET', JSchema : schema.userCreated,
      JValues: { username: 'recla'}  };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});


describe('POST /username/check/', function () {
  var path = '/username/check/';

  it('reserved list', function (done) {
    var test =  { username: 'facebook', status: 200, desc : 'reserved from list', value: 'false' };

    request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('reserved pryv', function (done) {
    var test = { username: 'pryvtoto', status: 200, desc : 'reserved for pryv', value: 'false' };

    request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('available', function (done) {
    var test = { username: 'asdfhgsdkfewg', status: 200, desc : 'available', value: 'true' };

    request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});



describe('GET /:username/check_username', function () {
  var path = '/check_username';

  it('too short', function (done) {
    var test = { username: 'abcd', status: 400, desc : 'too short ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}};

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid username', function (done) {
    var test = { username: 'abcdefghijklmnopqrstuvwxyzasaasaaas' +
    'abcdefghijklmnopqrstuvwxyzasaasaaas' +
    'abcdefghijklmnopqrstuvwxyzasaasaaas' +
    'abcdefghijklmnopqrstuvwxyzasaasaaas', status: 400, desc : 'too long ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}};

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid character 1', function (done) {
    var test = { username: 'abc%20def', status: 400, desc : 'invalid character 1',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}};

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('invalid character 2', function (done) {
    var test = { username: 'abc.def', status: 400, desc : 'invalid character 2',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}};

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('authorized', function (done) {
    var test = { username: 'abcd-ef', status: 200, desc : '- authorized ',
      JSchema : schema.checkUID };

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('correct', function (done) {
    var test = { username: 'wactiv', status: 200, desc : 'correct ',
      JSchema : schema.checkUID };

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('always available', function (done) {
    var test = { username: 'recla', status: 200, desc : 'always available ',
      JSchema : schema.checkUID };

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('reserved for pryv', function (done) {
    var test = { username: 'pryvtoto', status: 200, desc : 'reserved for pryv',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'} };

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('reserved from list', function (done) {
    var test = { username: 'facebook', status: 200, desc : 'reserved from list',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'} };

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

  it('reserved dns', function (done) {
    var test = { username: 'access', status: 200, desc : 'reserved dns',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'}};

    request.get(server.url + '/' + test.username + path).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});


