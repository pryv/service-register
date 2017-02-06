//Dependencies

var nconf = require('nconf');
var logger = require('winston');
var fs = require('fs');

//Exports

module.exports = nconf;

//Setup nconf to use (in-order):
//1. Command-line arguments
//2. Environment variables

nconf.argv()
  .env();

//3. A file located at ..
var configFile =
  fs.existsSync('dev-config.json') ? 'dev-config.json': 'localhost-config.json';
if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}


if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  logger.info('using custom config file: ' + configFile);
} else {
  logger.error('Cannot find custom config file: ' + configFile);
}

nconf.file({ file: configFile});

//Set default values
nconf.defaults({
  dns: {
    'defaultTTL' : 3600,
    'ip': '127.0.0.1',
    'name': 'localhost',
    'port': '2053'
  },
  auth: {
    authorizedKeys: {

    }
  },
  'languages': {
    'default' : 'en',
    'supported' : [{'en': 'English'}, {'fr': 'Français'}]
  },
  'http': {  // this should match the config of sww
    'static': {
      'url': 'https://sw.pryv.me/register/index.html', // for redirection
      'errorUrl': 'https://sw.pryv.me/register/error.html',
      'access': 'https://sw.pryv.io:2443/access/v0/access.html' // ADD A trailing slashes for dir
    },
    'register': { // this is the (public) front url
      'url': 'https://reg.pryv.io:443'  // no trailling "/" !!
    }
  },
  'server': { // see http:register for public url
    'port': 2443,
    'ip': '0.0.0.0',
    'ssl': true,
    'certsPathAndKey': '/home/register/secrets/pryv.io' // will add '-privatekey'.. and others
  },
  'persistence' : {
    'init-ttl' : 86400, // seconds should be 86400 for a day
    'access-ttl' : 3600  // access-request
  },
  'net': { // manly used in /network/dataservers
    aahostings : {
    },
    'AAservers_domain': 'pryv.net', // domain for all admin / activity servers
    'aaservers_ssl': true, // set if admin / activity servers have ssl
    'aaservers': {}
  },
  oauth2: {
    port: 9090
  },
  'test': {

  },
  'devel': {
    'static': {
      'access' : 'https://l.rec.la:4443/access/'
    }
  },
  airbrake: {
    key: 'xxxxxxxx' // registration server key
  },
  appList: {
    // apps defined in specific configs (dev/staging/production)
  }
});



//Set network aware parameters
