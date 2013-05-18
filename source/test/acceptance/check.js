var config = require('../config-test');

var app = require('../../server');

var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

describe('GET /:uid/check/available', function(){
  var tests =  [
    { uid: 'pryvtoto', status: 200 , desc : 'reserved for pryv', value: 'false' },
    { uid: 'asdfhgsdkfewg', status: 200 , desc : 'available', value: 'true' }] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].url = '/'+ tests[key].uid +'/check/available';
    tests[key].method = 'GET';
    tests[key].restype = 'text/plain';

    dataValidation.pathStatusSchema(tests[key]);
  };
})



describe('GET /:uid/check', function(){
  var tests = [ 
    { uid: 'abcd', status: 400 , desc : 'too short ' ,
      JSchema : schema.error , JValues: {"id":'INVALID_USER_NAME'}},

    { uid: 'abcdefghijklmnopqrstuvwxyzasaasaaas', status: 400 , desc : 'too long ',
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}},

    { uid: 'abc%20def', status: 400 , desc : 'invalid character 1', 
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}},
      
    { uid: 'abc.def', status: 400 , desc : 'invalid character 2',
      JSchema : schema.error, JValues: {"id":'INVALID_USER_NAME'}},

    { uid: 'abcd-ef', status: 200 , desc : '- authorized ',
      JSchema : schema.checkUID },

    { uid: 'wactiv', status: 200 , desc : 'correct ', 
      JSchema : schema.checkUID },

    { uid: 'pryvtoto', status: 200 , desc : 'reserved for pryv',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'} },

    { uid: 'access', status: 200 , desc : 'reserved dns',
      JSchema : schema.checkUID,  JValues: {reserved : true, reason : 'RESERVED_USER_NAME'}}
    ] ;
  
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].url = '/'+ tests[key].uid +'/check';
    tests[key].method = 'GET';
    
    dataValidation.pathStatusSchema(tests[key]);
  }
});
