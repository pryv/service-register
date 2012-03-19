var app = require('../../app');


var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');



// TODO Data validation

describe('GET /:uid/check', function(){
var tests = [ 
    { uid: 'abcd', status: 400 , desc : 'too short ' , 
      JSchema : schema.error , JValues: {"id":'INVALID_USER_NAME'}}, 
      
    { uid: 'abcdefghijklmnopqrstuvwxyz', status: 400 , desc : 'too long ', 
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}}, 
      
    { uid: 'abc%20def', status: 400 , desc : 'invalid character 1', 
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}},
      
    { uid: 'abc.def', status: 400 , desc : 'invalid character 2', 
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}},
      
    { uid: 'abc_def', status: 400 , desc : 'invalid character ', 
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}}, 
      
    { uid: 'wactiv', status: 200 , desc : 'correct ', 
      JSchema : schema.check_exists }, 
    ] ;

for (key in tests) { // cretate PATH and method
  tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
  tests[key].path = '/'+ tests[key].uid +'/check';
  tests[key].method = 'GET';
  
  dataValidation.path_status_schema(tests[key]);
}
});
  