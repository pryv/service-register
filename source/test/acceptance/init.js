var config = require('../config-test');

var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

var domain = "."+config.get('dns:domain');
var aa_servers_http_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';

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


//chained confirm test ... with a valid challenge
var confirm_challenge_post = function(test, json_data) {
  if (! config.get('test:init:add_challenge')) return;

  describe('POST /:challenge/confirm (from init)->'+json_data.captchaChallenge, function(){
    var ntest = { it : " uid: " + test.data.userName,
        path : '/'+json_data.captchaChallenge+'/confirm',
        data : {},
        status: 200,
        JSchema : schema.server ,
        method: 'POST',
        nextStep: re_confirm_challenge,
        initialtest: test};
    dataValidation.path_status_schema(ntest);
  });
}


//chained confirm test ... with a valid challenge, p
var confirm_challenge = function(test, json_data) {
  if (! config.get('test:init:add_challenge')) return;

  describe('GET /:challenge/confirm (from init)->'+json_data.captchaChallenge, function(){
    var server_alias =  test.data.userName + domain;
    var ntest = { it : " uid: " + test.data.userName,
        path : '/'+json_data.captchaChallenge+'/confirm',
        data : {},
        status: 302,
        headers : { location: aa_servers_http_mode+"://"+ server_alias +"/?msg=CONFIRMED" },
        method: 'GET',
        restype: 'html',
        initialtest: test};
    dataValidation.path_status_schema(ntest);
  });
}

require('readyness/wait/mocha');

describe('POST /init', function(){

  var randomuser = 'testPFX'+ Math.floor( Math.random() * ( 100000  ) );
  var randommail = randomuser +'@wactiv.chx'; // should not be necessary
  var tests = [ 
    { data: { userName: "wactiv", password: 'abcdefg', email: randommail}, 
    status: 400 , desc : 'Existing user', 
    JSchema :  schema.error_multiple , 
    JValues: {"id":'INVALID_DATA', 
      "errors": [ {"id": 'EXISTING_USER_NAME' } ]   }},
    
    { data: { userName: randomuser, password: 'abcdefg', email: "wactiv@rec.la"}, 
        status: 400 , desc : 'Existing e-mail', 
        JSchema :  schema.error_multiple , 
        JValues: {"id":'INVALID_DATA', 
          "errors": [ {"id": 'EXISTING_EMAIL' } ]   }},
               
     { data: { userName: randomuser, password: 'abcdefg', email: randommail}, 
       status: 200 , desc : 'valid JSON GET', JSchema : schema.init_done , 
       JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge },
       
       { data: { userName: "post"+ randomuser, password: 'abcdefg', email: "post"+ randommail}, 
         status: 200 , desc : 'valid JSON POST', JSchema : schema.init_done , contenttype: "JSON",
         JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge_post },

     { data: { userName: 'abcd', password: 'abc', email: 'pml@simpledata.ch'}, 
       status: 400 , desc : 'uid too short & bad password' , 
       JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } ]}},

     {  data: { userName: 'abcd', password: 'abc', email: 'pml @simpledata.ch'}, status: 400 , desc : 'uid too short & bad password & bad email' , 
       JSchema : schema.error_multiple , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } , {"id": 'INVALID_EMAIL' }]}},
         ] ;
 // tests.length
  for (var key = 0; key < 2; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.userName;
    tests[key].path = '/init';
    tests[key].method = 'POST';
    if (! tests[key].data)  tests[key].data = {};
    dataValidation.path_status_schema(tests[key]);
  }
});


