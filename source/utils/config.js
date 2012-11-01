//Dependencies

var nconf = require('nconf');
var logger = require('winston');
var fs = require('fs');
var path = require('path');

//Exports

module.exports = nconf;

//Setup nconf to use (in-order): 
//1. Command-line arguments
//2. Environment variables

nconf.argv()
.env(); 

//3. A file located at .. 
var configFile = 'config.json';
if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}

if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  logger.info('using custom config file: '+configFile);
} else {
  logger.error('Cannot find custom config file: '+configFile);
} 

nconf.file({ file: configFile});

//Set default values
nconf.defaults({
  'languages': {
    'default' : 'en',
    'supported' : [{'en': 'English'}, {'fr': 'Français'}]
  },
  'http': {  // this should match the config of sww
    'static': {
      'url': 'https://sw.pryv.io/register/index.js', 
      'error_page': 'error.html'
    },
    'register': {
      'url': 'https://reg.pryv.io/',
      'ssl': true, // could be changed by a _startwidth(https: tests)
    }
  },
  'server': {
    'name': 'reg.pryv.io', // adapt http:static:url of needed
    'port': 2443, 
    'ip': '0.0.0.0',
    'certsPathAndKey': '/home/register/secrets/pryv.io', // will add '-privatekey'.. and others
  },
  'persistence' : { 
    'init-ttl' : 86400, // seconds should be 86400 for a day
    'access-ttl' : 3600  // access-request 
  },
  'net': { // manly used in /network/dataservers
    'AAservers_domain': 'pryv.net', // domaine for all admin / activity servers
    'aaservers_ssl': true, // set if admin / activity servers have ssl
    'aaservers': 
      [{ 'base_name': 'act-gandi-fr-01', 'port': 443, 'authorization': 'register-test-token'}, 
       { 'base_name': 'act-gandi-us-01', 'port': 443, 'authorization': 'register-test-token'}]
  },
  'mailer': {
    'deactivated' : false, // globally deactivate mailing
    'confirm-sender-email': 'active@pryv.com',
    'amazon_ses' : {
      'accesskeyid': 'AKIAIHR6HVRME43VNCSA',
      'secretkey': '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',
      'serviceurl': 'https://email.us-east-1.amazonaws.com'
    }
  },
  'dns': {
    'port': 2053,
    'ip': '0.0.0.0',
    'name': 'local.pryv.net',
    'domain': 'pryv.io',
    'domain_A': '217.70.184.38',
    'defaultTTL': 3600,
    'nameserver': [
                   {
                     'name': 'dns-gandi-fr-01.pryv.net',
                     'ip': '92.243.26.12'
                   },
                   {
                     'name': 'dns-gandi-fr-02.pryv.net',
                     'ip': '95.142.162.163'
                   }
                   ],
   'mail': [
            {
              'name': 'spool.mail.gandi.net',
              'ip': '217.70.184.6',
              'ttl': 10800,
              'priority': 10
            },
            {
              'name': 'fb.mail.gandi.net',
              'ip': '217.70.184.162',
              'ttl': 10800,
              'priority': 50
            }
            ]
  },
  'redis': {
    'password': 'MyRecordedLife',
  },
  'test': {
    'init': {
      'deactivate_mailer' : false,
      'add_challenge' : true  // will add the challenge string to the response in order to chain tests
    }
  }
});



//Set network aware parameters
