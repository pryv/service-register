/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const config = require('../config');
const url = require('url');

// get version from the file that is in the container
const info = Object.assign({}, config.get('service'));
const reportingSettings = config.get('reporting');
info['version'] = '1.0.0';

// add eventual missing '/';
['access', 'api', 'register'].forEach((key) => {
  if (info[key].slice(-1) !== '/') {
    info[key] += '/';
  }
});

module.exports = info;