// @flow

const cac = require('../../../source/utils/check-and-constraints.js');

const assert = require('chai').assert;

/* global describe, it */

describe('Checks And Constraints', function () {
  describe('#extractResourceFromHostname', function () {
    it('should extract resource name from fqdn with respect to domains array', function () {
      const result = cac.extractResourceFromHostname(
        "foo.sd.pryv.tech", ['sd.pryv.tech']);
      
      assert.equal(result, 'foo');
    });
  });
});

