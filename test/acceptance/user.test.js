/*global require, describe */
require('../config-test');
require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

describe('POST /user', function () {

  var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));


  var defaults = {
    hosting: 'gandi.net-fr',
    appid :  'pryv-test',
    username : randomuser,
    email : randomuser + '@wactiv.chx', // should not be necessary
    password: 'abcdefgh',
    invitationtoken: 'enjoy'
  };

  var tests = [
    { data: { invitationtoken: 'aa'},
      status: 400, desc : 'Invalid invitation',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_INVITATION' } },


    { data: { hosting: ''},
      status: 400, desc : 'Invalid hosting',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_HOSTING' } },

    { data: { appid: ''},
      status: 400, desc : 'Invalid app Id',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_APPID' } },

    { data: {  username: 'wa' },
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_USER_NAME' } },

    { data: { username: 'pryvwa' },
      status: 400, desc : 'Reserved user starting by pryv',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } },

    { data: { username: 'facebook' },
      status: 400, desc : 'Reserved user starting from list',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } },

    { data: { email: 'assa'},
      status: 400, desc : 'Invalid email',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_EMAIL' } },

    { data: {  username: 'wactiv'},
      status: 400, desc : 'Existing user',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'EXISTING_USER_NAME' } },



    { data: {  email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'EXISTING_EMAIL'     }},

    { data: {   username: 'wactiv', email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail & username',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' }, {'id': 'EXISTING_EMAIL' } ]   }},
    { data: { },
      status: 200, desc : 'valid JSON GET', JSchema : schema.userCreated,
      JValues: { username: defaults.username.toLowerCase()}  }
  ];

  function doTest(key) {
    // add defaults
    Object.keys(defaults).forEach(function (dkey) {
      if (tests[key].data[dkey] === undefined) {
        tests[key].data[dkey] = defaults[dkey];
      }
    });
    tests[key].url = '/user';
    tests[key].method = 'POST';

    tests[key].it = tests[key].desc + ', username: ' + tests[key].data.username;
    dataValidation.pathStatusSchema(tests[key]);

  }

  // tests.length
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    doTest(key);
  }
});


describe('POST /username/check/', function () {
  var tests =  [
    { username: 'facebook', status: 200, desc : 'reserved from list', value: 'false' },
    { username: 'pryvtoto', status: 200, desc : 'reserved for pryv', value: 'false' },
    { username: 'asdfhgsdkfewg', status: 200, desc : 'available', value: 'true' }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', username: ' + tests[key].username;
    tests[key].url = '/username/check/';
    tests[key].method = 'POST';
    tests[key].restype = 'text/plain';
    tests[key].data = {username: tests[key].username};
    dataValidation.pathStatusSchema(tests[key]);
  }
});



describe('GET /:username/check_username', function () {
  var tests = [
    { username: 'abcd', status: 400, desc : 'too short ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'abcdefghijklmnopqrstuvwxyzasaasaaas', status: 400, desc : 'too long ',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'abc%20def', status: 400, desc : 'invalid character 1',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'abc.def', status: 400, desc : 'invalid character 2',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'abcd-ef', status: 200, desc : '- authorized ',
      JSchema : schema.checkUID },

    { username: 'wactiv', status: 200, desc : 'correct ',
      JSchema : schema.checkUID },

    { username: 'pryvtoto', status: 200, desc : 'reserved for pryv',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'} },

    { username: 'facebook', status: 200, desc : 'reserved from list',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'} },

    { username: 'access', status: 200, desc : 'reserved dns',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'}}
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', username: ' + tests[key].username;
    tests[key].url = '/' + tests[key].username + '/check_username';
    tests[key].method = 'GET';

    dataValidation.pathStatusSchema(tests[key]);
  }
});


