var config = require('./config'),
  httpMode = config.get('net:aaservers_ssl') ? 'https' : 'http',
  http = require(httpMode);

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

/*
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
*/

/**
 * POST a request to an admin server
 * @param host: the host to which to send the request (hostname and port)
 * @param path: the request's path
 * @param expectedStatus: the status expected as an answer of this request
 * @param jsonData: the JSON body of this request
 * @param callback: function(error,result), result being the answer body of this request as JSON
 */
function postToAdmin(host, path, expectedStatus, jsonData, callback) {
  host.name = host.base_name + '.' + config.get('net:AAservers_domain');
  var httpOptions = {
    host : host.name,
    port: host.port,
    path: path,
    method: 'POST',
    rejectUnauthorized: false
  };
  var postData = JSON.stringify(jsonData);

  httpOptions.headers = {
    'Content-Type': 'application/json',
    'authorization': host.authorization,
    'Content-Length': postData.length
  };

  var onError = function (reason) {
    var content =  '\n Request: ' + httpOptions.method + ' ' +
      httpMode + '://' + httpOptions.host + ':' + httpOptions.port + '' + httpOptions.path +
      '\n Data: ' + postData;
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