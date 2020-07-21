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
      const testData = _.extend({}, defaults());
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
                  user.invitationtoken = user.invitationToken;
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
          db.setServerAndInfos(user.username, 'server.name.at.tld', user, cb));
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
    return `${server.url}/users/${username}`;
  }

  describe('POST /users/validate', function () {
    const path = '/users/validate';
    it('Path requires system auth', async () => {
      const userTestData = _.extend({}, defaults());
      const testData = {
        username: userTestData.username,
        email: userTestData.email,
        invitationtoken: userTestData.invitationToken,
      }

      try{
        const res = await request.post(server.url + path).send(testData);
        assert.isNull(res);
      } catch(e){
        assert.equal(e.status, 401);
      }
    });

    it('Successfully validate username, email and invitation token', async () => {
      const userTestData = _.extend({}, defaults());
      const testData = {
        "username": userTestData.username,
        "email": userTestData.email,
        "invitationToken": userTestData.invitationToken,
      }

      const res = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    describe('Sequence of validations', () => {
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
          email: 'wactiv@pryv.io',
          invitationtoken: 'second',
        }

        try{
          const res = await request.post(server.url + path)
                                   .send(testData)
                                   .set('Authorization', defaultAuth);
          assert.isNull(res);
        } catch(e){
          assert.equal(e.status, 400);
          assert.include(e.response.body.errors, 'ExistingUsername');
          assert.include(e.response.body.errors, 'ExistingEmail');
          assert.equal(e.response.body.errors.length, 2);
        }
      });
 
      it('Does not check email and username if invitation token validation fails', async () => {
        const testData = {
          "username": 'wactiv',
          "email": 'wactiv@pryv.io',
          "invitationToken": 'abc',
        }

        try{
          const res = await request.post(server.url + path)
                                   .send(testData)
                                   .set('Authorization', defaultAuth);
          assert.isNull(res);
        } catch(e){
          assert.equal(e.status, 400);
          assert.include(e.response.body.errors, 'InvalidInvitationToken');
          assert.equal(e.response.body.errors.length, 1);
        }
      });
    });

    it('username is reserved', async () => {
      const testData = {
        username: 'pryvwa',
        email: 'anyemail@pryv.io',
        invitationtoken: null
      }

      try{
        const res = await request.post(server.url + path)
                                 .send(testData)
                                 .set('Authorization', defaultAuth);
        assert.isNull(res);
      } catch(e){
        assert.equal(e.status, 400);
        assert.include(e.response.body.errors, 'ReservedUsername');
        assert.equal(e.response.body.errors.length, 1);
      }
    });
  });


  describe('POST /users/reservations', () => {
    const path = '/users/reservations';
    it('Path requires system auth', async () => {
      try{
        const res = await request.post(server.url + path);
        assert.isNull(res);
      } catch(e){
        assert.equal(e.status, 401);
      }
    });

    it('Successfully reserve the key', async () => {
      const testData = {
        "key": 'key_Test1',
        "core": 'testing_core1'
      }

      const res = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('Get successful response when trying to reserve user key from the save server in 10 minutes', async () => {
      const testData = {
        key: 'key_Test2',
        core: 'testing_core2'
      }

      const res1 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
      assert.equal(res1.status, 200);
      assert.equal(res1.body.success, true);

      const res2 = await request.post(server.url + path).send(testData).set('Authorization', defaultAuth);
      assert.equal(res2.status, 200);
      assert.equal(res2.body.success, true);
    });

    it('Fail when reservation is made from different core', async () => {
      const res1 = await request.post(server.url + path)
                  .send({
                    key: 'key_Test3',
                    core: 'testing_core3'
                  })
                  .set('Authorization', defaultAuth);
      assert.equal(res1.status, 200);
      assert.equal(res1.body.success, true);

      const res2 = await request.post(server.url + path)
                  .send({
                    key: 'key_Test3',
                    core: 'testing_core_not_3'
                  })
                  .set('Authorization', defaultAuth);

      assert.equal(res2.status, 200);
      assert.equal(res2.body.success, false);
    });

    it('Success when reservation is made from different core after more than 10 minutes', async () => {
      const key = 'key_Test';
      await bluebird.fromCallback(cb => db.setReservation(key, 'core1', Date.now() - 11 * 60 * 1000, cb));

      const res2 = await request.post(server.url + path).send({key: key, core: 'core2'}).set('Authorization', defaultAuth);
      assert.equal(res2.status, 200);
      assert.equal(res2.body.success, true);
    });

  });

});
