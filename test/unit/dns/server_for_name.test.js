/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const { serverForName } = require('../../../src/dns/server_for_name.js');
const config = require('../../../src/config');
const chai = require('chai');
const assert = chai.assert;

describe('serverForName', () => {
  it('handles static lookups', (done) => {
    const req = 'req';
    const res = 'res';
    const callback = (req, res, resolvedRecord) => {
      assert.deepEqual(resolvedRecord.REP, [
        ['foo.bar.pryv.me', 3600, 'IN', 'A', '1.2.3.4']
      ]);
      done();
    };
    serverForName('foo.bar.pryv.me', callback, req, res);
  });
  it('handles TXT records at root domain', () => {
    const domain = config.get('dns:domain');
    const ttl = config.get('dns:defaultTTL');
    const rootTXTRecords = config.get('dns:rootTXT:description');
    const req = {
      q: {
        0: {
          typeName: 'TXT'
        }
      }
    };
    const res = 'res';
    const callback = (req, res, resolvedRecord) => {
      assert.deepEqual(resolvedRecord.REP, [
        [domain, ttl, 'IN', 'TXT', rootTXTRecords[0]],
        [domain, ttl, 'IN', 'TXT', rootTXTRecords[1]]
      ]);
    };
    serverForName(domain, callback, req, res);
  });
});
