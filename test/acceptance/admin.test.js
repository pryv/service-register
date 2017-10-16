
/* global describe, it */
const request = require('superagent');

const config = require('../../source/utils/config');
const server = require('../../source/server');
const dataValidation = require('../support/data-validation');
const schema = require('../support/schema.responses');

require('readyness/wait/mocha');

const domain = config.get('dns:domain');

const authAdminKey = 'test-admin-key';
const authSystemKey = 'test-system-key';

describe('GET /admin/servers/:serverName/users', function () {
  it('invalid', function (done) {
    var test = { serverName: 'a', status: 400, desc : 'invalid',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}};
    var path = `/admin/servers/${test.serverName}/users?auth=${authAdminKey}`;

    request.get(server.url + path).end((err,res) => {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('empty', function (done) {
    var test = { serverName: 'ab.cd.ef', status: 200, desc : 'empty',
      JSchema : schema.userList, JValues: {users: []}};
    var path = '/admin/servers/' + test.serverName + '/users' + '?auth=' + authAdminKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('good', function (done) {
    var test = { serverName: domain, status: 200, desc : 'good',
      JSchema : schema.userList, JValues: {users: ['wactiv']}};
    var path = '/admin/servers/' + test.serverName + '/users' + '?auth=' + authAdminKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
});

describe('GET /admin/servers/:srcServerName/rename/:dstServerName', function () {
  it('invalid src', function (done) {
    var test = { srcServerName: 'a', dstServerName: 'ab.cd.ef', status: 400, desc : 'invalid src',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}};
    var path = '/admin/servers/' + test.srcServerName +
      '/rename/' + test.dstServerName + '?auth=' + authSystemKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('invalid dst', function (done) {
    var test = { srcServerName: 'ab.cd.ef', dstServerName: 'a', status: 400, desc : 'invalid dst',
      JSchema : schema.error, JValues: {id: 'INVALID_DATA'}};
    var path = '/admin/servers/' + test.srcServerName +
      '/rename/' + test.dstServerName + '?auth=' + authSystemKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('empty', function (done) {
    var test = { srcServerName: 'ab.cd.ef', dstServerName: 'ab.cd.ef', status: 200, desc : 'empty',
      JSchema : schema.count, JValues: {count: 0}};
    var path = '/admin/servers/' + test.srcServerName +
      '/rename/' + test.dstServerName + '?auth=' + authSystemKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('one done', function (done) {
    var test = { srcServerName: domain, dstServerName: 'ab.cd.ef', status: 200, desc : '1 done',
      JSchema : schema.count, JValues: {count: 1}};
    var path = '/admin/servers/' + test.srcServerName +
      '/rename/' + test.dstServerName + '?auth=' + authSystemKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
  it('other done', function (done) {
    var test = { srcServerName: 'ab.cd.ef', dstServerName: domain, status: 200, desc : '1 done',
      JSchema : schema.count, JValues: {count: 1}};
    var path = '/admin/servers/' + test.srcServerName +
      '/rename/' + test.dstServerName + '?auth=' + authSystemKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
});

describe('GET /admin/servers', function () {
  it('one done', function (done) {
    var test = { status: 200, desc : '1 done',
      JSchema : schema.serverList  };
    var path = '/admin/servers' + '?auth=' + authAdminKey;

    request.get(server.url + path).end(function(err,res) {
      dataValidation.jsonResponse(err, res, test, done);
    });
  });
});

describe('/admin/users/invitations', function () {
  describe('GET ', function () {
    it('should send a list of current tokens', function (done) {
      request.get(server.url + '/admin/users/invitations' + '?auth=' + authAdminKey)
      .end((err, res) => {
        dataValidation.check(res, {status: 200});

        res.body.should.have.property('invitations');
        res.body.invitations.should.be.instanceOf(Array);
        res.body.invitations.forEach(function (tokenData) {
          tokenData.should.have.property('id');
          tokenData.should.have.property('createdAt');
        });
        done(); 
      });
    });
    it('should send a list of current tokens as html tables', function (done) {
      request.get(server.url + '/admin/users/invitations' + '?auth=' + authAdminKey + '&toHTML=true')
      .end((err, res) => {
        dataValidation.check(res, {status: 200});
        res.text.should.containEql('<th>Created At</th>');
        res.text.should.containEql('<th>by</th>');
        res.text.should.containEql('<th>description</th>');
        res.text.should.containEql('<th>ConsumedAt</th>');
        res.text.should.containEql('<th>ConsumedBy</th>');
        res.text.should.containEql('<th>Token</th>');
        res.text.should.containEql('</table>');
        done(); 
      });
    });
  });
  describe('future POST ', function () {
    it('should create a list of token', function (done) {
      request.get(server.url + '/admin/users/invitations/post' +
          '?auth=' + authAdminKey +
          '&count=2&message=testx'
        ).end((err, res) => {
          dataValidation.check(res, {status: 200}); 

          res.body.should.have.property('data');
          res.body.data.should.be.instanceOf(Array);
          done();
        });
    });
  });
});

describe('/admin/users', function () {
  describe('GET ', function () {
    it('should get a users list', function (done) {
      request.get(server.url + '/admin/users' + '?auth=' + authAdminKey)
      .end((err, res) => {
        dataValidation.check(res, {status: 200});
        res.body.should.have.property('users');
        res.body.users.should.be.instanceOf(Array);
        res.body.users.forEach(function (user) {
          user.should.have.property('username');
          user.should.have.property('registeredTimestamp');
          user.should.have.property('server');
          user.should.have.property('errors');
          user.should.have.property('registeredDate');
        });
        done(); 
      });
    });
    it('should get a users list as html tables', function (done) {
      request.get(server.url + '/admin/users' + '?auth=' + authAdminKey + '&toHTML=true')
      .end((err, res) => {
        dataValidation.check(res, {status: 200});
        res.text.should.containEql('<th>Registered At</th>');
        res.text.should.containEql('<th>Username</th>');
        res.text.should.containEql('<th>e-mail</th>');
        res.text.should.containEql('<th>lang</th>');
        res.text.should.containEql('<th>Server</th>');
        res.text.should.containEql('<th>From app</th>');
        res.text.should.containEql('<th>Referer</th>');
        res.text.should.containEql('<th>Token</th>');
        res.text.should.containEql('<th>Errors</th>');
        res.text.should.containEql('</table>');
        done(); 
      });
    });
  });
});
