/**
 * Actually runs the server. Launch with `node server [options]`.
 */

var app = require('./app'),
config = require('./utils/config'),
fs = require('fs'),
logger = require('winston'),
_ = require('underscore.string');

var ready = require('readyness');
ready.setLogger(logger.info);


//https server
logger.info('Register  server :' + config.get('http:register:url'));
logger.info('Static  server :' + config.get('http:static:url'));


if (config.get('server:port') > 0) {

  var serverOptions = {};

  var server = null;
  if (config.get('server:ssl')) {
    serverOptions = {
      key : fs.readFileSync(config.get('server:certsPathAndKey') + '-key.pem').toString(),
      cert : fs.readFileSync(config.get('server:certsPathAndKey') + '-cert.crt').toString(),
      ca : fs.readFileSync(config.get('server:certsPathAndKey') + '-ca.pem').toString()
    };
    server =  require('https').createServer(serverOptions, app);
  } else {
    server =  require('http').createServer(app);
  }

  var appListening = ready.waitFor('register:listening:' + config.get('server:ip') +
    ':' + config.get('server:port'));
  server.listen(config.get('server:port'), config.get('server:ip'), function () {
    var address = server.address();
    var protocol = server.key ? 'https' : 'http';

    var sslmessage =  server.key ? ' with ssl certs: ' +
    config.get('server:certsPathAndKey') : '';

    appListening(_.sprintf('SW %s://%s:%d in %s mode ' + sslmessage,
      protocol, address.address, address.port, app.settings.env));
  }).on('error', function (e) {
      if (e.code === 'EACCES') {
        logger.error('Cannot ' + e.syscall);
        throw (e);
      }
    });

  module.exports = server;
} else {
  logger.info('** Https server is off !');
}
//start dns
require('./app-dns');

