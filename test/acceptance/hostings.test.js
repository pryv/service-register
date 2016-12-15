/*global describe, it*/
require('../config-test');
var server = require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var should = require('should');
var request = require('superagent');

require('readyness/wait/mocha');

describe('GET /hostings', function () {

  it('valid', function (done) {
    var test = { status: 200, desc : 'validSchema',  JSchema : schema.hostings };
    var path = '/hostings';

    request.get(server.url + path).end(function(err,res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});

