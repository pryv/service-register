
/* global describe, before, after, it */
const request = require('superagent');
const lodash = require('lodash');
const exec = require('child_process').exec;
const bluebird = require('bluebird');
const assert = require('chai').assert;

const config = require('../../source/utils/config');
const Server = require('../../source/server.js');

require('readyness/wait/mocha');

const domain = config.get('dns:domain');

const authAdminKey = 'test-admin-key';

describe('POST /records', function () {
  let server;

  before(async function () {
    server = new Server(config);
    await server.start();
  });

  after(async function () {
    await server.stop();
  });


  it('should work', async function () {
    const key = 'acme';
    const val = 'abc';
    const payload = {};
    payload[key] = {description: val};
    const res = await request.post(server.url + '/records')
      .set('Authorization', authAdminKey)
      .send(payload);
    console.log('res', JSON.stringify(res.body, null, 2));
    await bluebird.fromCallback(cb => {
      dig('TXT', key + '.' + domain, function (error, result) {
        console.log('got err?', error);
        console.log('res', result)
        assert.strictEqual(result, val);
        cb();
      });
    });
    
  });
});

/** Helper for dns requests using dig.
 * 
 * @param dns_class - A, NS, CNAME (optional)
 * @param name - the domain to search
 * @param result - function (error, result) 
 */
function dig(dns_class, name, result, useIPv6) {
  const type = useIPv6 ? ' -6 ' : ' -4 ';
  const host = useIPv6 ? config.get('dns:ip6') : config.get('dns:ip');
  const cmd = 'dig +short @' + host + ' ' + type + ' -p ' + config.get('dns:port') +
    ' ' + dns_class + ' ' + name;

  exec(cmd, function callback(error, stdout, stderr) {
    stdout = lodash.trim(stdout, ' \n');
    if (stderr && stderr !== '') { throw new Error(stderr + ' | running ' + cmd); }

    if ((!stdout) || (stdout === '')) {
      throw new Error('no result for ' + dns_class + ' ' + name + ' (' + stderr + ')');
    }
    result(error, stdout);
  });
}