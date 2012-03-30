
var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

// the folowwing tests are not "init" dependents
// other confirm tests are included in the "init" part in order to chain them

describe('GET /:challenge/confirm', function(){
var tests = [ 
    { challenge: 'abcd', status: 400 , desc : 'invalid ' , 
      JSchema : schema.error , JValues: {"id":'INVALID_CHALLENGE'}}, 
      
    { challenge: 'abcdefghijklmnopqrstuvwxyz', status: 404 , desc : 'no pending', 
      JSchema : schema.error, JValues: {"id":'NO_PENDING_CREATION'}}
    ] ;

for (var key = 0; key < tests.length; key++) { // create PATH and method
  tests[key].it = tests[key].desc + ', challenge: ' + tests[key].uid;
  tests[key].path = '/'+ tests[key].challenge +'/confirm';
  tests[key].method = 'GET';
  
  dataValidation.path_status_schema(tests[key]);
}
});
  
