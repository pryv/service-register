// @flow

const dataservers = require('../../source/utils/dataservers.js');
const db = require('../../source/storage/database');

const http = require('http');
const https = require('https');
const assert = require('assert');
const should = require('should');
const async = require('async');

import type { ServerDefinition } from '../../source/utils/config';

/* global describe, it, before */
describe('utils/dataservers', function () {

  describe('getAdminClient', function () {
    const getAdminClient = dataservers.getAdminClient;
    const url = function (url) {
      return {
        base_url: url,
        authorization: 'gooooo',
      };
    };

    it('should set .name as a side effect on the host structure', function() {
      const host: ServerDefinition = {
        base_url: 'http://foo.com:9000',
        authorization: 'foooo',
      };

      getAdminClient(host, '/path', 'foobar');

      if (host.name) {
        should.equal(host.name, 'foo.com');
      }
      else {
        assert(false, 'host.name was not set.');
      }
    });
    it('should return port 80 for http urls', function() {
      var given = getAdminClient(url('http://foo.com/'), '/path', 'foobar');

      should(given.options.port).be.equal(80);
      should(given.client).be.equal(http);
    });
    it('should return port 443 for https urls', function() {
      var given = getAdminClient(url('https://foo.com/'), '/path', 'foobar');

      should(given.options.port).be.equal(443);
      should(given.client).be.equal(https);
    });
    it('should return port 9000 for an url with custom port', function() {
      var given = getAdminClient(
        url('http://foo.com:9000/'), '/path', 'foobar');

      should(given.options.port).be.equal(9000);
      should(given.client).be.equal(http);
    });
    it('should return the hostname from the base_url', function() {
      var given = getAdminClient(url('http://foo.com/'), '/path', 'foobar');

      should(given.options.host).be.equal('foo.com');
    });
    it('should include authorization header', function() {
      var given = getAdminClient(url('http://foo.com/'), '/path', 'foobar');

      const headers = given.options.headers;
          
      should(headers['Content-Type']).equal('application/json');
      should.exist(headers['authorization']);
      should(headers['Content-Length']).be.above(0);
    });

    describe('fallback to old behaviour', function() {
      const oldHost = {
        'base_name': 'stact-gandi-fr-01',
        'port': 443,
        'authorization': 'lkajsflsajflj'
      };

      it('still uses old fields if base_url is absent', function() {
        var given = getAdminClient(oldHost, '/path', 'foobar');

        // 'pryv.net' is read from net:AAservers_domain. This is the current
        // default.
        should(given.options.host).be.equal('stact-gandi-fr-01.pryv.net');
        should(given.options.port).be.equal(443);

        // This is controlled by net:aaservers_ssl, but set to true in the
        // default config.
        should(given.client).be.equal(https);
      });
    });
  });

  describe('getCoreForHosting', function () {
    const hosting = 'test.ch-ch';

    before( done => {
      async.series([
        nextStep => {
          db.setServer('dummyUser1', 'localhost', nextStep);
        },
        nextStep => {
          db.setServer('dummyUser2', 'dummy_server', nextStep);
        },
        nextStep => {
          db.setServer('dummyUser3', 'dummy_server', nextStep);
        }
      ], done
      );
    });

    it('should fairly select host (among emptiest) for provided hosting', function(done) {
      dataservers.getCoreForHosting(hosting, (err, host) => {
        should.not.exist(err);
        
        if (host == null)
          throw new Error('AF: Should have selected a host.');
          
        if (host.base_name == null) 
          throw new Error('AF: Should have an old-style host here.');
        
        const name = host.base_name; 
        
        // Localhost was setup as containing the less users (only one)
        should(name).be.equal('localhost');
        done();
      });
    });
  });
});

