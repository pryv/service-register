var app = require('../../app');
var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');

var config = require('../../utils/config');
var domain = config.get('dns:domain');



describe('POST /:uid/server', function(){
  var tests =  [ { uid: 'abcd', status: 400 , desc : 'too short ' , 
    JSchema : schema.error , JValues: {'id': 'INVALID_USER_NAME' } },
    { uid: 'abcdefghijkl', status: 404 , desc : 'unkown', 
      JSchema: schema.error, 
      JValues: {'id':'UNKOWN_USER_NAME' } },
      
     { uid: 'wactiv', status: 200 , desc : 'known', 
        JSchema: schema.server, 
        JValues: {'server': domain, 'alias': 'wactiv.'+domain } } ] ;
  
  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].path = '/'+ tests[key].uid +'/server';
    tests[key].method = 'POST';
    tests[key].data = {};

    dataValidation.path_status_schema(tests[key]);
  };
})


// TODO check the returned URL
describe('GET /:uid/server', function(){
  var tests =  [ { uid: 'abcd', status: 302 , desc : 'too short '},
    { uid: 'abcdefghijkl', status: 302 , desc : 'unkown'},
      
     { uid: 'wactiv', status: 302 , desc : 'known' } ] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', uid: ' + tests[key].uid;
    tests[key].path = '/'+ tests[key].uid +'/server';
    tests[key].method = 'GET';
    tests[key].restype = 'html';
    
    dataValidation.path_status_schema(tests[key]);
  };
})
