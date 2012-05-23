var config = require('../utils/config');

config.set('http:register:port',8443);
config.set('http:register:name','localhost');
config.set('http:register:no_ssl_on_port',8480);
config.set('http:register:ip','127.0.0.1');

config.set('dns:port',8453);
config.set('dns:ip','127.0.0.1');

module.exports = config;