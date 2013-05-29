/*global require,describe */

require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

/**
 * change an email
 */
describe('POST /system/:uid/email', function () {


  var tests = [
    { username: 'wac', data : {email: 'wactiv@pryv.io'},
      status: 400, desc : 'OK',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'wactiv', data : {email: 'toto@pryv.io'},
      status: 200, desc : 'OK',
      JSchema : schema.success, JValues: { success : true}},

    { username: 'wactiv', data : {email: 'wactiv@pryv.io'}, //set back after test
      status: 200, desc : 'OK',
      JSchema : schema.success, JValues: { success : true}}
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' +
        tests[key].username + ', email: ' + tests[key].data.email;
    tests[key].url = '/system/' + tests[key].username + '/email';
    tests[key].method = 'POST';

    dataValidation.pathStatusSchema(tests[key]);
  }
});

