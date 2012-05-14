// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');
var config = require('./utils/config');
var db = require('./storage/database.js');

// test with http://www.dnsvalidation.com/
// http://www.dnssniffer.com/include/report-includes.php?domain=rec.la&advanced=

// create matching Regex
// TODO Link regexp with ck.js
var _temp = "([a-z0-9]{3,21})\\."+ config.get("dns:domain").replace(/\./g,"\\.");

var matchingRegExp = new RegExp("^"+_temp+"$");

var baseData = {
      autority: config.get("dns:name")+",admin."+config.get("dns:domain"),
    nameserver: config.get("dns:nameserver") 
};

var mxData = {
     mail: config.get("dns:mail"),
};

var nsData = {
     nameserver: baseData.nameserver,
};

var rootData = {
    autority: baseData.autority,
  nameserver: baseData.nameserver,
       alias: [ { name: config.get("dns:name") } ],
        mail: mxData.mail,
};




var serverForName = function(name,callback,req,res) { 
  var nullRecord = dns.getRecords({},name);
  
  console.log(nullRecord);
  
  if (name == "isc.org") return;
  logger.info("DNS "+req.rinfo.address+" "+ name+ " "+JSON.stringify(req.q));
  
  
  // root request
  if (name.toLowerCase() == config.get("dns:domain")) {
      switch (req.q[0].typeName) {
	  case 'MX':
		return callback(req,res,dns.getRecords(mxData,name));
	  break;
	  case 'NS':
	  	console.log("***NS***");
		return callback(req,res,dns.getRecords(nsData,name));
	  break;
	  default:
	    return callback(req,res,dns.getRecords(rootData,name));
	  break;
	  }
  }
  
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
  
 
  db.getServer(uid,function(error,result) {
    //console.log("*** FOUND :"+ result);
    if (error || ! result) return callback(req,res,nullRecord);
    var dyn = {"alias": [ { name: result } ] };
    // add Authority or Nameservers
    switch (req.q[0].typeName) {
	  case 'NS':
		dyn.nameserver = baseData.nameserver;
	  break;
	  case 'SOA':
		dyn.autority = baseData.autority;
	  break;
	}
    
    rec = dns.getRecords(dyn,name);
    return callback(req,res,rec); // ndns_warper.sendresponse
  });
  
   
}

var NAMES = require('./dnsserver_lib/static_hosts.js');

readyListening = require('readyness').waitFor('app_static:listening');
dns.start(NAMES,config.get('dns:port'),config.get('dns:ip'),serverForName,readyListening);
