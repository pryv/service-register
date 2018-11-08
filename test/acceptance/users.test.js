// @flow

/*global describe, it, before, after, beforeEach */

const bluebird = require('bluebird');
const lodash = require('lodash');

const dataValidation = require('../support/data-validation');
const schemas = require('../support/schema.responses');
const config = require('../../source/utils/config');

const _ = require('lodash');
const request = require('superagent');
const chai = require('chai');
const assert = chai.assert; 

// Load and start our web server
require('../../source/server');

// Mocks out a core server.
require('../support/mock-core-server');

const db = require('../../source/storage/database');

function randomuser() { return 'testpfx' + Math.floor(Math.random() * (100000)); }
function defaults() {
  return {
    hosting: 'mock-api-server',
    appid: 'pryv-test',
    username: randomuser(),
    email: randomuser() + '@wactiv.chx', // should not be necessary
    password: 'abcdefgh',
    invitationtoken: 'enjoy',
    referer: 'pryv'
  };
}

const defaultUsername = 'wactiv';
const defaultEmail = 'wactiv@pryv.io';
const defaultAuth = 'test-system-key';

describe('User Management', () => {
  let serverUrl;
  before((done) => {
    require('readyness').doWhen(() => {
      serverUrl = config.get('server:url');
      done();
    });
  });

  describe('POST /user (create user)', function () {
    const basePath = '/user';

    it('invalid hosting', function (done) {
      var test = {
        data: { hosting: '' },
        status: 400, desc: 'Invalid hosting',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_HOSTING' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid appid', function (done) {
      var test = {
        data: { appid: '' },
        status: 400, desc: 'Invalid app Id',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_APPID' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid username', function (done) {
      var test = {
        data: { username: 'wa' },
        status: 400, desc: 'Invalid user',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('reserved username', function (done) {
      var test = {
        data: { username: 'pryvwa' },
        status: 400, desc: 'Reserved user starting by pryv',
        JSchema: schemas.error,
        JValues: { 'id': 'RESERVED_USER_NAME' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('listed username', function (done) {
      var test = {
        data: { username: 'facebook' },
        status: 400, desc: 'Reserved user starting from list',
        JSchema: schemas.error,
        JValues: { 'id': 'RESERVED_USER_NAME' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid email', function (done) {
      var test = {
        data: { email: null },
        status: 400, desc: 'Invalid email',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_EMAIL' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid language', function (done) {
      var test = {
        data: { languageCode: 'abcdef' },
        status: 400, desc: 'Invalid language',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_LANGUAGE' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing user', function (done) {
      var test = {
        data: { username: 'wactiv' },
        status: 400, desc: 'Existing user',
        JSchema: schemas.multipleErrors,
        JValues: { 'id': 'EXISTING_USER_NAME' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing email', function (done) {
      var test = {
        data: { email: 'wactiv@pryv.io' },
        status: 400, desc: 'Existing e-mail',
        JSchema: schemas.multipleErrors,
        JValues: { 'id': 'EXISTING_EMAIL' }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing user and email', function (done) {
      var test = {
        data: { username: 'wactiv', email: 'wactiv@pryv.io' },
        status: 400, desc: 'Existing e-mail & username',
        JSchema: schemas.multipleErrors,
        JValues: {
          'id': 'INVALID_DATA',
          'errors': [{ 'id': 'EXISTING_USER_NAME' }, { 'id': 'EXISTING_EMAIL' }]
        }
      };

      request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });

    describe('Undefined invitationTokens', function () {

      let defaultConfigInvitationTokens;

      before(function () {
        defaultConfigInvitationTokens = config.get('invitationTokens');
        config.set('invitationTokens', null);
      });

      after(function () {
        config.set('invitationTokens', defaultConfigInvitationTokens);
      });

      it('should succeed when providing anything in the "invitationToken" field', function (done) {
        const testData = _.extend({}, defaults(), {
          invitationtoken: 'anythingAtAll'
        });

        const test = {
          data: testData,
          status: 200,
          JSchema: schemas.userCreated,
          JValues: {
            username: testData.username,
          }
        };

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });

      it('should succeed when the "invitationtoken" field is missing', function (done) {
        const testData = _.extend({}, defaults());
        delete testData.invitationtoken;

        const test = {
          data: testData,
          status: 200,
          JSchema: schemas.userCreated,
          JValues: {
            username: testData.username,
          }
        };

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });
    });

    describe('Defined invitationTokens array', function () {

      let defaultConfigInvitationTokens;

      before(function () {
        defaultConfigInvitationTokens = config.get('invitationTokens');
        config.set('invitationTokens', ['first', 'second', 'third']);
      });

      after(function () {
        config.set('invitationTokens', defaultConfigInvitationTokens);
      });

      it('should succeed if the "invitationToken" matches one of the tokens', function (done) {
        const testData = _.extend({}, defaults(), {
          invitationtoken: 'second',
        });

        const test = {
          data: testData,
          status: 200,
          JSchema: schemas.userCreated,
          JValues: {
            username: testData.username,
          }
        };

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });

      it('should fail if the "invitationToken" does not match any token', function (done) {
        const testData = _.extend({}, defaults(), {
          invitationtoken: 'anythingAtAll',
        });
        const test = {
          data: testData,
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { 'id': 'INVALID_INVITATION' }
        };

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });

      it('should fail if the "invitationToken" is missing', function (done) {
        const test = {
          data: _.extend({}, defaults()),
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { 'id': 'INVALID_INVITATION' }
        };

        delete test.data.invitationtoken;

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });
    });

    describe('Empty invitationTokens array', function () {

      let defaultConfigInvitationTokens;

      before(function () {
        defaultConfigInvitationTokens = config.get('invitationTokens');
        config.set('invitationTokens', []);
      });

      after(function () {
        config.set('invitationTokens', defaultConfigInvitationTokens);
      });

      it('should fail for any "invitationToken"', function (done) {
        const test = {
          data: {
            invitationtoken: 'anything',
          },
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { 'id': 'INVALID_INVITATION' }
        };

        request.post(serverUrl + basePath).send(_.extend({}, defaults(), test.data))
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });

      it('should fail if the "invitationToken" is missing', function (done) {
        const test = {
          data: _.extend({}, defaults()),
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { 'id': 'INVALID_INVITATION' }
        };

        delete test.data.invitationtoken;

        request.post(serverUrl + basePath).send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });
    });
  });

  describe('POST /username/check', function () {
    var path = '/username/check';
    const defaults = {
      hosting: 'test.ch-ch',
      appid: 'pryv-test',
      username: randomuser(),
      email: randomuser() + '@wactiv.chx', // should not be necessary
      password: 'abcdefgh',
      invitationtoken: 'enjoy',
      referer: 'pryv'
    };

    it('reserved list', function (done) {
      var test = {
        username: 'facebook', status: 200, desc: 'reserved from list',
        value: 'false', restype: 'text/plain; charset=utf-8'
      };

      request.post(serverUrl + path).send(_.extend(defaults, test)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved pryv', function (done) {
      var test = {
        username: 'pryvtoto', status: 200, desc: 'reserved for pryv',
        value: 'false', restype: 'text/plain; charset=utf-8'
      };

      request.post(serverUrl + path).send(_.extend(defaults, test)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('available', function (done) {
      var test = {
        username: 'asdfhgsdkfewg', status: 200, desc: 'available',
        value: 'true', restype: 'text/plain; charset=utf-8'
      };

      request.post(serverUrl + path).send(_.extend(defaults, test)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

  });

  describe('GET /:username/check_username', function () {

    function getPath(username) {
      return '/' + (username || defaultUsername) + '/check_username';
    }

    it('too short', function (done) {
      var test = {
        username: 'abcd', status: 400, desc: 'too short ',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid username', function (done) {
      var test = {
        username: 'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas', status: 400, desc: 'too long ',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 1', function (done) {
      var test = {
        username: 'abc%20def', status: 400, desc: 'invalid character 1',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 2', function (done) {
      var test = {
        username: 'abc.def', status: 400, desc: 'invalid character 2',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('authorized', function (done) {
      var test = {
        username: 'abcd-ef', status: 200, desc: '- authorized ',
        JSchema: schemas.checkUID
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('correct', function (done) {
      var test = {
        username: 'wactiv', status: 200, desc: 'correct ',
        JSchema: schemas.checkUID
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('always available', function (done) {
      var test = {
        username: 'recla', status: 200, desc: 'always available ',
        JSchema: schemas.checkUID
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved for pryv', function (done) {
      var test = {
        username: 'pryvtoto', status: 200, desc: 'reserved for pryv',
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved from list', function (done) {
      var test = {
        username: 'facebook', status: 200, desc: 'reserved from list',
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved dns', function (done) {
      var test = {
        username: 'access', status: 200, desc: 'reserved dns',
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(serverUrl + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

  });

  describe('POST /users/:username/change-email', function () {

    function getPath(username) {
      return '/users/' + (username || defaultUsername) + '/change-email';
    }

    it('must change the username\'s email', function (done) {
      request.post(serverUrl + getPath()).send({ email: 'toto@pryv.io' })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.check(res, {
            status: 200,
            schema: schemas.success,
            body: { success: true }
          }, done);
        });
    });
    it('must return an error if the username is unknown', function (done) {
      request.post(serverUrl + getPath('baduser')).send({ email: 'toto@pryv.io' })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 404,
            id: 'UNKNOWN_USER_NAME'
          }, done);
        });
    });
    it('must return an error if the email is invalid', function (done) {
      request.post(serverUrl + getPath()).send({ email: null })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 400,
            id: 'INVALID_EMAIL'
          }, done);
        });
    });
    it('must return an error if the request auth key is missing or unknown', function (done) {
      request.post(serverUrl + getPath()).send({ email: 'toto@pryv.io' })
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 401,
            'id': 'unauthorized'
          }, done);
        });
    });
    it('must return an error if the request auth key is unauthorized', function (done) {
      request.post(serverUrl + getPath()).send({ email: 'toto@pryv.io' })
        .set('Authorization', 'test-admin-key')
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 403,
            'id': 'forbidden'
          }, done);
        });
    });

    after(function (done) {
      // reset test user (could be optimized by directly calling into the DB)
      request.post(serverUrl + getPath()).send({ email: defaultEmail })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.check(res, {
            status: 200,
            schema: schemas.success
          }, done);
        });
    });
  });

  describe('DELETE /users/:username', () => {
    let defaultQuery; 
    beforeEach(() => {
      defaultQuery = {
        dryRun: true, 
        onlyReg: true,
      };
    });

    const systemRoleKey = defaultAuth;

    beforeEach((done) => {
      const userInfos = {
        username: 'jsmith', 
        password: 'foobar', 
        email: 'jsmith@test.com',
      };
      db.setServerAndInfos('jsmith', 'server.name.at.tld', userInfos, done);
    });

    it('requires the system role', async () => {
      try {
        await request.delete(resourcePath('jsmith'))
          .query(defaultQuery)
          .set('Authorization', 'SomethingElse'); 
      }
      catch (err) {
        assert.strictEqual(err.status, 401);

        return; 
      }

      assert.fail('Request should fail.');
    });
    it('requires `onlyReg=true` for now', async () => {
      // NOTE The other methods in the registries API manage the user completely,
      //  ie: also on the respective core. This method does not currently. To 
      //  remind us of this fact and to allow for evolution we introduce this 
      //  parameter. If it is missing, we're supposed to delete the user every
      //  where - right now we cannot, hence we error out. 

      const query = lodash.omit(defaultQuery, ['onlyReg']);
      
      try {
        await request.delete(resourcePath('jsmith'))
          .query(query)
          .set('Authorization', systemRoleKey);
      }
      catch (err) {
        return; 
      }

      assert.fail('If onlyReg=true is missing, the method should error out.');
    });
    it('fails if the user doesnt exist', async () => {
      try {
        await request.delete(resourcePath('somebodyelse'))
          .query(defaultQuery)
          .set('Authorization', systemRoleKey);
      }
      catch (err) {
        assert.strictEqual(err.status, 404);

        return;
      }

      assert.fail('Request should fail.');
    });
    it('checks, but doesn\'t delete if dryRun=true is given', async () => {
      const res = await request.delete(resourcePath('jsmith'))
        .query(defaultQuery)
        .set('Authorization', systemRoleKey);

      assert.isTrue(res.ok);
      assert.strictEqual(res.status, 200);

      const body = res.body; 
      assert.isTrue(body.result.dryRun);
      assert.isFalse(body.result.deleted);
    });
    it('deletes the user (dryRun=false, onlyReg=true)', async () => {
      const query = lodash.omit(defaultQuery, ['dryRun']);

      const res = await request.delete(resourcePath('jsmith'))
        .query(query)
        .set('Authorization', systemRoleKey);

      assert.isTrue(res.ok);
      assert.strictEqual(res.status, 200);

      const body = res.body;
      assert.isFalse(body.result.dryRun);
      assert.isTrue(body.result.deleted);

      const exists = await bluebird.fromCallback(cb => db.uidExists('jsmith', cb));
      assert.isFalse(exists);
    });
  });
  
  function resourcePath(username: string): string {
    return `${serverUrl}/users/${username}`;
  }
});
