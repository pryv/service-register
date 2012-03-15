/** 
 * deal with the server logic 
 * - find the closest server for an IP
 * - convert 
**/
var logger = require('winston');

var servers = {names: [{ 'name': 'ch1.wactiv.com' }, 
               { 'name': 'fr1.wactiv.com' }, 
               { 'name' : 'us1.wactiv.com'}]};

// return recommanded servers
function recommanded(req,callback) {
    // for now it's random
    var i = Math.floor( Math.random() * ( servers.names.length + 1 ) );
    var result = servers.names[i].name;
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
