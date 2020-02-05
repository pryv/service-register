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

// server: http.Server;
// Produces the server instance for listening to HTTP/HTTPS traffic, depending
// on the configuration. 
//
// NOTE Since we depend on there being an url property in the server, we don't 
//    return vanilla servers from this function but a subtype. Make sure
//    the code knows about the `url`.
//
class ServerWithUrl {
  server: http.Server;
  url: string;

  constructor(customSettings?: Object) {
    if(customSettings != null) {
      config.overrides(customSettings);
    }

    const ssl = config.get('server:ssl');
    
    // NOTE The code below typecasts through any. If you modify this code, please
    //   make sure that the return value is in fact a http/https server instance. 
    //   Also why we have type assertions just before the cast through any. 

    // HACK: config doesn't parse bools when passed from command-line
    if (ssl && ssl !== 'false') {
      throw new Error('SSL inside register server has been removed. Set ssl to false to continue.');
    }
    this.server = http.createServer(app);
  }

  async start() {
    logger.info('Register  server :' + config.get('http:register:url'));
    logger.info('Static  server :' + config.get('http:static:url'));

    if (config.get('server:port') <= 0) {
      logger.info('** HTTP server is off !');
      return;
    }

    var appListening = ready.waitFor('register:listening:' + config.get('server:ip') +
      ':' + config.get('server:port'));
    
    const opts = {
      port: config.get('server:port'),
      host: config.get('server:ip'),
    };

    try {
      await bluebird.fromCallback(
        (cb) => this.server.listen(opts, cb));
    }
    catch(e) {
      if (e.code === 'EACCES') {
        logger.error('Cannot ' + e.syscall);
        throw (e);
      }
    }

    var address = this.server.address();
    var protocol = 'http';

    const server_url = protocol + '://' + address.address + ':' + address.port;
    
    // Tests access 'server.url' for now. Deprecated. 
    this.url = this.server.url = server_url;
    
    // Use this instead.
    config.set('server:url', this.server.url);

    const readyMessage = 'Registration server v' + require('../package.json').version +
        ' listening on ' + server_url +
      '\n Serving main domain: ' + config.get('dns:domain') +
      ' extras: ' + config.get('dns:domains');
    logger.info(readyMessage);
    appListening(readyMessage);

    this.collectUsageAndSendReport();

    //start dns
    require('./app-dns');
  }

  async collectUsageAndSendReport() {

    // Check if the PRYV_REPORTING_OFF environment variable is set to 1.
    // If it is, don't collect data and don't send report
    const optOutReporting = config.get('services:reporting:optOut');

    if (optOutReporting) {
      logger.info('PRYV_REPORTING_OFF is set to ' + optOutReporting + ', not reporting');
      return;
    }

    // Collect data
    let reportingSettings = config.get('services:reporting');
    const hostname = await this.collectHostname();
    const clientData = await this.collectClientData();
    const body = {
      licenseName: reportingSettings.licenseName,
      role: 'register',
      hostname: hostname,
      templateVersion: reportingSettings.templateVersion,
      clientData: clientData
    };

    // Send report
    const reportingUrl = 'https://reporting.pryv.com'; // 'http://0.0.0.0:4001'; //
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
      this.collectUsageAndSendReport();
    }, timeout);
  }

  async collectClientData(): Object {
    const usersStorage = require('./storage/users');

    let numUser = await bluebird.fromCallback(cb => {
      usersStorage.getAllUsersInfos(cb);
    });
    numUser = numUser.length;

    return {numUser: numUser};
  }

  async collectHostname(): Object {
    const hostname = await bluebird.fromCallback(
      cb => child_process.exec('hostname', cb));
    return hostname.replace(/\s/g,''); // Remove all white spaces
  }

  async stop() {
    await this.server.close();
  }
}

module.exports = ServerWithUrl;
