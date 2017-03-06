/*global describe,it*/
var server = require('../../lib/server');
var request = require('superagent');
var should = require('should');

require('readyness/wait/mocha');

//TODO Data validation

describe('LOAD ', function () {
  it('GET /:uid/check  10000x', function(done){

    var requests = 5000;
    var count =  0;

    this.timeout(requests*2);

    function charge() {
      var path = '/perki/check_username';
      request.get(server.url + path).end(function(err,res) {
        should.not.exists(err);
        should.exists(res);
        count++;
        if(count < requests) {
          charge();
        } else {
          done();
        }
      });
    }

    charge();

  });

});

