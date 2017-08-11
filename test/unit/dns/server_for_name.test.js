// @flow

const { serverForName } = require('../../../source/dns/server_for_name.js');

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
});