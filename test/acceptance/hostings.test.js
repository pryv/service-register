/*global describe*/
require('../config-test');
require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

describe('GET /hostings', function () {
  var tests =  [
    { status: 200, desc : 'validSchema',  JSchema : schema.hostings }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc;
    tests[key].url = '/hostings';
    tests[key].method = 'GET';
    dataValidation.pathStatusSchema(tests[key]);
  }
});

