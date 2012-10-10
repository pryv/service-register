var config = require('../utils/config');

config.set('server:name','localhost');
config.set('server:ip','127.0.0.1');

config.set('dns:port',8453);
config.set('dns:ip','127.0.0.1');

module.exports = config;