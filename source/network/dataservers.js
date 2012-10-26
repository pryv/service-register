var config = require('../utils/config');
var querystring = require('querystring');

//-- 
var httpMode = config.get('net:aaservers_ssl') ? 'https' : 'http';
var servers = config.get('net:aaservers');
var http = require(httpMode); 

/** 
 * deal with the server logic 
 * - find the closest server for an IP
 * - convert 
 **/
var logger = require('winston');


//update servers list with domain name
for (var i = 0; i < servers.length; i++) {
  servers[i].name = servers[i].base_name+"."+config.get('net:AAservers_domain');
  logger.info("dataservers: "+servers[i].name);
}

//return recommanded servers
function recommanded(req,callback) {
  // for now it's random
  var i = Math.floor( Math.random() * ( servers.length  ) );
  var result = servers[i];
  callback(null,result);
}

exports.recommanded = recommanded;

//from http://catapulty.tumblr.com/post/8303749793/heroku-and-node-js-how-to-get-the-client-ip-address
function getClientIp(req) {
  var ipAddress;
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
};

//POST request to an admin server, callback(error,json_result)
function postToAdmin(host,path,expectedStatus,jsonData,callback) {

  var httpOptions = { host : host.name , port: host.port, path: path, method: "POST" };
  var postData = querystring.stringify(jsonData);

  //console.log(postData);

  httpOptions.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'authorization': host.authorization,
      'Content-Length': postData.length
  }

  var req = http.request(httpOptions, function(res){
    var bodyarr = [];
    res.on('data', function (chunk) { bodyarr.push(chunk); });
    res.on('end', function() {
      if (res.statusCode != expectedStatus) {
        return callback('\n **start**\n postToAdmin bad result status'+ res.statusCode +' != expectedStatus '
            +'\n Options: '+httpOptions.method+" "+httpMode+'://'+httpOptions.host+':'+httpOptions.port+''+httpOptions.path
            +'\n Request: '+postData+' \n Message: '+ bodyarr.join(''),null)+'\n**end**\n';
      }
      var resJson = JSON.parse(bodyarr.join(''));
      return callback(null,resJson);
    });

  }).on('error', function(e) {
    return callback("postToAdmin "+ JSON.stringify(host) +"error: " + e.message,null);
  });

  req.on('socket', function (socket) {
    socket.setTimeout(1000);  
    socket.on('timeout', function() {
      req.abort();
      return callback('postToAdmin timeout',null);
    });
  });

  req.write(postData);
  req.end();
}


exports.postToAdmin = postToAdmin;