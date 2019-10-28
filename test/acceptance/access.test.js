'use strict';

/* global describe, it, before, after */
const server = require('../../source/server');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');
const request = require('superagent');
const config = require('../../source/utils/config');
const assert = require('chai').assert;
const faker = require('faker');
faker.locale = 'en';

require('readyness/wait/mocha');

describe('POST /access/invitationtoken/check', function () {

  let defaultConfigInvitationTokens;

  before(function () {
    defaultConfigInvitationTokens = config.get('invitationTokens');
    config.set('invitationTokens', ['enjoy']);
  });

  after(function () {
    config.set('invitationTokens', defaultConfigInvitationTokens);
  });

  var path = '/access/invitationtoken/check/';

  it('invalid', function (done) {
    var test = { invitationtoken: 'facebook', status: 200, value: 'false', restype:'text/plain; charset=utf-8' };
    request.post(server.url + path).send(test).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('valid', function (done) {
    var test = { invitationtoken: 'enjoy', status: 200, value: 'true', restype:'text/plain; charset=utf-8' };
    request.post(server.url + path).send(test).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

});


describe('POST /access', function () {

  const path = '/access';

  it('valid', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test', languageCode: 'en', returnURL: 'something',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{some: 'json', data: 'to request access'}]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
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
        requestingAppId: 'a', languageCode: 'en', returnURL: 'http://BlipBlop.com',
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{some: 'json', data: 'to request access'}]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('invalid language', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test', languageCode: 'abcdef', returnURL: false,
        appAuthorization: 'ABCDEFGHIJKLMNOPQ',
        requestedPermissions: [{some: 'json', data: 'to request access'}]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error,
      JValues: {'id': 'INVALID_LANGUAGE'}
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('returnURL should accept a null', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test', 
        languageCode: 'en', 
        returnURL: null,
        requestedPermissions: [
          { some: 'json', data: 'to request access' }
        ]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('returnURL should accept `false`', function (done) {
  
    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: false,
        requestedPermissions: [
          { some: 'json', data: 'to request access' }
        ]
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('returnURL should not accept a value which acts like false', function (done) {

    const test = {
      data: {
        requestingAppId: 'reg-test',
        languageCode: 'en',
        returnURL: 0,
        requestedPermissions: [
          { some: 'json', data: 'to request access' }
        ]
      },
      contenttype: 'JSON',
      status: 400,
      JSchema: schema.error,
      JValues: { id: 'INVALID_DATA', detail: 'Invalid returnURL field.' },
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('should validate an access without custom auth URL', function (done) {
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [{streamId: faker.internet.domainWord(), level: "contribute", defaultName: faker.internet.domainWord()}],
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      assert.isNull(err);
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('should validate an access with a trusted custom auth URL', function (done) {
    const trustedAuthUrls = config.get('http:trustedAuthUrls');
    assert.isArray(trustedAuthUrls);
    const authUrl = trustedAuthUrls[Math.floor(Math.random() * Math.floor(trustedAuthUrls.length))];

    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [{streamId: faker.internet.domainWord(), level: 'contribute', defaultName: faker.internet.domainWord()}],
        authUrl : authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      assert.isNull(err);
      assert.isNotNull(res);
      assert.isNotNull(res.body);
      assert.isNotNull(res.body.url);
      res.body.url.should.startWith(test.data.authUrl);
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('should validate an access with a trusted custom auth URL with parameters', function (done) {
    const trustedAuthUrls = config.get('http:trustedAuthUrls');
    assert.isArray(trustedAuthUrls);
    const fakeParamName = faker.internet.domainWord();
    const fakeParamValue = faker.internet.domainWord();
    const authUrl = trustedAuthUrls[Math.floor(Math.random() * Math.floor(trustedAuthUrls.length))] + '?'+fakeParamName+'='+fakeParamValue;

    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [{streamId: faker.internet.domainWord(), level: 'contribute', defaultName: faker.internet.domainWord()}],
        authUrl : authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      assert.isNull(err);
      assert.isNotNull(res);
      assert.isNotNull(res.body);
      assert.isNotNull(res.body.url);
      res.body.url.should.startWith(test.data.authUrl);
      
      const nbQuestionMark =(res.body.url.match(/\?/g) || []).length;
      assert.strictEqual(nbQuestionMark, 1);
      
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  
  it('should not validate an access with an unstrusted custom auth URL', function (done) {
    const authUrl = faker.internet.url();
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [{streamId: faker.internet.domainWord(), level: "contribute", defaultName: faker.internet.domainWord()}],
        authUrl : authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      assert.isNotNull(err);
      assert.isNotNull(err.status);
      assert.isNotNull(err.response);
      assert.isNotNull(err.response.body);
      assert.isNotNull(err.response.body.id);
      assert.isNotNull(err.response.body.detail);
      err.status.should.eql(400);
      err.response.body.id.should.eql("UNTRUSTED_AUTH_URL");
      err.response.body.detail.should.include(test.data.authUrl);

      done();
    });
  });
  
  it('should not validate an access with an invalid custom auth URL', function (done) {
    const authUrl = faker.random.number(); // Really invalid url...
    const test = {
      data: {
        requestingAppId: 'reg-test',
        requestedPermissions: [{streamId: faker.internet.domainWord(), level: "contribute", defaultName: faker.internet.domainWord()}],
        authUrl : authUrl
      },
      contenttype: 'JSON',
      status: 201,
      JSchema: schema.accessPOST
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      assert.isNotNull(err);
      assert.isNotNull(err.status);
      assert.isNotNull(err.response);
      assert.isNotNull(err.response.body);
      assert.isNotNull(err.response.body.id);
      assert.isNotNull(err.response.body.detail);
      err.status.should.eql(400);
      err.response.body.id.should.eql("INVALID_AUTH_URL");
      err.response.body.detail.should.include(test.data.authUrl);

      done();
    });
  });
});
