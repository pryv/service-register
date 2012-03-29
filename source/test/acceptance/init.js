var app = require('../../app');


var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');



var confirm_challenge = function(test, json_data) {
    describe('GET /confirm ->'+json_data.captchaChallenge, function(){
        test = { it : " uid: " + test.data.userName,
                 path : '/'+ json_data.captchaChallenge +'/confirm',
                 status: 200,
                  method : 'GET'};
        dataValidation.path_status_schema(test)
    });
}

// TODO Data validation

describe('POST /init', function(){

var randomuser = 'xabcDefg'+ Math.floor( Math.random() * ( 100000  ) );
var randommail = randomuser +'@simpledata.ch'; // should not be necessary
var tests = [ 
    { data: { userName: randomuser, password: 'abcdefg', email: randommail}, status: 200 , desc : 'valid',
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
  