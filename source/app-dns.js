// @flow

// Starts the DNS server. 

const config = require('./utils/config');
const dns = require('./dns/ndns-wrapper');

const { serverForName, logger } = require('./dns/server_for_name.js');

var ready = require('readyness');
ready.setLogger(logger.info);

var readyListening = ready.waitFor('app_dns:listening');
dns.start(config.get('dns:port'), config.get('dns:ip'), serverForName, readyListening);

