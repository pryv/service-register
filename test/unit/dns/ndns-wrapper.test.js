/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const { _rotate, _onDnsRequest } = require('../../../src/dns/ndns-wrapper.js');
const chai = require('chai');
const assert = chai.assert;

describe('_rotate', () => {
  it('should rotate the array right by one position', () => {
    const ary = [1, 2, 3, 4, 5, 6];
    const res = _rotate(ary);
    assert.deepEqual(res, [2, 3, 4, 5, 6, 1]);
    // NOT a pure function. `this` is returned to allow chaining.
    assert.deepEqual(ary, [2, 3, 4, 5, 6, 1]);
  });
  it('should rotate the array right by n positions', () => {
    const ary = [1, 2, 3, 4, 5, 6];
    const res = _rotate(ary, 3);
    assert.deepEqual(res, [4, 5, 6, 1, 2, 3]);
  });
});
describe('_onDnsRequest', () => {
  it('should handle empty requests, issuing a warning', () => {
    // Mock out dns environment, simulating the case where the 'q' (questions)
    // array is empty.
    const dyncall = () => undefined;
    const req = { q: [] };
    const res = {};
    res.setHeader = () => undefined;
    res.send = () => undefined;
    _onDnsRequest(dyncall, req, res);
  });
});
