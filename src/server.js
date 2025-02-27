/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
/**
 * Runs the server. Launch with `node server [options]`.
 */

const app = require('./app');
const logger = require('winston');

const http = require('http');
const bluebird = require('bluebird');

const ready = require('readyness');

const info = require('./business/service-info');
const config = require('./config');

ready.setLogger(logger.info);

/**
 * server: http.Server;
 * Produces the server instance for listening to HTTP/HTTPS traffic, depending
 * on the configuration.
 *
 * NOTE Since we depend on there being an url property in the server, we don't
 *    return vanilla servers from this function but a subtype. Make sure
 *    the code knows about the `url`.
 */
class ServerWithUrl {
  /**
   * @type {http.Server}
   */
  server;
  /**
   * @type {string}
   */
  url;
  /**
   * @type {object}
   */
  config;

  constructor (customConfig) {
    this.config = customConfig || config;
    this.server = http.createServer(app);
  }

  /**
   * @returns {Promise<void>}
   */
  async start () {
    logger.info('Register  server :' + info.register);
    if (this.config.get('server:port') <= 0) {
      logger.info('** HTTP server is off !');
      return;
    }
    const appListening = ready.waitFor(
      'register:listening:' +
        this.config.get('server:ip') +
        ':' +
        this.config.get('server:port')
    );
    const opts = {
      port: this.config.get('server:port'),
      host: this.config.get('server:ip')
    };
    try {
      await bluebird.fromCallback((cb) => this.server.listen(opts, cb));
    } catch (e) {
      if (e.code === 'EACCES') {
        logger.error('Cannot ' + e.syscall);
        throw e;
      }
    }
    const address = this.server.address();
    const protocol = 'http';
    const serverURL = protocol + '://' + address.address + ':' + address.port;
    // Tests access 'server.url' for now. Deprecated.
    this.url = this.server.url = serverURL;
    // Use this instead.
    this.config.set('server:url', this.server.url);
    const readyMessage =
      'Registration server v' +
      require('../package.json').version +
      ' listening on ' +
      serverURL +
      '\n Serving main domain: ' +
      this.config.get('dns:domain') +
      ' extras: ' +
      this.config.get('dns:domains');
    logger.info(readyMessage);
    appListening(readyMessage);
    // start dns
    require('./app-dns');
  }

  /**
   * @returns {any}
   */
  async collectClientData () {
    const usersStorage = require('./storage/users');
    const users = await bluebird.fromCallback((cb) => {
      usersStorage.getAllUsersInfos(cb);
    });
    const numUsers = users.length;
    return { numUsers, domain: this.config.get('dns:domain') };
  }

  /**
   * @returns {Promise<void>}
   */
  async stop () {
    await this.server.close();
  }
}
module.exports = ServerWithUrl;
