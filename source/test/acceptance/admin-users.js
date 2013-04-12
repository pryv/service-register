var config = require('../config-test');

var app = require('../../server');

var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

require('readyness/wait/mocha');


var domain = config.get('dns:domain');


describe('GET /admin/servers/:serverName/users', function(){
  var tests = [
    { serverName: 'a', status: 400 , desc : 'invalid' ,
      JSchema : schema.error , JValues: {id:'INVALID_DATA'}},

   { serverName: 'ab.cd.ef', status: 200 , desc : 'empty' ,
      JSchema : schema.userList , JValues: {users:[]}},


    { serverName: domain, status: 200 , desc : 'good' ,
      JSchema : schema.userList , JValues: {users:['wactiv']}}

  ] ;

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', serverName: ' + tests[key].serverName;
    tests[key].url = '/admin/servers/'+ tests[key].serverName +'/users';
    tests[key].method = 'GET';

    dataValidation.pathStatusSchema(tests[key]);
  }
});
