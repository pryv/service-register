// Dependencies

var nconf = require('nconf');
var logger = require('winston');
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
  'http': {  // this should match the config of sww
    'static': {
      'port': 443,
      'name': 'www.wactiv.com', // used by dns and index.js
      'ssl': true,
      'no_ssl_on_port': 80, // IF SSL IS ON also listen to this port 0 if not
    },
    'register': {
      'port': 443, 
      'ip': '127.0.0.1', // for listening on a specific IP
      'name': 'rec.la',
      'ssl': true, // turn ssl on
      'no_ssl_on_port': 80, // IF SSL IS ON also listen to this port 0 if not
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
    'confirm-sender-email': 'active@rec.la',
    'amazon_ses' : {
      'accesskeyid': 'AKIAIHR6HVRME43VNCSA',
      'secretkey': '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',
      'serviceurl': 'https://email.us-east-1.amazonaws.com'
    }
  },
  'dns': {
      'port': 53,
      'ip': '127.0.0.1', // listen on a specific IP
      'name': 'ns1.wactiv.com', // (my name for a dns)
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
nconf.httpUrl = function(serverKey, secure) {
  if (secure == undefined) secure = true;
  var server = nconf.get(serverKey);
  if (server == undefined) throw(new Error('unkown key: '+serverKey));
  
  var ssl = server.ssl;
  var port = server.port + 0;
  
  if (! secure) {
    if (server.no_ssl_on_port > 0) {
      ssl = false;
      port = server.no_ssl_on_port + 0;
    } else {
      logger.error('config.httpUrl Cannot build unsecure url for: '+serverKey);
    }
  }
  
  var url = ssl ? 'https://' : 'http://';
  if ((ssl && port == 443) || ((! ssl ) && port == 80)) {
    url += server.name+'/';
  } else {
    url += server.name+':'+port+"/";
  }
  return url;
}


// Set network aware parameters
