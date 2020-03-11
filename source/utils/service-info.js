const config = require('../utils/config');
const url = require('url');

const info = Object.assign({}, config.get('service'));

setConfig('serial', 'serial');
setConfig('register', 'http:register:url');
setConfig('home', 'http:static:url');
setConfig('event-types', 'eventTypes:sourceURL');

function setConfig(memberName, configPath) {
  const value = config.get(configPath);
  if (value)
    info[memberName] = value;
}

// add eventual missing '/';
['access', 'api', 'register'].forEach((key) => { 
  if (info[key].slice(-1) !== '/') {
    info[key] += '/';
  }
});

module.exports = info;