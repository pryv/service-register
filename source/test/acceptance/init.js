var app = require('../../app');


var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

// TODO Data validation

describe('POST /init', function(){
var tests = [ 
    { uid: 'abcd', password: 'abcdefgh',status: 400 , desc : 'uid too short ' , 
      JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', "errors": [{"id": 'INVALID_USER_NAME' }]}},
      
    ] ;



for (key in tests) { // cretate PATH and method
  tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
  tests[key].path = '/init';
  tests[key].method = 'POST';
  
  dataValidation.path_status_schema(tests[key]);
}
});
  