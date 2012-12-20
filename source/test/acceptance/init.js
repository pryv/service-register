var config = require('../config-test');

var app = require('../../server');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

var domain = "."+config.get('dns:domain');
var aa_servers_http_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';

//chained server test (step3) ... to see if we can find this user back
var server_test = function(test,json_data) {
  describe('POST /server (chained with init) ', function(){
    //console.log("XXXXXXXXXXXXXXX"+ JSON.stringify(test.initialtest));   
    var ntest = { it : test.it +" (3rd)",
        url : "/"+ test.initialtest.data.username +"/server",
        status: 200,
        JSchema : schema.server ,
        JValues: {server: test.initialtest.secondTestResult.server, alias: test.initialtest.data.username + domain},
        method: 'POST', };
    dataValidation.pathStatusSchema(ntest);
  });

}

//chained confirm test (step2) ... with a valid challenge but already confirmed
var re_confirm_challenge = function(test, json_data) {
  describe('POST /confirm (2nd) ', function(){
    test.initialtest.secondTestResult = json_data;
    var ntest = { it : test.it +" (2nd)",
        url : test.url,
        data : test.data,
        status: 400,
        JSchema : schema.alreadyConfirmed ,
        method: 'POST',
        nextStep: server_test,
        initialtest: test.initialtest };
    dataValidation.pathStatusSchema(ntest);
  });
}


//chained confirm test ... with a valid challenge
var confirm_challenge_post = function(test, json_data) {
  if (! config.get('test:init:add_challenge')) return;

  describe('POST /:challenge/confirm (from init)->'+json_data.captchaChallenge, function(){
    var ntest = { it : " uid: " + test.data.username,
        url : '/'+json_data.captchaChallenge+'/confirm',
        data : {},
        status: 200,
        JSchema : schema.server ,
        method: 'POST',
        nextStep: re_confirm_challenge,
        initialtest: test};
    dataValidation.pathStatusSchema(ntest);
  });
}


//chained confirm test ... with a valid challenge, p
var confirm_challenge = function(test, json_data) { 
  if (! config.get('test:init:add_challenge')) return;
  describe('GET /:challenge/confirm (from init)->'+json_data.captchaChallenge, function(){
    var server_alias =  test.data.username + domain;
    var ntest = { it : " uid: " + test.data.username,
        url : '/'+json_data.captchaChallenge+'/confirm',
        data : {},
        status: 302,
        headers : { location: aa_servers_http_mode+"://"+ server_alias +"/?msg=CONFIRMED" },
        method: 'GET',
        restype: 'text/plain',
        initialtest: test};
    dataValidation.pathStatusSchema(ntest);
  });
}

require('readyness/wait/mocha');

describe('POST /init', function(){

  var randomuser = 'testPFX'+ Math.floor( Math.random() * ( 100000  ) );
  var randommail = randomuser +'@wactiv.chx'; // should not be necessary
  var tests = [ 
    { data: { username: "wactiv", password: 'abcdefg', email: randommail}, 
    status: 400 , desc : 'Existing user', 
    JSchema :  schema.multipleErrors , 
    JValues: {"id":'INVALID_DATA', 
      "errors": [ {"id": 'EXISTING_USER_NAME' } ]   }},
    
    { data: { username: randomuser, password: 'abcdefg', email: "wactiv@pryv.io"}, 
        status: 400 , desc : 'Existing e-mail', 
        JSchema :  schema.multipleErrors , 
        JValues: {"id":'INVALID_DATA', 
          "errors": [ {"id": 'EXISTING_EMAIL' } ]   }},
               
     { data: { username: randomuser, password: 'abcdefg', email: randommail}, 
       status: 200 , desc : 'valid JSON GET', JSchema : schema.initDone , 
       JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge },
       
       { data: { username: "post"+ randomuser, password: 'abcdefg', email: "post"+ randommail}, 
         status: 200 , desc : 'valid JSON POST', JSchema : schema.initDone , contenttype: "JSON",
         JValues: {"id":'INIT_DONE'} , nextStep: confirm_challenge_post },

     { data: { username: 'abcd', password: 'abc', email: 'pml@simpledata.ch'}, 
       status: 400 , desc : 'uid too short & bad password' , 
       JSchema : schema.multipleErrors , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } ]}},

     {  data: { username: 'abcd', password: 'abc', email: 'pml @simpledata.ch'}, status: 400 , desc : 'uid too short & bad password & bad email' , 
       JSchema : schema.multipleErrors , JValues: {"id":'INVALID_DATA', 
         "errors": [ {"id": 'INVALID_USER_NAME' }, {"id": 'INVALID_PASSWORD' } , {"id": 'INVALID_EMAIL' }]}},
         ] ;
 // tests.length
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].data.username;
    tests[key].url = '/init';
    tests[key].method = 'POST';
    if (! tests[key].data)  tests[key].data = {};
    dataValidation.pathStatusSchema(tests[key]);
  }
});


