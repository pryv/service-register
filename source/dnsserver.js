// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');

var BIND_PORT = 9999;

var serverForName = function(name,callback,req,res) {
  logger.info("What's the server of: "+ name);
  
  var fake = { alias: [ { name: 'blop.perki.com' } ],
  dynamic: 'true',
  description: 'hello Perki' };
  var rec = dns.getRecords(fake,name);
  
  callback(req,res,rec);  
}

//var NAMES = require('./dnsserver_lib/static_hosts.json');

var NAMES = require('./dnsserver_lib/static_hosts.js');

dns.start(NAMES,BIND_PORT,serverForName);
