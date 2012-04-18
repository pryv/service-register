var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');


describe('GET /:uid/server', function(){
var tests =  [ { uid: 'abcd', status: 400 , desc : 'too short ' , 
      JSchema : schema.error , JValues: {'id': 'INVALID_USER_NAME' } },
    { uid: 'abcdefghijkl', status: 404 , desc : 'unkown', 
      JSchema : schema.error, JValues: {'id':'UNKOWN_USER_NAME' } } ] ;

for (var key = 0; key < tests.length; key++) { // create PATH and method
  tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
  tests[key].path = '/'+ tests[key].uid +'/server';
  tests[key].method = 'GET';
  
  dataValidation.path_status_schema(tests[key]);
};
});
  
