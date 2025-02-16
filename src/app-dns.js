/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// Starts the DNS server.

const config = require('./config');
const dns = require('./dns/ndns-wrapper');

const { serverForName, logger } = require('./dns/server_for_name');

const ready = require('readyness');
ready.setLogger(logger.info);

const readyListening = ready.waitFor('app_dns:listening');
dns.start(
  'udp4',
  config.get('dns:port'),
  config.get('dns:ip'),
  serverForName,
  readyListening
);
if (config.get('dns:ip6')) {
  dns.start(
    'udp6',
    config.get('dns:port'),
    config.get('dns:ip6'),
    serverForName,
    readyListening
  );
}
