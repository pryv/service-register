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
var configFile = fs.existsSync('local-config.json') ? 'local-config.json' : 'dev-config.json';
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
      'url': 'https://sw.pryv.me/register/index.html', // for redirection
      'errorUrl': 'https://sw.pryv.me/register/error.html', 
      'access': 'https://sw.pryv.io:2443/access/v0/access.html' // ADD A trailing slashes for directories
    },
    'register': { // this is the (public) front url 
      'url': 'https://reg.pryv.io:443',  // no trailling "/" !!
    }
  },
  'server': { // see http:register for public url 
    'port': 2443, 
    'ip': '0.0.0.0',
    'ssl': true,
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
    'staticDataInDomain': { 
      'www': {alias: [ { name: 'w.pryv.com' } ]}, // static web files repository
      'sw': {alias: [ { name: 'sw.pryv.net' } ]}, // secured web files repository
      'reg': {alias: [ { name: 'reg.pryv.net' } ]}, // register real name
      'access': {alias: [ { name: 'reg.pryv.net' } ]} // access need to be migrated
    },
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
  'confirmEmail': {
    'method': 'pre', // (default = "pre") If "post" then account is created automatically and confirmation is handled by activity server  
    'postSalt': 'SaltyPryv', // the salt to encrypt the confirmation message
    'postUrl': 'confirm-email', // the url on the activity server 
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
