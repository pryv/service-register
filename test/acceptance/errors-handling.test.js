'use strict';

const Server = require('../../src/server.js');
const request = require('superagent');
const assert = require('chai').assert;

require('readyness/wait/mocha');

describe('Errors handling tests', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  const path = '/access';
  describe('Malformed JSON error', function () {
    it('Malformed JSON is catched and 400 is shown to the user', async function () {
      try {
        // Important to set the header, otherwise error will happen later in the
        // process and not in json body parser
        const res = await request.post(server.url + path).set('Content-Type', 'application/json')
                .send('{"test": "malformed json"');
        // just to make sure that test fails if the error was not thrown by the system
        assert.equal(res.status, 400);
      } catch (e) {
        assert.equal(e.response.status, 400);
        assert.equal(e.response.body.error.id, 'invalid-parameters-format');
      }
    });
  });
});
