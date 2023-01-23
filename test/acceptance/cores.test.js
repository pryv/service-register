/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const supertest = require('supertest');
const faker = require('faker');
const bluebird = require('bluebird');
const assert = require('chai').assert;

const config = require('../../src/config');
const Server = require('../../src/server.js');
const userStorage = require('../../src/storage/users');
const dataservers = require('../../src/business/dataservers');

require('readyness/wait/mocha');

describe('cores', () => {
  let server, request;

  before(async function () {
    server = new Server();
    await server.start();
    request = supertest(server.server);
  });

  after(async function () {
    await server.stop();
  });

  const path = '/cores';

  describe('GET /', () => {
    let username, email, coreUrl;
    before(async () => {
      username = faker.random.alphaNumeric(10);
      email = faker.internet.email();

      // just take first one
      const hostings = config.get('net:aaservers');
      const firstKey = Object.keys(hostings)[0];
      coreUrl = hostings[firstKey][0].base_url;
      const hostname = coreUrl.split('//')[1];

      // core forwards the "Host" header of the request
      await bluebird.fromCallback((cb) =>
        userStorage.createUserOnServiceRegister(
          { name: hostname },
          { username, email },
          ['username', 'email'],
          cb
        )
      );
    });

    describe('by username', () => {
      it('must return the right core when the account exists', async () => {
        const res = await request.get(path).query({ username });
        assert.equal(res.status, 200);
        const core = res.body.core;
        assert.exists(core);
        assert.equal(core.url, coreUrl);
      });
      it('must return 404 core when the account does not exists', async () => {
        const res = await request.get(path).query({ username: 'doesnt-exist' });
        assert.equal(res.status, 404);
      });
    });

    describe('by email', () => {
      it('must return the right core when the account exists', async () => {
        const res = await request.get(path).query({ email });
        assert.equal(res.status, 200);
        const core = res.body.core;
        assert.exists(core);
        assert.equal(core.url, coreUrl);
      });
      it('must return the first core when the account does not exist', async () => {
        const res = await request
          .get(path)
          .query({ email: 'whatever@mail.com' });
        assert.equal(res.status, 200);
        const core = res.body.core;
        assert.exists(core);
        assert.equal(dataservers.getCoresUrls()[0], core.url);
      });
    });

    it('must return an error when no parameters are provided', async () => {
      const res = await request.get(path);
      assert.equal(res.status, 400);
      const error = res.body;
      assert.exists(error);
      assert.equal(error.id, 'INVALID_PARAMETERS');
    });
    it('must return an error when both are provided', async () => {
      const res = await request
        .get(path)
        .query({ email: 'whatever@mail.com', username: 'hellothere' });
      assert.equal(res.status, 400);
      const error = res.body;
      assert.exists(error);
      assert.equal(error.id, 'INVALID_PARAMETERS');
    });
    it('must return an error when an invalid username is provided', async () => {
      const res = await request.get(path).query({ username: 'abc' });
      assert.equal(res.status, 400);
      const error = res.body;
      assert.exists(error);
      assert.equal(error.id, 'INVALID_USER_NAME');
    });
    it('must return an error when an invalid email is provided', async () => {
      const res = await request.get(path).query({ email: null });
      assert.equal(res.status, 400);
      const error = res.body;
      assert.exists(error);
      assert.equal(error.id, 'INVALID_EMAIL');
    });
  });
});
