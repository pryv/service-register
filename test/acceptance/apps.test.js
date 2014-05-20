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
          res.body.apps.forEach(checkApp);
          done();
        });
      });
    });
  });

  describe('GET /apps/:appid', function () {

    it('valid appId', function (done) {
      request.get(server.url + '/apps/test-a').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsSingle
        }, function (error) {
          if (error) { done(error); }
          res.body.should.have.property('app');
          checkApp(res.body.app);
          done();
        });
      });
    });

  });

  function checkApp(appData) {
    appData.should.have.property('id');
    appData.should.have.property('description');
    appData.should.have.property('iconURL');
    appData.should.have.property('appURL');
  }

});
