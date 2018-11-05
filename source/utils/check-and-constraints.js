// @flow

const _ = require('lodash');

// Username regular expression
var checkUsername = new RegExp('^' + '([a-z0-9-]{1,100})' + '$');

// Returns true if `candidate` could be a username, which means it fulfills the
// character level constraints we impose. 
// 
module.exports.isLegalUsername = function(candidate: string): boolean {
  return checkUsername.exec(candidate) != null;
};

/**
 * Check if a string ends with specified suffix
 * @param suffix: the suffix to look for
 * @returns {boolean}: 'true' if containing the suffix, 'false' otherwise
 */
function endsWith(str: string, suffix: string) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * Extract resources such as username and domain from hostname.
 * 
 * @param hostname: the hostname containing resources
 * @returns: a sliced string of resources
 */
module.exports.extractResourceFromHostname = function (
  hostname: string, domains: Array<string>
): string {
  for (let i = 0; i < domains.length; i++) {
    if ( endsWith(hostname, '.' + domains[i]) ) {
      const resource = hostname.slice(0, - domains[i].length - 1 );
      return resource;
    }
  }
  
  const message = 'Domain name not recognized in hostname.\n' +
    `I know the following domains: ${domains.join(', ')}.`;
  throw new Error(message);
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
  str = _.trim(str).toLowerCase();
  const filter = /^([a-zA-Z0-9])(([a-zA-Z0-9-]){3,100})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};


// Alphanumeric between 2 an 70 chars, case-insensitive  - and . authorized
// Trim the hosting
exports.hosting = function (str: ?string): ?string {
  if (! str) return null;
    
  str = str.trim();
  
  var filter =  /^([a-zA-Z0-9])(([a-zA-Z0-9-.]){2,70})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};

// Any chars between 6 and 99 chars, with no trailing spaces.
exports.password = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
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
  var filter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
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
  var filter = /^([a-zA-Z0-9_.-]{3,256})$/;
  return (filter.test(str)) ? str : null;
};

exports.lang = function (str: mixed): ?string {
  if (str == null || str === '') { return 'en'; }
  if (typeof str !== 'string') return null;
  if (str.length > 5) return null;
  return str;
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

exports.appToken = function (str: string): ?string {
  if (! str) { return null; }
  return (str.length < 256) ? str : null;
};

exports.accesskey = function (str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{10,200})$/;
  return (filter.test(str)) ? str : null;
};

export type PermissionSet = Array<PermissionEntry>;
export type PermissionEntry = Object; 

exports.access = function (json: Object): ?PermissionSet {
  if (json == null) return null; 
  if (! Array.isArray(json)) return null; 
  
  return json;
};