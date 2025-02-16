/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const request = require('superagent');
const lodash = require('lodash');
const exec = require('child_process').exec;
const bluebird = require('bluebird');
const assert = require('chai').assert;

const config = require('../../src/config');
const Server = require('../../src/server.js');

require('readyness/wait/mocha');

const domain = config.get('dns:domain');

const authAdminKey = 'test-admin-key';

describe('POST /records', function () {
  let server;

  before(async function () {
    server = new Server();
    await server.start();
  });

  after(async function () {
    await server.stop();
  });

  it('A dig should retrieve DNS updates', async function () {
    const key = 'acme';
    const val = 'abc';
    const payload = {};
    payload[key] = { description: val };
    await request
      .post(server.url + '/records')
      .set('Authorization', authAdminKey)
      .send(payload);
    await bluebird.fromCallback((cb) => {
      dig('TXT', key + '.' + domain, function (error, result) {
        assert.notExists(error);
        result = result.replace(/^"|"$/g, ''); // Strip boundary quote
        assert.strictEqual(result, val);
        cb();
      });
    });
  });
});

/** Helper for dns requests using dig.
 *
 * @param dnsClass - A, NS, CNAME (optional)
 * @param name - the domain to search
 * @param result - function (error, result)
 */
function dig (dnsClass, name, result, useIPv6) {
  const type = useIPv6 ? ' -6 ' : ' -4 ';
  const host = useIPv6 ? config.get('dns:ip6') : config.get('dns:ip');
  const cmd =
    'dig +short @' +
    host +
    ' ' +
    type +
    ' -p ' +
    config.get('dns:port') +
    ' ' +
    dnsClass +
    ' ' +
    name;

  exec(cmd, function callback (error, stdout, stderr) {
    stdout = lodash.trim(stdout, ' \n');
    if (stderr && stderr !== '') {
      throw new Error(stderr + ' | running ' + cmd);
    }

    if (!stdout || stdout === '') {
      throw new Error(
        'no result for ' + dnsClass + ' ' + name + ' (' + stderr + ')'
      );
    }
    result(error, stdout);
  });
}
