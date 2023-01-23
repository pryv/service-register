'use strict';

/* global describe, it, before, beforeEach, after */
const Server = require('../../src/server.js');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');
const request = require('superagent');
const config = require('../../src/config');
const assert = require('chai').assert;
const faker = require('faker');
faker.locale = 'en';

require('readyness/wait/mocha');

describe('POST /access/invitationtoken/check', function () {
  let defaultConfigInvitationTokens;
  let server;

  before(async function () {
    server = new Server();
    await server.start();

    defaultConfigInvitationTokens = config.get('invitationTokens');
    config.set('invitationTokens', ['enjoy']);
  });

  after(async function () {
    config.set('invitationTokens', defaultConfigInvitationTokens);
    await server.stop();
  });

  var path = '/access/invitationtoken/check/';

  it('invalid', function (done) {
    var test = {
      invitationtoken: 'facebook',
      status: 200,
      value: 'false',
      restype: 'text/plain; charset=utf-8'
    };
    request
      .post(server.url + path)
      .send(test)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });

  it('valid', function (done) {
    var test = {
      invitationtoken: 'enjoy',
      status: 200,
      value: 'true',
      restype: 'text/plain; charset=utf-8'
    };
    request
      .post(server.url + path)
      .send(test)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
});

describe('POST /access/:key', function () {
  const path = '/access';
  let server;
  let accessState;

  before(async function () {
    server = new Server();
    await server.start();
  });

  beforeEach(async function () {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: 'something',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    const res = await request.post(server.url + path).send(test.data);
    const generatedUrl = res.body.poll;

    const ending = /\/access\/\w+$/;
    generatedUrl.should.match(ending);
    accessState = res.body;
    accessState.status.should.equal('NEED_SIGNIN');

    dataValidation.jsonResponse(null, res, test, () => {});
  });

  after(async function () {
    await server.stop();
  });

  describe('when updating status to Accepted', function () {
    describe('with username and token', function () {
      it('should return apiEndpoint, username & token', async function () {
        const data = {
          status: 'ACCEPTED',
          username: 'tototp',
          token: 'token'
        };

        const res = await request.post(accessState.poll).send(data);
        'https://token@tototp.pryv.me/'.should.equal(res.body.apiEndpoint);
        data.username.should.equal(res.body.username);
        data.token.should.equal(res.body.token);
      });
    });

    describe('with apiEndpoint, username and token', function () {
      it('should return apiEndpoint, username & token', async function () {
        const data = {
          status: 'ACCEPTED',
          apiEndpoint: 'https://token@tototp.pryv.me/',
          username: 'tototp',
          token: 'token'
        };
        const res = await request.post(accessState.poll).send(data);

        'https://token@tototp.pryv.me/'.should.equal(res.body.apiEndpoint);
        'tototp'.should.equal(res.body.username);
        'token'.should.equal(res.body.token);
      });
    });
  });
});

describe('POST /access', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  const path = '/access';

  it('valid', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: 'something',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        const generatedUrl = res.body.poll;

        // Verify that the string has something like this:
        //    /access/DiM1efAaZmTi0WbH
        const ending = /\/access\/\w+$/;
        generatedUrl.should.match(ending);
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
  it('invalid', function (done) {
    var test = {
      url: '/access',
      method: 'POST',
      data: {
        requestingAppId: 'a',
        languageCode: 'en',
        returnURL: 'http://BlipBlop.com',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
  it('invalid language', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'abcdef',
        returnURL: false,
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error,
      JValues: { id: 'INVALID_LANGUAGE' }
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
  it('returnURL should accept a null', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: null,
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
  it('returnURL should accept `false`', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: false,
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
  it('returnURL should not accept a value which acts like false', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: 0,
        requestedPermissions: [{ some: 'json', data: 'to request access' }]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error,
      JValues: { id: 'INVALID_DATA', detail: 'Invalid returnURL field.' }
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });

  it('should validate an access without custom auth URL', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.internet.domainWord(),
            level: 'contribute',
            defaultName: faker.internet.domainWord()
          }
        ]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        assert.isNull(err);
        dataValidation.jsonResponse(err, res, test, done);
      });
  });

  it('should validate an access with a trusted custom auth URL', function (done) {
    const trustedAuthUrls = config.get('access:trustedAuthUrls');
    assert.isArray(trustedAuthUrls);
    const authUrl =
      trustedAuthUrls[
        Math.floor(Math.random() * Math.floor(trustedAuthUrls.length))
      ];

    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.internet.domainWord(),
            level: 'contribute',
            defaultName: faker.internet.domainWord()
          }
        ],
        authUrl: authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        assert.isNull(err);
        assert.isNotNull(res);
        assert.isNotNull(res.body);
        assert.isNotNull(res.body.url);
        res.body.url.should.startWith(test.data.authUrl);
        dataValidation.jsonResponse(err, res, test, done);
      });
  });

  it('should validate an access with a trusted custom auth URL with parameters', function (done) {
    const trustedAuthUrls = config.get('access:trustedAuthUrls');
    assert.isArray(trustedAuthUrls);
    const fakeParamName = faker.internet.domainWord();
    const fakeParamValue = faker.internet.domainWord();
    const authUrl =
      trustedAuthUrls[Math.floor(Math.random() * trustedAuthUrls.length)] +
      '?' +
      fakeParamName +
      '=' +
      fakeParamValue;

    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.internet.domainWord(),
            level: 'contribute',
            defaultName: faker.internet.domainWord()
          }
        ],
        authUrl: authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        assert.isNull(err);
        assert.isNotNull(res);
        assert.isNotNull(res.body);
        assert.isNotNull(res.body.url);
        res.body.url.should.startWith(test.data.authUrl);

        const nbQuestionMark = (res.body.url.match(/\?/g) || []).length;
        assert.strictEqual(nbQuestionMark, 1);

        dataValidation.jsonResponse(err, res, test, done);
      });
  });

  it('should not validate an access with an unstrusted custom auth URL', function (done) {
    const authUrl = faker.internet.url();
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.internet.domainWord(),
            level: 'contribute',
            defaultName: faker.internet.domainWord()
          }
        ],
        authUrl: authUrl
      }
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        assert.isNotNull(err);
        assert.isNotNull(err.status);
        assert.isNotNull(err.response);
        assert.isNotNull(err.response.body);
        assert.isNotNull(err.response.body.id);
        assert.isNotNull(err.response.body.detail);
        err.status.should.eql(400);
        err.response.body.id.should.eql('UNTRUSTED_AUTH_URL');
        err.response.body.detail.should.containEql(test.data.authUrl);

        done();
      });
  });

  it('should not validate an access with an invalid custom auth URL', function (done) {
    const authUrl = faker.random.number(); // Really invalid url...
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.internet.domainWord(),
            level: 'contribute',
            defaultName: faker.internet.domainWord()
          }
        ],
        authUrl: authUrl
      }
    };

    request
      .post(server.url + path)
      .send(test.data)
      .end(function (err, res) {
        assert.isNotNull(err);
        assert.isNotNull(err.status);
        assert.isNotNull(err.response);
        assert.isNotNull(err.response.body);
        assert.isNotNull(err.response.body.id);
        assert.isNotNull(err.response.body.detail);
        err.status.should.eql(400);
        err.response.body.id.should.eql('INVALID_AUTH_URL');
        err.response.body.detail.should.containEql(test.data.authUrl);

        done();
      });
  });

  describe('serviceInfo', function () {
    it('should accept a valid one', async function () {
      const serviceInfo = { name: 'Test' };
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        serviceInfo: serviceInfo
      };

      const res = await request.post(server.url + path).send(payload);
      assert.equal(res.status, 201);
      const body = res.body;
      assert.isNotNull(body);
      assert.equal(body.serviceInfo.name, serviceInfo.name);
    });
    it('should refuse an invalid one', async function () {
      const serviceInfo = { boby: 'Bob' };
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        serviceInfo: serviceInfo
      };
      try {
        await request.post(server.url + path).send(payload);
      } catch (e) {
        assert.equal(e.response.status, 400);
        assert.equal(e.response.body.id, 'INVALID_SERVICE_INFO_URL');
        assert.include(e.response.body.detail, serviceInfo);
      }
    });
  });

  describe('expireAfter', function () {
    it('should accept a valid value', async function () {
      const expireAfter = 53453463243425;
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        expireAfter: expireAfter
      };

      const res = await request.post(server.url + path).send(payload);
      assert.equal(res.status, 201);
      const body = res.body;
      assert.isNotNull(body);
      assert.equal(body.expireAfter, expireAfter);
    });
    it('should refuse an invalid value', async function () {
      const expireAfter = 'invalid_value';
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        expireAfter: expireAfter
      };

      try {
        await request.post(server.url + path).send(payload);
        throw new Error('request should never succeed');
      } catch (e) {
        assert.equal(e.response.status, 400);
        assert.equal(e.response.body.id, 'INVALID_EXPIRE_AFTER');
        assert.include(e.response.body.detail, expireAfter);
      }
    });
  });

  describe('deviceName', function () {
    it('should accept a valid value', async function () {
      const deviceName = 'some_name';
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        deviceName: deviceName
      };

      const res = await request.post(server.url + path).send(payload);
      assert.equal(res.status, 201);
      const body = res.body;
      assert.isNotNull(body);
      assert.equal(body.deviceName, deviceName);
    });
    it('should refuse an invalid value', async function () {
      const deviceName = 67;
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        deviceName: deviceName
      };

      try {
        const res = await request.post(server.url + path).send(payload);
        throw new Error('request should never succeed');
      } catch (e) {
        assert.equal(e.response.status, 400);
        assert.equal(e.response.body.id, 'INVALID_DEVICE_NAME');
        assert.include(e.response.body.detail, deviceName);
      }
    });
  });

  describe('referer', function () {
    it('should accept a valid value', async function () {
      const referer = faker.lorem.word();
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        referer: referer
      };

      const res = await request.post(server.url + path).send(payload);
      assert.equal(res.status, 201);
      const body = res.body;
      assert.isNotNull(body);
      assert.equal(body.referer, referer);
    });
    it('should refuse an invalid value', async function () {
      const referer = {};
      const payload = {
        requestingAppId: 'reg-test',
        requestedPermissions: [
          {
            streamId: faker.lorem.word(),
            level: 'contribute',
            defaultName: faker.lorem.word()
          }
        ],
        referer: referer
      };

      try {
        const res = await request.post(server.url + path).send(payload);
        throw new Error('request should never succeed');
      } catch (e) {
        assert.equal(e.response.status, 400);
        assert.equal(e.response.body.id, 'INVALID_REFERER');
        assert.include(e.response.body.detail, referer);
      }
    });
  });
});
