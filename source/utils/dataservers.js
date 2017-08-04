'use strict';

const url = require('url');
const http = require('http');
const https = require('https');
const config = require('./config');

var hostings = null;

/**
 * Get the hostings list, deal with the server logic:
 * - find the closest server for and IP
 * - convert
 * @returns: the list of hostings
 * See:
 * http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
 * https://github.com/benlowry/node-geoip-native
 */
exports.hostings = function () {
  if (!hostings) {
    var aaservers = config.get('net:aaservers');
    hostings = config.get('net:aahostings');
    Object.keys(hostings.regions).forEach(function (region) {    // for each region(default config)
      if (hostings.regions[region].zones) {
        Object.keys(hostings.regions[region].zones).forEach(function (zone) { // zones
          if (hostings.regions[region].zones[zone].hostings) {
            Object.keys(hostings.regions[region].zones[zone].hostings).forEach(function (hosting) {
              hostings.regions[region].zones[zone].hostings[hosting].available =
                aaservers[hosting] && aaservers[hosting].length > 0;
            });
          }
        });
      }
    });
  }
  return hostings;
};

/**
 * Retrieve host associated with provided hosting
 * @param hosting: the hosting
 * @returns: the corresponding host if existing, 'null' otherwise
 */
exports.getHostForHosting = function (hosting) {
  var servers = config.get('net:aaservers:' + hosting);

  if (! servers || servers.length === 0) {
    return null;
  }
  
  // for now it's random
  var i = Math.floor(Math.random() * (servers.length));
  return servers[i];
};

function getLegacyAdminClient(host, path, postData) {
  const useSSL = config.get('net:aaservers_ssl') || true;

  // SIDE EFFECT
  host.name = host.base_name + '.' + config.get('net:AAservers_domain');

  const httpClient = useSSL ? https : http; 

  var httpOptions = {
    host : host.name,
    port: host.port,
    path: path,
    method: 'POST',
    rejectUnauthorized: false
  };
  
  httpOptions.headers = {
    'Content-Type': 'application/json',
    'authorization': host.authorization,
    'Content-Length': postData.length
  };
  
  return {
    client: httpClient, 
    options: httpOptions,
  };
}

/**
 * Deals with parsing the 'base_url' field in the host object. Returns an 
 * object that has fields 'client' and 'options' - together they will yield 
 * the http call to make: 
 * 
 *    var httpCall = getAdminClient(host, path, postData); 
 *    httpCall.client.request(httpCall.options, function() { ... })
 *
 * As a _side effect_, sets the `.name` field on host to the host name of the 
 * server used for the call.  
 */
function getAdminClient(host, path, postData) {
  if (host.base_url === undefined) {
    // We used to define the path to the core server using 'base_name', 'port'
    // and net:AAservers_domain. This function implements that as a fallback. 
    return getLegacyAdminClient(host, path, postData);
  }
  
  var coreServer = url.parse(host.base_url);
  
  const useSSL = (coreServer.protocol === 'https:');
  const port = parseInt(coreServer.port || (useSSL ? 443 : 80));

  const httpClient = useSSL ? https : http; 
  
  var httpOptions = {
    host : coreServer.hostname,
    port: port,
    path: path,
    method: 'POST',
    rejectUnauthorized: false
  };
    
  httpOptions.headers = {
    'Content-Type': 'application/json',
    'authorization': host.authorization,
    'Content-Length': postData.length
  };
  
  // SIDE EFFECT
  host.name = coreServer.hostname;
  
  return {
    client: httpClient, 
    options: httpOptions,
  };
}

/** 
 * POSTs a request to the core server indicated by `host`. Calls the callback
 * which has the signature `function(error, json_result)`. 
 * 
 * As a _side effect_, `host.name` is set to the name of the actual host used 
 * for this call. 
 */
function postToAdmin(host, path, expectedStatus, jsonData, callback) {
  var postData = JSON.stringify(jsonData);
  //console.log(postData);

  var httpCall = getAdminClient(host, path, postData); 

  var onError = function (reason) {
    var content =  '\n Request: ' + httpCall.options.method + ' ' +
      httpCall.options.host + ':' + httpCall.options.port + '' + httpCall.options.path +
      '\n Data: ' + postData;
    return callback(reason + content, null);
  };

  var req = httpCall.client.request(httpCall.options, function (res) {
    var bodyarr = [];

    res.on('data', function (chunk) { bodyarr.push(chunk); });
    res.on('end', function () {
      if (res.statusCode !== expectedStatus) {
        return onError('\n **start**\n  bad result status' + res.statusCode +
          ' != expectedStatus ' + '\nMessage: ' + bodyarr.join('') + '\n**end**\n');
      }
      var resJson = JSON.parse(bodyarr.join(''));
      return callback(null, resJson);
    });

  }).on('error', function (e) {
    return onError('Error ' + JSON.stringify(host) + '\n Error: ' + e.message);
  });


  req.on('socket', function (socket) {
    socket.setTimeout(5000);
    socket.on('timeout', function () {
      req.abort();
      return callback('Timeout');
    });
  });

  req.write(postData);
  req.end();
}

exports.getAdminClient = getAdminClient; 
exports.postToAdmin = postToAdmin;
