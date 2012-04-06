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
    'port_static': 3080,
    'port_register': 3443,
    'register_ssl': false,
    'host': 'localhost'
  },
  'persistence' : { 
    'init-ttl' : 60 // seconds should be 86400 for a day
  },
  'net': {
    'servers_domain': 'rec.la', 
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
  'dns': {
      'port': 9999,
      'host': '127.0.0.1',
      'hostname': 'ns1.wactiv.com',
      'domain': 'rec.la'
  },
  'test': {
    'init': {
        'deactivate_mailer' : false,
        'add_challenge' : true  // will add the challenge string to the response in order to chain tests
    }
  }
});

// Set network aware parameters
