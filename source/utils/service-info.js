const config = require('../utils/config');

const info = Object.assign({}, config.get('service'));

// set default, up to the time they are provided by config
info.access = info.access || 'https://access.' + config.get('dns:domain') + '/access';
info.api = info.api || 'https://{username}.' + config.get('dns:domain') + '/';

setConfig('serial', 'serial');
setConfig('register', 'http:register:url');
setConfig('home', 'http:static:url');
setConfig('event-types', 'eventTypes:sourceURL');

function setConfig(memberName, configPath) {
  const value = config.get(configPath);
  if (value)
    info[memberName] = value;
}

module.exports = info;