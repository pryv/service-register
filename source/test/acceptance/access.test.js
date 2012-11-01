var config = require('../config-test');

var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');


describe('POST /access', function(){
  var tests = [];
  
  tests[0] = {
    it: 'valid',
    path: '/access',
    method: 'POST',
    data: { appID: 'reg-test', access: { some: 'json', data: 'to request access'}},
    contenttype: 'JSON',
    status: 201, // created
    JSchema: schema.accessPOST,
    nextStep: chainedPoll }
  
  tests[1] = {
      it: 'invalid App Id',
      path: '/access',
      method: 'POST',
      data: { appID: 'a', access: { some: 'json', data: 'to request access'}},
      contenttype: 'JSON',
      status: 400, // created
      JSchema: schema.accessPOST }
    
  for (var key = 0; key < tests.length; key++) {
    dataValidation.pathStatusSchema(tests[key]);
  }
})

//chained confirm test ... with a valid challenge
function chainedPoll(test, json_data) {

  describe('GET /access/--key--/status: ', function(){
    var url = require('url').parse(json_data.polling);
    var ntest = { 
        it : json_data.polling,
        host: url.hostname,
        path: url.path,
        data : {},
        status: 449,
        JSchema : schema.accessGET ,
        method: 'GET'};
    dataValidation.pathStatusSchema(ntest);
  });
}