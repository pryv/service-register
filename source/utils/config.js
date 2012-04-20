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
  'languages': {
      'default' : 'en',
      'supported' : [{'en': 'English'}, {'fr': 'Français'}]
  },
  'http': {
    'static': {
      'port': 3080,
      'host': '127.0.0.1',
      'ssl': false
    },
    'register': {
      'port': 3443,
      'host': 'localhost',
      'ssl': true
    }
  },
  'persistence' : { 
    'init-ttl' : 86400 // seconds should be 86400 for a day
  },
  'net': {
    'servers_domain': 'wactiv.com', 
    'aaservers_ssl': false, // set if admin / activity servers have ssl
    'my_id': 'ns1'
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
      'hostname': 'ns1.wactiv.com', // see the 'net' key
      'domain': 'rec.la'
  },
  'test': {
    'init': {
        'deactivate_mailer' : false,
        'add_challenge' : true  // will add the challenge string to the response in order to chain tests
    }
  }
});

/** 
* construct an Url from a port/host/ssl config
**/
nconf.httpUrl = function(serverKey) {
  server = nconf.get(serverKey);
  if (server == undefined) throw(new Error('unkown key: '+serverKey));
  var url = server.ssl ? 'https://' : 'http://';
  if ((server.ssl && server.port == 443) || ((! server.ssl ) && server.port == 80)) {
    url += server.host+'/';
  } else {
    url += server.host+':'+server.port+"/";
  }
  return url;
}

// Set network aware parameters
