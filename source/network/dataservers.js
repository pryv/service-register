var config = require('../utils/config');
var logger = require('winston');

//-- 
var httpMode = config.get('net:aaservers_ssl') ? 'https' : 'http';
var http = require(httpMode);

/**
 * deal with the server logic
 * - find the closest server for an IP
 * - convert
 **/
//http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
//https://github.com/benlowry/node-geoip-native


var hostings = null;
exports.hostings = function () {
  if (hostings === null) {
    var aaservers = config.get('net:aaservers');
    hostings = config.get('net:aahostings');
    Object.keys(hostings.regions).forEach(function (region) {
      if (hostings.regions[region].zones) {
        Object.keys(hostings.regions[region].zones).forEach(function (zone) {
          if (hostings.regions[region].zones[zone].hostings) {
            Object.keys(hostings.regions[region].zones[zone].hostings).forEach(function (hosting) {
              hostings.regions[region].zones[zone].hostings[hosting].available = false;
              if (aaservers[hosting] && aaservers[hosting].length > 0) {
                hostings.regions[region].zones[zone].hostings[hosting].available = true;
              }
            });
          }
        });
      }
    });

  }

  return hostings;
};

/**
 *
 * @param hosting
 * @param callback(error,hostname)
 */
exports.getHostForHosting = function (hosting) {

  var servers = config.get('net:aaservers:' + hosting);


  //require('../utils/dump').inspect({hosting: hosting, servers: servers});

  if (! servers || servers.length === 0) {
    return null;
  }
  // for now it's random
  var i = Math.floor(Math.random() * (servers.length));
  return servers[i];
};



//http://catapulty.tumblr.com/post/8303749793/heroku-and-node-js-how-to-get-the-client-ip-address
function getClientIp(req) {
  var ipAddress = null;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for');
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}

//POST request to an admin server, callback(error,json_result)
function postToAdmin(host, path, expectedStatus, jsonData, callback) {
  host.name = host.base_name + '.' + config.get('net:AAservers_domain');
  var httpOptions = { host : host.name, port: host.port, path: path, method: 'POST' };
  var postData = JSON.stringify(jsonData);

  //console.log(postData);

  httpOptions.headers = {
    'Content-Type': 'application/json',
    'authorization': host.authorization,
    'Content-Length': postData.length
  };

  var onError = function (reason) {
    var content =  '\n Request: ' + httpOptions.method + ' ' +
      httpMode + '://' + httpOptions.host + ':' + httpOptions.port + '' + httpOptions.path +
      '\n Data: ' + postData;
    // console.error(require('../utils/dump.js').curlHttpRequest(httpOptions,config.get('net:aaservers_ssl'),postData))
    return callback(reason + content, null);
  };

  var req = http.request(httpOptions, function (res) {
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


exports.postToAdmin = postToAdmin;