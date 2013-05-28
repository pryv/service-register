/*global require, describe */

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
    password: 'abcdefgh'
  };

  var tests = [
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
      status: 400, desc : 'Invalid user',
      JSchema :  schema.error,
      JValues: {'id': 'RESERVED_USER_NAME' } },

    { data: { email: 'assa'},
      status: 400, desc : 'Invalid email',
      JSchema :  schema.error,
      JValues: {'id': 'INVALID_EMAIL' } },

    { data: {  username: 'wactiv'},
      status: 400, desc : 'Existing user',
      JSchema :  schema.multipleErrors,
      JValues: { 'id': 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' } ]   }},

    { data: {  email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_EMAIL' } ]   }},

    { data: {   username: 'wactiv', email: 'wactiv@pryv.io'},
      status: 400, desc : 'Existing e-mail & username',
      JSchema :  schema.multipleErrors,
      JValues: {'id' : 'INVALID_DATA',
        'errors': [ {'id': 'EXISTING_USER_NAME' }, {'id': 'EXISTING_EMAIL' } ]   }},
    { data: { },
      status: 200, desc : 'valid JSON GET', JSchema : schema.userCreated,
      JValues: { username: defaults.username}  }
  ];
  // tests.length
  for (var key = 0; key < tests.length; key++) { // create PATH and method

    tests[key].url = '/user';
    tests[key].method = 'POST';
    Object.keys(defaults).forEach(function (dkey) {
      if (tests[key].data[dkey] === undefined) {
        tests[key].data[dkey] = defaults[dkey];
      }
    });
    tests[key].it = tests[key].desc + ', username: ' + tests[key].data.username;
    dataValidation.pathStatusSchema(tests[key]);
  }
});


