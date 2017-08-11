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
      console.log(resolvedRecord);
      done(); 
    }
    serverForName('foo.bar.domain.com', callback, req, res); 
  });
});