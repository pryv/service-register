// @flow

/* global describe, it, before, beforeEach */

require('../../source/server');
const config = require('../../source/utils/config');

const validation = require('../support/data-validation');
const schemas = require('../support/schema.responses');

const db = require('../../source/storage/database');

const supertest = require('supertest');
const chai = require('chai');
const assert = chai.assert; 

describe('POST /email/check', () => {
  // Obtains the server url and specialise supertest to call it. 
  let request; 
  before(function (done) {
    require('readyness').doWhen(done);
    const serverUrl = config.get('server:url');

    request = supertest(serverUrl);
  });

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
      db.setServerAndInfos('foobar', 'somewhere.place.com', {
        email: 'taken@pryv.com',
      }, done);
    });

    it('rejects emails that are already part of the user base', async () => {
      await taken('taken@pryv.com');
    });
  });

  async function taken(email) {
    assert.isFalse(await checkEmail(email), `Expected ${email} to be taken, but it was not.`);
  }
  async function free(email) {
    assert.isTrue(await checkEmail(email), `Expected ${email} to be free, but it was not.`);
  }
  async function checkEmail(email: string): Promise<boolean> {
    const res = await request
      .post('/email/check/')
      .send({ email: email })
      .expect(200);
    
    if (res.text === 'true') return true; 
    if (res.text === 'false') return false; 
    
    throw new Error('Unexpected response from /email/check.');
  }
});

describe('GET /:email/check_email', function () {
  let request;
  before(function (done) {
    require('readyness').doWhen(done);
    const serverUrl = config.get('server:url');

    request = supertest(serverUrl);
  });

  it('does not exist', function (done) {
    request.get('/abcd.efg_ijkl@bobby.com/check_email')
      .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.checkExists,
          body: {exists: false}
        }, done);
      });
  });
  it('does exist', function (done) {
    request.get('/wactiv@pryv.io/check_email')
      .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.checkExists,
          body: {exists: true}
        }, done);
      });
  });
});

