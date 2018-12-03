// @flow

const url = require('url');
const http = require('http');
const https = require('https');
const config = require('./config');
const users = require('../storage/users');

import type {HostingDefinition, ServerList, ServerConfig, OldServerDefinition} from './config';

var memoizedHostings: ?HostingDefinition = null;

// Returns the hostings list from the configuration file. This list is immutable 
// and memoized, so you can call this function wherever you need the list. 
//
function getHostings(): ?HostingDefinition {
  if (! memoizedHostings) {
    memoizedHostings = produceHostings();
  }
  return memoizedHostings;
  
  function produceHostings(): HostingDefinition {
    const aaservers = config.get('net:aaservers');
    const configHostings = config.get('net:aahostings');
        
    Object.keys(configHostings.regions).forEach((name) => {    // for each region(default config)
      const region = configHostings.regions[name];
      
      Object.keys(region.zones).forEach((name) => { // zones
        const zone = region.zones[name];
        const hostings = zone.hostings; 
        
        Object.keys(hostings).forEach((name) => {
          const hosting = hostings[name];
          const servers = aaservers[name];
          
          hosting.available = computeAvailability(servers);
        });
      });
    });
    
    return configHostings;
  }
  
  function computeAvailability(serverList: ServerList) {
    return serverList.length > 0;
  }

}

type HostForHostingCallback = (err: mixed, core: ?ServerConfig) => mixed; 

/**
 * Select host associated with provided hosting fairly.
 * Fairly = A new user must be created among the cores that have the least users.
 */
function getCoreForHosting(
  hosting: string, callback: HostForHostingCallback
): void {
  const servers = config.get('net:aaservers');
  // Get the available hosts (from config file)
  const availableCores = servers[hosting];

  // No host available
  if (! availableCores || availableCores.length === 0) {
    callback();
    return;
  }

  // Only one host available, we return it directly to avoid users computation
  if(availableCores.length === 1) {
    callback(null, availableCores[0]);
    return;
  }
  
  findBestCore(availableCores, callback);
  
  function findBestCore(availableCores, callback) {
    // Get the list of active hosts and the users count (from Redis)
    users.getServers((err, redisServers) => {
      if (err != null) return callback(err);
      if (redisServers == null) 
        return callback(new Error('AF: Expected server usage stats'));

      let candidate = null;
      let min = null;

      // We look through available hosts for one good candidate (small users count)
      for (const server of availableCores) {
        const serverName = produceRedisName(server);
        const usersCount = redisServers[serverName] || 0;

        // This host has smaller users count, we take it as new best candidate
        if (candidate == null || min == null || usersCount < min) {
          min = usersCount;
          candidate = server;
        }
      }

      callback(null, candidate);
    });
  }
  // Extracts the name of the core we store in redis from a given configuration
  // entry, handling old and new format correctly. 
  // 
  function produceRedisName(server: ServerConfig): string {
    if (typeof server.base_name === 'string') {
      // Legacy config entry: 
      return server.base_name + '.' + config.get('net:AAservers_domain');
    }
    
    if (typeof server.base_url !== 'string') 
      throw new Error('Unknown server configuration format.');
    
    const serverUrl = url.parse(server.base_url);
    
    if (serverUrl.hostname == null) 
      throw new Error('AF: Hostname must not be null.');
    
    return serverUrl.hostname;
  }
}

function getLegacyAdminClient(
  host: OldServerDefinition, path: string, postData: string
) {
  const useSSL = config.get('net:aaservers_ssl') || true;

  // SIDE EFFECT
  host.name = host.base_name + '.' + config.get('net:AAservers_domain');

  const httpClient = useSSL ? https : http;

  const httpOptions = {
    host : host.name,
    port: host.port,
    path: path,
    method: 'POST',
    rejectUnauthorized: false, 
    headers: {
      'Content-Type': 'application/json',
      'authorization': host.authorization,
      'Content-Length': postData.length
    }, 
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
function getAdminClient(
  host: ServerConfig, path: string, postData: string
) {
  if (host.base_name != null) {
    // HACK Is there a better way to make flow realize we're in the clear here?
    const oldHost: OldServerDefinition = (host: any); 
    
    // We used to define the path to the core server using 'base_name', 'port'
    // and net:AAservers_domain. This function implements that as a fallback.
    return getLegacyAdminClient(oldHost, path, postData);
  }
  
  if (typeof host.base_url !== 'string')
    throw new Error('AF: base_url expected to be present in ServerDefinition.');
    
  const coreServer = url.parse(host.base_url);

  const useSSL = (coreServer.protocol === 'https:');
  const port = parseInt(coreServer.port || (useSSL ? 443 : 80));

  const httpClient = useSSL ? https : http;

  const httpOptions = {
    host: coreServer.hostname,
    port: port,
    path: path,
    method: 'POST',
    rejectUnauthorized: false, 
    headers: {
      'Content-Type': 'application/json',
      'authorization': host.authorization,
      'Content-Length': postData.length
    }, 
  };

  // SIDE EFFECT
  if (coreServer.hostname != null)
    host.name = coreServer.hostname;

  return {
    client: httpClient,
    options: httpOptions,
  };
}

type PostToAdminCallback = (err: ?(Error | string), res: ?Object) => mixed; 

/**
 * POSTs a request to the core server indicated by `host`. Calls the callback
 * which has the signature `function(error, json_result)`.
 *
 * As a _side effect_, `host.name` is set to the name of the actual host used
 * for this call.
 */
function postToAdmin(
  host: ServerConfig, path: string, expectedStatus: number, 
  jsonData: any, callback: PostToAdminCallback, 
) {
  var postData = JSON.stringify(jsonData);
  //console.log(postData);

  var httpCall = getAdminClient(host, path, postData);

  var onError = function (reason) {
    var content =  '\n Request: ' + httpCall.options.method + ' ' +
      (httpCall.options.host || 'n/a') + ':' + httpCall.options.port + '' + httpCall.options.path +
      '\n Data: ' + postData;
    return callback(reason + content);
  };

  const req = httpCall.client.request(httpCall.options, function (res) {
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
exports.getHostings = getHostings; 
exports.getCoreForHosting = getCoreForHosting;