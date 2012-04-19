// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');
var config = require('./utils/config');
var db = require('./storage/database.js');

// create matching Regex
// TODO Link regexp with ck.js
var _temp = "([a-z0-9]{3,21})\\."+ config.get("dns:domain").replace(/\./g,"\\.");

var matchingRegExp = new RegExp("^"+_temp+"$");

var baseData = {"nameserver": [{
                   "ip": config.get("dns:host"),
		         "name": config.get("dns:hostname")
	              }] 
             };

var rootData = {"alias": [ { name: "www.wactiv.com" } ], "nameserver": baseData.nameserver};

var serverForName = function(name,callback,req,res) { 
  var nullRecord = dns.getRecords({},name);
  logger.info("What's the server of: "+ name);
  
  // root request
  if (name.toLowerCase() == config.get("dns:domain"))
      return callback(req,res,dns.getRecords(rootData,name));
  
  //logger.info(req);
  var matchArray = matchingRegExp.exec(name.toLowerCase());
  if (! matchArray) return callback(req,res,nullRecord);
  
  var uid = matchArray[1];
  // 0 to 4 char length are reserved
  if (uid.length < 5) {
      if (uid == "www") 
          return callback(req,res,dns.getRecords(rootData,name));
      
      // nothing found
      return callback(req,res,nullRecord);
  }
  
 
  var server = db.getServer(uid,function(error,result) {
    //console.log("*** FOUND :"+ result);
    if (error || ! result) return callback(req,res,nullRecord);
    
    var dyn = {"alias": [ { name: result } ], "nameserver": baseData.nameserver};
    rec = dns.getRecords(dyn,name);
    return callback(req,res,rec); // ndns_warper.sendresponse
  });
  
   
}

var NAMES = require('./dnsserver_lib/static_hosts.js');

readyListening = require('./utils/readyness').waitFor('app_static:listening');
dns.start(NAMES,config.get('dns:port'),config.get('dns:host'),serverForName,readyListening);
