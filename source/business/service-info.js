const config = require('../config');
const checkAndConstraints = require('../utils/check-and-constraints');

const info = Object.assign({}, config.get('service'));

info.serial = config.get('serial');


// add eventual trailing '/' to all URL fields of service information;
Object.keys(info).forEach(k => {
  if (checkAndConstraints.url(info[k])) {
    if (info[k].slice(-1) !== '/') {
      info[k] += '/';
    }
  }
});

module.exports = info;