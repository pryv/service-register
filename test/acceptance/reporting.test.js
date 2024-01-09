/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const awaiting = require('awaiting');
const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash');
const BluebirdPromise = require('bluebird');
const supertest = require('supertest');
const EventEmitter = require('events');
const hostname = require('os').hostname;

const config = require('../../src/config');
const Server = require('../../src/server.js');
const DEFAULT_USERNAME = 'wactiv';
const Mock = require('../support/Mock');
const eventEmitter = new EventEmitter();

let lastReport;
const mock = new Mock(
  'https://reporting.pryv.com',
  '/reports',
  'POST',
  200,
  null,
  (reqBody) => {
    lastReport = reqBody;
    eventEmitter.emit('report_received');
  }
);
let server;
let request;
/** @returns {Promise<void>} */
async function assertServerStarted () {
  await request.get(`/${DEFAULT_USERNAME}/check_username`);
}

describe('service-reporting ON', function () {
  const reportingSettings = {
    optOut: false,
    licenseName: 'pryv.io-test-license',
    role: 'reg-master',
    templateVersion: '1.0.0',
    hostname: hostname()
  };
  const testDomain = 'test.pryv.li';
  before(async () => {
    config.set('reporting', reportingSettings);
    config.set('domain', testDomain);
    server = new Server();
    await server.start();
    request = supertest(server.server);
  });
  after(async () => {
    await server.stop();
  });
  it('YYY server must start and send a report when service-reporting is ON', async function () {
    await awaiting.event(eventEmitter, 'report_received');
    await assertServerStarted();
    assert.equal(
      lastReport.licenseName,
      reportingSettings.licenseName,
      'missing or wrong licenseName'
    );
    assert.equal(
      lastReport.role,
      reportingSettings.role,
      'missing or wrong role'
    );
    assert.equal(
      lastReport.templateVersion,
      reportingSettings.templateVersion,
      'missing or wrong templatVersion'
    );
    assert.equal(
      lastReport.domain,
      reportingSettings.domain,
      'missing or wrong domain'
    );
    assert.equal(
      lastReport.hostname,
      reportingSettings.hostname,
      'missing or wrong hostname'
    );
    assert.isAbove(
      lastReport.clientData.numUsers,
      0,
      'missing or wrong numUsers'
    );
  });
});
describe('service-reporting ON and optOut ON', function () {
  before(async () => {
    const configClone = _.cloneDeep(config); // clone it to avoid overriding original config, may be used by further tests.
    configClone.set('reporting:optOut', 'true');
    server = new Server(configClone);
    await server.start();
    request = supertest(server.server);
  });
  after(async () => {
    await server.stop();
  });
  it('server must start and not send a report when opting-out reporting', async () => {
    await new BluebirdPromise(async function (resolve) {
      await awaiting.event(eventEmitter, 'report_received');
      resolve();
    })
      .timeout(1000)
      .then(() => {
        throw new Error('Should not have received a report');
      })
      .catch(async (error) => {
        if (error instanceof BluebirdPromise.TimeoutError) {
          // Everything is ok, the promise should have timeouted
          // since the report has not been sent.
          await assertServerStarted();
        } else {
          assert.fail(error.message);
        }
      });
  });
});
/**
 * Must be the last test
 * See Mock.js stop() function comments
 */
describe('service-reporting OFF', function () {
  before(async () => {
    mock.stop();
    server = new Server();
    await server.start();
    request = supertest(server.server);
  });
  after(async () => {
    await server.stop();
  });
  it('server must start and not send a report when service-reporting is OFF', async function () {
    await new BluebirdPromise(async function (resolve) {
      await awaiting.event(eventEmitter, 'report_received');
      resolve();
    })
      .timeout(1000)
      .then(() => {
        throw new Error('Should not have received a report');
      })
      .catch(async (error) => {
        if (error instanceof BluebirdPromise.TimeoutError) {
          // Everything is ok, the promise should have timeouted
          // since the report has not been sent.
          await assertServerStarted();
        } else {
          assert.fail(error.message);
        }
      });
  });
});
