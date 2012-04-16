var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');
var config = require('../../utils/config');

describe('POST /init with invalid data', function(){

var tests = [ 
    { data: "NON JSON DATA STRING", contenttype: "JSONSTRING",
              status: 400 , desc : 'invalid JSON', JSchema : schema.error , 
              JValues: {"id":'INVALID_JSON_REQUEST'}
     } ] ;
    
for (var key = 0; key < tests.length; key++) { // cretate PATH and method
  tests[key].it = tests[key].desc ;
  tests[key].path = '/init';
  tests[key].method = 'POST';
  dataValidation.path_status_schema(tests[key]);
}
});
  
