const { serverForName } = require('../../../src/dns/server_for_name.js');
const config = require('../../../src/config');

/* global describe, it */

const chai = require('chai');
const assert = chai.assert;

describe('serverForName', () => {
  it('handles static lookups', (done) => {
    const req = 'req';
    const res = 'res';
    const callback = (req, res, resolvedRecord) => {
      assert.deepEqual(resolvedRecord.REP, [ [ 'foo.bar.pryv.me', 3600, 'IN', 'A', '1.2.3.4' ] ]);

      done();
    };

    serverForName('foo.bar.pryv.me', callback, req, res);
  });

  it('handles TXT records at root domain', () => {
    const domain = config.get('dns:domain');
    const ttl = config.get('dns:defaultTTL');
    const root_TXT_records = config.get('dns:rootTXT:description');

    const req = {
      q: {
        '0': {
          typeName: 'TXT',
        }
      }
    };
    const res = 'res';
    const callback = (req, res, resolvedRecord) => {
      assert.deepEqual(resolvedRecord.REP, [
        [ domain, ttl, 'IN', 'TXT', root_TXT_records[0] ],
        [ domain, ttl, 'IN', 'TXT', root_TXT_records[1] ]
      ]);
    };
    serverForName(domain, callback, req, res);
  });
});
