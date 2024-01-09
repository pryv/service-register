/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
require('../../src/server');
const config = require('../../src/config');
const Server = require('../../src/server.js');
const validation = require('../support/data-validation');
const schemas = require('../support/schema.responses');
const db = require('../../src/storage/database');
const supertest = require('supertest');
const chai = require('chai');
const assert = chai.assert;

describe('Email', function () {
  // Obtains the server url and specialise supertest to call it.
  let request, server;
  before(async function () {
    server = new Server();
    await server.start();
    request = supertest(server.server);
  });
  after(async function () {
    await server.stop();
  });
  describe('POST /email/check', () => {
    it('when the email is still free and looks good, the form should be good', async () => {
      await free('abcd.efg_ijkl@bobby.com');
    });
    it('does loose verification and errs on the side of false positive', async () => {
      await free('#!$%&’*+-/=?^_`{}|~@example.com');
      await free('no_at_sign_present');
      await free('THISISNOEMAILADDRESS');
    });
    describe('when taken@pryv.com is in the database', () => {
      beforeEach((done) => {
        // FLOW Ignore the missing attributes in the user attr hash.
        db.setServerAndInfos(
          'foobar',
          'somewhere.place.com',
          {
            email: 'taken@pryv.com'
          },
          ['email'],
          done
        );
      });
      it('rejects emails that are already part of the user base', async () => {
        await taken('taken@pryv.com');
      });
    });
    async function taken (email) {
      assert.isFalse(
        await checkEmail(email),
        `Expected ${email} to be taken, but it was not.`
      );
    }
    async function free (email) {
      assert.isTrue(
        await checkEmail(email),
        `Expected ${email} to be free, but it was not.`
      );
    }
    async function checkEmail (email) {
      const res = await request
        .post('/email/check/')
        .send({ email })
        .expect(200);
      if (res.text === 'true') return true;
      if (res.text === 'false') return false;
      throw new Error('Unexpected response from /email/check.');
    }
  });
  describe('GET /:email/check_email', function () {
    it('does not exist', function (done) {
      request
        .get('/abcd.efg_ijkl@bobby.com/check_email')
        .end(function (err, res) { /* eslint-disable-line n/handle-callback-err */
          validation.check(
            res,
            {
              status: 200,
              schema: schemas.checkExists,
              body: { exists: false }
            },
            done
          );
        });
    });
    it('does exist', function (done) {
      request.get('/wactiv@pryv.io/check_email').end(function (err, res) { /* eslint-disable-line n/handle-callback-err */
        validation.check(
          res,
          {
            status: 200,
            schema: schemas.checkExists,
            body: { exists: true }
          },
          done
        );
      });
    });
  });
  describe('GET /:email/username', () => {
    it('throws an error when the call is disabled in config', async () => {
      config.set('routes:disableGetUsernameByEmail', true);
      await getUsername('x'.repeat(10), false, 405);
    });
    it('throws an error when the provided email has invalid format', async () => {
      config.set('routes:disableGetUsernameByEmail', false);
      await getUsername('x'.repeat(301), false, 400);
    });
    it('throws an error when the provided email is not registered', async () => {
      await getUsername('idonotexist@unexisting.com', false, 404);
    });
    describe('when existinguser@pryv.com is in the database', () => {
      const username = 'existinguser';
      const email = username + '@pryv.com';
      beforeEach((done) => {
        // FLOW Ignore the missing attributes in the user attr hash.
        db.setServerAndInfos(
          username,
          'somewhere.place.com',
          {
            email
          },
          ['email'],
          done
        );
      });
      it('returns the username corresponding to the provided email', async () => {
        assert.equal(await getUsername(email, false, 200), username);
      });
      it('is backward-compatible with the old endpoint (/:email/uid)', async () => {
        assert.equal(await getUsername(email, true, 200), username);
      });
    });
    async function getUsername (email, oldEndpoint, expectedStatus) {
      let endpoint = `/${email}/`;
      endpoint += oldEndpoint ? 'uid' : 'username';
      const res = await request
        .get(endpoint)
        .send({ email })
        .expect(expectedStatus);
      return oldEndpoint ? res.body.uid : res.body.username;
    }
  });
});
