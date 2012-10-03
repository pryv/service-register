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

configFile = fs.realpathSync(configFile);

if (fs.existsSync(configFile)) {
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
      "name": "www.wactiv.com", // used by dns and index.js
      "ssl": true,
      "no_ssl_on_port": 80, // IF SSL IS ON also listen to this port 0 if not
    },
    "register": {
      "port": 443, 
      //"ip": "127.0.0.1"
      "name": "rec.la",
      "ssl": true, // turn ssl on
      "no_ssl_on_port": 80, // IF SSL IS ON also listen to this port 0 if not
    }
  },
  "persistence" : { 
    "init-ttl" : 86400 // seconds should be 86400 for a day
  },
  "net": { // manly used in /network/dataservers
    "AAservers_domain": "wactiv.com", // domaine for all admin / activity servers
    "aaservers_ssl": true, // set if admin / activity servers have ssl
    "aaservers": 
      [{ "base_name": "test1", "port": 443, "authorization": "register-test-token" , ip: "91.121.34.251"}, 
       { "base_name": "test2", "port": 443, "authorization": "register-test-token" , ip: "46.105.35.181" }]
  },
  "mailer": {
    "deactivated" : false, // globally deactivate mailing
    "confirm-sender-email": "active@rec.la",
    "amazon_ses" : {
      "accesskeyid": "AKIAIHR6HVRME43VNCSA",
      "secretkey": "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",
      "serviceurl": "https://email.us-east-1.amazonaws.com"
    }
  },
  "dns": {
      "port": 53,
      //"ip": "127.0.0.1", // listen on a specific IP
      "name": "ns1.wactiv.com", // (my name for a dns) must be in nameserver list
      "domain": "rec.la",
      "domain_A": "91.121.41.240", // should point to www
      "default_ttl": 3600,
   "nameserver": [{"name": "ns1.wactiv.com", "ip": "91.121.41.240"},
   				  {"name": "ns2.wactiv.com", "ip": "91.121.41.94"}],
   "mail" : [{"name": "spool.mail.gandi.net", "ip": "217.70.184.6", "ttl": 10800, "priority": 10 },
             { "name": "fb.mail.gandi.net", "ip": "217.70.184.162", "ttl": 10800, "priority": 50 }]
  },
  "redis": {
    "password": "My recorded Life",
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
  var url = ssl ? 'https://' : 'http://';
  if ((ssl && port == 443) || ((! ssl ) && port == 80)) {
    url += name+'/';
  } else {
    url += name+':'+port+"/";
  }
  //console.log(serverKey+" "+url);
  return url;
}

nconf.save(function (err) {
  fs.readFile('/tmp/config.json', function (err, data) {
    console.log(data)
  });
});


// Set network aware parameters
