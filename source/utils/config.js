// @flow

//Dependencies

const nconf = require('nconf');
const logger = require('winston');
const fs = require('fs');

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
  serial: '2019061301',
  dns: {
    'defaultTTL' : 3600,
    'ip': '127.0.0.1',
    'name': 'localhost',
    'port': '2053',
    'mail': []
  },
  service: {
    "name": "My Pryv Lab",
    "support": "https://pryv.com/helpdesk",
    "terms": "https://pryv.com/pryv-lab-terms-of-use/"
  },
  eventTypes: {
    "sourceURL": "https://api.pryv.com/event-types/flat.json"
  },
  auth: {
    authorizedKeys: {

    },
    authUrl : 'https://sw.pryv.io:2443/access/v0/access.html'
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
  },
  invitationTokens: undefined,
});

// Check the validity of the configuration
validateConfiguration();

type LocalizedNameList = {
  [language: string]: string, 
};

type Hosting = {
  url: string, 
  name: string, 
  description: string, 
  localizedDescription: {
    [language: string]: string, 
  }, 
  
  available: ?boolean, 
};

type HostingZone = {
  name: string, 
  localizedName: LocalizedNameList,
  hostings: {
    [hostingName: string]: Hosting, 
  }, 
};

type HostingZoneList = {
  [key: string]: HostingZone, 
};

type HostingRegion = {
  name: string, 
  localizedName: LocalizedNameList,
  zones: HostingZoneList, 
};

export type HostingDefinition = {
  regions: {
    [regionName: string]: HostingRegion,
  }, 
}; 

// type ServerConfiguration = {
//   [hostingName: string]: ServerList, 
// };

export type ServerList = Array<ServerConfig>;

export type ServerConfig = OldServerDefinition | ServerDefinition;

export type OldServerDefinition = {
  base_name: string, 
  port: number, 
  authorization: string, 
  
  name: string,
};

export type ServerDefinition = {
  base_url: string, 
  authorization: string, 

  name: string,
};

function validateConfiguration () {
  const ipRegexp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  const hostnameRegexp = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  
  // Check the DNS MX entries
  const mxEntries = nconf.get('dns:mail');
  if (mxEntries == null || !Array.isArray(mxEntries)) {
    throw parseError('Expecting "dns:mail" to be an array (even empty) of MX entries.'); 
  }
  
  for (const mxEntry of mxEntries) {
    const mxName = mxEntry.name;
    if (mxName == null || typeof mxName !== 'string' || !hostnameRegexp.test(mxName))
      throw parseError('Invalid MX entry found: "name" attribute invalid: ' + mxName
        + '\n Expecting a name in the form: "mailserver.domain.tld".'); 
    const mxIp = mxEntry.ip;
    if(mxIp != null) {
      if (typeof mxIp !== 'string' || !ipRegexp.test(mxIp))
        throw parseError('Invalid MX entry found: "ip" attribute invalid: ' + mxIp
          + '\n Expecting an ip in the form: "127.0.0.1".');  
    }
    const mxPriority = mxEntry.priority;
    if (mxPriority == null || typeof mxPriority !== 'number')
      throw parseError('Invalid MX entry found: "priority" attribute invalid: ' + mxPriority); 
  }

  // Check the hosting entries
  const hostings = nconf.get('net:aahostings'); 
  
  const hosturlRegexp = /^http(s?):\/\/[a-zA-Z0-9.-]+$/;
  
  if (hostings == null || hostings.regions == null) 
    throw parseError('No net:aahostings key found in configuration'); 
  
  for (const name of Object.keys(hostings.regions)) {
    const region = hostings.regions[name];
    const zones = region.zones; 
    
    if (zones == null || Object.keys(zones).length <= 0) 
      throw parseError(`Region ${name} has no zones defined.`);
      
    // assert: Object.keys(zones).length > 0
    for (const zoneName of Object.keys(zones)) {
      const zone = zones[zoneName];
      const hostings = zone.hostings; 
      
      if (hostings == null || Object.keys(hostings).length <= 0) 
        throw parseError(`Zone ${zoneName} (region ${name}) has no hostings.`);
      
      for (const hostingName of Object.keys(hostings)) {
        const hosting = hostings[hostingName];
        const hostingUrl = hosting.url;
        
        if(hostingUrl == null || typeof hostingUrl !== 'string' || !hosturlRegexp.test(hostingUrl))
          throw parseError('Hosting ' + hostingName + ' has invalid url: ' + hostingUrl
            + '\n Expecting an url in the form: "http(s)://server.domain.tld".');  
      }
    }
  }

  const invitationTokens = nconf.get('invitationTokens');
  if (invitationTokens == null) {
    // ok
  } else if (!Array.isArray(invitationTokens)) {
    throw parseError('"invitationTokens" is defined, but is not an Array');
  } else {
    invitationTokens.forEach((token, i) => {
      if (typeof token !== 'string') {
        throw parseError('invitationToken "' + token + '" at position ' + i + ' in the "invitationTokens" array is not a string.');
      }

      if (token.length < 5) {
        throw parseError('invitationToken "' + token + '" at position ' + i +
          'in the "invitationTokens" array is less than 5 characters in length.');
      }

      if (token.length > 99) {
        throw parseError('invitationToken "' + token + '" at position ' + i +
          'in the "invitationTokens" array is more than 99 characters in length.');
      }
    });
  }
}

function parseError(msg: string) {
  return new Error('Configuration error: ' + msg);
}