/*global describe, before, after, it*/
const should = require('should');

const validation = require('../support/data-validation');
const schemas = require('../support/schema.responses');
const request = require('superagent');
const config = require('../../source/config');
const Server = require('../../source/server.js');
const chai = require('chai');
const assert = chai.assert; 

require('readyness/wait/mocha');

describe('/service', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /info', function () {

    it('info', function (done) {
      request.get(server.url + '/service/info').end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.serviceInfo
        });

        res.should.have.property('body');
        res.body.should.have.property('serial');
        res.body.should.have.property('register');
        res.body.should.have.property('access');
        res.body.should.have.property('api');
        res.body.should.have.property('name');
        res.body.should.have.property('home');
        res.body.should.have.property('support');
        res.body.should.have.property('terms');
        res.body.should.have.property('eventTypes');
        res.body.should.have.property('assets');
        done();
      });
    });
  });

  describe('GET /apps', function () {

    it('appList', function (done) {
      request.get(server.url + '/apps').end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsList
        });
      
        should.exists(res.body);
        should.exists(res.body.apps);

        res.body.should.have.property('apps');
        res.body.apps.should.be.instanceOf(Array);
        res.body.apps.forEach(checkApp);
        done();
      });
    });
  });

  describe('GET /apps/:appid', function () {

    it('valid appId', function (done) {
      request.get(server.url + '/apps/test-a').end(function (err, res) {
        validation.check(res, {
          status: 200,
          schema: schemas.appsSingle
        }); 

        res.body.should.have.property('app');
        checkApp(res.body.app);
        done();
      });
    });

  });

  describe('GET /hostings', function () {

    it('valid', function (done) {
      const test =  {
        regions: {
          region1: {
            name: 'Region 1',
            localizedName: { fr: 'Region 1' },
            zones: {
              zone1: {
                name: 'Zone 1',
                localizedName: { fr: 'Zone 1' },
                hostings: {
                  'exoscale.ch-ch': {
                    url: 'http://www.exoscale.ch',
                    name: 'Exoscale',
                    description: 'Swiss quality',
                    available: true,
                    availableCore: 'https://co2.rec.la'
                  },
                  'local-api-server': {
                    url: 'http://localhost',
                    name: 'Switzerland',
                    description: 'Switzerland',
                    available: true,
                    availableCore: 'http://localhost:3000'
                  },
                  'test.ch-ch': {
                    available: true,
                    description: 'Hosting provider slogan',
                    localizedDescription: {},
                    name: 'Hosting provider name',
                    url: 'https://hostingprovider.com'
                  },
                  'mock-api-server': {
                    available: true,
                    availableCore: 'http://localhost:3000',
                    description: 'Hosting provider slogan',
                    localizedDescription: {},
                    name: 'Hosting provider name',
                    url: 'https://hostingprovider.com'
                  }
                }
              }
            }
          }
        }
      };
      const path = '/hostings';

      request.get(server.url + path).end(function(err,res) {
        assert.deepEqual(res.status, 200);
        assert.deepEqual(res.body, test);
       done();
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
