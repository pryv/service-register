var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');
var config = require('../../utils/config');

var domain = "."+config.get('dns:domain');


//chained server test (step3) ... to see if we can find this user back
var server_test = function(test,json_data) {
  describe('POST /server (chained with init) ', function(){
    //console.log("XXXXXXXXXXXXXXX"+ JSON.stringify(test.initialtest));   
    var ntest = { it : test.it +" (3rd)",
        path : "/"+ test.initialtest.data.userName +"/server",
        status: 200,
        JSchema : schema.server ,
        JValues: {server: test.initialtest.secondTestResult.server, alias: test.initialtest.data.userName + domain},
        method: 'POST', };
    dataValidation.path_status_schema(ntest);
  });

}

//chained confirm test (step2) ... with a valid challenge but already confirmed
var re_confirm_challenge = function(test, json_data) {
  describe('POST /confirm (2nd) ', function(){
    test.initialtest.secondTestResult = json_data;
    var ntest = { it : test.it +" (2nd)",
        path : test.path,
        data : test.data,
        status: 400,
        JSchema : schema.confirm_already ,
        method: 'POST',
        nextStep: server_test,
        initialtest: test.initialtest };
    dataValidation.path_status_schema(ntest);
  });
}


//chained confirm test ... with a valid captcha
var confirm_challenge = function(test, json_data) {
  if (! config.get('test:init:add_challenge')) return;

  describe('POST /confirm (from init)->'+json_data.captchaChallenge, function(){
    var ntest = { it : " uid: " + test.data.userName,
        path : '/confirm_post',
        data : {challenge: json_data.captchaChallenge},
        status: 200,
        JSchema : schema.server ,
        method: 'POST',
        nextStep: re_confirm_challenge,
        initialtest: test};
    dataValidation.path_status_schema(ntest);
  });
}

require('readyness/wait/mocha');

describe('POST /init', function(){

  var randomuser = 'plip'+ Math.floor( Math.random() * ( 100000  ) );
  var randommail = randomuser +'@simpledata.ch'; // should not be necessary
  var tests = [ 
     { data: { userName: randomuser, password: 'abcdefg', email: randommail}, 
       status: 200 , desc : 'valid', JSchema : schema.init_done , 
       JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge },

     { data: { userName: "json"+ randomuser, password: 'abcdefg', email: randommail}, 
       status: 200 , desc : 'valid JSON POST', JSchema : schema.init_done , contenttype: "JSON",
       JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge },

     { data: { userName: 'abcd', password: 'abc', email: 'pml@simpledata.ch'}, 
       status: 400 , desc : 'uid too short & bad password' , 
       JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } ]}},

     {  data: { userName: 'abcd', password: 'abc', email: 'pml @simpledata.ch'}, status: 400 , desc : 'uid too short & bad password & bad email' , 
       JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } , {"id": 'INVALID_EMAIL' }]}},
         ] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.userName;
    tests[key].path = '/init';
    tests[key].method = 'POST';
    if (! tests[key].data)  tests[key].data = {};
    dataValidation.path_status_schema(tests[key]);
  }
});


