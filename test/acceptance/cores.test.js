/* global describe, before, beforeEach, after, it */

const request = require('superagent');

const config = require('../../source/config');
const Server = require('../../source/server.js');
const db = require('../../source/storage/database');

require('readyness/wait/mocha');

const domain = config.get('dns:domain');

describe('cores', () => {

  let server;

    before(async function () {
      server = new Server();
      await server.start();
    });
  
    after(async function () {
      await server.stop();
    });

  describe('GET /', () => {
    
    describe('by username', () => {
      it('must return the right core when the account exists');
      it('must return 404 core when the account does not exists');
    });

    describe('by email', () => {
      it('must return the right core when the account exists');
      it('must return the a core at random when the account does not exist');
    });

    it('must return an error when both are provided');
  });
});
