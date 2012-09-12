// dns server 
var logger = require('winston');
var dns = require('./dnsserver_lib/ndns_warper.js');
var config = require('./utils/config');
var ck = require('./utils/ck');
var db = require('./storage/database.js');

logger['default'].transports.console.level = 'debug';
logger['default'].transports.console.colorize = true;

// test with http://www.dnsvalidation.com/
// http://www.dnssniffer.com/include/report-includes.php?domain=pryv.io&advanced=
// http://www.db.ripe.net/cgi-bin/delcheck/delcheck2.cgi

// packets
// http://marcoceresa.com/net-dns/classes/Net/DNS/Header.html

// TODO do some caching w/redis: create records only once


var baseData = {
      autority: config.get('dns:name')+',admin.'+config.get('dns:domain'),
    nameserver: config.get('dns:nameserver') 
};

var mxData = {
     mail: config.get('dns:mail'),
};

var nsData = {
     nameserver: baseData.nameserver,
};

var soaData = {
     autority: baseData.autority,
};



var rootData = {
    autority: baseData.autority,
  nameserver: baseData.nameserver,
        ip: config.get('dns:domain_A'),
        mail: mxData.mail,
};



//static entries; matches a fully qualified names
var staticDataFull = {
    'isc.org': false,
    '_amazonses.rec.la': {description: 't6vNgpvah1g2WJbjhZn4qJ6zjkYiAmp5Cbj7QXQYTcU='} // DO NOT REMOVE EMAIL CHECK FOR AMAZON SES
}
//static entries; matches 'in domains' names
var staticDataInDomain = { 
    'www': {alias: [ { name: config.get('http:static:name') } ]} // static web files repository
};


var serverForName = function(reqName,callback,req,res) { 
  var nullRecord = dns.getRecords({},reqName);
  //simpler request matching in lower case
  keyName = reqName.toLowerCase()
  
  //reserved, static records
  if (keyName in staticDataFull) {
    return callback(req,res,dns.getRecords(staticDataFull[keyName],reqName));
  }
  
  logger.log('DNS: '+keyName);

  // root request
  if (keyName == config.get('dns:domain')) {
    switch (req.q[0].typeName) {
    case 'MX':
      return callback(req,res,dns.getRecords(mxData,reqName));
      break;
    case 'NS':
      return callback(req,res,dns.getRecords(nsData,reqName));
      break;
    case 'SOA':
    case 'DNSKEY':
      return callback(req,res,dns.getRecords(soaData,reqName));
      break;
    default:
      return callback(req,res,dns.getRecords(rootData,reqName));
    break;
    }
  }

  // look for matches within domain .rec.la
  var uid = ck.extractRessourceFromHostname(keyName);
  
  if (! uid) {
  	logger.log('DNS: (Not in domain) '+keyName);
  	return callback(req,res,nullRecord);
  }
  
  // reserved, static records within domain
  if (uid in staticDataInDomain) {
    return callback(req,res,dns.getRecords(staticDataInDomain[uid],reqName));
  }
  
  // 0 to 4 char length are reserved
  if (uid.length < 5) {
    // nothing found
    return callback(req,res,nullRecord);
  }


  db.getServer(uid,function(error,result) {
    //console.log('*** FOUND :'+ result);
    if (error || ! result) return callback(req,res,nullRecord);
    var dyn = {'alias': [ { name: result } ] };
    // add Authority or Nameservers
    switch (req.q[0].typeName) {
    case 'NS':
      dyn.nameserver = baseData.nameserver;
      break;
    case 'SOA':
      dyn.autority = baseData.autority;
      break;
    }

    rec = dns.getRecords(dyn,reqName);
    return callback(req,res,rec); // ndns_warper.sendresponse
  });
  
   
}

var NAMES = require('./dnsserver_lib/static_hosts.js');

readyListening = require('readyness').waitFor('app_static:listening');
dns.start(NAMES,config.get('dns:port'),config.get('dns:ip'),serverForName,readyListening);
