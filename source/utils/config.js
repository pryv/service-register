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
      'ip': '127.0.0.1', // for listening on a specific IP
      'name': 'localhost',
      'ssl': false
    },
    'register': {
      'port': 3443, 
      'ip': '127.0.0.1', // for listening on a specific IP
      'name': 'localhost',
      'ssl': true, // turn ssl on
      'no_ssl_on_port': 4080, // IF SSL IS ON also listen to this port for no ssl
    }
  },
  'persistence' : { 
    'init-ttl' : 86400 // seconds should be 86400 for a day
  },
  'net': { // manly used in /network/dataservers
    'AAservers_domain': 'wactiv.com', // domaine for all admin / activity servers
    'aaservers_ssl': false, // set if admin / activity servers have ssl
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
      'ip': '127.0.0.1', // for listening on a specific IP
      'name': 'ns1.wactiv.com', // see the 'net' key (my name for a dns)
      'domain': 'rec.la',
      'default_ttl': 3600,
   'nameserver': [{name: 'ns1.wactiv.com', ip: '91.121.41.240'},
   				  {name: 'ns2.wactiv.com', ip: '91.121.41.94'}],
   'mail' : [{name: "spool.mail.gandi.net", ip: "217.70.184.6", ttl: 10800, priority: 10 },
                { name: "fb.mail.gandi.net", ip: "217.70.184.162", ttl: 10800, priority: 50 }]
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
    url += server.name+'/';
  } else {
    url += server.name+':'+server.port+"/";
  }
  return url;
}

// Set network aware parameters
