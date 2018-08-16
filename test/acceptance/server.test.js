

/* global describe, it */

const request = require('superagent');
const should = require('should');

const chai = require('chai');
const assert = chai.assert; 

const config = require('../../source/utils/config');
const server = require('../../source/server');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');
var path = '/server';

describe('POST /:uid/server', function () {
  it('too short', function (done) {
    request.post(server.url + '/abcd/server').send({}).end((err, res) => {
      should.exist(err);

      assert.strictEqual(res.statusType, 4);
      assert.strictEqual(res.body.id, 'INVALID_USER_NAME');
      done(); 
    });
  });
  it('unknown', function (done) {
    request.post(server.url + '/abcdefghijkl/server').send({}).end((err, res) => {
      should.exist(err);
      
      assert.strictEqual(res.statusType, 4);
      assert.strictEqual(res.body.id, 'UNKNOWN_USER_NAME');
      done(); 
    });
  });
  it('known', function (done) {
    var test = { uid: 'wactiv', status: 200, desc : 'known',
      JSchema: schema.server,
      JValues: {'server': domain, 'alias': 'wactiv.' + domain } };

    request.post(server.url + '/' + test.uid + path).send({}).end(function (err, res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
});

describe('GET /:uid/server', function () {
  it('too short', function(done) {
    request.get(server.url + '/abcd/server')
      .redirects(0)
      .end((err, res) => {
        assert.equal(res.statusCode, 302, 'Should have status code 302');
        res.header.location.should.match(/\/error\.html\?id=INVALID_USER_NAME$/);
        done(); 
      });
  });
  it('unknown', function (done) {
    request.get(server.url + '/abcdefghijkl/server')
      .redirects(0)
      .end((err, res) => {
        assert.equal(res.statusCode, 302, 'Should have status code 302');
        res.header.location.should.match(/\/error\.html\?id=UNKNOWN_USER_NAME$/);
        done(); 
      });
  });
  it('known', function (done) {
    request.get(server.url + '/wactiv/server')
      .redirects(0)
      .end((err, res) => {
        assert.equal(res.statusCode, 302, 'Should have status code 302');
        res.header.location.should.match('https://pryv.in/?username=wactiv');
        done(); 
      });
  });
});
