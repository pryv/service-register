/*global describe*/
require('../config-test');
require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

function xdescribe() {};

describe('POST /access/invitationtoken/check', function () {
    var tests =  [
      { invitationtoken: 'facebook', status: 200, desc : 'invalid', value: 'false' },
      { invitationtoken: 'enjoy', status: 200, desc : 'valid', value: 'true' }
    ];

    for (var key = 0; key < tests.length; key++) { // create PATH and method
      tests[key].it = tests[key].desc + ', token: ' + tests[key].username;
      tests[key].url = '/access/invitationtoken/check/';
      tests[key].method = 'POST';
      tests[key].restype = 'text/plain';
      tests[key].data = {invitationtoken: tests[key].invitationtoken};
      dataValidation.pathStatusSchema(tests[key]);
    }
  });


// TODO complete tests with real devID
describe('POST /access', function () {
  var tests = [];

  tests[0] = {
    it: 'valid',
    url: '/access',
    method: 'POST',
    data: { requestingAppId: 'reg-test', languageCode: 'en', returnURL: false,
      appAuthorization: 'ABCDEFGHIJKLMNOPQ',
      requestedPermissions: { some: 'json', data: 'to request access'}},
    contenttype: 'JSON',
    status: 201, // created
    JSchema: schema.accessPOST,
    nextStep: chainedPoll
  };

  tests[1] = {
    it: 'invalid App Id',
    url: '/access',
    method: 'POST',
    data: { requestingAppId: 'a', languageCode: 'en', returnURL: 'http://BlipBlop.com',
      appAuthorization: 'ABCDEFGHIJKLMNOPQ',
      requestedPermissions: { some: 'json', data: 'to request access'}},
    contenttype: 'JSON',
    status: 400, // created
    JSchema: schema.error
  };

  for (var key = 0; key < tests.length; key++) {
    dataValidation.pathStatusSchema(tests[key]);
  }
});

//chained confirm test ... with a valid challenge
function chainedPoll(test, json_data) {

  describe('GET /access/--key--: ', function () {
    var ntest = {
      it : json_data.poll,
      url: json_data.poll,
      data : {},
      status: 201,
      JSchema : schema.accessGET,
      method: 'GET'
    };
    dataValidation.pathStatusSchema(ntest);
  });
}