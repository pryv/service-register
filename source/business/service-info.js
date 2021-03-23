/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const config = require('../config');
const url = require('url');

const STUB_VALUE_FOR_OPEN_SOURCE = '1.6.0';

// get version from the file that is in the container
const info = Object.assign({}, config.get('service'));
const reportingSettings = config.get('reporting');
if (reportingSettings == null) {
  info['version'] = STUB_VALUE_FOR_OPEN_SOURCE;
} else {
  info['version'] = reportingSettings.templateVersion;
}

// add eventual missing '/';
['access', 'api', 'register'].forEach((key) => {
  if (info[key].slice(-1) !== '/') {
    info[key] += '/';
  }
});

module.exports = info;