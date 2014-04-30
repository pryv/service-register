/*global describe*/
var config = require('../config-test');

require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');



describe('POST /:uid/server', function () {
  var tests =  [ { uid: 'abcd', status: 400, desc : 'too short ',
    JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME' } },
    { uid: 'abcdefghijkl', status: 404, desc : 'unknown',
      JSchema: schema.error,
      JValues: {'id': 'UNKNOWN_USER_NAME' } },

     { uid: 'wactiv', status: 200, desc : 'known',
        JSchema: schema.server,
        JValues: {'server': domain, 'alias': 'wactiv.' + domain } }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].url = '/' + tests[key].uid + '/server';
    tests[key].method = 'POST';
    tests[key].data = {};

    dataValidation.pathStatusSchema(tests[key]);
  }
});


// TODO check the returned URL
describe('GET /:uid/server', function () {
  var tests =  [ { uid: 'abcd', status: 302, desc : 'too short '},
    { uid: 'abcdefghijkl', status: 302, desc : 'unknown'},

     { uid: 'wactiv', status: 302, desc : 'known' }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].url = '/' + tests[key].uid + '/server';
    tests[key].method = 'GET';
    tests[key].restype = 'text/plain; charset=UTF-8';

    dataValidation.pathStatusSchema(tests[key]);
  }
});
