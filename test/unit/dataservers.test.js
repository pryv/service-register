require('../config-test');
const dataservers = require('../../source/network/dataservers.js');

const http = require("http");
const https = require("https");

describe('network/dataservers', function () {

  describe("getAdminClient", function () {
    const getAdminClient = dataservers.getAdminClient; 
    const url = function (url) {
      return {
        base_url: url, 
        authorization: "gooooo",
      };
    }
    
    
    it('should return port 80 for http urls', function() {
      var given = getAdminClient(url("http://foo.com/"), "/path", "foobar"); 
      
      given.options.port.should.equal(80);
      given.client.should.equal(http);
    });
    it('should return port 443 for https urls', function() {
      var given = getAdminClient(url("https://foo.com/"), "/path", "foobar"); 
      
      given.options.port.should.equal(443);
      given.client.should.equal(https);
    });
    it('should return port 9000 for an url with custom port', function() {
      var given = getAdminClient(url("http://foo.com:9000/"), "/path", "foobar"); 
      
      given.options.port.should.equal(9000);
      given.client.should.equal(http);
    });
    it('should return the hostname from the base_url', function() {
      var given = getAdminClient(url("http://foo.com/"), "/path", "foobar"); 
      
      given.options.host.should.equal("foo.com");
    });
  });
});

