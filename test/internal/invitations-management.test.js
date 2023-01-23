/*global describe, it, before, after*/

/*
 * test for generic behaviour of the app
 */

require('../../src/server');
var should = require('should');
const config = require('../../src/config');
require('readyness/wait/mocha');

var invitations = require('../../src/storage/invitations');

describe('INTERNAL invitations managements', function () {
  let defaultConfigInvitationTokens;

  before(function () {
    defaultConfigInvitationTokens = config.get('invitationTokens');
    config.set('invitationTokens', ['enjoy']);
  });

  after(function () {
    config.set('invitationTokens', defaultConfigInvitationTokens);
  });

  describe('checkIfValid', function () {
    it('should accept enjoy', function (done) {
      invitations.checkIfValid('enjoy', function (isValid) {
        isValid.should.be.equal(true);
        done();
      });
    });

    it('should refuse an invalid token', function (done) {
      invitations.checkIfValid('blup', function (isValid) {
        isValid.should.be.equal(false);
        done();
      });
    });
  });

  describe('consumeToken', function () {
    var generatedToken = null;
    before(function (done) {
      invitations.generate(
        1,
        'test',
        'too counsume token',
        function (error, result) {
          generatedToken = result;
          done();
        }
      );
    });

    it('should accept enjoy', function (done) {
      invitations.consumeToken('enjoy', 'wactiv', function (error) {
        should.not.exist(error);
        done();
      });
    });

    it('should refuse an invalid token', function (done) {
      invitations.consumeToken('blup', 'wactiv', function (error) {
        should.exist(error);
        done();
      });
    });

    it('should accept an invalid token', function (done) {
      invitations.consumeToken(
        generatedToken[0].id,
        'wactiv',
        function (error) {
          should.not.exist(error);

          invitations.checkIfValid(generatedToken[0].id, function (isValid) {
            isValid.should.be.equal(false);
            done();
          });
        }
      );
    });
  });

  describe('generateToken', function () {
    it('should generate 2 tokens', function (done) {
      invitations.generate(
        2,
        'test',
        'Testing token',
        function (error, result) {
          should.not.exist(error);
          should.exist(result);
          result.should.be.instanceOf(Array);
          result.length.should.be.equal(2);
          done();
        }
      );
    });
  });

  describe('getAll', function () {
    it('should find tokens', function (done) {
      invitations.getAll(function (error, result) {
        should.not.exist(error);
        should.exist(result);
        result.should.be.instanceOf(Array);
        for (var i = 0; i < result.length; i++) {
          result[0].should.have.property('id');
        }

        done();
      });
    });
  });
});
