/*global describe,it,after */

var server = require('../../source/server'),
  dataValidation = require('../support/data-validation'),
  schemas = require('../../source/model/schema.responses'),
  request = require('superagent'),
  _ = require('lodash');

require('readyness/wait/mocha');

var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));
var defaults = {
  hosting: 'gandi.net-fr',
  appid: 'pryv-test',
  username: randomuser,
  email: randomuser + '@wactiv.chx', // should not be necessary
  password: 'abcdefgh',
  invitationtoken: 'enjoy',
  referer: 'pryv'
};

require('readyness/wait/mocha');

describe('/users', function () {

  var basePath = '/users',
    defaultUsername = 'wactiv',
    defaultEmail = 'wactiv@pryv.io',
    defaultAuth = 'test-system-key';

  it('invalid invitation', function (done) {
    var test = {
      data: {invitationtoken: 'aa'},
      status: 400, desc: 'Invalid invitation',
      JSchema: schemas.error,
      JValues: {'id': 'INVALID_INVITATION'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('invalid hosting', function (done) {
    var test = {
      data: {hosting: ''},
      status: 400, desc: 'Invalid hosting',
      JSchema: schemas.error,
      JValues: {'id': 'INVALID_HOSTING'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('invalid appid', function (done) {
    var test = {
      data: {appid: ''},
      status: 400, desc: 'Invalid app Id',
      JSchema: schemas.error,
      JValues: {'id': 'INVALID_APPID'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('invalid username', function (done) {
    var test = {
      data: {username: 'wa'},
      status: 400, desc: 'Invalid user',
      JSchema: schemas.error,
      JValues: {'id': 'INVALID_USER_NAME'}
    };

    request.post(server.url + path).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('reserved username', function (done) {
    var test = {
      data: {username: 'pryvwa'},
      status: 400, desc: 'Reserved user starting by pryv',
      JSchema: schemas.error,
      JValues: {'id': 'RESERVED_USER_NAME'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('listed username', function (done) {
    var test = {
      data: {username: 'facebook'},
      status: 400, desc: 'Reserved user starting from list',
      JSchema: schemas.error,
      JValues: {'id': 'RESERVED_USER_NAME'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('invalid email', function (done) {
    var test = {
      data: {email: 'assa'},
      status: 400, desc: 'Invalid email',
      JSchema: schemas.error,
      JValues: {'id': 'INVALID_EMAIL'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('existing user', function (done) {
    var test = {
      data: {username: 'wactiv'},
      status: 400, desc: 'Existing user',
      JSchema: schemas.multipleErrors,
      JValues: {'id': 'EXISTING_USER_NAME'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('existing email', function (done) {
    var test = {
      data: {email: 'wactiv@pryv.io'},
      status: 400, desc: 'Existing e-mail',
      JSchema: schemas.multipleErrors,
      JValues: {'id': 'EXISTING_EMAIL'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('existing user and email', function (done) {
    var test = {
      data: {username: 'wactiv', email: 'wactiv@pryv.io'},
      status: 400, desc: 'Existing e-mail & username',
      JSchema: schemas.multipleErrors,
      JValues: {
        'id': 'INVALID_DATA',
        'errors': [{'id': 'EXISTING_USER_NAME'}, {'id': 'EXISTING_EMAIL'}]
      }
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err.res, test, done);
    });
  });

  it('valid random', function (done) {
    var test = {
      data: {},
      status: 200, desc: 'valid JSON GET', JSchema: schemas.userCreated,
      JValues: {username: defaults.username.toLowerCase()}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('valid', function (done) {
    var test = {
      data: {username: 'recla', email: 'recla@pryv.io'},
      status: 200, desc: 'valid JSON GET', JSchema: schemas.userCreated,
      JValues: {username: 'recla'}
    };

    request.post(server.url + basePath).send(_.extend(defaults, test.data)).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });


  describe('POST /check/', function () {
    var path = basePath + '/check/';

    it('reserved list', function (done) {
      var test = {username: 'facebook', status: 200, desc: 'reserved from list', value: 'false'};

      request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved pryv', function (done) {
      var test = {username: 'pryvtoto', status: 200, desc: 'reserved for pryv', value: 'false'};

      request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('available', function (done) {
      var test = {username: 'asdfhgsdkfewg', status: 200, desc: 'available', value: 'true'};

      request.post(server.url + path).send(_.extend(defaults, test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

  });

  describe('GET /:username/check_username', function () {
    var path = '/check_username';

    function getPath(username) {
      return basePath + '/' + (username || defaultUsername) + '/check_username';
    }

    it('too short', function (done) {
      var test = {
        username: 'abcd', status: 400, desc: 'too short ',
        JSchema: schemas.error, JValues: {'id': 'INVALID_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid username', function (done) {
      var test = {
        username: 'abcdefghijklmnopqrstuvwxyzasaasaaas' +
        'abcdefghijklmnopqrstuvwxyzasaasaaas' +
        'abcdefghijklmnopqrstuvwxyzasaasaaas' +
        'abcdefghijklmnopqrstuvwxyzasaasaaas', status: 400, desc: 'too long ',
        JSchema: schemas.error, JValues: {'id': 'INVALID_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 1', function (done) {
      var test = {
        username: 'abc%20def', status: 400, desc: 'invalid character 1',
        JSchema: schemas.error, JValues: {'id': 'INVALID_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 2', function (done) {
      var test = {
        username: 'abc.def', status: 400, desc: 'invalid character 2',
        JSchema: schemas.error, JValues: {'id': 'INVALID_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('authorized', function (done) {
      var test = {
        username: 'abcd-ef', status: 200, desc: '- authorized ',
        JSchema: schemas.checkUID
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('correct', function (done) {
      var test = {
        username: 'wactiv', status: 200, desc: 'correct ',
        JSchema: schemas.checkUID
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('always available', function (done) {
      var test = {
        username: 'recla', status: 200, desc: 'always available ',
        JSchema: schemas.checkUID
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved for pryv', function (done) {
      var test = {
        username: 'pryvtoto', status: 200, desc: 'reserved for pryv',
        JSchema: schemas.checkUID, JValues: {reserved: true, reason: 'RESERVED_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved from list', function (done) {
      var test = {
        username: 'facebook', status: 200, desc: 'reserved from list',
        JSchema: schemas.checkUID, JValues: {reserved: true, reason: 'RESERVED_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved dns', function (done) {
      var test = {
        username: 'access', status: 200, desc: 'reserved dns',
        JSchema: schemas.checkUID, JValues: {reserved: true, reason: 'RESERVED_USER_NAME'}
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

  });

  describe('POST /:username/change-email', function () {

    function getPath(username) {
      return basePath + '/' + (username || defaultUsername) + '/change-email';
    }

    it('must change the username\'s email', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
        .set('Authorization', defaultAuth)
        .end(function (res) {
          dataValidation.check(res, {
            status: 200,
            schema: schemas.success,
            body: {success: true}
          }, done);
        });
    });

    it('must return an error if the username is unknown', function (done) {
      request.post(server.url + getPath('baduser')).send({email: 'toto@pryv.io'})
        .set('Authorization', defaultAuth)
        .end(function (res) {
          dataValidation.checkError(res, {
            status: 404,
            id: 'UNKNOWN_USER_NAME'
          }, done);
        });
    });

    it('must return an error if the email is invalid', function (done) {
      request.post(server.url + getPath()).send({email: 'bad@email'})
        .set('Authorization', defaultAuth)
        .end(function (res) {
          dataValidation.checkError(res, {
            status: 400,
            id: 'INVALID_EMAIL'
          }, done);
        });
    });

    it('must return an error if the request auth key is missing or unknown', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
        .end(function (res) {
          dataValidation.checkError(res, {
            status: 401,
            'id': 'unauthorized'
          }, done);
        });
    });

    it('must return an error if the request auth key is unauthorized', function (done) {
      request.post(server.url + getPath()).send({email: 'toto@pryv.io'})
        .set('Authorization', 'test-admin-key')
        .end(function (res) {
          dataValidation.checkError(res, {
            status: 403,
            'id': 'forbidden'
          }, done);
        });
    });

    after(function (done) {
      // reset test user (could be optimized by directly calling into the DB)
      request.post(server.url + getPath()).send({email: defaultEmail})
        .set('Authorization', defaultAuth)
        .end(function (res) {
          dataValidation.check(res, {
            status: 200,
            schema: schemas.success
          }, done);
        });
    });
  });
});