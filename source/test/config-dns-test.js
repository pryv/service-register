var config = require('../utils/config');

config.set('dns:port',8453);
config.set('dns:ip','127.0.0.1');
config.set('dns:name','localhost');

module.exports = config;