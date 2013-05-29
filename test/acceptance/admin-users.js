/*global describe*/
var config = require('../config-test');
require('../../source/server');

var dataValidation = require('../support/data-validation');
var schema = require('../../source/model/schema.responses');

require('readyness/wait/mocha');

var domain = config.get('dns:domain');

describe('GET /admin/servers/:serverName/users', function () {
  var tests = [
    { serverName: 'a', status: 400, desc : 'invalid',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}},

    { serverName: 'ab.cd.ef', status: 200, desc : 'empty',
      JSchema : schema.userList, JValues: {users: []}},

    { serverName: domain, status: 200, desc : 'good',
      JSchema : schema.userList, JValues: {users: ['wactiv']}}
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', serverName: ' + tests[key].serverName;
    tests[key].url = '/admin/servers/' + tests[key].serverName + '/users';
    tests[key].method = 'GET';

    dataValidation.pathStatusSchema(tests[key]);
  }
});

describe('GET /admin/servers/:srcServerName/rename/:dstServerName', function () {
  var tests = [
    { srcServerName: 'a', dstServerName: 'ab.cd.ef', status: 400, desc : 'invalid src',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}},

    { srcServerName: 'ab.cd.ef', dstServerName: 'a', status: 400, desc : 'invalid dst',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}},

    { srcServerName: 'ab.cd.ef', dstServerName: 'ab.cd.ef', status: 200, desc : 'empty',
      JSchema : schema.count, JValues: {count: 0}},

    { srcServerName: domain, dstServerName: 'ab.cd.ef', status: 200, desc : '1 done',
      JSchema : schema.count, JValues: {count: 1}},

    { srcServerName: 'ab.cd.ef', dstServerName: domain, status: 200, desc : '1 done',
      JSchema : schema.count, JValues: {count: 1}}
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc + ', src: ' + tests[key].srcServerName +
      ' dest:' + tests[key].srcServerName;
    tests[key].url = '/admin/servers/' + tests[key].srcServerName +
      '/rename/' + tests[key].dstServerName;
    tests[key].method = 'GET';

    dataValidation.pathStatusSchema(tests[key]);
  }
});

describe('GET /admin/servers', function () {
  var tests = [
    { status: 200, desc : '1 done',
      JSchema : schema.serverList  }
  ];

  for (var key = 0; key < tests.length; key++) { // create PATH and method
    tests[key].it = tests[key].desc;
    tests[key].url = '/admin/servers';
    tests[key].method = 'GET';

    dataValidation.pathStatusSchema(tests[key]);
  }
});
