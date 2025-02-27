/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const ndns = require('./ndns');
const logger = require('winston');
const config = require('../config');
const defaultTTL = config.get('dns:defaultTTL');

let UpdateConfFile;

require('./_extend.js');

/**
 * @param {Array<T>} ary
 * @param {number} count
 * @returns {T[]}
 */
function rotate (ary, count = 1) {
  const len = ary.length;
  ary.unshift(...ary.splice(count % len, len));
  return ary;
}

/** @typedef {ndns.Message} DnsRequest */

/** @typedef {ndns.Message} DnsResponse */

/**
 * @typedef {{
 *   REP: Array<DnsEntry>
 *   NS: Array<DnsEntry>
 *   ADD: Array<DnsEntry>
 * }} DnsRecord
 */

/** @typedef {Array<string | number>} DnsEntry */

/**
 * @typedef {{
 *   ip?: string | Array<string>
 *   autority?: string
 *   nameserver?: Array<NameserverEntry>
 * }} DnsData
 */

/**
 * @typedef {{
 *   name?: string
 *   ip?: string
 * }} NameserverEntry
 */

/**
 * @typedef {(
 *   name: string,
 *   a: (c: DnsRequest, b: DnsResponse, a: DnsRecord) => void,
 *   req: DnsRequest,
 *   res: DnsResponse
 * ) => void} DnsDynamicHandler
 */

/**
 * Handles each individual DNS request - our main handler function.
 * @param {DnsDynamicHandler} dynamicCall
 * @param {any} req
 * @param {any} res
 * @returns {void}
 */
function onDnsRequest (dynamicCall, req, res) {
  // Ignore DNS responses, since answering to them would represent
  // a vulnerability that can lead to DOS attacks.
  // DNS responses are identified thanks to the request headers:
  //  req.header.qr === 0: this is a DNS query
  //  req.header.qr === 1: this is a DNS response
  if (req.header != null && req.header.qr === 1) {
    return;
  }

  if (req.q.length > 0) {
    const name = validateRequest(req);
    return dynamicCall(name, sendResponse, req, res);
  }

  // close with nothing
  return sendResponse(req, res, null);

  // Validates the DNS request and handles some special cases before going
  // further. Returns the request to handle.
  //
  function validateRequest (req) {
    const name = req.q[0].name;
    // This should be rare. If it is not, we'll need to investigate why this
    // happens.
    if (name == null) {
      logger.warn('Received empty request, treating as if it was empty.');
      return '';
    }
    // Please comment on why we have this code if you know.
    if (name === '.') return '';
    return name;
  }

  function sendResponse (req, res, rec) {
    res.setHeader(req.header);
    for (let i = 0; i < req.q.length; i++) {
      res.addQuestion(req.q[i]);
    }

    if (rec == null) {
      const requestedName = (req.q[0] && req.q[0].name) || '(n/a)';
      logger.info(
        `Could not find ${requestedName} on this server; proxy list is empty`
      );
      // no proxy on this server (added by Perki)

      // maybe some code should be sent
      res.setHeader(req.header);
      res.send();
      return;
    }

    const FLAG_TRUE = 1;
    const FLAG_FALSE = 0;

    res.header.qr = FLAG_TRUE; // Indicates that it is a DNS response
    res.header.ra = FLAG_FALSE; // Recursion available
    res.header.aa = FLAG_TRUE; // Authorative answer

    // Answers count
    res.header.ancount = rec.REP.length;
    // Namespaces count
    res.header.nscount = rec.NS.length;
    // Additional answers count
    res.header.arcount = rec.ADD.length;

    // Add answers
    for (let a = 0; a < rec.REP.length; a++) {
      res.addRR.apply(res, rec.REP[a]);
    }

    // Add namespaces
    for (let b = 0; b < rec.NS.length; b++) {
      res.addRR.apply(res, rec.NS[b]);
    }

    // Add additional answers
    for (let c = 0; c < rec.ADD.length; c++) {
      res.addRR.apply(res, rec.ADD[c]);
    }

    res.send();
  }
}

/**
 * @param {string} BIND_TYPE
 * @param {string} BIND_PORT
 * @param {string} BIND_HOST
 * @param {DnsDynamicHandler} dynamicCall
 * @param {(msg?: string | null) => void} done
 * @returns {void}
 */
function start (BIND_TYPE, BIND_PORT, BIND_HOST, dynamicCall, done) {
  const server = ndns.createServer(BIND_TYPE);
  // Server launch
  server.on('request', (req, res) => onDnsRequest(dynamicCall, req, res));

  server.bind(BIND_PORT, BIND_HOST);
  return done('DNS Started on IP=' + BIND_HOST + ' PORT=' + BIND_PORT + ' ' + BIND_TYPE);
}

/**
 * @param {DnsData} data
 * @param {string} name
 * @returns {DnsRecord}
 */
const getRecords = function (data, name) {
  // Check if this is a dynamic request

  const ret = {
    REP: [],
    NS: [],
    ADD: []
  };
  let i = 0;
  let j = 0;
  let k = 0;
  for (i in data) {
    if (Object.prototype.hasOwnProperty.call(data, i)) {
      j = String(data[i]).replace(/{name}/g, name);

      switch (i.toLowerCase()) {
        case 'ip': {
        // IP address
          const ipAdresses = data[i] instanceof Array ? data[i] : [data[i]];
          rotate(ipAdresses);
          for (let x = 0; x < ipAdresses.length; x++) {
            ret.REP.push([name, defaultTTL, 'IN', 'A', ipAdresses[x]]);
          }
          break;
        }
        case 'description': {
        // handle old format where description is a string
          const txtRecords = data[i] instanceof Array ? data[i] : [data[i]];
          for (let y = 0; y < txtRecords.length; y++) {
            ret.REP.push([name, defaultTTL, 'IN', 'TXT', txtRecords[y]]);
          }
          break;
        }
        case 'autority': {
          let authority = String(j).split(',').slice(0, 2);
          authority =
          authority.length === 1 ? authority.concat(authority) : authority;
          ret.REP.push(
            [name, defaultTTL, 'IN', 'SOA']
              .concat(authority)
              .concat([UpdateConfFile, 1800, 900, 604800, 86400])
          );
          break;
        }
        case 'mail': {
          const mxRecords = data[i] instanceof Array ? data[i] : [data[i]];
          let l = 0;
          for (j = 0; j < mxRecords.length; j++) {
            mxRecords[j].ttl = mxRecords[j].ttl ? mxRecords[j].ttl : defaultTTL;
            mxRecords[j].name = mxRecords[j].name
              ? mxRecords[j].name.replace(/{name}/g, name)
              : 'mail.' + name;
            ret.REP.push([
              name,
              mxRecords[j].ttl,
              'IN',
              'MX',
              mxRecords[j].priority || ++l * 10,
              mxRecords[j].name
            ]);
            if (mxRecords[j].ip) {
              mxRecords[j].ip =
              mxRecords[j].ip instanceof Array
                ? mxRecords[j].ip
                : [mxRecords[j].ip];
              rotate(mxRecords[j].ip, 1);
              for (let y = 0; y < mxRecords[j].ip.length; y++) {
                ret.ADD.push([
                  mxRecords[j].name,
                  defaultTTL,
                  'IN',
                  'A',
                  mxRecords[j].ip[y]
                ]);
              }
            }
          }
          break;
        }
        case 'nameserver': {
          const nameServers = data[i] instanceof Array ? data[i] : [data[i]];
          for (j = 0; j < nameServers.length; j++) {
            const record = nameServers[j];
            record.name = record.name
              ? record.name.replace(/{name}/g, name)
              : 'ns' + ++k + '.' + name;
            ret.NS.push([name, defaultTTL, 'IN', 'NS', record.name]);
            // removed from authority section
            ret.REP.push([name, defaultTTL, 'IN', 'NS', record.name]);
            if (record.ip) {
              record.ip = record.ip instanceof Array ? record.ip : [record.ip];
              rotate(record.ip);
              for (let z = 0; z < record.ip.length; z++) {
                ret.ADD.push([
                  record.name,
                  defaultTTL,
                  'IN',
                  'A',
                  record.ip[z]
                ]);
              }
            }
          }
          break;
        }
        case 'certificate_authority_authorization': {
        // Allow addition of CAA records. Each entry needs to have at least an 'issuer', but can also contain a 'flag' and a 'tag.
          const caRecords = data[i] instanceof Array ? data[i] : [data[i]];
          for (j = 0; j < caRecords.length; j++) {
            const record = caRecords[j];
            const flag = record.flag || 0;
            const tag = record.tag || 'issue';
            const issuer = record.issuer;
            ret.REP.push([name, defaultTTL, 'IN', 'CAA', flag, tag, issuer]);
          }
          break;
        }
        case 'alias': {
        // BUG: Multiple CNAME records for the same fully-qualified domain name
        //   is a violation of the specs for DNS. Some versions of BIND would
        //   allow you to do this (some only if you specified the multiple-cnames
        //   yes option) and would round-robin load-balance between then but it's
        //   not technically legal.
          const cnameRecords = data[i] instanceof Array ? data[i] : [data[i]];
          for (j = 0; j < cnameRecords.length; j++) {
            cnameRecords[j].name = cnameRecords[j].name
              ? cnameRecords[j].name.replace(/{name}/g, name)
              : 'ns' + ++k + '.' + name;
            ret.REP.push([
              name,
              defaultTTL,
              'IN',
              'CNAME',
              cnameRecords[j].name
            ]);
            if (cnameRecords[j].ip) {
              cnameRecords[j].ip =
              cnameRecords[j].ip instanceof Array
                ? cnameRecords[j].ip
                : [cnameRecords[j].ip];
              rotate(cnameRecords[j].ip);
              for (let w = 0; w < cnameRecords[j].ip.length; w++) {
                ret.REP.push([
                  cnameRecords[j].name,
                  defaultTTL,
                  'IN',
                  'A',
                  cnameRecords[j].ip[w]
                ]);
              }
            }
          }
          break;
        }
      }
    }
  }
  return ret;
};

exports.start = start;
exports._onDnsRequest = onDnsRequest;
exports.getRecords = getRecords;
exports._rotate = rotate;
