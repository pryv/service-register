// @flow

/* global describe, it, before */
const supertest = require('supertest');

require('../../source/server');
const config = require('../../source/utils/config');

const validation = require('../support/data-validation');
const schemas = require('../support/schema.responses');

require('readyness/wait/mocha');

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

  it('when trying to register reserved emails, the form cannot be sent', async () => {
    await taken('wactiv@pryv.io');
  });
  it('when the email is still free and looks good, the form should be good', async () => {
    await free('abcd.efg_ijkl@bobby.com');
  });
  it('rejects emails that are already part of the user base', async () => {
    await taken('taken@pryv.com');
  });
  it('does loose verification and errs on the side of false positive', async () => {
    await free('#!$%&’*+-/=?^_`{}|~@example.com');

    await free('no_at_sign_present');
    await free('THISISNOEMAILADDRESS');
  });

  async function taken(email) {
    assert.isTrue(await checkEmail(email), `Expected ${email} to be taken, but it was not.`);
  }
  async function free(email) {
    assert.isFalse(await checkEmail(email), `Expected ${email} to be free, but it was not.`);
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

  function getPath(email) {
    return '/' + email + '/check_email';
  }

  it('too short', function (done) {
    request.get(serverUrl + getPath('abcd'))
      .end(function (err, res) {
        validation.checkError(res, {
          status: 400,
          id: 'INVALID_EMAIL'
        }, done);
      });
  });
  it('does not exist', function (done) {
    request.get(serverUrl + getPath('abcd.efg_ijkl@bobby.com'))
      .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.checkExists,
          body: {exists: false}
        }, done);
      });
  });
  it('does exist', function (done) {
    request.get(serverUrl + getPath('wactiv@pryv.io'))
      .end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.checkExists,
          body: {exists: true}
        }, done);
      });
  });
});

