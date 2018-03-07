// @flow

const ndns = require('./ndns'),
      server = ndns.createServer('udp4'),
      logger = require('winston'),
      config = require('../utils/config'),
      defaultTTL = config.get('dns:defaultTTL');

var UpdateConfFile;

require('./_extend.js');
const console = logger;

function rotate<T>(ary: Array<T>, count: number = 1): Array<T> {
  const len = ary.length;

  ary.unshift(...ary.splice(count % len, len));
  return ary;
}
function format(date: Date, format: string): string {
  var fullYear = date.getFullYear();
  if (fullYear < 1000) {
    fullYear = fullYear + 1900;
  }
  var hour = date.getHours();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var minute = date.getMinutes();
  var seconde = date.getSeconds();
  var reg = new RegExp('(d|m|Y|H|i|s)', 'g');
  var replacement = {};
  replacement.d = day < 10 ? '0' + day : day;
  replacement.m = month < 10 ? '0' + month : month;
  replacement.Y = fullYear;
  replacement.H = hour < 10 ? '0' + hour : hour;
  replacement.i = minute < 10 ? '0' + minute : minute;
  replacement.s = seconde < 10 ? '0' + seconde : seconde;
  return format.replace(reg, function($0) {
    return ($0 in replacement) ? replacement[$0] : $0.slice(1,
        $0.length - 1);
  });
}

export type DnsRequest = ndns.Message; 
export type DnsResponse = ndns.Message; 

// This is what ndns consumes. We're not being as specific as we can be
// eventually  here. 
export type DnsRecord = {
  REP: Array<DnsEntry>, 
  NS: Array<DnsEntry>, 
  ADD: Array<DnsEntry>, 
};
type DnsEntry = Array<string | number>;

export type DnsData = {
  ip?: string | Array<string>, 
  autority?: string,
  nameserver?: string,
}

type DnsDynamicHandler = (
  name: string, 
  (DnsRequest, DnsResponse, DnsRecord) => void, 
  req: DnsRequest, res: DnsResponse
) => void;

// Handles each individual DNS request - our main handler function. 
function onDnsRequest(dynamic_call: DnsDynamicHandler, req: any, res: any) {
  logger.info(JSON.stringify(req.q));
  if (req.q.length > 0) {
    const name = validateRequest(req);
    return dynamic_call(name, sendResponse, req, res);
  }

  // close with nothing
  return sendResponse(req, res, null);

  // Validates the DNS request and handles some special cases before going
  // further. Returns the request to handle. 
  //
  function validateRequest(req): string {
    const name = req.q[0].name;

    // This should be rare. If it is not, we'll need to investigate why this 
    // happens. 
    if (name == null) {
      logger.info("Received empty request, treating as if it was empty.");
      return '';
    }
      
    // Please comment on why we have this code if you know. 
    if (name === '.') return '';
    
    return name; 
  }
  function sendResponse(req, res, rec) {
    res.setHeader(req.header);
    for (var i = 0; i < req.q.length; i++) {
      res.addQuestion(req.q[i]);
    }

    if (rec == null) {
      const requestedName = req.q[0] && req.q[0].name || "(n/a)";
      logger.info(`Could not find ${requestedName} on this server; proxy list is empty`);
      // no proxy on this server (added by Perki)
      
      // maybe some code should be sent
      res.setHeader(req.header);
      res.send();
      return;
    }

    res.header.qr = 1;
    res.header.ra = 1;
    res.header.rd = 0;
    res.header.aa = 1;

    // Answers count
    res.header.ancount = rec.REP.length;
    // Namespaces count
    res.header.nscount = rec.NS.length;
    // Additional answers count
    res.header.arcount = rec.ADD.length;

    // Add answers
    for (var a = 0; a < rec.REP.length; a++) {
      res.addRR.apply(res, rec.REP[a]);
    }

    // Add namespaces
    for (var b = 0; b < rec.NS.length; b++) {
      res.addRR.apply(res, rec.NS[b]);
    }

    // Add additional answers
    for (var c = 0; c < rec.ADD.length; c++) {
      res.addRR.apply(res, rec.ADD[c]);
    }

    res.send();
  }

}

function onDnsRequestCatchError(... args) {
  try {
    onDnsRequest(... args);
  } catch (dnsError) {
    if(config.get('airbrake:disable') !== true) {
      const projectId = config.get('airbrake:projectId');
      const key = config.get('airbrake:key');
      if(projectId != null && key != null) {
        const airbrake = require('airbrake').createClient(projectId, key);
        airbrake.notify(dnsError);
      }
    }
    throw dnsError;
  }
}

function start(
  BIND_PORT: string, BIND_HOST: string, 
  dynamic_call: DnsDynamicHandler, 
  done: (msg: ?string) => void
) {
  // Server launch
  UpdateConfFile = format(new Date(), 'Ymd33');
  server.on('request', (req, res) => onDnsRequestCatchError(dynamic_call, req, res)); 

  server.bind(BIND_PORT, BIND_HOST);
  return done('DNS Started on '+BIND_HOST+':'+BIND_PORT);
}

var getRecords = function(data: DnsData, name: string): DnsRecord {
  // Check if this is a dynamic request

  var ret: DnsRecord = {
    REP : [],
    NS  : [],
    ADD : []
  };
  var i=0;
  var j=0;
  var k=0;
  for(i in data) {
    if(data.hasOwnProperty(i)) {
      j = String(data[i]).replace(/{name}/g,name);

      switch(i.toLowerCase()){
      case 'ip':
        // IP address
        data[i] = data[i] instanceof Array ? data[i] : [data[i]];
        rotate(data[i]);
        for(var x=0; x< data[i].length; x++) {
          ret.REP.push([name,defaultTTL, 'IN', 'A', data[i][x]]);
        }
        break;
      case 'description':
        ret.REP.push([name, defaultTTL, 'IN', 'TXT', data[i]]);
        break;
      case 'autority': 
        data[i] = String(j).split(',').slice(0,2);
        data[i] = data[i].length === 1 ? data[i].concat(data[i]) : data[i];
        ret.REP.push([name, defaultTTL, 'IN', 'SOA'].concat(data[i])
          .concat([UpdateConfFile,1800, 900, 604800, 86400]));
        break;
      case 'mail':
        data[i] = data[i] instanceof Array ? data[i] : [data[i]];
        var l = 0;
        for(j = 0;j< data[i].length;j++){
          data[i][j].ttl = data[i][j].ttl ? data[i][j].ttl : defaultTTL;
          data[i][j].name = data[i][j].name ? data[i][j].name.replace(/{name}/g,name) : 'mail.'+name;
          ret.REP.push([name, data[i][j].ttl, 'IN', 'MX', data[i][j].priority ||
          (++l)*10, data[i][j].name]);
          if(data[i][j].ip){
            data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
            rotate(data[i][j].ip, 1);
            for(var y=0; y< data[i][j].ip.length;y++) {
              ret.ADD.push([data[i][j].name, defaultTTL, 'IN', 'A', data[i][j].ip[y]]);
            }
          }
        }
        break;
      case 'nameserver':
        for(j = 0;j< data[i].length;j++){
          data[i][j].name = data[i][j].name ?
            data[i][j].name.replace(/{name}/g,name) : 'ns'+(++k)+'.'+name;
          ret.NS.push([name, defaultTTL, 'IN', 'NS' , data[i][j].name]);
          // removed from authority section
          ret.REP.push([name, defaultTTL, 'IN', 'NS' , data[i][j].name]);
          if(data[i][j].ip){
            data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
            rotate(data[i][j].ip);
            for(var z=0; z< data[i][j].ip.length;z++) {
              ret.ADD.push([data[i][j].name, defaultTTL, 'IN', 'A', data[i][j].ip[z]]);
            }
          }
        }
        break;

      case 'alias':
        // BUG: Multiple CNAME records for the same fully-qualified domain name
        //   is a violation of the specs for DNS. Some versions of BIND would
        //   allow you to do this (some only if you specified the multiple-cnames
        //   yes option) and would round-robin load-balance between then but it's
        //   not technically legal.
        data[i] = data[i] instanceof Array ? data[i] : [data[i]];
        for(j = 0;j< data[i].length;j++){
          data[i][j].name = data[i][j].name ?
            data[i][j].name.replace(/{name}/g,name) : 'ns'+(++k)+'.'+name;
          ret.REP.push([name, defaultTTL, 'IN', 'CNAME' , data[i][j].name]);

          if(data[i][j].ip){
            data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
            rotate(data[i][j].ip);
            for(var w=0; w< data[i][j].ip.length;w++) {
              ret.REP.push([data[i][j].name, defaultTTL, 'IN', 'A', data[i][j].ip[w]]);
            }
          }
        }
        break;
      }
    }
  }
  return ret;
};

exports.start = start;
exports._onDnsRequest = onDnsRequest;
exports.getRecords = getRecords;
exports._rotate = rotate; 
