// @flow

/* global describe, before, after, it */

const awaiting = require('awaiting');
const chai = require('chai');
const assert = chai.assert; 
const _ = require('lodash');

const config = require('../../source/utils/config');
const Server = require('../../source/server.js');
const Promise = require('bluebird');

const Mock = require('../support/Mock');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
const reportMock = {
  licenseName: 'pryv.io-test-license',
  templateVersion: '1.0.0'
};
const mock = new Mock('https://reporting.pryv.com', '/reports', 'POST', 200, reportMock, () => eventEmitter.emit('report_received'));

describe('service-reporting ON', function () {
  let server: Server;

  before(async () => {
    server = new Server(config);
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  it('server must start and send a report when service-reporting is ON', async function () {
    await awaiting.event(eventEmitter, 'report_received');
    assert.isNotEmpty(server.url); // Check the server has booted
  });
});

describe('service-reporting ON and optOut ON', function () {
  let server: Server;

  before(async () => {
    const configClone = _.cloneDeep(config); // clone it to avoid overriding original config, may be used by further tests.
    configClone.overrides({services: {reporting: {optOut: true}}});
    server = new Server(configClone);
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  it('server must start and not send a report when opting-out reporting', async () => {
    await new Promise(async function (resolve) {
      await awaiting.event(eventEmitter, 'report_received');
      resolve();
    }).timeout(1000)
      .then(() => {
        throw new Error('Should not have received a report');
      })
      .catch(error => {
        if (error instanceof Promise.TimeoutError) {
          // Everything is ok, the promise should have timeouted
          // since the report has not been sent.
          assert.isNotEmpty(server.url); // Check the server has booted
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
  let server: Server;

  before(async () => {
    mock.stop();
    server = new Server(config);
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  it('server must start and not send a report when service-reporting is OFF', async function () {
    await new Promise(async function (resolve) {
      await awaiting.event(eventEmitter, 'report_received');
      resolve();
    }).timeout(1000)
    .then(() => {
      throw new Error('Should not have received a report');
    })
    .catch(error => {
      if (error instanceof Promise.TimeoutError) {
        // Everything is ok, the promise should have timeouted
        // since the report has not been sent.
        assert.isNotEmpty(server.url); // Check the server has booted
      } else {
        assert.fail(error.message);
      }
    });
  });
});
