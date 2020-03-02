// @flow

const config = require('../utils/config');
const _ = require('lodash');
const requireRoles = require('../middleware/requireRoles');

/**
 * Routes that allows to modify DNS records
 * (i.e. to set a acme-challenge)
 *
 * @param app
 */
module.exports = function (app) {

  /**
   * POST /records: Save the dns record provided in the body into DNS config.
   */
  app.post('/records', requireRoles('admin'), function (req, res, next) {
    const dnsUpdate = req.body;
    if(!validateDns(dnsUpdate)) {
      return next(new Error('Body is malformed or not provided (' + JSON.stringify(dnsUpdate) + ')'));
    }

    let dnsCurrent = config.get('dns') || {};
    if(dnsCurrent.staticDataInDomain == null) {
      dnsCurrent.staticDataInDomain = {};
    }
    dnsCurrent.staticDataInDomain = _.merge(dnsCurrent.staticDataInDomain, dnsUpdate);

    let result = [];
    const dnsKeys = Object.keys(dnsUpdate);

    // Return only the provided parameters, updated
    for(let i = 0; i < dnsKeys.length; i++) {
      const dnsKey = dnsKeys[i];
      const partResult = {};
      partResult[dnsKey] = dnsCurrent.staticDataInDomain[dnsKey];
      result.push(partResult);
    }

    res.json(result);
  });
};

function validateDns(dns: Object): boolean {
  const dnsKeys = Object.keys(dns);
  if(dns == null || dnsKeys.length === 0) {
    return false;
  }

  for(let i = 0; i < dnsKeys.length; i++) {
    const dnsKey = dnsKeys[i];
    if(dns[dnsKey].description == null) {
      return false;
    }

    if(!Array.isArray(dns[dnsKey].description)) {
      dns[dnsKey].description = [dns[dnsKey].description];
    }
  }

  return true;
}