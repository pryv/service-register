/* global describe, it, before */

const server = require('../../source/server');
const request = require('superagent');
const config = require('../../source/utils/config');
const dataValidation = require('../support/data-validation');

describe('GET /conf/core', function () {
  const coreConf = {coreValue1: 1, coreValue2: 2, coreValue3: 3};

  before(function () {
    config.set('mainConf', {
      domain: 'rec.la',
      secrets: {
        core: {
          adminAccessKey: 'CORE_ADMIN_KEY',
          ssoCookieSignSecret: 'OVERRIDE_ME',
          filesReadTokenSecret: 'OVERRIDE_ME',
          mailKey: 'CORE_MAIL_KEY'
        },
        register: {
          adminAccessKey: 'test-admin-key'
        }
      }
    });
    config.set('coreConf', coreConf);
  });

  const path = '/conf/core';

  it('fetches the core configuration file', function (done) {
    request.get(server.url + path).end(function(err,res) {
      const test = {status: 200, JValues: coreConf};

      dataValidation.jsonResponse(err, res, test, done);
    });
  });

});
