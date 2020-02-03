// @flow

/**
 * Runs the server. Launch with `node server [options]`.
 */

const app = require('./app');
const config = require('./utils/config');
const logger = require('winston');
    
const http = require('http');
const superagent = require('superagent');
const bluebird = require('bluebird');
const child_process = require('child_process');
const url = require('url');

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

async function collectUsageAndSendReport() {

  // Check if the PRYV_REPORTING_OFF environment variable is set to 1.
  // If it is, don't collect data and don't send report
  const optOutReporting = process.env.PRYV_REPORTING_OFF;
  if (optOutReporting === 1) { // TODO TESTING true, false, 1, 0, '', "1", "0", {}, null
    logger.info('PRYV_REPORTING_OFF is set to ' + optOutReporting + ', not reporting');
    return;
  }

  // Collect data
  let reportingSettings = config.get('services:reporting');
  const hostname = await collectHostname();
  const clientData = await collectClientData();
  const body = {
    licenseName: reportingSettings.licenseName,
    role: 'register',
    hostname: hostname,
    templateVersion: reportingSettings.templateVersion,
    clientData: clientData
  };

  // Send report
  // TODO TESTING avec et sans service-reporting qui tourne
  const reportingUrl = 'http://0.0.0.0:4000'; //'reporting.pryv.com';
  try {
    const res = await superagent.post(url.resolve(reportingUrl, 'reports')).send(body);
    logger.info('Report sent to ' + reportingUrl, res.body);
  } catch(error) {
    logger.error('Unable to send report to ' + reportingUrl + ' Reason : ' + error.message);
  }

  // Schedule another report in 24 hours
  const hours = 24;
  const timeout = hours * 60 * 60 * 1000;
  logger.info('Scheduling another report in ' + hours + ' hours');
  setTimeout(() => {
    collectUsageAndSendReport();
  }, timeout);
}

async function collectClientData(): Object {
  const usersStorage = require('./storage/users');

  let numUser = await bluebird.fromCallback(cb => { // TODO TESTING 0 ou plusieurs users, ainsi qu'une erreur de DB
    usersStorage.getAllUsersInfos(cb);
  });
  numUser = numUser.length;

  return {numUser: numUser};
}

async function collectHostname(): Object {
  const hostname = await bluebird.fromCallback(
    cb => child_process.exec('hostname', cb));
  return hostname.replace(/\s/g,''); // Remove all white spaces
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

    const readyMessage = 'Registration server v' + require('../package.json').version +
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

  collectUsageAndSendReport();
} else {
  logger.info('** HTTP server is off !');
}
//start dns
require('./app-dns');
