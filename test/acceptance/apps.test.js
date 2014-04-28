/*global describe,it*/
var server = require('../../source/server'),
  validation = require('../support/data-validation'),
  schemas = require('../../source/model/schema.responses'),
  request = require('superagent');

require('readyness/wait/mocha');

describe('/apps', function () {

  describe('GET /apps', function () {
    it('appList', function (done) {
      request.get(server.url + '/apps').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsList
        }, function (error) {
          if (error) { done(error); }
          res.headers['cache-control'].should.eql('max-age=3600');
          res.body.should.have.property('apps');
          res.body.apps.should.be.instanceOf(Array);
          res.body.apps.forEach(function (appData) {
            appData.should.have.property('id');
            appData.should.have.property('description');
          });
          done();
        });
      });
    });
  });


  describe('GET /apps/:appid', function () {
    it('valid appId', function (done) {
      request.get(server.url + '/apps/ifttt-all').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsSingle
        }, function (error) {
          if (error) { done(error); }
          res.body.should.have.property('app');
          res.body.app.should.have.property('id');
          res.body.app.should.have.property('description');
          done();
        });
      });
    });
  });
});
