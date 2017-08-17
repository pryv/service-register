// @flow

const dataservers = require('../../source/utils/dataservers.js');
const db = require('../../source/storage/database');
const config = require('../../source/utils/config');

const http = require('http');
const https = require('https');
const assert = require('assert');
const should = require('should');
const async = require('async');

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
      var host: {
        base_url: string,
        authorization: string,
        name?: string,
      } = {
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

      given.options.port.should.equal(80);
      given.client.should.equal(http);
    });
    it('should return port 443 for https urls', function() {
      var given = getAdminClient(url('https://foo.com/'), '/path', 'foobar');

      given.options.port.should.equal(443);
      given.client.should.equal(https);
    });
    it('should return port 9000 for an url with custom port', function() {
      var given = getAdminClient(
        url('http://foo.com:9000/'), '/path', 'foobar');

      given.options.port.should.equal(9000);
      given.client.should.equal(http);
    });
    it('should return the hostname from the base_url', function() {
      var given = getAdminClient(url('http://foo.com/'), '/path', 'foobar');

      given.options.host.should.equal('foo.com');
    });
    it('should include authorization header', function() {
      var given = getAdminClient(url('http://foo.com/'), '/path', 'foobar');

      const headers = given.options.headers;
      headers['Content-Type'].should.equal('application/json');
      should.exist(headers['authorization']);
      headers['Content-Length'].should.be.above(0);
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
        given.options.host.should.equal('stact-gandi-fr-01.pryv.net');
        given.options.port.should.equal(443);

        // This is controlled by net:aaservers_ssl, but set to true in the
        // default config.
        given.client.should.equal(https);
      });
    });
  });

  describe('getHostForHosting', function () {
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

    it('should fairly select host (among emptiest) for provided hosting', async function() {
      const host = await dataservers.getHostForHosting(hosting);
      should.exist(host);
      // Localhost was setup as containing the less users (only one)
      host['base_name'].should.be.equal('localhost');
    });

    it('should not select full host', async function() {
      const hostingsPath = 'net:aaservers:' + hosting;
      let hostings = config.get(hostingsPath);
      // Set localhost users limit as already reached
      hostings[0].limit = 1;
      config.set(hostingsPath, hostings);
      const host = await dataservers.getHostForHosting(hosting);
      should.exist(host);
      host['base_name'].should.not.be.equal('localhost');
    });

    it('should not select unavailable host', async function() {
      const hostingsPath = 'net:aaservers:' + hosting;
      let hostings = config.get(hostingsPath);
      // Set localhost to unavailable
      hostings[0].available = false;
      config.set(hostingsPath, hostings);
      const host = await dataservers.getHostForHosting(hosting);
      should.exist(host);
      host['base_name'].should.not.be.equal('localhost');
    });
  });
});

