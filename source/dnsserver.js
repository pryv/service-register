// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');
var config = require('./utils/config');
var db = require('./storage/database.js');

// create matching Regex
var _temp = "([a-z0-9]{3,21})\\."+ config.get("dns:domain").replace(/\./g,"\\.");

var matchingRegExp = new RegExp("^"+_temp+"$");


var serverForName = function(name,callback,req,res) { 
  var rec = dns.getRecords({},name);
  logger.info("What's the server of: "+ name);
  //logger.info(req);
  // TODO Link regexp with ck.js
  var matchArray = matchingRegExp.exec(name.toLowerCase());
  if (! matchArray) return callback(req,res,rec);
  
  var dyn = {"alias": [ { name: "www.wactiv.com" } ],
        "nameserver": [{
                   "ip": config.get("dns:host"),
		 "name": "ns1.rec.la"
	              }] 
             };
  
  var uid = matchArray[1];
  // 3 to 4 char length are reserved
  if (uid.length < 5) {
      if (uid == "www") { 
          rec = dns.getRecords(dyn,name); };
      
      // nothing found
      return callback(req,res,rec);
  }
  
 
  var server = db.getServer(uid,function(error,result) {
    if (error || ! result) return callback(req,res,rec);
    
    dyn.alias[0].name = result ;
    rec = dns.getRecords(dyn,name);
    return callback(req,res,rec); // ndns_warper.sendresponse
  });
  
   
}

var NAMES = require('./dnsserver_lib/static_hosts.js');

dns.start(NAMES,config.get('dns:port'),config.get('dns:host'),serverForName);
