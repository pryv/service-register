var config = require('../config-test');

var app = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

describe('POST /:uid/email/admin', function(){

  var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));
  var randommail = randomuser + '@wactiv.chx'; // should not be necessary

  var tests = [
    { uid: 'wac', data : {email: 'wactiv@pryv.io'},
      status: 400, desc : 'OK',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { uid: 'wactiv', data : {email: randommail},
      status: 200, desc : 'OK',
      JSchema : schema.success, JValues: { success : true}}
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid + ', email: ' + tests[key].data.email;
    tests[key].url = '/'+ tests[key].uid + '/email/admin';
    tests[key].method = 'POST';

    dataValidation.pathStatusSchema(tests[key]);
  }
});

