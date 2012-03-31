// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');
var config = require('./utils/config');
var db = require('./storage/database.js');

var serverForName = function(name,callback,req,res) { 
  var rec = dns.getRecords({},name);
  logger.info("What's the server of: "+ name);
  //logger.info(req);
  // TODO Link regexp with ck.js
  var matchArray = /^([a-z0-9]{5,21})\.edelwat\.ch$/.exec(name.toLowerCase());
  if (! matchArray) return callback(req,res,rec);
  
  var uid = matchArray[1];
  var server = db.getServer(uid,function(error,result) {
    if (error || ! result) return callback(req,res,rec);
    
    var dyn = { alias: [ { name: result } ],
      dynamic: 'true',
      description: 'hello '+ uid};
      
    rec = dns.getRecords(dyn,name);
    return callback(req,res,rec); // ndns_warper.sendresponse
  });
  
   
}

var NAMES = require('./dnsserver_lib/static_hosts.js');

dns.start(NAMES,config.get('dns:port'),config.get('dns:host'),serverForName);
