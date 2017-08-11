// @flow

const util = require('util');

const logger = require('winston');

const db = require('../storage/database');

const checkAndConstraints = require('../utils/check-and-constraints');
const config = require('../utils/config');
const dns = require('./ndns-wrapper');

import type { DnsRequest, DnsResponse, DnsRecord, DnsData } from './ndns-wrapper';

//static entries; matches a fully qualified names
const staticDataFull = {
  'isc.org': false
};
const mxData = {
  mail: config.get('dns:mail')
};

const baseData = {
  autority: config.get('dns:name') + ',admin.' + config.get('dns:domain'),
  nameserver: config.get('dns:nameserver'),
};
const nsData = {
  nameserver: baseData.nameserver
};

const soaData = {
  autority: baseData.autority
};

const rootData = {
  autority: baseData.autority,
  nameserver: baseData.nameserver,
  ip: config.get('dns:domain_A'),
  mail: mxData.mail
};

//static entries; matches 'in domains' names
const staticDataInDomain = config.get('dns:staticDataInDomain');


// Logger setup
logger['default'].transports.console.level = 'debug';
logger['default'].transports.console.colorize = true;

// logger.config.syslog.levels: 
// 
// { debug: 0,
//   info: 1,
//   notice: 2,
//   warning: 3,
//   error: 4,
//   crit: 5,
//   alert: 6,
//   emerg: 7 }
//
logger.setLevels(logger.config.syslog.levels);


// test with http://www.dnsvalidation.com/
// http://www.dnssniffer.com/include/report-includes.php?domain=pryv.io&advanced=
// http://www.db.ripe.net/cgi-bin/delcheck/delcheck2.cgi

// packets
// http://marcoceresa.com/net-dns/classes/Net/DNS/Header.html

function serverForName(
  reqName: string, 
  callback: (req: DnsRequest, res: DnsResponse, rec: DnsRecord) => void, 
  req: DnsRequest, res: DnsResponse
): void {
  const domains = config.get('dns:domains');
  var nullRecord = dns.getRecords({}, reqName);

  //simpler request matching in lower case
  var keyName = reqName.toLowerCase();

  //reserved, static records
  if (keyName in staticDataFull) {
    return callback(req, res, dns.getRecords(staticDataFull[keyName], reqName));
  }

  logger.info('DNS: ' + keyName);
 
  if ( domains.indexOf(keyName) > -1) {
    switch (req.q[0].typeName) {
    case 'MX':
      return callback(req, res, dns.getRecords(mxData, reqName));
    case 'NS':
      return callback(req, res, dns.getRecords(nsData, reqName));
    case 'SOA':
    case 'DNSKEY':
      return callback(req, res, dns.getRecords(soaData, reqName));
    default:
      return callback(req, res, dns.getRecords(rootData, reqName));
    }
  }

  //console.log("**** " + keyName);

  // look for matches within domain .pryv.io
  var resourceName; 

  try {
    resourceName = checkAndConstraints.extractResourceFromHostname(keyName, domains);
  }
  catch (err) {
    logger.warning('DNS: ' + err);
  }

  if (resourceName == null) {
    logger.info('DNS: (Not in domain) ' + keyName);
    return callback(req, res, nullRecord);
  }

  // reserved, static records within domain
  if (resourceName in staticDataInDomain) {
    const staticData = staticDataInDomain[resourceName];
    return callback(req, res, dns.getRecords(staticData, reqName));
  }
  
  if (! checkAndConstraints.isLegalUsername(resourceName)) {
    logger.warning(`DNS: ${util.inspect(resourceName)} is no legal username.`);
    return callback(req, res, nullRecord);
  }
  
  // assert: resourceName fulfills the character level constraints for a username.
  const uid = resourceName;

  // 0 to 4 char length are reserved
  if (uid.length < 5) {
    // nothing found
    return callback(req, res, nullRecord);
  }


  db.getServer(uid, function (error, result) {
    //console.log('*** FOUND :'+ result);
    if (error || ! result) { return callback(req, res, nullRecord); }

    var dyn: DnsData = {
      'alias': [ { name: result } ]};
      
    // add Authority or Nameservers
    switch (req.q[0].typeName) {
    case 'NS':
      dyn.nameserver = baseData.nameserver;
      break;
    case 'SOA':
      dyn.autority = baseData.autority;
      break;
    }

    var rec = dns.getRecords(dyn, reqName);
    return callback(req, res, rec); // ndns-warper.sendresponse
  });
}
module.exports = {
  serverForName: serverForName, 
  logger: logger 
};

