var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

// the following tests are not "init" dependents
// other confirm tests are included in the "init" part in order to chain them

require('../support/waiter.js');

describe('GET /challenge:/confirm', function(){
  var tests = [ 
   { challenge: 'abcd', status: 400 , desc : 'invalid ' , 
	 JSchema : schema.error , JValues: {'id':'INVALID_CHALLENGE'}},
   { challenge: 'abcdefghijklmnopqrstuvwxyz', status: 404 , desc : 'no pending', 
	 JSchema : schema.error, JValues: {'id':'NO_PENDING_CREATION'}}
   ] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
	tests[key].it = tests[key].desc + ', challenge: ' + tests[key].challenge;
	tests[key].path = '/'+ tests[key].challenge +'/confirm';
	tests[key].method = 'GET';

	dataValidation.path_status_schema(tests[key]);
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
  tests[key].path = '/confirm_post';
  tests[key].method = 'POST';
  tests[key].data = {challenge: tests[key].challenge};

  dataValidation.path_status_schema(tests[key]);
}
});


