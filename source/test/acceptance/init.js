var app = require('../../app');


var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');



var confirm_challenge = function(test, json_data) {
    console.log("YOOOOO"+ test.data.userName);
    console.log(json_data);
}

// TODO Data validation

describe('POST /init', function(){
var tests = [ 
    { data: { userName: 'abcDefg', password: 'abcdefg', email: 'pml@simpledata.ch'}, status: 200 , desc : 'valid',
     JSchema : schema.init_done , nextStep: confirm_challenge },
                                                                           
    {  data: { userName: 'abcd', password: 'abc', email: 'pml@simpledata.ch'}, status: 400 , desc : 'uid too short & bad password' , 
      JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
                                          "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } ]}},
                                          
    {  data: { userName: 'abcd', password: 'abc', email: 'pml @simpledata.ch'}, status: 400 , desc : 'uid too short & bad password & bad email' , 
      JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
                                          "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } , {"id": 'INVALID_EMAIL' }]}},
      
      
    ] ;



for (key in tests) { // cretate PATH and method
  tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.userName;
  tests[key].path = '/init';
  tests[key].method = 'POST';
  if (! tests[key].data)  tests[key].data = {};
  dataValidation.path_status_schema(tests[key]);
}
});
  