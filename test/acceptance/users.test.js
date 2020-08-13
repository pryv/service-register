// @flow

/*global describe, it, before, after, beforeEach */

const bluebird = require('bluebird');
const lodash = require('lodash');

const dataValidation = require('../support/data-validation');
const schemas = require('../support/schema.responses');
const config = require('../../source/config');

const _ = require('lodash');
const request = require('superagent');
const chai = require('chai');
const assert = chai.assert; 

const async = require('async');

const registerKeys = config.get('auth:authorizedKeys');
const authAdminKey = retrieveAdminKey(registerKeys);

function retrieveAdminKey(authKeys) {
  return Object.keys(authKeys).filter(k => {
    return registerKeys[k].roles.indexOf('admin') >= 0;
  })[0];
}

// Load and start our web server
const Server = require('../../source/server.js');

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

function defaultsForSystemRegistration () {
  const randomFieldValue = randomuser();

  return {
    user: _.extend({}, defaults(), { RandomField: randomFieldValue }),
    unique: ['email', 'RandomField'],
    host: { name: 'some-host' }
  };
}

const defaultUsername = 'wactiv';
const defaultEmail = 'wactiv@pryv.io';
const defaultAuth = 'test-system-key';

describe('User Management', () => {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  describe('POST /user (create user)', function () {
    const basePath = '/user';

    // fixes missing appId PR#104
    it ('user creation should store all provided fields', function (done) {
      let testData = _.extend({}, defaults());
      const test = {
        data: testData,
        status: 200,
        JSchema: schemas.userCreated,
        JValues: {
          username: testData.username,
        }
      };

      async.series([
        function doRequest(stepDone) {
          request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
            .end(function (err, res) {
              dataValidation.jsonResponse(err, res, test, stepDone);
            });
        },
        function checkUser(stepDone) {
          request.get(server.url + '/admin/users' + '?auth=' + authAdminKey)
            .end((err, res) => {
              res.body.users.forEach(function (user) {
                if (user.username === testData.username) {
                  delete testData.hosting;
                  delete testData.password;
                  testData.invitationToken = testData.invitationtoken;
                  delete testData.invitationtoken;
                  Object.keys(testData).forEach(function (prop) {
                    assert.deepEqual(testData[prop], user[prop]);
                  });
                }
              });
              stepDone();
            });
        
        }
      ], done);

    });

    it('invalid hosting', function (done) {
      var test = {
        data: { hosting: '' },
        status: 400, desc: 'Invalid hosting',
        JSchema: schemas.error,
        JValues: { 'id': 'INVALID_HOSTING' }
      };

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

      request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

        request.post(server.url + basePath).send(test.data)
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

        request.post(server.url + basePath).send(test.data)
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

        request.post(server.url + basePath).send(test.data)
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

        request.post(server.url + basePath).send(test.data)
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

        request.post(server.url + basePath).send(test.data)
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

        request.post(server.url + basePath).send(_.extend({}, defaults(), test.data))
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

        request.post(server.url + basePath).send(test.data)
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

      request.post(server.url + path).send(_.extend(defaults, test)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved pryv', function (done) {
      var test = {
        username: 'pryvtoto', status: 200, desc: 'reserved for pryv',
        value: 'false', restype: 'text/plain; charset=utf-8'
      };

      request.post(server.url + path).send(_.extend(defaults, test)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('available', function (done) {
      var test = {
        username: 'asdfhgsdkfewg', status: 200, desc: 'available',
        value: 'true', restype: 'text/plain; charset=utf-8'
      };

      request.post(server.url + path).send(_.extend(defaults, test)).end(function (err, res) {
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
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 1', function (done) {
      var test = {
        username: 'abc%20def', status: 400, desc: 'invalid character 1',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('invalid character 2', function (done) {
      var test = {
        username: 'abc.def', status: 400, desc: 'invalid character 2',
        JSchema: schemas.error, JValues: { 'id': 'INVALID_USER_NAME' }
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
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved from list', function (done) {
      var test = {
        username: 'facebook', status: 200, desc: 'reserved from list',
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

    it('reserved dns', function (done) {
      var test = {
        username: 'access', status: 200, desc: 'reserved dns',
        JSchema: schemas.checkUID, JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };

      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });

  });

  describe('POST /users/:username/change-email', function () {
    beforeEach(async () => {
      const users = [
        { username: defaultUsername, email: defaultEmail},
        { username: 'otherUser', email: 'otherEmail'}
      ];

      users.forEach(async (user) => {
        await bluebird.fromCallback((cb) => 
          // FLOW Ignore the missing attributes in the user attr hash.
          db.setServerAndInfos(user.username, 'server.name.at.tld', user, ['email'], cb));
      });
    });

    function getPath(username) {
      return '/users/' + (username || defaultUsername) + '/change-email';
    }

    it('must change the username\'s email', function (done) {
      request.post(server.url + getPath()).send({ email: 'toto@pryv.io' })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.check(res, {
            status: 200,
            schema: schemas.success,
            body: { success: true }
          }, done);
        });
    });
    it('must accept changing a user\'s email by the same one', function (done) {
      request.post(server.url + getPath()).send({ email: defaultEmail })
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
      request.post(server.url + getPath('baduser')).send({ email: 'toto@pryv.io' })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 404,
            id: 'UNKNOWN_USER_NAME'
          }, done);
        });
    });
    it('must return an error if the email is invalid', function (done) {
      request.post(server.url + getPath()).send({ email: null })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 400,
            id: 'INVALID_EMAIL'
          }, done);
        });
    });
    it('must return an error if the email is taken', function (done) {
      request.post(server.url + getPath('otherUser')).send({ email: defaultEmail })
        .set('Authorization', defaultAuth)
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 400,
            id: 'DUPLICATE_EMAIL'
          }, done);
        });
    });
    it('must return an error if the request auth key is missing or unknown', function (done) {
      request.post(server.url + getPath()).send({ email: 'toto@pryv.io' })
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 401,
            'id': 'unauthorized'
          }, done);
        });
    });
    it('must return an error if the request auth key is unauthorized', function (done) {
      request.post(server.url + getPath()).send({ email: 'toto@pryv.io' })
        .set('Authorization', 'test-admin-key')
        .end((err, res) => {
          dataValidation.checkError(res, {
            status: 403,
            'id': 'forbidden'
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

      // FLOW Ignore the missing attributes in the user attr hash.
      db.setServerAndInfos('jsmith', 'server.name.at.tld', userInfos, ['email'], done);
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
    return `${server.url}/users/${username}`;
  }

  describe('POST /users/validate', function () {
    const path = '/users/validate';

    it('Path requires system auth', async () => {
      const userTestData = _.extend({}, defaults());
      const testData = {
        username: userTestData.username,
        email: userTestData.email,
        invitationtoken: userTestData.invitationtoken,
      }
      try{
        await request.post(server.url + path).send(testData);
        assert.isTrue(false);
      } catch(e){
        assert.equal(e.status, 401);
      }
    });

    describe('Sequence of validations', () => {
      describe('Invitation token is required', () => {
        let defaultConfigInvitationTokens;

        before(function () {
          defaultConfigInvitationTokens = config.get('invitationTokens');
          config.set('invitationTokens', ['first', 'second', 'third']);
        });

        after(function () {
          config.set('invitationTokens', defaultConfigInvitationTokens);
        });

        it('username, email fails and invitation token is ok', async () => {
          const testData = {
            username: 'wactiv',
            invitationtoken: 'second',
            uniqueFields: {
              email: 'wactiv@pryv.io',
            }
          }

          try {
            await request.post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.isTrue(false);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(e.response.body.errors, 'Existing_username');
            assert.include(e.response.body.errors, 'Existing_email');
            assert.equal(e.response.body.errors.length, 2);
          }
        });
 
        it('Does not check email and username if invitation token validation fails', async () => {
          const testData = {
            "username": 'wactiv',
            "email": 'wactiv@pryv.io',
            "invitationtoken": 'abc',
          }

          try {
            await request.post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.isTrue(false);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(e.response.body.errors, 'InvalidInvitationToken');
            assert.equal(e.response.body.errors.length, 1);
          }
        });

        it('Fail when additional unique field is not unique', async () => {
          const userTestData = _.extend({}, defaults());
          const randomFieldValue = randomuser();
          const testData = {
            username: userTestData.username,
            invitationtoken: 'first',
            uniqueFields: {
              email: userTestData.email,
              RandomField: randomFieldValue
            },
            core: 'testing_core1'
          }
          try {
            let userRegistrationData = {
              user: _.extend({}, defaults(), { RandomField: randomFieldValue }),
              unique: ['email', 'RandomField'],
              host: { name: 'some-host' }
            }
            const userRegistrationRes = await request.post(server.url + '/users').set('Authorization', defaultAuth)
              .send(userRegistrationData);
            // make sure registration was successful
            assert.equal(userRegistrationRes.status, 200);
            
            // call validation api and check that RandomField is already existing
            await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
            (false).equal(true);
          } catch (err) {
            assert.equal(err.response.status, 400);
            assert.equal(err.response.body.reservation, false);
            assert.include(err.response.body.errors, 'Existing_RandomField');
          }
        });

        it('Successfully validate username, email and invitation token and reserve the unique values', async () => {
          const userTestData = _.extend({}, defaults());
          const randomFieldValue = randomuser();
          const testData = {
            username: userTestData.username,
            invitationtoken: 'first',
            uniqueFields: {
              email: userTestData.email,
              RandomField: randomFieldValue
            },
            core: 'testing_core1'
          }
          try {
            const res = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
            assert.equal(res.status, 200);
            assert.equal(res.body.reservation, true);
          } catch (err) {
            (false).equal(true);
          }

          // check the reservation in the database
          const storedReservation = await db.getReservations({
            email: userTestData.email,
            username: userTestData.username,
            RandomField: randomFieldValue
          });
          assert.equal(storedReservation.length, 3);
          assert.equal(storedReservation[0].core, testData.core);
          assert.exists(storedReservation[0].time);

          assert.equal(storedReservation[1].core, testData.core);
          assert.exists(storedReservation[1].time);

          assert.equal(storedReservation[2].core, testData.core);
          assert.exists(storedReservation[2].time);
        });
      });
    
      it('username is reserved', async () => {
        const testData = {
          username: 'pryvwa',
          invitationtoken: null,
          uniqueFields: {
            email: 'anyemail@pryv.io'
          }
        }

        try{
          await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
          assert.isTrue(false);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.include(e.response.body.errors, 'ReservedUsername');
          assert.equal(e.response.body.errors.length, 1);
        }
      });
    });
    describe('Reservation', () => {
      it('Reservation fails if reservation is made for username', async () => {
        const userTestData1 = _.extend({}, defaults());
        const userTestData2 = _.extend({}, defaults());
        const testData1 = {
          username: userTestData1.username,
          invitationtoken: userTestData1.invitationtoken,
          uniqueFields: {
            email: userTestData1.email,
          },
          core: 'testing_core3'
        }
        const testData2 = _.extend({}, testData1, {
          core: 'testing_core_not_3',
          uniqueFields: {
            email: userTestData2.email,
          },
        });
        const res1 = await request.post(server.url + path).send(testData1).set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);

        try {
          const res2 = await request.post(server.url + path)
            .send(testData2)
            .set('Authorization', defaultAuth);
          assert.isNull(res2);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.equal(e.response.body.reservation, false);
        }
      });

      it('Reservation fails if reservation is made for additional unique field', async () => {
        const userTestData1 = _.extend({}, defaults());
        const userTestData2 = _.extend({}, defaults());
        const randomFieldValue = randomuser();
        const testData1 = {
          username: userTestData1.username,
          invitationtoken: userTestData1.invitationtoken,
          uniqueFields: {
            email: userTestData1.email,
            RandomField: randomFieldValue,
          },
          core: 'testing_core4'
        }
        const testData2 = _.extend({}, testData1, {
          core: 'testing_core_not_4',
          username: userTestData2.username,
          uniqueFields: {
            email: userTestData2.email,
            RandomField: randomFieldValue,
          },
        });
        try {
          const res1 = await request.post(server.url + path).send(testData1).set('Authorization', defaultAuth);
          assert.equal(res1.status, 200);
          assert.equal(res1.body.reservation, true);
        } catch (e) {
          console.log(e, 'e');
          assert.equal(false, true);
        }
        try {
          const res2 = await request.post(server.url + path)
            .send(testData2)
            .set('Authorization', defaultAuth);
          assert.isNull(res2);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.equal(e.response.body.reservation, false);
        }
      });

      it('Fail when reservation is made from different core', async () => {
        const userTestData = _.extend({}, defaults());
        const testData = {
          username: userTestData.username,
          invitationtoken: userTestData.invitationtoken,
          uniqueFields: {
            email: userTestData.email,
          },
          core: 'testing_core3'
        }
        const testData2 = _.extend({}, testData, { core: 'testing_core_not_3'});
        const res1 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);

        try {
          const res2 = await request.post(server.url + path)
            .send(testData2)
            .set('Authorization', defaultAuth);
          assert.isNull(res2);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.equal(e.response.body.reservation, false);
        }
      });

      it('Get successful response when trying to reserve user registrationIndexedValues from the save server in 10 minutes', async () => {
        const userTestData = _.extend({}, defaults());
        const testData = {
          username: userTestData.username,
          invitationtoken: userTestData.invitationtoken,
          uniqueFields: {
            email: userTestData.email,
          },
          core: 'testing_core2'
        }

        const res1 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);

        const res2 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
        assert.equal(res2.status, 200);
        assert.equal(res2.body.reservation, true);
      });

      it('Success when reservation is made from different core after more than 10 minutes', async () => {
        try {
          const userTestData = _.extend({}, defaults());
          const testData = {
            username: userTestData.username,
            invitationtoken: userTestData.invitationtoken,
            uniqueFields: {
              email: userTestData.email,
              username: userTestData.username,
            },
            core: 'core2'
          }

          await db.setReservations({
            username: userTestData.username,
            email: userTestData.email,
          }, 'core_new', Date.now() - 11 * 60 * 1000);
          const res2 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
          assert.equal(res2.status, 200);
          assert.equal(res2.body.reservation, true);
        } catch (error) {
          assert.isTrue(false);
        }
      });

      it('Success reservation without email', async () => {
        try {
          const userTestData = _.extend({}, defaults());
          const testData = {
            username: userTestData.username,
            invitationtoken: userTestData.invitationtoken,
            uniqueFields: {},
            core: 'core2'
          }

          await db.setReservations({
            username: userTestData.username
          }, 'core_new', Date.now() - 11 * 60 * 1000);
          const res = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
          assert.equal(res.status, 200);
          assert.equal(res.body.reservation, true);
        } catch (error) {
          assert.isTrue(false);
        }
      });
    });
  });

  describe('POST /users', function () {
    const path = '/users';

    it('Path requires system auth', async () => {
      const randomFieldValue = randomuser();
      let userRegistrationData = {
        user: _.extend({}, defaults(), { RandomField: randomFieldValue }),
        unique: ['email', 'RandomField'],
        host: { name: 'some-host' }
      }
      try {
        await request.post(server.url + path).send(userRegistrationData);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.status, 401);
      }
    });

    describe('Successful system registration', async () => {
      const randomFieldValue = randomuser();
      let userRegistrationData = {
        user: _.extend({}, defaults(), { RandomField: randomFieldValue }),
        unique: ['email', 'RandomField'],
        host: { name: 'some-host' }
      }

      it('Registration process was successful', async () => {
        try {
          const userRegistrationRes = await request.post(server.url + path).set('Authorization', defaultAuth)
            .send(userRegistrationData);
          assert.equal(userRegistrationRes.status, 200);
          assert.equal(userRegistrationRes.body.username, userRegistrationData.user.username);
          assert.equal(userRegistrationRes.body.server, userRegistrationData.user.username + '.rec.la');
          assert.equal(userRegistrationRes.body.apiEndpoint, 'https://' + userRegistrationData.user.username + '.pryv.me/');
        } catch (e) {
          console.log(e,'e');
          assert.equal(false, true);
        }
      });

      it('Unique fields were saved in redis database', async () => {
        const usernameUnique = await  db.isFieldUnique('users', userRegistrationData.user.username);
        const emailUnique = await db.isFieldUnique('email', userRegistrationData.user.email);
        const randomFieldUnique = await db.isFieldUnique('RandomField', userRegistrationData.user.RandomField);
        assert.equal(usernameUnique, false);
        assert.equal(emailUnique, false);
        assert.equal(randomFieldUnique, false);
      });
    });

    it('Registration without email is successful', async () => {
      const randomFieldValue = randomuser();
      let userData = _.extend({}, defaults(), { RandomField: randomFieldValue });
      delete userData.email;
      let userRegistrationData = {
        user: userData,
        unique: ['RandomField'],
        host: { name: 'some-host' }
      }

      try {
        const res = await request.post(server.url + path)
          .send(userRegistrationData)
          .set('Authorization', defaultAuth);
        assert.equal(res.status, 200);
        assert.equal(res.body.username, userRegistrationData.user.username);
        assert.equal(res.body.server, userRegistrationData.user.username + '.rec.la');
        assert.equal(res.body.apiEndpoint, 'https://' + userRegistrationData.user.username + '.pryv.me/');
      } catch (e) {
        console.log(e, 'e');
        assert.isTrue(false);
      }
    });
    describe('Registration when invitation token is required is successful', async () => {
      let defaultConfigInvitationTokens;

      before(function () {
        defaultConfigInvitationTokens = config.get('invitationTokens');
        config.set('invitationTokens', ['first']);
      });

      after(function () {
        config.set('invitationTokens', defaultConfigInvitationTokens);
      });

      it('Registration fails if token is invalid', async () => {
        let userData = _.extend({}, defaults(), { invitationtoken: 'random' });
        let userRegistrationData = {
          user: userData,
          unique: [],
          host: { name: 'some-host' }
        }

        try {
          await request.post(server.url + path)
            .send(userRegistrationData)
            .set('Authorization', defaultAuth);
          assert.isTrue(false);
        } catch (e) {
          assert.equal(e.status, 404);
        }
      });
      it('Registration succeeds when token is valid', async () => {
        let userData = _.extend({}, defaults(), { invitationtoken: 'first' });
        let userRegistrationData = {
          user: userData,
          unique: [],
          host: { name: 'some-host' }
        }

        try {
          const res = await request.post(server.url + path)
            .send(userRegistrationData)
            .set('Authorization', defaultAuth);
          assert.equal(res.status, 200);
          assert.equal(res.body.username, userRegistrationData.user.username);
          assert.equal(res.body.server, userRegistrationData.user.username + '.rec.la');
          assert.equal(res.body.apiEndpoint, 'https://' + userRegistrationData.user.username + '.pryv.me/');
        } catch (e) {
          console.log(e, 'e');
          assert.isTrue(false);
        }
      });
    });
  });

  describe('PUT /users', function () {
    const path = '/users';

    it('Path requires system auth', async () => {
      let userRegistrationData = {
        user: defaults(),
        unique: ['email'],
        host: { name: 'some-host' }
      }
      try {
        await request.post(server.url + path).send(userRegistrationData);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.status, 401);
      }
    });

    describe('Unique fields validation', async () => {

      it('Fail if email is not unique', async () => {
        try {
          let userRegistrationData1 = defaultsForSystemRegistration();

          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.email = userRegistrationData1.user.email;

          let userRegistrationData3 = defaultsForSystemRegistration();
          userRegistrationData3.user.username = userRegistrationData1.user.username;

          // seed initial user
          await request.post(server.url + path)
            .send(userRegistrationData3)
            .set('Authorization', defaultAuth);

          // seed the user that will have the same email and random field
          await request.post(server.url + path)
            .send(userRegistrationData2)
            .set('Authorization', defaultAuth);

          await request.put(server.url + path).set('Authorization', defaultAuth)
            .send(userRegistrationData1);
          assert.equal(false, true);
        } catch (e) {
          console.log(e.response.body, 'e');
          assert.equal(e.status, 400);
          assert.equal(e.response.body.errors.length, 1);
          assert.equal(e.response.body.user, false);
          assert.equal(e.response.body.errors[0].id, 'Existing_email');
          assert.exists(e.response.body.errors[0].message);
        }
      });

      it('Fail if additional field is not unique', async () => {
        try {
          let userRegistrationData1 = defaultsForSystemRegistration();

          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.RandomField = userRegistrationData1.user.RandomField;

          let userRegistrationData3 = defaultsForSystemRegistration();
          userRegistrationData3.user.username = userRegistrationData1.user.username;

          // seed initial user
          await request.post(server.url + path)
            .send(userRegistrationData3)
            .set('Authorization', defaultAuth);

          // seed the user that will have the same email and random field
          await request.post(server.url + path)
            .send(userRegistrationData2)
            .set('Authorization', defaultAuth);

          await request.put(server.url + path).set('Authorization', defaultAuth)
            .send(userRegistrationData1);
          assert.equal(false, true);
        } catch (e) {
          console.log(e.response.body, 'e');
          assert.equal(e.status, 400);
          assert.equal(e.response.body.errors.length, 1);
          assert.equal(e.response.body.user, false);
          assert.equal(e.response.body.errors[0].id, 'Existing_RandomField');
          assert.exists(e.response.body.errors[0].message);
        }
      });

      it('Fail with nested error if several fields are not unique', async () => {
        try {
          let userRegistrationData1 = defaultsForSystemRegistration();

          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.email = userRegistrationData1.user.email;
          userRegistrationData2.user.RandomField = userRegistrationData1.user.RandomField;

          let userRegistrationData3 = defaultsForSystemRegistration();
          userRegistrationData3.user.username = userRegistrationData1.user.username;

          // seed initial user
          await request.post(server.url + path)
            .send(userRegistrationData3)
            .set('Authorization', defaultAuth);
          
          // seed the user that will have the same email and random field
          await request.post(server.url + path)
            .send(userRegistrationData2)
            .set('Authorization', defaultAuth);

          await request.put(server.url + path).set('Authorization', defaultAuth)
            .send(userRegistrationData1);
          assert.equal(false, true);
        } catch (e) {
          console.log(e.response.body, 'e');
          assert.equal(e.status, 400);
          assert.equal(e.response.body.errors.length, 2);
          assert.equal(e.response.body.user, false);
          assert.equal(e.response.body.errors[0].id, 'Existing_email');
          assert.equal(e.response.body.errors[1].id, 'Existing_RandomField');
          assert.exists(e.response.body.errors[0].message);
          assert.exists(e.response.body.errors[1].message);
        }
      });
    });

    describe('[ieva] Update user information', async () => {
      let userRegistrationData1 = defaultsForSystemRegistration();
      let userRegistrationData2 = defaultsForSystemRegistration();
      userRegistrationData2.user.username = userRegistrationData1.user.username;

      it('Succeed updating fields when all fields are unique', async () => {
        // seed initial user
        await request.post(server.url + path)
          .send(userRegistrationData1)
          .set('Authorization', defaultAuth);

        const response = await request.put(server.url + path).set('Authorization', defaultAuth)
          .send(userRegistrationData2);
        assert.equal(response.status, 200);
        assert.equal(response.body.user, true);
      });

      it(' Succeed updating username:users information', async () => {
        const userInfo = await bluebird.fromCallback(cb =>
          db.getSet(`${userRegistrationData1.user.username}:users`, cb));
        for (const [key, value] of Object.entries(userRegistrationData2.user)){
          assert.equal(value, userInfo[key]);
        }
      });

      it('Succeed updating unique fields information', async () => {
        const oldEmail = await bluebird.fromCallback(cb =>
          db.get(`${userRegistrationData1.user.email}:email`, cb));
        const uniqueEmail = await bluebird.fromCallback(cb =>
          db.get(`${userRegistrationData2.user.email}:email`, cb));
        console.log(oldEmail,'oldEmail',uniqueEmail, 'uniqueEmail');
        const oldRandomField = await bluebird.fromCallback(cb =>
          db.get(`${userRegistrationData1.user.RandomField}:RandomField`, cb));
        const uniqueRandomField = await bluebird.fromCallback(cb =>
          db.get(`${userRegistrationData2.user.RandomField}:RandomField`, cb));
        assert.equal(oldEmail, null);
        assert.equal(oldRandomField, null);
        assert.equal(uniqueEmail, userRegistrationData2.user.username);
        assert.equal(uniqueRandomField, userRegistrationData2.user.username);
      });
    });
  });
});
