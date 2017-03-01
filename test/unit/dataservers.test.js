const dataservers = require('../../source/utils/dataservers.js');

const http = require('http');
const https = require('https');

/* global describe, it */
describe('network/dataservers', function () {

  describe('getAdminClient', function () {
    const getAdminClient = dataservers.getAdminClient; 
    const url = function (url) {
      return {
        base_url: url, 
        authorization: 'gooooo',
      };
    };
    
    it('should set .name as a side effect on the host structure', function() {
      var host = {
        base_url: 'http://foo.com:9000', 
        authorization: 'foooo', 
      }; 
      
      getAdminClient(host, '/path', 'foobar');
      
      host.name.should.equal('foo.com'); 
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
});

