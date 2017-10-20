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
  dns: {
    'defaultTTL' : 3600,
    'ip': '127.0.0.1',
    'name': 'localhost',
    'port': '2053'
  },
  auth: {
    authorizedKeys: {

    }
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
  oauth2: {
    port: 9090
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
  }
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

type ServerConfiguration = {
  [hostingName: string]: ServerList, 
};

export type ServerList = Array<ServerConfig>;

export type ServerConfig = OldServerDefinition | ServerDefinition;

export type OldServerDefinition = {|
  base_name: string, 
  port: number, 
  authorization: string, 
  
  name?: string, // added later by admin calls
|};

export type ServerDefinition = {|
  base_url: string, 
  authorization: string, 

  name?: string, // added later by admin calls
|};

function validateConfiguration () {
  // TODO Add a few checks for well-formedness of server configuration (net:aaservers).
  // TODO Check if all servers that have base_url have a defined 'hostname' in there. Parse the urls.
  
  // Check the DNS MX entries (see the ttl isssue #39)
  const mxEntries = nconf.get('dns:mail');
  if (mxEntries != null && Object.keys(mxEntries).length > 0) {
    for (const entry of Object.keys(mxEntries)) {
      const mxEntry = mxEntries[entry];
      const mxName = mxEntry.name;
      if (mxName == null && typeof mxName !== 'string')
        throw parseError('Invalid MX entry found: "name" attribute invalid: ' + mxName
        + '\n Expecting a name in the form: "mymailserver.somedomain.tld".'); 
      const mxIp = mxEntry.ip;
      if (mxIp == null && typeof mxIp !== 'string')
        throw parseError('Invalid MX entry found: "ip" attribute invalid:' + mxIp); 
      const mxTtl = mxEntry.ttl;
      if (mxTtl == null && typeof mxTtl !== 'number')
        throw parseError('Invalid MX entry found: "ttl" attribute invalid:' + mxTtl); 
      const mxPriority = mxEntry.priority;
      if (mxPriority == null && typeof mxPriority !== 'number')
        throw parseError('Invalid MX entry found: "priority" attribute invalid' + mxPriority); 
    }
  }

  // Check the hosting entries
  const hostings = nconf.get('net:aahostings'); 
  
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
    }
  }
}

function parseError(msg: string) {
  return new Error('Configuration error: ' + msg);
}