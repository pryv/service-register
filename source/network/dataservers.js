var config = require('../utils/config');
var querystring = require('querystring');

//-- 
var http_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
var servers = config.get('net:aaservers');
var http = require(http_mode); 

/** 
 * deal with the server logic 
 * - find the closest server for an IP
 * - convert 
**/
var logger = require('winston');


// update servers list with domain name
for (var i = 0; i < servers.length; i++) {
    servers[i].name = servers[i].base_name+"."+config.get('net:AAservers_domain');
    logger.info("dataservers: "+servers[i].name);
}

// return recommanded servers
function recommanded(req,callback) {
    // for now it's random
    var i = Math.floor( Math.random() * ( servers.length  ) );
    var result = servers[i];
    callback(null,result);
}

exports.recommanded = recommanded;

// from http://catapulty.tumblr.com/post/8303749793/heroku-and-node-js-how-to-get-the-client-ip-address
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

// POST request to an admin server, callback(error,json_result)
function post_to_admin(host,path,expected_status,json_data,callback) {
  
  var http_options = { host : host.name , port: host.port, path: path, method: "POST" };
  var post_data = querystring.stringify(json_data);

  //console.log(post_data);

  http_options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'authorization': host.authorization,
    'Content-Length': post_data.length
  }
  
  var req = http.request(http_options, function(res){
     var bodyarr = [];
     res.on('data', function (chunk) { bodyarr.push(chunk); });
     res.on('end', function() {
       if (res.statusCode != expected_status) {
        return callback('\n **start**\n post_to_admin bad result status'+ res.statusCode +' != expected_status '
            +'\n Options: '+http_options.method+" "+http_mode+'://'+http_options.host+':'+http_options.port+''+http_options.path
            +'\n Request: '+post_data+' \n Message: '+ bodyarr.join(''),null)+'\n**end**\n';
       }
        var res_json = JSON.parse(bodyarr.join(''));
        return callback(null,res_json);
     });
    
   }).on('error', function(e) {
     return callback("post_to_admin "+ JSON.stringify(host) +"error: " + e.message,null);
  });
  
  req.on('socket', function (socket) {
    socket.setTimeout(1000);  
    socket.on('timeout', function() {
        req.abort();
        return callback('post_to_admin timeout',null);
    });
  });
  
  req.write(post_data);
  req.end();
}


exports.post_to_admin = post_to_admin;