/**
 * Actually runs the server. Launch with `node server [options]`.
 */

var app = require('./app'),
    config = require('./utils/config'),
    fs = require('fs'),
    logger = require('winston');

var ready = require('readyness');
ready.setLogger(logger.info);


// send crashes to Airbrake service
if (config.get('airbrake:disable') !== true) {
  var airbrake = require('airbrake').createClient(config.get('airbrake:key'));
  airbrake.handleExceptions();
}

//https server
logger.info('Register  server :' + config.get('http:register:url'));
logger.info('Static  server :' + config.get('http:static:url'));


if (config.get('server:port') > 0) {

  var serverOptions = {};

  var server = null,
      ssl = config.get('server:ssl');
  // HACK: config doesn't parse bools when passed from command-line
  if (ssl && ssl !== 'false') {
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

    server.url = protocol + '://' + address.address + ':' + address.port;

    var readyMessage = 'Registration server v' + require('../package.json').version +
        ' [' + app.settings.env + '] listening on ' + server.url;
    logger.info(readyMessage);
    appListening(readyMessage); // TODO: replace that "readyness" thing with simple event messaging
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
require('./oauth2/index.js');

