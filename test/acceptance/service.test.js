/*global describe,it*/
var config = require('../../source/utils/config.js'),
  validation = require('../support/data-validation'),
  schemas = require('../../source/model/schema.responses'),
  request = require('superagent');

require('readyness/wait/mocha');

describe('/service', function () {

  describe('GET /service/infos', function () {

    it('infos', function (done) {
      request.get(config.get('http:register:url') + '/service/infos').end(function (res) {
        validation.check(res, {
          status: 200,
          schema: schemas.serviceInfos
        }, function (error) {
          if (error) { done(error); }

          done();
        });
      });
    });
  });

});
