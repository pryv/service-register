const config = require('./config'),
      _ = require('underscore');

_.str = require('underscore.string');
_.mixin(_.str.exports());

// Username regular expression
var checkUsername = new RegExp('^' + '([a-z0-9-]{1,100})' + '$');

/**
 * Check if a string ends with specified suffix
 * @param suffix: the suffix to look for
 * @returns {boolean}: 'true' if containing the suffix, 'false' otherwise
 */
String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/**
 * Extract resources such as username and domain from hostname
 * @param hostname: the hostname containing resources
 * @returns: a sliced string of resources
 */
exports.extractResourceFromHostname = function (hostname) {
  var domains = config.get('dns:domains');

  for (var i = 0; i < domains.length; i++) {
    if ( hostname.endsWith('.' + domains[i]) ) {
      var resource = hostname.slice(0, - domains[i].length - 1 );
      if (checkUsername.exec(resource)) {
        return resource;
      }
      else {
        throw new Error('Username not recognized in hostname.');
      }
    }
  }
  throw new Error('Domain name not recognized in hostname.');
};


/**
 * Set of functions to perform test and minimum cleaning on inputs
 * These functions take a string as input, apply some filter on it (regexp)
 * and return the processed string if it passes the tests, 'null' otherwise
 */

// Alphanumeric between 5 an 21 chars, case-insensitive  -  authorized
// Trim the uid
exports.uid = function (str) {
  if (! str) { return null; }
  str = _(str).trim().toLowerCase();
  var filter = /^([a-zA-Z0-9])(([a-zA-Z0-9\-]){3,100})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};


// Alphanumeric between 2 an 70 chars, case-insensitive  - and . authorized
// Trim the hosting
exports.hosting = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter =  /^([a-zA-Z0-9])(([a-zA-Z0-9\-\.]){2,70})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};

// Any chars between 6 and 99 chars, with no trailing spaces.
exports.password = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};

// Any chars between 5 and 99 chars, with no trailing spaces.
exports.invitationToken = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 4 && str.length < 100) ? str : null;
};

// Any chars between 1 and 99 chars, with no trailing spaces.
exports.referer = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 0 && str.length < 100) ? str : null;
};

exports.email = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  // not perfect 
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return (filter.test(str)) ? str : null;
};

exports.challenge = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{5,200})$/;
  return (filter.test(str)) ? str : null;
};

exports.hostname = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9_\.\-]{3,256})$/;
  return (filter.test(str)) ? str : null;
};

var supportedLanguages = {en : 'English', fr: 'Français'};
exports.lang = function (str) {
  if (! str) { return 'en'; }
  return (supportedLanguages.hasOwnProperty(str)) ? str : 'en';
};


exports.appID = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};


exports.activitySessionID = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};

exports.appAuthorization = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{10,200})$/;
  return (filter.test(str)) ? str : null;
};

exports.appToken = function (str) {
  if (! str) { return null; }
  return (str.length < 256) ? str : null;
};

exports.accesskey = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{10,200})$/;
  return (filter.test(str)) ? str : null;
};

exports.access = function (json) {
  //TODO Check access structure
  return json;
};