/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
/*

!!! This test was never run alongside the testsuite and crashes
if reactivated => commenting it for now !!!

var server = require('../../lib/server');
var request = require('superagent');
var should = require('should');

require('readyness/wait/mocha');

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

*/
