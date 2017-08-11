// @flow

/**
 * Runs the server. Launch with `node server [options]`.
 */

var app = require('./app'),
    config = require('./utils/config'),
    fs = require('fs'),
    logger = require('winston');
    
const http = require('http');
const https = require('https');

const ready = require('readyness');
ready.setLogger(logger.info);

class HttpsWithUrl extends https.Server {
  url: string; 
}
class HttpWithUrl extends http.Server {
  url: string; 
}
type ServerWithUrl = HttpsWithUrl | HttpWithUrl;

// Produces the server instance for listening to HTTP/HTTPS traffic, depending
// on the configuration. 
//
// NOTE Since we depend on there being an url property in the server, we don't 
//    return vanilla servers from this function but a subtype. Make sure
//    the code knows about the `url`.
//
function produceServer(): ServerWithUrl {
  const ssl = config.get('server:ssl');
  
  // NOTE The code below typecasts through any. If you modify this code, please
  //   make sure that the return value is in fact a http/https server instance. 

  // HACK: config doesn't parse bools when passed from command-line
  if (ssl && ssl !== 'false') {
    serverOptions = {
      key : fs.readFileSync(config.get('server:certsPathAndKey') + '-key.pem').toString(),
      cert : fs.readFileSync(config.get('server:certsPathAndKey') + '-cert.crt').toString(),
      ca : fs.readFileSync(config.get('server:certsPathAndKey') + '-ca.pem').toString()
    };
    const server = https.createServer(serverOptions, app);
    
    return (server: any);
  } else {
    const server =  http.createServer(app);
    
    return (server: any);
  }
}


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

  const server = produceServer(); 
  
  var appListening = ready.waitFor('register:listening:' + config.get('server:ip') +
    ':' + config.get('server:port'));
  server.listen(config.get('server:port'), config.get('server:ip'), function () {
    if (server == null) {
      throw new Error('Assertion failure: Server is not initialized.');
    }

    var address = server.address();
    var protocol = server.key ? 'https' : 'http';

    server.url = protocol + '://' + address.address + ':' + address.port;
    config.set('server:url', server.url);

    var readyMessage = 'Registration server v' + require('../package.json').version +
        ' [' + app.settings.env + '] listening on ' + server.url +
      '\n Serving main domain: ' + config.get('dns:domain') +
      ' extras: ' + config.get('dns:domains');
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
require('./middleware/oauth2/index');