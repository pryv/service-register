/*global describe*/

/*
 * test for generic behaviour of the app
 * TODO add unexpected error catching
 */

require('../config-test');
require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses.js');

require('readyness/wait/mocha');

describe('POST /init with invalid data (bodyParser test)', function () {
  var tests = [
    { data: 'NON JSON DATA STRING', contenttype: 'JSONSTRING',
      status: 400, desc : 'invalid JSON', JSchema : schema.error,
      JValues: {'id': 'INVALID_JSON_REQUEST'}
    }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc;
    tests[key].url = '/init';
    tests[key].method = 'POST';
    dataValidation.pathStatusSchema(tests[key]);
  }
});

/**
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
**/

