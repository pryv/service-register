///*global describe, it*/

/*
 * test for generic behaviour of the app
 * TODO add unexpected error catching
 */
/*
var server = require('../../lib/server');
var dataValidation = require('../support/data-validation');
var schema = require('../support/schema.responses.js');
var should = require('should');
var request = require('superagent');

require('readyness/wait/mocha');


describe('POST /init with invalid data (bodyParser test)', function () {

  it('invalid JSON', function (done) {
    var path = '/init';
    var test = { data: 'NON JSON DATA STRING', contenttype: 'JSONSTRING',
      status: 400, desc : 'invalid JSON', JSchema : schema.error,
      JValues: {'id': 'INVALID_JSON_REQUEST'}
    };

    request.post(server.url + path).send(test.data).end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      dataValidation.jsonResponse(res, test, done);
    });
  });

});


describe('GET /bug to test invalid code', function () {
  var tests = [
    { status: 500, desc : 'invalid javascript', JSchema : schema.error,
      JValues: {'id': 'INTERNAL_ERROR'}
    }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc;
    tests[key].url = '/bug';
    tests[key].method = 'GET';
    dataValidation.pathStatusSchema(tests[key]);
  }
});
*/

