/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const http = require('http');
const https = require('https');
const config = require('../config');
const users = require('../storage/users');

let memoizedHostings = null;
const memoizedServerNameForCore = {};
const memoizedCoreUrls = [];

/**
 * Returns the hostings list from the configuration file. This list is immutable
 * and memoized, so you can call this function wherever you need the list.
 *
 * @returns {any}
 */
function getHostings () {
  if (!memoizedHostings) {
    memoizedHostings = produceHostings();
  }
  return memoizedHostings;

  function produceHostings () {
    const aaservers = config.get('net:aaservers');
    const configHostings = config.get('net:aahostings');
    Object.keys(configHostings.regions).forEach((name) => {
      const region = configHostings.regions[name];
      Object.keys(region.zones).forEach((name) => {
        const zone = region.zones[name];
        const hostings = zone.hostings;
        Object.keys(hostings).forEach((name) => {
          const hosting = hostings[name];
          const servers = aaservers[name];
          hosting.available = computeAvailability(servers);
          // get least occupied core
          getCoreForHosting(name, (hostError, host) => {
            let coreURL = '';
            if (hostError == null && host != null) {
              if (host.base_url) {
                coreURL = host.base_url;
              } else if (host.base_name) {
                // support for old type of servers
                coreURL = host.base_name;
              }
            }
            hosting.availableCore = coreURL;
          });
        });
      });
    });
    return configHostings;
  }

  function computeAvailability (serverList) {
    return serverList.length > 0;
  }
}

/**
 * @typedef {(err: unknown, core?: ServerConfig | null) => unknown} HostForHostingCallback
 */

/**
 * Select host associated with provided hosting fairly.
 * Fairly = A new user must be created among the cores that have the least users.
 * @param {string} hosting
 * @param {HostForHostingCallback} callback
 * @returns {void}
 */
function getCoreForHosting (hosting, callback) {
  const servers = config.get('net:aaservers');
  // Get the available hosts (from config file)
  const availableCores = servers[hosting];
  // No host available
  if (!availableCores || availableCores.length === 0) {
    callback();
    return;
  }
  // Only one host available, we return it directly to avoid users computation
  if (availableCores.length === 1) {
    callback(null, availableCores[0]);
    return;
  }
  findBestCore(availableCores, callback);
  function findBestCore (availableCores, callback) {
    // Get the list of active hosts and the users count (from Redis)
    users.getServers((err, redisServers) => {
      if (err != null) return callback(err);
      if (redisServers == null) { return callback(new Error('AF: Expected server usage stats')); }
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

  /**
   * Extracts the name of the core we store in redis from a given configuration
   * entry, handling old and new format correctly.
   * @param {ServerConfig} server
   * @returns
   */
  function produceRedisName (server) {
    if (typeof server.base_name === 'string') {
      // Legacy config entry:
      return server.base_name + '.' + config.get('net:AAservers_domain');
    }

    if (typeof server.base_url !== 'string') { throw new Error('Unknown server configuration format.'); }

    const serverUrl = new URL(server.base_url);

    if (serverUrl.hostname == null) { throw new Error('AF: Hostname must not be null.'); }

    return serverUrl.hostname;
  }
}

/**
 * @param {OldServerDefinition} host
 * @param {string} path
 * @param {string} postData
 * @returns {{ client: any; options: { host: any; port: any; path: string; method: string; rejectUnauthorized: boolean; headers: { 'Content-Type': string; authorization: any; 'Content-Length': number; }; }; }}
 */
function getLegacyAdminClient (host, path, postData) {
  const useSSL = config.get('net:aaservers_ssl') || true;
  // SIDE EFFECT
  host.name = host.base_name + '.' + config.get('net:AAservers_domain');
  const httpClient = useSSL ? https : http;
  const httpOptions = {
    host: host.name,
    port: host.port,
    path,
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json',
      authorization: host.authorization,
      'Content-Length': postData.length
    }
  };
  return {
    client: httpClient,
    options: httpOptions
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
 * @param {ServerConfig} host
 * @param {string} path
 * @param {string} postData
 * @returns {{ client: any; options: { host: any; port: any; path: string; method: string; rejectUnauthorized: boolean; headers: { 'Content-Type': string; authorization: any; 'Content-Length': number; }; }; }}
 */
function getAdminClient (host, path, postData) {
  if (host.base_name != null) {
    // HACK Is there a better way to make flow realize we're in the clear here?
    const oldHost = host;
    // We used to define the path to the core server using 'base_name', 'port'
    // and net:AAservers_domain. This function implements that as a fallback.
    return getLegacyAdminClient(oldHost, path, postData);
  }
  if (typeof host.base_url !== 'string') { throw new Error('AF: base_url expected to be present in ServerDefinition.'); }
  const coreServer = new URL(host.base_url);
  const useSSL = coreServer.protocol === 'https:';
  const port = parseInt(coreServer.port || (useSSL ? 443 : 80));
  const httpClient = useSSL ? https : http;
  const httpOptions = {
    host: coreServer.hostname,
    port,
    path,
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json',
      authorization: host.authorization,
      'Content-Length': postData.length
    }
  };
  // SIDE EFFECT
  if (coreServer.hostname != null) host.name = coreServer.hostname;
  return {
    client: httpClient,
    options: httpOptions
  };
}

/**
 * @typedef {(err?: Error | string | null, res?: any | null) => unknown} PostToAdminCallback
 */

/**
 * POSTs a request to the core server indicated by `host`. Calls the callback
 * which has the signature `function(error, json_result)`.
 *
 * As a _side effect_, `host.name` is set to the name of the actual host used
 * for this call.
 * @param {ServerConfig} host
 * @param {string} path
 * @param {number} expectedStatus
 * @param {any} jsonData
 * @param {PostToAdminCallback} callback
 * @returns {void}
 */
function postToAdmin (host, path, expectedStatus, jsonData, callback) {
  const postData = JSON.stringify(jsonData);
  const httpCall = getAdminClient(host, path, postData);
  const onError = function (reason) {
    const content =
      '\n Request: ' +
      httpCall.options.method +
      ' ' +
      (httpCall.options.host || 'n/a') +
      ':' +
      httpCall.options.port +
      '' +
      httpCall.options.path +
      '\n Data: ' +
      postData;
    return callback(new Error(reason + content));
  };
  const req = httpCall.client
    .request(httpCall.options, function (res) {
      const bodyarr = [];
      res.on('data', function (chunk) {
        bodyarr.push(chunk);
      });
      res.on('end', function () {
        if (res.statusCode !== expectedStatus) {
          return onError(
            '\n **start**\n  bad result status' +
              res.statusCode +
              ' != expectedStatus ' +
              '\nMessage: ' +
              bodyarr.join('') +
              '\n**end**\n'
          );
        }
        const resJson = JSON.parse(bodyarr.join(''));
        return callback(null, resJson);
      });
    })
    .on('error', function (e) {
      return onError(
        'Error ' + JSON.stringify(host) + '\n Error: ' + e.message
      );
    });
  req.on('socket', function (socket) {
    socket.setTimeout(5000);
    socket.on('timeout', function () {
      req.abort();
      return callback(new Error('Timeout'));
    });
  });
  req.write(postData);
  req.end();
}

/**
 * Returns a simple map of hostings:
 * {
 *    hostingName: [{
 *        base_url: https://coreUrl,
 *        authorization: coreSystemToken,
 *      },
 *      ...
 *    ]
 * }
 * @returns {any}
 */
function getFlatHostings () {
  return config.get('net:aaservers');
}

/**
 * Return an array of core URLs
 * @returns {{}[]}
 */
function getCoresUrls () {
  if (memoizedCoreUrls.length > 0) return memoizedCoreUrls;
  const hostings = getFlatHostings();
  const hostingKeys = Object.keys(hostings);
  hostingKeys.forEach((k) => {
    const coresPerHosting = hostings[k];
    coresPerHosting.forEach((core) => {
      memoizedCoreUrls.push(core.base_url);
    });
  });
  return memoizedCoreUrls;
}

/**
 * Returns the core URL based on the server name
 * The server name is the one that is provided at user creation, namely the hostname of the core server, such as co1.pryv.li
 * We look for its URL in the hostings object.
 *
 * returns coreObject with properties:
 * - base_url
 * - authorization
 *
 * Works by memoization
 * @returns {any}
 */
function getCore (serverName) {
  if (memoizedServerNameForCore[serverName] != null) { return memoizedServerNameForCore[serverName]; }
  const hostings = getFlatHostings();
  // build urls
  const hostingKeys = Object.keys(hostings);
  hostingKeys.forEach((k) => {
    const coresPerHosting = hostings[k];
    coresPerHosting.forEach((core) => {
      if (core.base_url.includes(serverName)) { memoizedServerNameForCore[serverName] = core; }
    });
  });
  return memoizedServerNameForCore[serverName];
}

exports.getAdminClient = getAdminClient;
exports.postToAdmin = postToAdmin;
exports.getHostings = getHostings;
exports.getCoreForHosting = getCoreForHosting;
exports.getCore = getCore;
exports.getCoresUrls = getCoresUrls;
