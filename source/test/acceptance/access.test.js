var config = require('../config-test');

var app = require('../../server');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');

// TODO complete tests with real devID
describe('POST /access', function(){
  var tests = [];
  
  tests[0] = {
    it: 'valid',
    url: '/access',
    method: 'POST',
    data: { appID: 'reg-test', devID: 'wactiv', appAuthorization: 'ABCDEFGHIJKLMNOPQ', access: { some: 'json', data: 'to request access'}},
    contenttype: 'JSON',
    status: 201, // created
    JSchema: schema.accessPOST,
    nextStep: chainedPoll }
  
  tests[1] = {
      it: 'invalid App Id',
      url: '/access',
      method: 'POST',
      data: { appID: 'a', devID: 'wactiv', appAuthorization: 'ABCDEFGHIJKLMNOPQ', access: { some: 'json', data: 'to request access'}},
      contenttype: 'JSON',
      status: 400, // created
      JSchema: schema.error }
    
  for (var key = 0; key < tests.length; key++) {
    dataValidation.pathStatusSchema(tests[key]);
  }
})

//chained confirm test ... with a valid challenge
function chainedPoll(test, json_data) {

  describe('GET /access/--key--: ', function(){
    var ntest = { 
        it : json_data.poll,
        url: json_data.poll,
        data : {},
        status: 201,
        JSchema : schema.accessGET ,
        method: 'GET'};
    dataValidation.pathStatusSchema(ntest);
  });
}