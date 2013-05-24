var config = require('../config-test');

var app = require('../../source/server');
var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

// the following tests are not "init" dependents
// other confirm tests are included in the "init" part in order to chain them

require('readyness/wait/mocha');

describe('GET /challenge:/confirm', function(){
  var tests = [ 
   { challenge: 'abcd', status: 302 , desc : 'invalid ' },
   { challenge: 'abcdefghijklmnopqrstuvwxyz', status: 302 , desc : 'no pending' }
   ] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
  tests[key].it = tests[key].desc + ', challenge: ' + tests[key].challenge;
  tests[key].url = '/'+ tests[key].challenge +'/confirm';
  tests[key].method = 'GET';
  tests[key].restype = 'text/plain';
  
  dataValidation.pathStatusSchema(tests[key]);
  }
});
  



describe('POST /confirm_post', function(){
  var tests = [ 
    { challenge: 'abcd', status: 400 , desc : 'invalid ' , 
    JSchema : schema.error , JValues: {'id':'INVALID_CHALLENGE'}}, 
    { challenge: 'abcdefghijklmnopqrstuvwxyz', status: 404 , desc : 'no pending', 
    JSchema : schema.error, JValues: {'id':'NO_PENDING_CREATION'}}
    ] ;
  
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', challenge: ' + tests[key].challenge;
    tests[key].url = '/confirm_post';
    tests[key].method = 'POST';
    tests[key].data = {challenge: tests[key].challenge};
  
    dataValidation.pathStatusSchema(tests[key]);
  }
});

// the following one is hidden in doc 
describe('POST  /challenge:/confirm', function(){
  var tests = [ 
    { challenge: 'abcd', status: 400 , desc : 'invalid ' , 
    JSchema : schema.error , JValues: {'id':'INVALID_CHALLENGE'}}, 
    { challenge: 'abcdefghijklmnopqrstuvwxyz', status: 404 , desc : 'no pending', 
    JSchema : schema.error, JValues: {'id':'NO_PENDING_CREATION'}}
    ] ;
  
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', challenge: ' + tests[key].challenge;
    tests[key].url = '/'+tests[key].challenge+'/confirm';
    tests[key].method = 'POST';
    tests[key].data = {};
  
    dataValidation.pathStatusSchema(tests[key]);
  }
});