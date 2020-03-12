// @flow

// Starts the DNS server. 

const config = require('./config');
const dns = require('./dns/ndns-wrapper');

const { serverForName, logger } = require('./dns/server_for_name.js');

var ready = require('readyness');
ready.setLogger(logger.info);

var readyListening = ready.waitFor('app_dns:listening');
dns.start('udp4', config.get('dns:port'), config.get('dns:ip'), serverForName, readyListening);
if (config.get('dns:ip6')) {
  dns.start('udp6', config.get('dns:port'), config.get('dns:ip6'), serverForName, readyListening);
}
