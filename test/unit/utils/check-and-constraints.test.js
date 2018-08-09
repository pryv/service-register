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
    it('should allow letsencrypt dns challenge hostnames to pass', function () {
      const result = cac.extractResourceFromHostname(
        "_acme-challenge.www.sd.pryv.tech", ['sd.pryv.tech']);
      
      assert.equal(result, '_acme-challenge.www');
    });
    it('should disallow other fqdns not in one of our domains', function () {
      const check = () => {
        const result = cac.extractResourceFromHostname(
          "bringmeto.space.ch", ['sd.pryv.tech']);
      };
      assert.throws(check, Error);
    });
  });
  
  describe('#isLegalUsername', function () {
    ok('foobar');
    not_ok('_acme-challenge');
    
    function ok(name) {
      it(`should accept ${name} as username`, function () {
        assert.isOk(cac.isLegalUsername(name));
      });
    }
    function not_ok(name) {
      it(`should NOT accept ${name} as username`, function () {
        assert.isNotOk(cac.isLegalUsername(name));
      });
    }
  });

  describe('#lang', function () {
    it('should return the input as-is if it is valid', function () {
      const input = 'abc';
      const result = cac.lang(input);

      assert.equal(input, result);
    });

    it('should return \'en\' if the input is null', function () {
      const result = cac.lang(null);

      assert.equal(result, 'en');
    });

    it('should return \'en\' if the input is the empty string', function () {
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
    })
  });
});

