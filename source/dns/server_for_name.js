/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
// @flow

const util = require('util');

const logger = require('winston');

const db = require('../storage/database');

const checkAndConstraints = require('../utils/check-and-constraints');
const config = require('../config');
const dns = require('./ndns-wrapper');

import type { DnsRequest, DnsResponse, DnsRecord, DnsData } from './ndns-wrapper';

const staticDataFull = {
  'isc.org': false
};
const mxData = {
  mail: config.get('dns:mail')
};

const baseData = {
  autority: config.get('dns:name') + ',admin.' + config.get('dns:domain'),
  nameserver: config.get('dns:nameserver'),
  certificate_authority_authorization: config.get('dns:certificateAuthorityAuthorization'),
};
const nsData = {
  nameserver: baseData.nameserver || [{}]
};

const soaData = {
  autority: baseData.autority
};

const rootData = {
  autority: baseData.autority,
  nameserver: baseData.nameserver || [{}],
  ip: config.get('dns:domain_A'),
  mail: mxData.mail,
  txt: config.get('dns:rootTXT'),
};

const caaData = {
  certificate_authority_authorization: baseData.certificate_authority_authorization || {},
};

//static entries; matches 'in domains' names



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

// packets
// http://marcoceresa.com/net-dns/classes/Net/DNS/Header.html

function serverForName(
  reqName: string, 
  callback: (req: DnsRequest, res: DnsResponse, rec: DnsRecord) => void, 
  req: DnsRequest, res: DnsResponse
): void {
  //static entries; matches a fully qualified names
  const staticDataInDomain = config.get('dns:staticDataInDomain');
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
    case 'CAA':
      return callback(req, res, dns.getRecords(caaData, reqName));
    case 'MX':
      return callback(req, res, dns.getRecords(mxData, reqName));
    case 'NS':
      return callback(req, res, dns.getRecords(nsData, reqName));
    case 'SOA':
    case 'DNSKEY':
      return callback(req, res, dns.getRecords(soaData, reqName));
    case 'TXT':
      return callback(req, res, dns.getRecords(rootData.txt, reqName));
    default:
      return callback(req, res, dns.getRecords(rootData, reqName));
    }
  }

  // look for matches within domain .pryv.io
  var resourceName; 

  try {
    resourceName = checkAndConstraints.extractResourceFromHostname(keyName, domains);
  }
  catch (err) {
    logger.warn('DNS: ' + err);
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



  getEntryFromDB(resourceName, function (error, dyn) {
    if (error || ! dyn) { return callback(req, res, nullRecord); }

      
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

function getEntryFromDB(resourceName, callback) {
  
  getEntryFromKey(resourceName, function (err, dbEntry) {
    if (err) return callback(err, null); 
    if (dbEntry) return callback(null, dbEntry);

    getAliasForuser(resourceName, callback);
  });
}

function getEntryFromKey(resourceName, callback) {
  db.getNSEntry(resourceName, callback);
}

function getAliasForuser(resourceName, callback) {
  // username 
  if (! checkAndConstraints.isLegalUsername(resourceName)) {
    logger.warn(`DNS: ${util.inspect(resourceName)} is no legal username.`);
    return callback(null, null);
  }
  
  // assert: resourceName fulfills the character level constraints for a username.
  const uid = resourceName;

  // 0 to 4 char length are reserved
  if (uid.length < 5) {
    // nothing found
    return callback(null, null);
  }


  db.getServer(uid, function (error, result) {
    if (error || ! result) { return callback(error, null); }

    var dyn: DnsData = {
      'alias': [ { name: result } ]
    };
    callback(null, dyn);
  });
}


module.exports = {
  serverForName: serverForName, 
  logger: logger 
};

