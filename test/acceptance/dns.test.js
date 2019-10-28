// @flow

/* global describe, it, before */

const lodash = require('lodash');

const exec = require('child_process').exec;

const should = require('should');

const chai = require('chai');
const assert = chai.assert; 

const config = require('../../source/utils/config');
var db = require('../../source/storage/database');
const ndns = require('../../source/dns/ndns');
const Client = ndns.Client;

require('../../source/app-dns');

require('readyness/wait/mocha');

describe('DNS', function () {

  const domain = config.get('dns:domain');

  describe('users', () => {

    before(function (done) {
      const info = { email: 'foo@bar.ch' };

      // FLOW Not really a full user info, but it doesn't matter here.
      db.setServerAndInfos('dns-test', 'dummy.pryv.net', info, function (error) {
        done(error);
      });
    });

    it('username with "-" should be valid', function (done) {
      dig('CNAME', 'dns-test.' + config.get('dns:domain'), function (error, result) {
        assert.strictEqual(result, 'dummy.pryv.net.');
        done();
      });
    });

  });

  describe('staticDataInDomain', () => {

    const staticDataInDomain = config.get('dns:staticDataInDomain');

    describe('TXT records', () => {

      it('multiple records', (done) => {

        const key = '_acme-challenge';
        const values = staticDataInDomain[key].description;
        
        dig('TXT', key + '.' + domain, (err, res) => {
          if (err) {
            return done(err);
          }
          const resValues = res.split('\n');

          values.forEach((v) => {
            let found = false;
            resValues.forEach((rv) => {
              if ('"' + v + '"' === rv) found = true;
            });
            assert.isTrue(found);
          })
          done();
        });
      });

      it('should accept a single entry (old previous TXT format)', (done) => {

        const key = 'previous-format';
        const value = staticDataInDomain[key].description;

        dig('TXT', key + '.' + domain, (err, res) => {
          if (err) {
            return done(err);
          }
          assert.strictEqual(res, '"' + value + '"');
          done();
        });
      });

    });

    it('A ' + config.get('dns:domain'), function (done) {
      dig('CNAME', 'sw.' + domain, function (error, result) {
        if (error) { return done(error); }

        var t = config.get('dns:staticDataInDomain:sw:alias');

        should.exist(result);
        if (result) {
          assert.strictEqual(result, t[0].name + '.');
        }
        done();
      });
    });

    it('UDP6 A ' + config.get('dns:domain'), function (done) {
      dig('CNAME', 'sw.' + domain, function (error, result) {
        if (error) { return done(error); }

        const t = config.get('dns:staticDataInDomain:sw:alias');

        should.exist(result);
        if (result) {
          assert.strictEqual(result, t[0].name + '.');
        }
        done();
      }, true);
    });
  });


  describe('CAA records', () => {
    it('work', (done) => {
      dig('CAA', config.get('dns:domain'), function (error, result) {
        if (error) { return done(error); }

        assert.strictEqual(result, '0 issue "letsencrypt.org"');

        done();
      });
    });
  });

  describe('root TXT record', () => {

    const domain = config.get('dns:domain');
    const root_TXT_records = config.get('dns:rootTXT');

    it('works for multiple entries', (done) => {

      dig('TXT', domain, (err, res) => {
        if (err) {
          return done(err);
        }
        const responseArray = res.split('\n');
        root_TXT_records.description.forEach((txtRecord) => {
          let found = false;
          responseArray.forEach((response) => {
            
            if ('"' + txtRecord + '"' === response) {
              found = true;
            }
          });
          assert.isTrue(found);
        });
        done();
      });
    });
  });
  
  describe('Vulnerability 2018022102:', () => {
    
    // Simulate the case where our DNS receives
    // a query that is in fact a (replayed) DNS response.
    // We want to ensure that our DNS do not answer to DNS responses,
    // since it would make it vulnerable to DOS attacks.
    
    it('should not answer to DNS responses', (done) => {
                
      const port = config.get('dns:port');
      const ip = config.get('dns:ip');
      const type = 'udp4';

      const req = {
        q: [{
          name:'google.ch',
          type:1,
          class:1,
          typeName:'A',
          className:'IN'
        }],
        header: {}
      };
      
      const legitClient = new Client(type, legitResponseListener);
      const attackClient = new Client(type, attackResponseListener);
      
      // This first query should not be answered by our DNS.
      // The QR header is set to 1, which indicates that the query
      // is actually a DNS response (potentially replayed by an attacker).
      req.header.qr = 1;
      attackClient.request(port, ip).send(req);
      
      // This second query should be answered by our DNS.
      // The QR header is set to 0, which indicates that the query
      // is a legit DNS query.
      // We delay this query so that if we get an answer, we assume that the
      // previous query was not answered (as expected).
      setTimeout(() => {
        req.header.qr = 0;
        legitClient.request(port, ip).send(req);
      }, 1000);
      
      function legitResponseListener () {
        done();
      }
      
      function attackResponseListener () {
        throw new Error('DNS just answered to a DNS response, '+
          'which makes it vulnerable to DOS attacks!');
      }
      
    });
  });
});

/** Helper for dns requests using dig.
 * 
 * @param dns_class - A, NS, CNAME (optional)
 * @param name - the domain to search
 * @param result - function (error, result) 
 */
function dig(dns_class, name, result, useIPv6) {
  const type = useIPv6 ? ' -6 ' : ' -4 ';
  const host = useIPv6 ? config.get('dns:ip6') : config.get('dns:ip');
  const cmd = 'dig +short @' + host + ' ' + type + ' -p ' + config.get('dns:port') +
    ' ' + dns_class + ' ' + name;
  
  exec(cmd, function callback(error, stdout, stderr) {
    stdout = lodash.trim(stdout, ' \n');
    if (stderr && stderr !== '') { throw new Error(stderr + ' | running ' + cmd); }
  
    if ((! stdout) || (stdout === ''))  {
      throw new Error('no result for ' + dns_class + ' ' + name + ' (' + stderr + ')');
    }
    result(error, stdout);
  });
}