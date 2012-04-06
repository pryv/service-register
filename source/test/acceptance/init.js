var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');
var config = require('../../utils/config');

// chained server test (step3) ... to see if we can find this user back
var server_test = function(test,json_data) {
     describe('GET /server (chained with init) ', function(){
         //console.log("XXXXXXXXXXXXXXX"+ JSON.stringify(test.initialtest));   
          var ntest = { it : test.it +" (3rd)",
                 path : "/"+ test.initialtest.data.userName +"/server",
                 status: 200,
                 JSchema : schema.server ,
                 method: 'GET', };
        dataValidation.path_status_schema(ntest);
    });

}

// chained confirm test (step2) ... with a valid captcha but already confirmed
var re_confirm_challenge = function(test, json_data) {
    describe('GET /confirm (2nd) ', function(){
      
        var ntest = { it : test.it +" (2nd)",
                 path : test.path,
                 status: 400,
                 JSchema : schema.confirm_already ,
                 method: 'GET',
                 nextStep: server_test,
                 initialtest: test.initialtest };
        dataValidation.path_status_schema(ntest);
    });
}


// chained confirm test ... with a valid captcha
var confirm_challenge = function(test, json_data) {
     if (! config.get('test:init:add_challenge')) return;
     
    describe('GET /confirm ->'+json_data.captchaChallenge, function(){
        var ntest = { it : " uid: " + test.data.userName,
                 path : '/'+ json_data.captchaChallenge +'/confirm',
                 status: 200,
                 JSchema : schema.server ,
                 method: 'GET',
                 nextStep: re_confirm_challenge,
                 initialtest: test};
        dataValidation.path_status_schema(ntest);
    });
}

describe('POST /init', function(){

var randomuser = 'xabcDefg'+ Math.floor( Math.random() * ( 100000  ) );
var randommail = randomuser +'@simpledata.ch'; // should not be necessary
var tests = [ 
    { data: { userName: randomuser, password: 'abcdefg', email: randommail}, 
              status: 200 , desc : 'valid', JSchema : schema.init_done , 
              JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge },
                                                                           
    { data: { userName: 'abcd', password: 'abc', email: 'pml@simpledata.ch'}, 
              status: 400 , desc : 'uid too short & bad password' , 
              JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
                                          "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } ]}},
                                          
    {  data: { userName: 'abcd', password: 'abc', email: 'pml @simpledata.ch'}, status: 400 , desc : 'uid too short & bad password & bad email' , 
      JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
                                          "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } , {"id": 'INVALID_EMAIL' }]}},
      
      
    ] ;
    
for (var key = 0; key < tests.length; key++) { // cretate PATH and method
  tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.userName;
  tests[key].path = '/init';
  tests[key].method = 'POST';
  if (! tests[key].data)  tests[key].data = {};
  dataValidation.path_status_schema(tests[key]);
}
});
  
