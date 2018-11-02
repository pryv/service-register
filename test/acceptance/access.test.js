'use strict';

/* global describe, it, before, after */
const server = require('../../source/server');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');
const request = require('superagent');
const config = require('../../source/utils/config');

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
    var test = { invitationtoken: 'facebook', status: 200, value: 'false', restype:'text/plain' };
    request.post(server.url + path).send(test).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

  it('valid', function (done) {
    var test = { invitationtoken: 'enjoy', status: 200, value: 'true', restype:'text/plain' };
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
});