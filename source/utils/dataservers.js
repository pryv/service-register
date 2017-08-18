// @flow

const url = require('url');
const http = require('http');
const https = require('https');
const config = require('./config');
const users = require('../storage/users');

type LocalizedNameList = {
  [language: string]: string, 
}

type Hosting = {
  url: string, 
  name: string, 
  description: string, 
  localizedDescription: {
    [language: string]: string, 
  }, 
  
  available: ?boolean, 
}

type HostingZone = {
  name: string, 
  localizedName: LocalizedNameList,
  hostings: {
    [hostingName: string]: Hosting, 
  }, 
}

type HostingZoneList = {
  [key: string]: HostingZone, 
}

type HostingRegion = {
  name: string, 
  localizedName: LocalizedNameList,
  zones: HostingZoneList, 
}

type HostingDefinition = {
  regions: {
    [regionName: string]: HostingRegion,
  }, 
}; 

var memoizedHostings: ?HostingDefinition = null;

type ServerConfiguration = {
  [hostingName: string]: ServerList, 
}
type ServerList = Array<ServerConfig>; 
type ServerConfig = OldServerDefinition | ServerDefinition; 
type OldServerDefinition = {|
  base_name: string, 
  port: number, 
  authorization: string, 
|}
type ServerDefinition = {|
  base_url: string, 
  authorization: string, 
|}

/**
 * Get the hostings list, deal with the server logic:
 * - find the closest server for and IP
 * - convert
 * @returns: the list of hostings
 * See:
 * http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
 * https://github.com/benlowry/node-geoip-native
 */
function getHostings(): ?HostingDefinition {
  if (! memoizedHostings) {
    memoizedHostings = produceHostings();
  }
  return memoizedHostings;
  
  function produceHostings(): HostingDefinition {
    const aaservers = readConfiguredServers(); 
    const configHostings = readConfiguredHostings();
        
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
  
  function readConfiguredHostings(): HostingDefinition {
    const hostings = config.get('net:aahostings'); 
    
    if (hostings == null || hostings.regions == null) 
      throw parseError('No net:aahostings key found in configuration'); 
    
    for (const name of Object.keys(hostings.regions)) {
      const region = hostings.regions[name];
      const zones = region.zones; 
      
      if (zones == null) 
        throw parseError(`Region ${name} has no zones defined.`);
      if (Object.keys(zones).length <= 0) 
        throw parseError(`Region ${name} has no zones defined.`);
        
      // assert: Object.keys(zones).length > 0
      for (const zoneName of Object.keys(zones)) {
        const zone = zones[zoneName];
        const hostings = zone.hostings; 
        
        if (hostings == null || Object.keys(hostings).length <= 0) 
          throw parseError(`Zone ${zoneName} (region ${name}) has no hostings.`);
      }
    }

    return hostings;
  }
  
  function parseError(msg: string) {
    return new Error('Configuration error: ' + msg);
  }
}

function readConfiguredServers(): ServerConfiguration {
  // TODO Add a few checks for well-formedness of server configuration.
  // 
  // TODO Check if all servers that have base_url have a defined 'hostname'
  //    in there. Parse the urls.
  
  return config.get('net:aaservers');
}

type HostForHostingCallback = () => mixed; 

/**
 * Select host associated with provided hosting fairly.
 * Fairly = A new user must be created among the cores that have the least users.
 */
function getCoreForHosting(
  hosting: string, callback: HostForHostingCallback
): void {
  const servers = readConfiguredServers(); 
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
      if(err) {
        return callback(err);
      }

      let candidate = null;
      let min = null;

      // We look through available hosts for one good candidate (small users count)
      for (const server of availableCores) {
        const serverName = produceRedisName(server);
        const usersCount = redisServers[serverName];

        // This host has 0 user, we will not find better candidate
        if (usersCount == null) {
          return callback(null, server);
        }

        // This host has smaller users count, we take it as new best candidate
        if(candidate == null || usersCount < min) {
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
    if (server.base_name != null) {
      // Legacy config entry: 
      return server.base_name + '.' + config.get('net:AAservers_domain');
    }
    
    if (server.base_url == null) 
      throw new Error('Unknown server configuration format.');
    
    const serverUrl = url.parse(server.base_url);
    
    if (serverUrl.hostname == null) 
      throw new Error('AF: Hostname must not be null.');
    
    return serverUrl.hostname;
  }
}

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
  if (host.base_url == null) {
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
exports.getHostings = getHostings; 
exports.getCoreForHosting = getCoreForHosting;