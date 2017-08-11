// @flow

const { _rotate } = require('../../../source/dns/ndns-wrapper.js');

/* global describe, it */

const chai = require('chai');
const assert = chai.assert;

describe('_rotate', () => {
  it('should rotate the array right by one position', () => {
    const ary = [1, 2, 3, 4, 5, 6];
    const res = _rotate(ary); 
    
    assert.deepEqual(res, [6, 1, 2, 3, 4, 5]);
    
    // NOT a pure function. `this` is returned to allow chaining.
    assert.deepEqual(ary, [6, 1, 2, 3, 4, 5]);
  });
  it('should rotate the array right by n positions', () => {
    const ary = [1, 2, 3, 4, 5, 6];
    const res = _rotate(ary, 3); 
    
    assert.deepEqual(res, [4, 5, 6, 1, 2, 3]);
  });
});

