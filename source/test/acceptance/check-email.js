var config = require('../config-test');

var app = require('../../app');

var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

describe('GET /:email/check_email', function(){
  var tests = [ 
    { email: 'abcd', status: 400 , desc : 'too short ' ,
      JSchema : schema.error , JValues: {"id":'INVALID_EMAIL'}},
      
    { email: 'abcd.efg_ijkl@bobby.com', status: 200 , desc : 'does not exists',
      JSchema: schema.checkExists, 
      JValues: { exists: false}},
      
      { email: 'wactiv@pryv.io', status: 200 , desc : 'does exists',
        JSchema: schema.checkExists, 
        JValues: { exists: true}},
    ] ;
  
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', email: ' + tests[key].email;
    tests[key].url = '/'+ tests[key].email +'/check_email';
    tests[key].method = 'GET';
    
    dataValidation.pathStatusSchema(tests[key]);
  }
});
