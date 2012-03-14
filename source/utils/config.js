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
  }
});
