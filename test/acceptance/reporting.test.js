// @flow

/* global describe, before, after, it */

const httpServer = require('../support/httpServer');
const awaiting = require('awaiting');
const chai = require('chai');
const assert = chai.assert; 
const Server = require('../../source/server.js');
const Mock = require('../support/Mock');
const EventEmitter = require('events');

const Promise = require('bluebird');

describe('service-reporting ON', function () {
  let reportHttpServer;
  let reportMock;
  const reportHttpServerPort = 4001;
  let server: Server;
  let a: EventEmitter;

  before(async () => {
    reportMock = {
      licenseName: 'pryv.io-test-license',
      apiVersion: '1.4.26',
      templateVersion: '1.0.0'
    };
    a = new EventEmitter();
    new Mock('https://reporting.pryv.com', '/reports', 'POST', 200, reportMock, () => a.emit('report_received'));
    
    //reportHttpServer = new httpServer('/reports', 200, reportMock);
    //await reportHttpServer.listen(reportHttpServerPort);
    server = new Server();
    await server.start();
  });

  after(async () => {
    //reportHttpServer.close();
    await server.stop();
  });

  it('server must start and send a report when service-reporting is ON', async function () {
    await awaiting.event(a, 'report_received');
    assert.isNotEmpty(server.url); // Check the server has booted
  });
});

describe('service-reporting ON and optOut ON', function () {
  let reportHttpServer;
  let reportMock;
  const reportHttpServerPort = 4001;
  let server: Server;

  before(async () => {
    reportMock = {
      licenseName: 'pryv.io-test-license',
      apiVersion: '1.4.26',
      templateVersion: '1.0.0'
    };
    reportHttpServer = new httpServer('/reports', 200, reportMock);
    await reportHttpServer.listen(reportHttpServerPort);

    const customSettings = {services: {reporting: {optOut: true}}};
    server = new Server(customSettings);
    await server.start();
  });

  after(async () => {
    reportHttpServer.close();
    await server.stop();
  });

  it('server must start and not send a report when opting-out reporting', async () => {
    await new Promise(async function (resolve) {
      await awaiting.event(reportHttpServer, 'report_received');
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

describe('service-reporting OFF', function () {
  let reportHttpServer;
  let server: Server;

  before(async () => {
    reportHttpServer = new httpServer('/reports', 200, {});
    server = new Server();
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  it('server must start and not send a report when service-reporting is OFF', async function () {
    await new Promise(async function (resolve) {
      await awaiting.event(reportHttpServer, 'report_received');
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
