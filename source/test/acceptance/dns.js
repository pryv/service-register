var config = require('../config-dns-test');
var exec = require('child_process').exec;
var app = require('../../app-dns');
var logger = require('winston');
var should = require('should');
var _s = require('underscore.string');

require('readyness/wait/mocha');

describe('DNS', function(){
  it('A '+config.get('dns:domain'), function(done){
    dig('CNAME','sw.'+config.get('dns:domain'),function(result) {
      var t = config.get('dns:staticDataInDomain:sw:alias');
      result.should.equal(t[0].name+".");
      done();
    });

  });
});



/**
 * Helper for dns requests using dig
 * @param dns_class A, NS, CNAME (optional)
 * @param name the domain to search 
 * @param result function(error,result) {} 
 */
function dig(dns_class,name,result) { 
  var cmd = 'dig +short @'+config.get('dns:ip')+' -p '+config.get('dns:port')+
    ' '+dns_class+' '+name;

  exec(cmd, function callback(error, stdout, stderr){
    stdout = _s.trim(stdout," \n");
    if (stderr && stderr != '') { throw Error(stderr+' | running '+cmd); }
    
    if ((! stdout) || (stdout == ''))  {
      throw new Error('no result for '+dns_class+' '+name+' ('+stderr+')');
    }
    result(stdout);
  });
}