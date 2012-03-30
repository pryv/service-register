// Dependencies

var nconf = require('nconf');

// Exports

module.exports = nconf;

// Load configuration settings

// Setup nconf to use (in-order): 
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
nconf.argv()
     .env()
     .file({ file: 'config.json' }); //TODO: set proper config file path

// Set default values
nconf.defaults({
  'http': {
    'port': 3000
  },
  'persistence' : { 
    'init-ttl' : 60 // seconds should be 86400 for a day
  },
  'net': {
    'servers_domain': 'edelwatch.net', // maybe tracktivist.net
    'my_id': 'ns1',
    'staticsurl': 'http://localhost:3000/',
    'confirmurl': 'http://localhost:3000/%challenge%/confirm'
  },
  'mailer': {
    'deactivated' : false, // globally deactivate mailing
    'confirm-sender-email': 'trac@edelwatch.net',
    'amazon_ses' : {
      'accesskeyid': 'AKIAIHR6HVRME43VNCSA',
      'secretkey': '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',
      'serviceurl': 'https://email.us-east-1.amazonaws.com'
    }
  },
  'test': {
    'init': {
        'deactivate_mailer' : true,
        'add_challenge' : true  // will add the challenge string to the response in order to chain tests
    }
  }
});

// Set network aware parameters
