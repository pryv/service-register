// Dependencies

var nconf = require('nconf');
var logger = require('winston');
var fs = require('fs');

// Exports

module.exports = nconf;

// Setup nconf to use (in-order): 
//   1. Command-line arguments
//   2. Environment variables

nconf.argv()
     .env(); 

//3. A file located at .. 
var configFile = 'config.json';
if (typeof(nconf.get("config")) !== 'undefined') {
  configFile = nconf.get("config");
}



if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  logger.info("using custom config file: "+configFile);
} else {
  logger.error("Cannot find custom config file: "+configFile);
} 

nconf.file({ file: configFile});

// Set default values
nconf.defaults({
  "languages": {
      "default" : "en",
      "supported" : [{"en": "English"}, {"fr": "Français"}]
  },
  "http": {  // this should match the config of sww
    "static": {
      "port": 443,
      "name": "w.pryv.com", // used by dns and index.js
      "ssl_name": "sw.pryv.io", // used by dns
      "ssl": true,
      "no_ssl_on_port": 80, // IF SSL IS ON also listen to this port 0 if not
    },
    "register": {
      "port": 2443, 
      "ip": "0.0.0.0",
      "name": "reg.pryv.io", // used by the dns to point join.pryv.io
      "ssl": true, // turn ssl on
      "certs": "pryv.io",
      "no_ssl_on_port": 2080, // IF SSL IS ON also listen to this port 0 if not
    }
  },
  "persistence" : { 
    "init-ttl" : 86400 // seconds should be 86400 for a day
  },
  "net": { // manly used in /network/dataservers
    "AAservers_domain": "pryv.net", // domains for all admin / activity servers
    "aaservers_ssl": true, // set if admin / activity servers have ssl
    "aaservers": 
      [{ "base_name": "reg-gandi-fr-01", "port": 443, "authorization": "register-test-token" }, 
       { "base_name": "reg-gandi-fr-02", "port": 443, "authorization": "register-test-token" }]
  },
  "mailer": {
    "deactivated" : false, // globally deactivate mailing
    "confirm-sender-email": "active@pryv.com",
    "amazon_ses" : {
      "accesskeyid": "AKIAIHR6HVRME43VNCSA",
      "secretkey": "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",
      "serviceurl": "https://email.us-east-1.amazonaws.com"
    }
  },
  "dns": {
    "port": 2053,
    "ip": "0.0.0.0",
    "name": "local.pryv.net",
    "domain": "pryv.io",
    "domain_A": "217.70.184.38",
    "default_ttl": 3600,
    "nameserver": [
      {
        "name": "dns-gandi-fr-01.pryv.net",
        "ip": "92.243.26.12"
      },
      {
        "name": "dns-gandi-fr-02.pryv.net",
        "ip": "95.142.162.163"
      }
    ],
    "mail": [
      {
        "name": "spool.mail.gandi.net",
        "ip": "217.70.184.6",
        "ttl": 10800,
        "priority": 10
      },
      {
        "name": "fb.mail.gandi.net",
        "ip": "217.70.184.162",
        "ttl": 10800,
        "priority": 50
      }
    ]
  },
  "redis": {
    "password": "MyRecordedLife",
  },
  "test": {
    "init": {
        "deactivate_mailer" : false,
        "add_challenge" : true  // will add the challenge string to the response in order to chain tests
    }
  }
});


/** 
 * construct an Url from a port/host/ssl config
 * beacause of stupid nconf who is unable to reconstruct 
 * object tree after overriding we have to grab each keys one by one
 **/
nconf.httpUrl = function(serverKey, secure) {
  if (secure == undefined) secure = true;

  var ssl = nconf.get(serverKey+":ssl");
  var port = nconf.get(serverKey+":port") + 0;


  if (! secure) {
    if (nconf.get(serverKey+":no_ssl_on_port") > 0) {
      ssl = false;
      port = nconf.get(serverKey+":no_ssl_on_port") + 0;
    } else {
      throw(new Error('config.httpUrl Cannot build unsecure url for: '+serverKey));
    }
  }
  var name = nconf.get(serverKey+":name");  
  if (secure && nconf.get(serverKey+":ssl_name")) {
    name = nconf.get(serverKey+":ssl_name");
  }
  var url = ssl ? 'https://' : 'http://';
  if ((ssl && port == 443) || ((! ssl ) && port == 80)) {
    url += name+'/';
  } else {
    url += name+':'+port+"/";
  }
  //console.log(serverKey+" "+url);
  return url;
}



// Set network aware parameters
