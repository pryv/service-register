/*global describe, it*/
var server = require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var request = require('superagent');

require('readyness/wait/mocha');

describe('GET /hostings', function () {

  it('valid', function (done) {
    var test = { status: 200, desc : 'validSchema',  JSchema : schema.hostings };
    var path = '/hostings';

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });

});

