/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
