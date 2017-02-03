/*global describe,it*/
var validation = require('../support/data-validation'),
  schemas = require('../../source/model/schema.responses'),
  request = require('superagent'),
  server = require('../../source/server'),
  should = require('should'),
  dataValidation = require('../support/data-validation');

require('readyness/wait/mocha');

describe('/service', function () {

  describe('GET /service/infos', function () {

    it('infos', function (done) {
      request.get(server.url + '/service/infos').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.serviceInfos
        }, done);
      });
    });
  });

  describe('GET /service/apps', function () {

    it('appList', function (done) {
      request.get(server.url + '/service/apps').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsList
        }, function (error) {
          if (error) {
            return done(error);
          }
          should.exists(res.body);
          should.exists(res.body.apps);

          res.body.should.have.property('apps');
          res.body.apps.should.be.instanceOf(Array);
          res.body.apps.forEach(checkApp);
          done();
        });
      });
    });
  });

  describe('GET /service/apps/:appid', function () {

    it('valid appId', function (done) {
      request.get(server.url + '/service/apps/test-a').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsSingle
        }, function (error) {
          if (error) {
            return done(error);
          }
          res.body.should.have.property('app');
          checkApp(res.body.app);
          done();
        });
      });
    });

  });

  describe('GET /service/hostings', function () {

    it('valid', function (done) {
      var test = { status: 200, desc : 'validSchema',  JSchema : schemas.hostings };
      var path = '/service/hostings';

      request.get(server.url + path).end(function(err,res) {
        dataValidation.jsonResponse(err, res, test, done);
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
