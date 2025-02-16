/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const config = require('../config');

const STUB_VALUE_FOR_OPEN_SOURCE = '1.6.0';

// get version from the file that is in the container
const info = Object.assign({}, config.get('service'));
const reportingSettings = config.get('reporting');
if (reportingSettings == null) {
  info.version = STUB_VALUE_FOR_OPEN_SOURCE;
} else {
  info.version = reportingSettings.templateVersion;
}

// add eventual missing '/';
['access', 'api', 'register'].forEach((key) => {
  if (info[key].slice(-1) !== '/') {
    info[key] += '/';
  }
});

module.exports = info;

const regexSchemaAndPath = /(.+):\/\/(.+)/gm;

/**
 * Copied over from the JS lib's `Service.buildAPIEndpoint()`
 * TODO: refactor code shared across client & server components into internal lib
 * @param {string} username
 * @param {string} token
 * @returns {string}
 */
module.exports.getAPIEndpoint = function (username, token) {
  const tokenAndAPI = {
    endpoint: info.api.replace('{username}', username),
    token
  };
  if (!tokenAndAPI.token) {
    let res = tokenAndAPI.endpoint + '';
    if (!tokenAndAPI.endpoint.endsWith('/')) {
      res += '/';
    }
    return res;
  }
  regexSchemaAndPath.lastIndex = 0;
  const res = regexSchemaAndPath.exec(tokenAndAPI.endpoint);
  // add a trailing '/' to end point if missing
  if (!res[2].endsWith('/')) {
    res[2] += '/';
  }
  return res[1] + '://' + tokenAndAPI.token + '@' + res[2];
};
