// @flow

/**
 * Runs the server. Launch with `node server [options]`.
 */

const app = require('./app');
const config = require('./utils/config');
const logger = require('winston');
    
const http = require('http');

const ready = require('readyness');
ready.setLogger(logger.info);

type ServerWithUrl = http.Server & {
  url: ?string,
};

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
  //   Also why we have type assertions just before the cast through any. 

  // HACK: config doesn't parse bools when passed from command-line
  if (ssl && ssl !== 'false') {
    throw new Error('SSL inside register server has been removed. Set ssl to false to continue.');
  } else {
    const server =  http.createServer(app);
    
    (server: http.Server);
    return (server: any);
  }
}

//https server
logger.info('Register  server :' + config.get('http:register:url'));
logger.info('Static  server :' + config.get('http:static:url'));

if (config.get('server:port') > 0) {
  const server = produceServer(); 
  
  var appListening = ready.waitFor('register:listening:' + config.get('server:ip') +
    ':' + config.get('server:port'));
  
  const opts = {
    port: config.get('server:port'),
    host: config.get('server:ip'),
  };
  server.listen(opts, err => {
    if (err != null)
      throw new Error(`AF: ${err} occurred.`);

    var address = server.address();
    var protocol = 'http';

    const server_url = protocol + '://' + address.address + ':' + address.port;
    
    // Tests access 'server.url' for now. Deprecated. 
    server.url = server_url;
    
    // Use this instead.
    config.set('server:url', server.url);

    var readyMessage = 'Registration server v' + require('../package.json').version +
        ' listening on ' + server_url +
      '\n Serving main domain: ' + config.get('dns:domain') +
      ' extras: ' + config.get('dns:domains');
    logger.info(readyMessage);
    appListening(readyMessage);
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
