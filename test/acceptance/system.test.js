/*global require,describe */

require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');
var db = require('../../source/storage/database');

require('readyness/wait/mocha');

/**
 * change an email
 */
describe('POST /system/:uid/email', function () {

  var randomuser = 'testPFX' + Math.floor(Math.random() * (100000));
  var randommail = randomuser + '@wactiv.chx'; // should not be necessary

  var user = { id: 1, email: 'toto@pryv.io' };
  db.setServerAndInfos(randomuser, 'unexistant.rec.la', user);

  var tests = [
    { username: 'wac', data : {email: randommail},
      status: 400, desc : 'OK',
      JSchema : schema.error, JValues: {'id': 'INVALID_USER_NAME'}},

    { username: 'wactivtest', data : {email: randommail},
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

