'use strict';
// @flow

/* global describe, it, before */
const exec = require('child_process').exec;
const _s = require('underscore.string');
const should = require('should');

const config = require('../../source/utils/config');
var db = require('../../source/storage/database');

require('../../source/app-dns');

require('readyness/wait/mocha');

describe('DNS', function () {
  before(function (done) {
    db.setServerAndInfos('dns-test', 'dummy.pryv.net', {}, function(error) {
      done(error);
    });
  });

  it('username with "-" should be valid', function (done) {
    dig('CNAME', 'dns-test.' + config.get('dns:domain'), function (error, result) {
      result.should.equal('dummy.pryv.net' + '.');
      done();
    });
  });
  it('A ' + config.get('dns:domain'), function (done) {
    dig('CNAME', 'sw.' + config.get('dns:domain'), function (error, result) {
      if (error) { return done(error); }
      
      var t = config.get('dns:staticDataInDomain:sw:alias');

      should.exist(result);
      if (result) {
        result.should.equal(t[0].name + '.');
      }
      done();
    });
  });
});

/** Helper for dns requests using dig.
 * 
 * @param dns_class - A, NS, CNAME (optional)
 * @param name - the domain to search
 * @param result - function (error, result) 
 */
function dig(dns_class, name, result) {
  var cmd = 'dig +short @' + config.get('dns:ip') + ' -p ' + config.get('dns:port') +
    ' ' + dns_class + ' ' + name;
  
  exec(cmd, function callback(error, stdout, stderr) {
    stdout = _s.trim(stdout, ' \n');
    if (stderr && stderr !== '') { throw new Error(stderr + ' | running ' + cmd); }
  
    if ((! stdout) || (stdout === ''))  {
      throw new Error('no result for ' + dns_class + ' ' + name + ' (' + stderr + ')');
    }
    result(error, stdout);
  });
}