const cac = require('../../../src/utils/check-and-constraints.js');
const {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH
} = require('../../../src/utils/check-and-constraints');
const assert = require('chai').assert;
/* global describe, it */
describe('Checks And Constraints', function () {
  describe('#extractResourceFromHostname', function () {
    it('should extract resource name from fqdn with respect to domains array', function () {
      const result = cac.extractResourceFromHostname('foo.sd.pryv.tech', [
        'sd.pryv.tech'
      ]);
      assert.equal(result, 'foo');
    });
    it('should allow letsencrypt dns challenge hostnames to pass', function () {
      const result = cac.extractResourceFromHostname(
        '_acme-challenge.www.sd.pryv.tech',
        ['sd.pryv.tech']
      );
      assert.equal(result, '_acme-challenge.www');
    });
    it('should disallow other fqdns not in one of our domains', function () {
      const check = () => {
        cac.extractResourceFromHostname('bringmeto.space.ch', ['sd.pryv.tech']);
      };
      assert.throws(check, /I know the following domains: sd.pryv.tech/);
    });
  });
  describe('#isValidUsername', function () {
    ok('foobar');
    ok('a'.repeat(USERNAME_MIN_LENGTH));
    ok('a'.repeat(USERNAME_MAX_LENGTH));
    not_ok('a'.repeat(USERNAME_MIN_LENGTH - 1));
    not_ok('a'.repeat(USERNAME_MAX_LENGTH + 1));
    not_ok('_acme-challenge');
    function ok(name) {
      it(`should accept ${name} as username`, function () {
        assert.isOk(cac.isValidUsername(name));
      });
    }
    function not_ok(name) {
      it(`should NOT accept ${name} as username`, function () {
        assert.isNotOk(cac.isValidUsername(name));
      });
    }
  });
  describe('#lang', function () {
    it('should return the input as-is if it is valid', function () {
      const input = 'abc';
      const result = cac.lang(input);
      assert.equal(input, result);
    });
    it("should return 'en' if the input is null", function () {
      const result = cac.lang(null);
      assert.equal(result, 'en');
    });
    it("should return 'en' if the input is the empty string", function () {
      const result = cac.lang('');
      assert.equal(result, 'en');
    });
    it('should return null if the input contains more than 5 characters', function () {
      const result = cac.lang('abcdef');
      assert.isNull(result);
    });
    it('should return null if the input is not a string', function () {
      const result = cac.lang({});
      assert.isNull(result);
    });
  });
});
