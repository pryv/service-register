const config = require('../config');
const url = require('url');

const info = Object.assign({}, config.get('service'));

info.serial = config.get('serial');


// add eventual missing '/';
['access', 'api', 'register'].forEach((key) => { 
  if (info[key].slice(-1) !== '/') {
    info[key] += '/';
  }
});

module.exports = info;