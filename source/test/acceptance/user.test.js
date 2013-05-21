
var app = require('../../server');

var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

describe('POST /user', function () {

  var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));
  var randommail = randomuser + '@wactiv.chx'; // should not be necessary
  var tests = [
    { data: { username: 'wa', password: 'abcdefg', email: randommail},
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_USER_NAME' } },

    { data: { username: 'pryvwa', password: 'abcdefg', email: randommail},
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } },

    { data: { username: randomuser, password: 'abcdefg', email: 'assa'},
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_EMAIL' } },

    { data: { username: 'wactiv', password: 'abcdefg', email: randommail},
      status: 400, desc : 'Existing user',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' } ]   }},

    { data: { username: randomuser, password: 'abcdefg', email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_EMAIL' } ]   }},

    { data: { username: 'wactiv', password: 'abcdefg', email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail & username',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' }, {'id': 'EXISTING_EMAIL' } ]   }},
     /**
    { data: { username: randomuser, password: 'abcdefg', email: randommail},
      status: 200 , desc : 'valid JSON GET', JSchema : schema.initDone ,
      JValues: {'id':'INIT_DONE'}  } **/
  ] ;
  // tests.length
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.username;
    tests[key].url = '/user';
    tests[key].method = 'POST';
    if (! tests[key].data)  tests[key].data = {};
    dataValidation.pathStatusSchema(tests[key]);
  }
});


