/*global describe, it, before, after, beforeEach */
const bluebird = require('bluebird');
const lodash = require('lodash');
const dataValidation = require('../support/data-validation');
const schemas = require('../support/schema.responses');
const config = require('../../src/config');
const ErrorIds = require('../../src/utils/errors-ids');
const faker = require('faker');
const _ = require('lodash');
const request = require('superagent');
const chai = require('chai');
const assert = chai.assert;
const async = require('async');
const registerKeys = config.get('auth:authorizedKeys');
const authAdminKey = retrieveAdminKey(registerKeys);
/** @returns {string} */
function retrieveAdminKey(authKeys) {
  return Object.keys(authKeys).filter((k) => {
    return registerKeys[k].roles.indexOf('admin') >= 0;
  })[0];
}
// Load and start our web server
const Server = require('../../src/server.js');
// Mocks out a core server.
require('../support/mock-core-server');
const db = require('../../src/storage/database');
/** @returns {string} */
function randomuser() {
  return 'testpfx' + Math.floor(Math.random() * 100000);
}
/** @param {Boolean} newRegsitration
 * @returns {{ hosting: string; appId: string; username: string; email: string; password: string; invitationToken: string; referer: string; appid?: undefined; invitationtoken?: undefined; } | { hosting: string; appid: string; username: string; email: string; password: string; invitationtoken: string; referer: string; appId?: undefined; invitationToken?: undefined; }}
 */
function defaults(newRegsitration) {
  newRegsitration = !newRegsitration ? false : true;
  if (newRegsitration) {
    return {
      hosting: 'mock-api-server',
      appId: 'pryv-test',
      username: randomuser(),
      email: randomuser() + '@wactiv.chx',
      password: 'abcdefgh',
      invitationToken: 'enjoy',
      referer: 'pryv'
    };
  } else {
    return {
      hosting: 'mock-api-server',
      appid: 'pryv-test',
      username: randomuser(),
      email: randomuser() + '@wactiv.chx',
      password: 'abcdefgh',
      invitationtoken: 'enjoy',
      referer: 'pryv'
    };
  }
}
/** @returns {{ user: { username: string; email: string; RandomField: string; }; unique: string[]; host: { name: string; }; }} */
function defaultsForSystemRegistration() {
  const randomFieldValue = randomuser();
  return {
    user: {
      username: randomuser(),
      email: faker.lorem.word().toLowerCase() + '@wactiv.chx',
      RandomField: randomFieldValue
    },
    unique: ['email', 'RandomField'],
    host: { name: 'some-host' }
  };
}
/** @returns {{ username: string; user: { email: { value: string; isUnique: boolean; isActive: boolean; creation: boolean; }[]; RandomField: { value: string; isUnique: boolean; isActive: boolean; creation: boolean; }[]; }; fieldsToDelete: {}; }} */
function defaultsForSystemDataUpdate() {
  const randomFieldValue = randomuser();
  return {
    username: randomuser(),
    user: {
      email: [
        {
          value: randomuser() + '@wactiv.chx',
          isUnique: true,
          isActive: true,
          creation: false
        }
      ],
      RandomField: [
        {
          value: randomFieldValue,
          isUnique: true,
          isActive: true,
          creation: false
        }
      ]
    },
    fieldsToDelete: {}
  };
}
const defaultUsername = 'wactiv';
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
    it('user creation should store all provided fields', function (done) {
      let testData = _.extend({}, defaults());
      const test = {
        data: testData,
        status: 200,
        JSchema: schemas.userCreated,
        JValues: {
          username: testData.username
        }
      };
      async.series(
        [
          function doRequest(stepDone) {
            request
              .post(server.url + basePath)
              .send(_.extend({}, defaults(), test.data))
              .end(function (err, res) {
                dataValidation.jsonResponse(err, res, test, stepDone);
              });
          },
          function checkUser(stepDone) {
            request
              .get(server.url + '/admin/users' + '?auth=' + authAdminKey)
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
        ],
        done
      );
    });
    it('invalid hosting', function (done) {
      var test = {
        data: { hosting: '' },
        status: 400,
        desc: 'Invalid hosting',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_HOSTING' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid appid', function (done) {
      var test = {
        data: { appid: '' },
        status: 400,
        desc: 'Invalid app Id',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_APPID' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid username', function (done) {
      var test = {
        data: { username: 'wa' },
        status: 400,
        desc: 'Invalid user',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_USER_NAME' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('reserved username', function (done) {
      var test = {
        data: { username: 'pryvwa' },
        status: 400,
        desc: 'Reserved user starting by pryv',
        JSchema: schemas.error,
        JValues: { id: 'RESERVED_USER_NAME' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('listed username', function (done) {
      var test = {
        data: { username: 'facebook' },
        status: 400,
        desc: 'Reserved user starting from list',
        JSchema: schemas.error,
        JValues: { id: 'RESERVED_USER_NAME' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid email', function (done) {
      var test = {
        data: { email: null },
        status: 400,
        desc: 'Invalid email',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_EMAIL' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('invalid language', function (done) {
      var test = {
        data: { languageCode: 'abcdef' },
        status: 400,
        desc: 'Invalid language',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_LANGUAGE' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing user', function (done) {
      var test = {
        data: { username: 'wactiv' },
        status: 400,
        desc: 'Existing user',
        JSchema: schemas.multipleErrors,
        JValues: { id: 'EXISTING_USER_NAME' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing email', function (done) {
      var test = {
        data: { email: 'wactiv@pryv.io' },
        status: 400,
        desc: 'Existing e-mail',
        JSchema: schemas.multipleErrors,
        JValues: { id: 'EXISTING_EMAIL' }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('existing user and email', function (done) {
      var test = {
        data: { username: 'wactiv', email: 'wactiv@pryv.io' },
        status: 400,
        desc: 'Existing e-mail & username',
        JSchema: schemas.multipleErrors,
        JValues: {
          id: 'INVALID_DATA',
          errors: [{ id: 'EXISTING_USER_NAME' }, { id: 'EXISTING_EMAIL' }]
        }
      };
      request
        .post(server.url + basePath)
        .send(_.extend({}, defaults(), test.data))
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
            username: testData.username
          }
        };
        request
          .post(server.url + basePath)
          .send(test.data)
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
            username: testData.username
          }
        };
        request
          .post(server.url + basePath)
          .send(test.data)
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
          invitationtoken: 'second'
        });
        const test = {
          data: testData,
          status: 200,
          JSchema: schemas.userCreated,
          JValues: {
            username: testData.username
          }
        };
        request
          .post(server.url + basePath)
          .send(test.data)
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });
      it('should fail if the "invitationToken" does not match any token', function (done) {
        const testData = _.extend({}, defaults(), {
          invitationtoken: 'anythingAtAll'
        });
        const test = {
          data: testData,
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { id: 'INVALID_INVITATION' }
        };
        request
          .post(server.url + basePath)
          .send(test.data)
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
          JValues: { id: 'INVALID_INVITATION' }
        };
        delete test.data.invitationtoken;
        request
          .post(server.url + basePath)
          .send(test.data)
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
            invitationtoken: 'anything'
          },
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { id: 'INVALID_INVITATION' }
        };
        request
          .post(server.url + basePath)
          .send(_.extend({}, defaults(), test.data))
          .end(function (err, res) {
            dataValidation.jsonResponse(err, res, test, done);
          });
      });
      it('[L3LP] should fail if the "invitationToken" is missing', function (done) {
        const test = {
          data: _.extend({}, defaults()),
          status: 400,
          desc: 'Invalid invitation',
          JSchema: schemas.error,
          JValues: { id: 'INVALID_INVITATION' }
        };
        delete test.data.invitationtoken;
        request
          .post(server.url + basePath)
          .send(test.data)
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
      email: randomuser() + '@wactiv.chx',
      password: 'abcdefgh',
      invitationtoken: 'enjoy',
      referer: 'pryv'
    };
    it('reserved list', function (done) {
      var test = {
        username: 'facebook',
        status: 200,
        desc: 'reserved from list',
        value: 'false',
        restype: 'text/plain; charset=utf-8'
      };
      request
        .post(server.url + path)
        .send(_.extend(defaults, test))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('reserved pryv', function (done) {
      var test = {
        username: 'pryvtoto',
        status: 200,
        desc: 'reserved for pryv',
        value: 'false',
        restype: 'text/plain; charset=utf-8'
      };
      request
        .post(server.url + path)
        .send(_.extend(defaults, test))
        .end(function (err, res) {
          dataValidation.jsonResponse(err, res, test, done);
        });
    });
    it('available', function (done) {
      var test = {
        username: 'asdfhgsdkfewg',
        status: 200,
        desc: 'available',
        value: 'true',
        restype: 'text/plain; charset=utf-8'
      };
      request
        .post(server.url + path)
        .send(_.extend(defaults, test))
        .end(function (err, res) {
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
        username: 'abcd',
        status: 400,
        desc: 'too short ',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('invalid username', function (done) {
      var test = {
        username:
          'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas' +
          'abcdefghijklmnopqrstuvwxyzasaasaaas',
        status: 400,
        desc: 'too long ',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('invalid character 1', function (done) {
      var test = {
        username: 'abc%20def',
        status: 400,
        desc: 'invalid character 1',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('invalid character 2', function (done) {
      var test = {
        username: 'abc.def',
        status: 400,
        desc: 'invalid character 2',
        JSchema: schemas.error,
        JValues: { id: 'INVALID_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('authorized', function (done) {
      var test = {
        username: 'abcd-ef',
        status: 200,
        desc: '- authorized ',
        JSchema: schemas.checkUID
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('correct', function (done) {
      var test = {
        username: 'wactiv',
        status: 200,
        desc: 'correct ',
        JSchema: schemas.checkUID
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('always available', function (done) {
      var test = {
        username: 'recla',
        status: 200,
        desc: 'always available ',
        JSchema: schemas.checkUID
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('reserved for pryv', function (done) {
      var test = {
        username: 'pryvtoto',
        status: 200,
        desc: 'reserved for pryv',
        JSchema: schemas.checkUID,
        JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('reserved from list', function (done) {
      var test = {
        username: 'facebook',
        status: 200,
        desc: 'reserved from list',
        JSchema: schemas.checkUID,
        JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
    it('reserved dns', function (done) {
      var test = {
        username: 'access',
        status: 200,
        desc: 'reserved dns',
        JSchema: schemas.checkUID,
        JValues: { reserved: true, reason: 'RESERVED_USER_NAME' }
      };
      request.get(server.url + getPath(test.username)).end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
    });
  });
  describe('DELETE /users/:username', () => {
    let defaultQuery;
    beforeEach(() => {
      defaultQuery = {
        dryRun: true,
        onlyReg: true
      };
    });
    const systemRoleKey = defaultAuth;
    beforeEach((done) => {
      const userInfos = {
        username: 'jsmith',
        password: 'foobar',
        email: 'jsmith@test.com'
      };
      // FLOW Ignore the missing attributes in the user attr hash.
      db.setServerAndInfos(
        'jsmith',
        'server.name.at.tld',
        userInfos,
        ['email'],
        done
      );
    });
    it('requires the system role', async () => {
      try {
        await request
          .delete(resourcePath('jsmith'))
          .query(defaultQuery)
          .set('Authorization', 'SomethingElse');
      } catch (err) {
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
        await request
          .delete(resourcePath('jsmith'))
          .query(query)
          .set('Authorization', systemRoleKey);
      } catch (err) {
        return;
      }
      assert.fail('If onlyReg=true is missing, the method should error out.');
    });
    it('fails if the user doesnt exist', async () => {
      try {
        await request
          .delete(resourcePath('somebodyelse'))
          .query(defaultQuery)
          .set('Authorization', systemRoleKey);
      } catch (err) {
        assert.strictEqual(err.status, 404);
        return;
      }
      assert.fail('Request should fail.');
    });
    it("checks, but doesn't delete if dryRun=true is given", async () => {
      const res = await request
        .delete(resourcePath('jsmith'))
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
      const res = await request
        .delete(resourcePath('jsmith'))
        .query(query)
        .set('Authorization', systemRoleKey);
      assert.isTrue(res.ok);
      assert.strictEqual(res.status, 200);
      const body = res.body;
      assert.isFalse(body.result.dryRun);
      assert.isTrue(body.result.deleted);
      const exists = await bluebird.fromCallback((cb) =>
        db.uidExists('jsmith', cb)
      );
      assert.isFalse(exists);
    });
  });
  function resourcePath(username) {
    return `${server.url}/users/${username}`;
  }
  describe('POST /users/validate', function () {
    const path = '/users/validate';
    it('When system auth fails', async () => {
      const userTestData = _.extend({}, defaults());
      const testData = {
        username: userTestData.username,
        email: userTestData.email,
        invitationToken: userTestData.invitationtoken
      };
      try {
        await request.post(server.url + path).send(testData);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.status, 401);
      }
    });
    describe('When not valid input is provided', () => {
      describe('When invitation token is required', () => {
        let defaultConfigInvitationTokens;
        before(function () {
          defaultConfigInvitationTokens = config.get('invitationTokens');
          config.set('invitationTokens', ['first', 'second', 'third']);
        });
        after(function () {
          config.set('invitationTokens', defaultConfigInvitationTokens);
        });
        it('Should successfully validate username, email and invitation token and reserve the unique values', async () => {
          const userTestData = _.extend({}, defaults());
          const randomFieldValue = randomuser();
          const testData = {
            username: userTestData.username,
            invitationToken: 'first',
            uniqueFields: {
              email: userTestData.email,
              RandomField: randomFieldValue
            },
            core: 'testing_core1'
          };
          try {
            const res = await request
              .post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.equal(res.status, 200);
            assert.equal(res.body.reservation, true);
          } catch (err) {
            false.equal(true);
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
        it('Should successfully validate ONLY username and invitation token when email is not provided', async () => {
          const userTestData = _.extend({}, defaults(true));
          const randomFieldValue = randomuser();
          const testData = {
            username: userTestData.username,
            invitationToken: 'first',
            uniqueFields: {
              RandomField: randomFieldValue
            },
            core: 'testing_core1'
          };
          const res = await request
            .post(server.url + path)
            .send(testData)
            .set('Authorization', defaultAuth);
          assert.equal(res.status, 200);
          assert.equal(res.body.reservation, true);
          // check the reservation in the database
          const storedReservation = await db.getReservations({
            email: userTestData.email,
            username: userTestData.username,
            RandomField: randomFieldValue
          });
          assert.equal(storedReservation.length, 2);
          assert.equal(storedReservation[0].core, testData.core);
          assert.exists(storedReservation[0].time);
          assert.equal(storedReservation[1].core, testData.core);
          assert.exists(storedReservation[1].time);
        });
        it('Should fail when invitation token is not provided', async () => {
          const testData = {
            username: 'wactiv',
            uniqueFields: {
              email: 'wactiv@pryv.io'
            }
          };
          try {
            await request
              .post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.isTrue(false);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(
              e.response.body.error.id,
              ErrorIds.InvalidInvitationToken
            );
            assert.include(e.response.body.error.data, {});
          }
        });
        it('Should fail when invitation token is ok, but username, email are not unique', async () => {
          const testData = {
            username: 'wactiv',
            invitationToken: 'second',
            uniqueFields: {
              email: 'wactiv@pryv.io'
            }
          };
          try {
            await request
              .post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.isTrue(false);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(
              e.response.body.error.id,
              ErrorIds.ItemAlreadyExists
            );
            assert.include(e.response.body.error.data, {
              username: testData.username,
              email: testData.uniqueFields.email
            });
          }
        });
        it('Should not check email and username if invitation token validation fails', async () => {
          const testData = {
            username: 'wactiv',
            email: 'wactiv@pryv.io',
            invitationToken: 'abc'
          };
          try {
            await request
              .post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            assert.isTrue(false);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(
              e.response.body.error.id,
              ErrorIds.InvalidInvitationToken
            );
            assert.include(e.response.body.error.data, {});
          }
        });
        it('Should fail when additional unique field is not unique', async () => {
          const userTestData = _.extend({}, defaults(true));
          const randomFieldValue = randomuser();
          const testData = {
            username: userTestData.username,
            invitationToken: 'first',
            uniqueFields: {
              email: userTestData.email,
              RandomField: randomFieldValue
            },
            core: 'testing_core1'
          };
          try {
            let userRegistrationData = {
              user: _.extend({}, defaults(true), {
                RandomField: randomFieldValue
              }),
              unique: ['email', 'RandomField'],
              host: { name: 'some-host' }
            };
            const userRegistrationRes = await request
              .post(server.url + '/users')
              .set('Authorization', defaultAuth)
              .send(userRegistrationData);
            // make sure registration was successful
            assert.equal(userRegistrationRes.status, 201);
            // call validation api and check that RandomField is already existing
            await request
              .post(server.url + path)
              .send(testData)
              .set('Authorization', defaultAuth);
            false.equal(true);
          } catch (err) {
            assert.equal(err.response.status, 400);
            assert.equal(err.response.body.reservation, false);
            assert.include(
              err.response.body.error.id,
              ErrorIds.ItemAlreadyExists
            );
            assert.include(err.response.body.error.data, {
              RandomField: randomFieldValue
            });
          }
        });
      });
    });
    describe('Reservation', () => {
      it('Success when reservation is made from the same server in 10 minutes', async () => {
        const userTestData = _.extend({}, defaults());
        const testData = {
          username: userTestData.username,
          invitationtoken: userTestData.invitationtoken,
          uniqueFields: {
            email: userTestData.email
          },
          core: 'testing_core2'
        };
        const res1 = await request
          .post(server.url + path)
          .send(testData)
          .set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);
        const res2 = await request
          .post(server.url + path)
          .send(testData)
          .set('Authorization', defaultAuth);
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
              username: userTestData.username
            },
            core: 'core2'
          };
          await db.setReservations(
            {
              username: userTestData.username,
              email: userTestData.email
            },
            'core_new',
            Date.now() - 11 * 60 * 1000
          );
          const res2 = await request
            .post(server.url + path)
            .send(testData)
            .set('Authorization', defaultAuth);
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
          };
          await db.setReservations(
            {
              username: userTestData.username
            },
            'core_new',
            Date.now() - 11 * 60 * 1000
          );
          const res = await request
            .post(server.url + path)
            .send(testData)
            .set('Authorization', defaultAuth);
          assert.equal(res.status, 200);
          assert.equal(res.body.reservation, true);
        } catch (error) {
          assert.isTrue(false);
        }
      });
      it('Reservation for email fails when done from different core in 10 minutes', async () => {
        const userTestData1 = _.extend({}, defaults());
        const userTestData2 = _.extend({}, defaults());
        const testData1 = {
          username: userTestData1.username,
          invitationtoken: userTestData1.invitationtoken,
          uniqueFields: {
            email: userTestData1.email
          },
          core: 'testing_core3'
        };
        const testData2 = _.extend({}, testData1, {
          core: 'testing_core_not_3',
          uniqueFields: {
            email: userTestData2.email
          }
        });
        const res1 = await request
          .post(server.url + path)
          .send(testData1)
          .set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);
        try {
          const res2 = await request
            .post(server.url + path)
            .send(testData2)
            .set('Authorization', defaultAuth);
          assert.isNull(res2);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.equal(e.response.body.reservation, false);
        }
      });
      it('Reservation for additional field fails when done from different core in 10 minutes', async () => {
        const userTestData1 = _.extend({}, defaults());
        const userTestData2 = _.extend({}, defaults());
        const randomFieldValue = randomuser();
        const testData1 = {
          username: userTestData1.username,
          invitationtoken: userTestData1.invitationtoken,
          uniqueFields: {
            email: userTestData1.email,
            RandomField: randomFieldValue
          },
          core: 'testing_core4'
        };
        const testData2 = _.extend({}, testData1, {
          core: 'testing_core_not_4',
          username: userTestData2.username,
          uniqueFields: {
            email: userTestData2.email,
            RandomField: randomFieldValue
          }
        });
        try {
          const res1 = await request
            .post(server.url + path)
            .send(testData1)
            .set('Authorization', defaultAuth);
          assert.equal(res1.status, 200);
          assert.equal(res1.body.reservation, true);
        } catch (e) {
          assert.equal(false, true);
        }
        try {
          const res2 = await request
            .post(server.url + path)
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
            email: userTestData.email
          },
          core: 'testing_core3'
        };
        const testData2 = _.extend({}, testData, {
          core: 'testing_core_not_3'
        });
        const res1 = await request
          .post(server.url + path)
          .send(testData)
          .set('Authorization', defaultAuth);
        assert.equal(res1.status, 200);
        assert.equal(res1.body.reservation, true);
        try {
          const res2 = await request
            .post(server.url + path)
            .send(testData2)
            .set('Authorization', defaultAuth);
          assert.isNull(res2);
        } catch (e) {
          assert.equal(e.status, 400);
          assert.equal(e.response.body.reservation, false);
        }
      });
    });
  });
  describe('POST /users', function () {
    const path = '/users';
    it('Should fail with 401 when system auth is not provided', async () => {
      const randomFieldValue = randomuser();
      let userRegistrationData = {
        user: _.extend({}, defaults(), { RandomField: randomFieldValue }),
        unique: ['email', 'RandomField'],
        host: { name: 'some-host' }
      };
      try {
        await request.post(server.url + path).send(userRegistrationData);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.status, 401);
      }
    });
    describe('When valid input with additional properties is provided', async () => {
      const randomFieldValue = randomuser();
      let userRegistrationData = {
        user: _.extend({}, defaults(true), { RandomField: randomFieldValue }),
        unique: ['email', 'RandomField'],
        host: { name: 'some-host' }
      };
      it('Response should return status 201', async () => {
        const userRegistrationRes = await request
          .post(server.url + path)
          .set('Authorization', defaultAuth)
          .send(userRegistrationData);
        assert.equal(userRegistrationRes.status, 201);
        assert.equal(
          userRegistrationRes.body.username,
          userRegistrationData.user.username
        );
        assert.equal(
          userRegistrationRes.body.server,
          userRegistrationData.user.username + '.rec.la'
        );
        assert.equal(
          userRegistrationRes.body.apiEndpoint,
          'https://' + userRegistrationData.user.username + '.pryv.me/'
        );
      });
      it('Should save all provided fields in <username>:users', async () => {
        const user = await bluebird.fromCallback((cb) =>
          db.getSet(`${userRegistrationData.user.username}:users`, cb)
        );
        assert.exists(user.registeredTimestamp);
        delete user.registeredTimestamp;
        // compatibility with old implemnetation
        userRegistrationData.user.appid = userRegistrationData.user.appId;
        delete userRegistrationData.user.appId;
        assert.deepEqual(user, userRegistrationData.user);
      });
      it('Should save unique fields in redis database', async () => {
        const usernameUnique = await db.isFieldUnique(
          'users',
          userRegistrationData.user.username
        );
        const emailUnique = await db.isFieldUnique(
          'email',
          userRegistrationData.user.email
        );
        const randomFieldUnique = await db.isFieldUnique(
          'RandomField',
          userRegistrationData.user.RandomField
        );
        assert.equal(usernameUnique, false);
        assert.equal(emailUnique, false);
        assert.equal(randomFieldUnique, false);
      });
    });
    it('Registration should be successful even when email is not provided', async () => {
      const randomFieldValue = randomuser();
      let userData = _.extend({}, defaults(), {
        RandomField: randomFieldValue
      });
      delete userData.email;
      let userRegistrationData = {
        user: userData,
        unique: ['RandomField'],
        host: { name: 'some-host' }
      };
      try {
        const res = await request
          .post(server.url + path)
          .send(userRegistrationData)
          .set('Authorization', defaultAuth);
        assert.equal(res.status, 201);
        assert.equal(res.body.username, userRegistrationData.user.username);
        assert.equal(
          res.body.server,
          userRegistrationData.user.username + '.rec.la'
        );
        assert.equal(
          res.body.apiEndpoint,
          'https://' + userRegistrationData.user.username + '.pryv.me/'
        );
      } catch (e) {
        assert.isTrue(false);
      }
    });
    describe('When invitation token is required', async () => {
      let defaultConfigInvitationTokens;
      before(function () {
        defaultConfigInvitationTokens = config.get('invitationTokens');
        config.set('invitationTokens', ['first']);
      });
      after(function () {
        config.set('invitationTokens', defaultConfigInvitationTokens);
      });
      it('Should succeed if invitation token is valid', async () => {
        let userData = _.extend({}, defaults(true), {
          invitationToken: 'first'
        });
        let userRegistrationData = {
          user: userData,
          unique: [],
          host: { name: 'some-host' }
        };
        const res = await request
          .post(server.url + path)
          .send(userRegistrationData)
          .set('Authorization', defaultAuth);
        assert.equal(res.status, 201);
        assert.equal(res.body.username, userRegistrationData.user.username);
        assert.equal(
          res.body.server,
          userRegistrationData.user.username + '.rec.la'
        );
        assert.equal(
          res.body.apiEndpoint,
          'https://' + userRegistrationData.user.username + '.pryv.me/'
        );
      });
      it('Should fails if invitation token is invalid', async () => {
        let userData = _.extend({}, defaults(), { invitationtoken: 'random' });
        let userRegistrationData = {
          user: userData,
          unique: [],
          host: { name: 'some-host' }
        };
        try {
          await request
            .post(server.url + path)
            .send(userRegistrationData)
            .set('Authorization', defaultAuth);
          assert.isTrue(false);
        } catch (e) {
          assert.equal(e.status, 404);
        }
      });
    });
  });
  describe('PUT /users', function () {
    const path = '/users';
    it('Should fail when system auth is invalid', async () => {
      let userRegistrationData = {
        user: defaults(),
        unique: ['email'],
        host: { name: 'some-host' }
      };
      try {
        await request.post(server.url + path).send(userRegistrationData);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.status, 401);
      }
    });
    describe('When fields for update are provided', async () => {
      describe('When valid input is provided', async () => {
        describe('When unique field has property “creation” set to false', async () => {
          describe('When active fields value is changed', async () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              userDataUpdate = defaultsForSystemDataUpdate();
              userDataUpdate.username = userRegistrationData1.user.username;
              // seed initial user
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              // The update that we will validate
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate);
            });
            it('[DAE0] Response is successful when all fields are unique', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('[AB25] Succeed updating username:users information', async () => {
              const userInfo = await bluebird.fromCallback((cb) =>
                db.getSet(`${userRegistrationData1.user.username}:users`, cb)
              );
              assert.equal(
                userDataUpdate.user.email[0].value,
                userInfo['email']
              );
              assert.equal(
                userDataUpdate.user.RandomField[0].value,
                userInfo['RandomField']
              );
            });
            it('[0C63] Old unique fields are deleted', async () => {
              const oldEmail = await bluebird.fromCallback((cb) =>
                db.get(`${userRegistrationData1.user.email}:email`, cb)
              );
              const uniqueEmail = await bluebird.fromCallback((cb) =>
                db.get(`${userDataUpdate.user.email[0].value}:email`, cb)
              );
              const oldRandomField = await bluebird.fromCallback((cb) =>
                db.get(
                  `${userRegistrationData1.user.RandomField}:RandomField`,
                  cb
                )
              );
              const uniqueRandomField = await bluebird.fromCallback((cb) =>
                db.get(
                  `${userDataUpdate.user.RandomField[0].value}:RandomField`,
                  cb
                )
              );
              assert.equal(oldEmail, null);
              assert.equal(oldRandomField, null);
              assert.equal(uniqueEmail, userDataUpdate.username);
              assert.equal(uniqueRandomField, userDataUpdate.username);
            });
          });
          describe('When inactive field value is change', async () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate1;
            let userDataUpdate2;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              // create inactive record
              userDataUpdate1 = {
                username: userRegistrationData1.user.username,
                user: {
                  email: [
                    {
                      value: userRegistrationData1.user.email,
                      isUnique: true,
                      isActive: false,
                      creation: false
                    }
                  ]
                },
                fieldsToDelete: {}
              };
              // seed initial user
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              // just generating inactive field
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate1);
              // verify inactive fields exists before the user data update
              const inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                Object.keys(inactiveData.email).length > 0,
                `before the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME}:email exists`
              );
              // update inactive fields value
              userDataUpdate2 = Object.assign({}, userDataUpdate1);
              userDataUpdate2.user.email[0].value = faker.lorem
                .word()
                .toLowerCase();
              // The update that we will validate
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate2);
            });
            it('Response is successful', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('Should update unique fields value', async () => {
              const oldEmail = await bluebird.fromCallback((cb) =>
                db.get(`${userRegistrationData1.user.email}:email`, cb)
              );
              const newEmail = await bluebird.fromCallback((cb) =>
                db.get(`${userDataUpdate2.user.email[0].value}:email`, cb)
              );
              assert.equal(oldEmail, null);
              assert.equal(newEmail, userDataUpdate2.username);
            });
            it('Inactive field should be updated', async () => {
              const inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                Object.keys(inactiveData).length === 1,
                `after the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} exists`
              );
              assert.equal(
                inactiveData.email[0],
                userDataUpdate2.user.email[0].value
              );
            });
          });
          describe('When active field is changed to inactive', async () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              userDataUpdate = {
                username: userRegistrationData1.user.username,
                user: {
                  email: [
                    {
                      value: userRegistrationData1.user.email,
                      isUnique: true,
                      isActive: false,
                      creation: false
                    }
                  ]
                },
                fieldsToDelete: {}
              };
              // seed initial user
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              // verify inactive fields exists before the user data update
              const inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                Object.keys(inactiveData).length === 0,
                `before the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} is empty`
              );
              // The update that we will validate
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate);
            });
            it('Response is successful when all fields are unique', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('Unique record still exists', async () => {
              const uniqueEailRecord = await bluebird.fromCallback((cb) =>
                db.get(`${userRegistrationData1.user.email}:email`, cb)
              );
              assert.equal(
                uniqueEailRecord,
                userRegistrationData1.user.username
              );
            });
            it('Not active unique field should be created', async () => {
              const inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                Object.keys(inactiveData.email).length > 0,
                `after the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} exists`
              );
              assert.equal(
                inactiveData.email[0],
                userRegistrationData1.user.email
              );
            });
          });
          describe('When inactive field is changed to active', async () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate1;
            let userDataUpdate2;
            let inactiveData;
            before(async function () {
              // seed initial user
              userRegistrationData1 = defaultsForSystemRegistration();
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              // create new inactive value
              userDataUpdate1 = {
                username: userRegistrationData1.user.username,
                user: {
                  email: [
                    {
                      value: faker.lorem.word().toLowerCase(),
                      isUnique: true,
                      isActive: false,
                      creation: true
                    }
                  ]
                },
                fieldsToDelete: {}
              };
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate1);
              // verify inactive fields exists before the user data update
              let initialInactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                initialInactiveData.email.includes(
                  userDataUpdate1.user.email[0].value
                ),
                `before the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} exists`
              );
              // update inactive value to active
              userDataUpdate2 = {
                username: userRegistrationData1.user.username,
                user: {
                  email: [
                    {
                      value: userDataUpdate1.user.email[0].value,
                      isUnique: true,
                      isActive: true,
                      creation: false
                    }
                  ]
                },
                fieldsToDelete: {}
              };
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate2);
              inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
            });
            it('Should return successful response', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('Should update username:users information', async () => {
              const userInfo = await bluebird.fromCallback((cb) =>
                db.getSet(`${userRegistrationData1.user.username}:users`, cb)
              );
              assert.equal(
                userDataUpdate2.user.email[0].value,
                userInfo['email']
              );
            });
            it('Should save old value to inactive list', async () => {
              assert.isTrue(
                Object.keys(inactiveData.email).length === 1,
                `after the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} exists`
              );
              assert.equal(
                inactiveData.email[0],
                userRegistrationData1.user.email
              );
            });
            it('New email should be removed from inactive list', async () => {
              assert.isFalse(
                inactiveData.email.includes(userDataUpdate1.user.email[0].value)
              );
            });
          });
        });
        describe('When fields have property “creation” set to true', () => {
          describe('Active and unique user information is updated', () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              userDataUpdate = defaultsForSystemDataUpdate();
              userDataUpdate.username = userRegistrationData1.user.username;
              userDataUpdate.user.email[0].creation = true;
              userDataUpdate.user.RandomField[0].creation = true;
              // seed initial user
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate);
            });
            it('Should return status 200', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('Should update username:users information', async () => {
              const userInfo = await bluebird.fromCallback((cb) =>
                db.getSet(`${userRegistrationData1.user.username}:users`, cb)
              );
              assert.equal(
                userDataUpdate.user.email[0].value,
                userInfo['email']
              );
              assert.equal(
                userDataUpdate.user.RandomField[0].value,
                userInfo['RandomField']
              );
            });
            it('Old unique field should be not modified', async () => {
              const dbEmailValue = await bluebird.fromCallback((cb) =>
                db.get(`${userRegistrationData1.user.email}:email`, cb)
              );
              const dbRandomFieldValue = await bluebird.fromCallback((cb) =>
                db.get(
                  `${userRegistrationData1.user.RandomField}:RandomField`,
                  cb
                )
              );
              assert.equal(userRegistrationData1.user.username, dbEmailValue);
              assert.equal(
                userRegistrationData1.user.username,
                dbRandomFieldValue
              );
            });
            it('New unique field should be created', async () => {
              const uniqueEmail = await bluebird.fromCallback((cb) =>
                db.get(`${userDataUpdate.user.email[0].value}:email`, cb)
              );
              const uniqueRandomField = await bluebird.fromCallback((cb) =>
                db.get(
                  `${userDataUpdate.user.RandomField[0].value}:RandomField`,
                  cb
                )
              );
              assert.equal(uniqueEmail, userDataUpdate.username);
              assert.equal(uniqueRandomField, userDataUpdate.username);
            });
          });
          describe('Not active unique user information is updated', () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              userDataUpdate = {
                username: userRegistrationData1.user.username,
                user: {
                  email: [
                    {
                      value: userRegistrationData1.user.email,
                      isUnique: true,
                      isActive: false,
                      creation: false
                    }
                  ]
                },
                fieldsToDelete: {}
              };
              // seed initial user
              await request
                .post(server.url + path)
                .send(userRegistrationData1)
                .set('Authorization', defaultAuth);
              response = await request
                .put(server.url + path)
                .set('Authorization', defaultAuth)
                .send(userDataUpdate);
            });
            it('Should return status 200', async () => {
              assert.equal(response.status, 200);
              assert.equal(response.body.user, true);
            });
            it('Should NOT update username:users information', async () => {
              const userInfo = await bluebird.fromCallback((cb) =>
                db.getSet(`${userRegistrationData1.user.username}:users`, cb)
              );
              assert.equal(userRegistrationData1.user.email, userInfo['email']);
            });
            it('Old unique field should be not modified', async () => {
              const oldEmailValueExists = await bluebird.fromCallback((cb) =>
                db.get(`${userRegistrationData1.user.email}:email`, cb)
              );
              assert.equal(
                userRegistrationData1.user.username,
                oldEmailValueExists
              );
            });
            it('Active unique field should become inactive unique field', async () => {
              const inactiveData = await db.getAllInactiveData(
                userRegistrationData1.user.username
              );
              assert.isTrue(
                Object.keys(inactiveData).length > 0,
                `before the tests, ${userRegistrationData1.user.username}:${db.INACTIVE_FOLDER_NAME} exists`
              );
              assert.deepEqual(inactiveData.email, [
                userRegistrationData1.user.email
              ]);
            });
          });
        });
      });
      describe('When not valid input is provided', async () => {
        it('[AFD5] Should fail if email is not unique', async () => {
          let userDataUpdate = defaultsForSystemDataUpdate();
          let userRegistrationData1 = defaultsForSystemRegistration();
          userRegistrationData1.user.username = userDataUpdate.username;
          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.email = userDataUpdate.user.email[0].value;
          try {
            // seed initial user
            await request
              .post(server.url + path)
              .send(userRegistrationData1)
              .set('Authorization', defaultAuth);
            // seed the user that will have the same email and random field
            await request
              .post(server.url + path)
              .send(userRegistrationData2)
              .set('Authorization', defaultAuth);
            await request
              .put(server.url + path)
              .set('Authorization', defaultAuth)
              .send(userDataUpdate);
            assert.equal(false, true);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(
              e.response.body.error.id,
              ErrorIds.ItemAlreadyExists
            );
            assert.include(e.response.body.error.data, {
              email: userRegistrationData2.user.email
            });
            assert.equal(e.response.body.user, false);
          }
        });
        it('[E987] Should fail if additional field is not unique', async () => {
          let userDataUpdate = defaultsForSystemDataUpdate();
          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.RandomField =
            userDataUpdate.user.RandomField[0].value;
          let userRegistrationData3 = defaultsForSystemRegistration();
          userRegistrationData3.user.username = userDataUpdate.username;
          try {
            // seed initial user
            await request
              .post(server.url + path)
              .send(userRegistrationData3)
              .set('Authorization', defaultAuth);
            // seed the user that will have the same email and random field
            await request
              .post(server.url + path)
              .send(userRegistrationData2)
              .set('Authorization', defaultAuth);
            await request
              .put(server.url + path)
              .set('Authorization', defaultAuth)
              .send(userDataUpdate);
            assert.equal(false, true);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.equal(e.response.body.user, false);
            assert.include(
              e.response.body.error.id,
              ErrorIds.ItemAlreadyExists
            );
            assert.include(e.response.body.error.data, {
              RandomField: userDataUpdate.user.RandomField[0].value
            });
            assert.equal(e.response.body.user, false);
          }
        });
        it('[7740] Should fail with nested error if several fields are not unique', async () => {
          let userDataUpdate = defaultsForSystemDataUpdate();
          let userRegistrationData2 = defaultsForSystemRegistration();
          userRegistrationData2.user.email = userDataUpdate.user.email[0].value;
          userRegistrationData2.user.RandomField =
            userDataUpdate.user.RandomField[0].value;
          try {
            let userRegistrationData3 = defaultsForSystemRegistration();
            userRegistrationData3.user.username = userDataUpdate.username;
            // seed initial user
            await request
              .post(server.url + path)
              .send(userRegistrationData3)
              .set('Authorization', defaultAuth);
            // seed the user that will have the same email and random field
            await request
              .post(server.url + path)
              .send(userRegistrationData2)
              .set('Authorization', defaultAuth);
            await request
              .put(server.url + path)
              .set('Authorization', defaultAuth)
              .send(userDataUpdate);
            assert.equal(false, true);
          } catch (e) {
            assert.equal(e.status, 400);
            assert.include(
              e.response.body.error.id,
              ErrorIds.ItemAlreadyExists
            );
            assert.include(e.response.body.error.data, {
              email: userRegistrationData2.user.email,
              RandomField: userRegistrationData2.user.RandomField
            });
            assert.equal(e.response.body.user, false);
          }
        });
      });
      describe('When field "fieldsToDelete" are provided', async () => {
        describe('When valid input is provided', async () => {
          let response;
          let userRegistrationData1;
          let userDataUpdate;
          before(async function () {
            userRegistrationData1 = defaultsForSystemRegistration();
            userDataUpdate = {
              username: userRegistrationData1.user.username,
              user: {},
              fieldsToDelete: {
                email: userRegistrationData1.user.email,
                RandomField: userRegistrationData1.user.RandomField
              }
            };
            // seed initial user
            await request
              .post(server.url + path)
              .send(userRegistrationData1)
              .set('Authorization', defaultAuth);
            response = await request
              .put(server.url + path)
              .set('Authorization', defaultAuth)
              .send(userDataUpdate);
          });
          it('[DAE0] Response should be successful when all fields are unique', async () => {
            assert.equal(response.status, 200);
            assert.equal(response.body.user, true);
          });
          it('[AB25] Information in username:users should not changed', async () => {
            const userInfo = await bluebird.fromCallback((cb) =>
              db.getSet(`${userRegistrationData1.user.username}:users`, cb)
            );
            assert.equal(userRegistrationData1.user.email, userInfo['email']);
            assert.equal(
              userRegistrationData1.user.RandomField,
              userInfo['RandomField']
            );
          });
          it('[0C62] Should succeed deleting unique fields information', async () => {
            const uniqueEmailField = await bluebird.fromCallback((cb) =>
              db.get(`${userRegistrationData1.user.email}:email`, cb)
            );
            const uniqueRandomField = await bluebird.fromCallback((cb) =>
              db.get(
                `${userRegistrationData1.user.RandomField}:RandomField`,
                cb
              )
            );
            assert.equal(uniqueEmailField, null);
            assert.equal(uniqueRandomField, null);
          });
        });
        describe('When not valid input is provided', async () => {
          describe('[UU2U] When username is provided for the deletion', async () => {
            let response;
            let userRegistrationData1;
            let userDataUpdate;
            before(async function () {
              userRegistrationData1 = defaultsForSystemRegistration();
              userDataUpdate = {
                username: userRegistrationData1.user.username,
                user: {},
                fieldsToDelete: {
                  username: userRegistrationData1.user.username
                }
              };
              // seed initial user
              try {
                await request
                  .post(server.url + path)
                  .send(userRegistrationData1)
                  .set('Authorization', defaultAuth);
                response = await request
                  .put(server.url + path)
                  .set('Authorization', defaultAuth)
                  .send(userDataUpdate);
              } catch (err) {
                response = err.response;
              }
            });
            it('Should fail with 400 status', async () => {
              assert.equal(response.status, 400);
              // no data was updated
              assert.equal(response.body.user, null);
            });
            it('Information in username:users should not be changed', async () => {
              const userInfo = await bluebird.fromCallback((cb) =>
                db.getSet(`${userRegistrationData1.user.username}:users`, cb)
              );
              assert.equal(userRegistrationData1.user.email, userInfo['email']);
            });
          });
        });
      });
    });
  });
});
