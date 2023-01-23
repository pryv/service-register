/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const request = require('superagent');
const should = require('should');

const chai = require('chai');
const assert = chai.assert;

const config = require('../../src/config');
const Server = require('../../src/server.js');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');

require('readyness/wait/mocha');

const domain = config.get('dns:domain');
const path = '/server';

describe('POST /:uid/server', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  it('too short', function (done) {
    request
      .post(server.url + '/abcd/server')
      .send({})
      .end((err, res) => {
        should.exist(err);

        assert.strictEqual(res.statusType, 4);
        assert.strictEqual(res.body.id, 'INVALID_USER_NAME');
        done();
      });
  });
  it('unknown', function (done) {
    request
      .post(server.url + '/abcdefghijkl/server')
      .send({})
      .end((err, res) => {
        should.exist(err);

        assert.strictEqual(res.statusType, 4);
        assert.strictEqual(res.body.id, 'UNKNOWN_USER_NAME');
        done();
      });
  });
  it('known', function (done) {
    const test = {
      uid: 'wactiv',
      status: 200,
      desc: 'known',
      JSchema: schema.server,
      JValues: { server: domain, alias: 'wactiv.' + domain }
    };

    request
      .post(server.url + '/' + test.uid + path)
      .send({})
      .end(function (err, res) {
        dataValidation.jsonResponse(err, res, test, done);
      });
  });
});

describe('GET /:uid/server', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  it('too short', function (done) {
    request
      .get(server.url + '/abcd/server')
      .redirects(0)
      .end((err, res) => { /* eslint-disable-line n/handle-callback-err */
        assert.equal(res.statusCode, 400, 'Should have status code 400');
        done();
      });
  });
  it('unknown', function (done) {
    request
      .get(server.url + '/abcdefghijkl/server')
      .redirects(0)
      .end((err, res) => { /* eslint-disable-line n/handle-callback-err */
        assert.equal(res.statusCode, 404, 'Should have status code 404');
        done();
      });
  });
  it('known', function (done) {
    request
      .get(server.url + '/wactiv/server')
      .redirects(0)
      .end((err, res) => { /* eslint-disable-line n/handle-callback-err */
        assert.equal(res.statusCode, 302, 'Should have status code 302');
        res.header.location.should.match('https://rec.la/?username=wactiv');
        done();
      });
  });
});
