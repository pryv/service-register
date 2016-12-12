/*global describe,it*/
var validation = require('../support/data-validation'),
  schemas = require('../../source/model/schema.responses'),
  request = require('superagent'),
  server = require('../../source/server');

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

});
