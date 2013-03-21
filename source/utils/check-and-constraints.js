/**
* Tools to perform test and minimum cleaning on inputs
*/
var config = require('./config')

var  _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

/**
 * extract ressource from hostname
 */
exports.extractRessourceFromHostname = function(hostname) {
  var matchArray = extractRessourceFromHostnameRegExp.exec(hostname);
  if (! matchArray) return null;
  return matchArray[1];
}
var _temp = '([a-z0-9]{1,21})\\.'+ config.get('dns:domain').replace(/\./g,'\\.');
var extractRessourceFromHostnameRegExp = new RegExp('^'+_temp+'$');

// (alphanum between 5 an 21 chars) case-insensitive  - and _ authorized
// trim the uid ..
exports.uid = function uid(str) {
    if (! str) return null;
    str = _(str).trim();
    //console.log('CHK USERNAME *'+str+'* ');
    if ( /^([a-zA-Z0-9])(([a-zA-Z0-9_\-]){3,21})([a-zA-Z0-9])$/.test(str) ) return str;
    return null;
};

// (not a static DNS entry & not starting by "pryv") case-insensitive
// uid must have already been checked and cleaned by check-and-constraints.uid(..
exports.uidReserved = function uid(str) {
  if (! str) return null;
  if ( /^(pryv)+(.*)$/.test(str.toLowerCase()) ) return true;
  // optimise this with some caching
  if (config.get("dns:staticDataInDomain:"+ str)) return true;
  return false;
};

// any chars between 6 and 99 chars, with no trailing spaces.
exports.password = function password(str) {
    if (! str) return null;
    str = _(str).trim();
    if (str.length > 5 && str.length < 100) return str;
    return null;
};

exports.email = function email(str) {
  if (! str) return null;
  str = _(str).trim();
  // not perfect 
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
  if ( filter.test(str)) return str;
  return null;
};

exports.challenge = function challenge(str) {
  if (! str) return null;
    str = _(str).trim();
    if ( /^([a-zA-Z0-9]{5,200})$/.test(str) ) return str;
    return null;
};

exports.lang = function lang(str) {
  if (! str) return 'en';
  return 'en';
};


exports.appID = function appID(str) {
  if (! str) return null;
  str = _(str).trim();
  if (str.length > 5 && str.length < 100) return str;
  return null;
};


exports.activitySessionID = function activitySessionID(str) {
  if (! str) return null;
  str = _(str).trim();
  if (str.length > 5 && str.length < 100) return str;
  return null;
};

exports.appAuthorization = function appAuthorization(str) {
  if (! str) return null;
  str = _(str).trim();
  if ( /^([a-zA-Z0-9]{10,200})$/.test(str) ) return str;
  return null;
};

exports.appToken = function appToken(str) {
  if (! str) return null;
  if ( str.length < 256 ) return str;
  return null;
};

exports.accesskey = function accessKey(str) {
  if (! str) return null;
  str = _(str).trim();
  if ( /^([a-zA-Z0-9]{10,200})$/.test(str) ) return str;
  return null;
};

exports.access = function access(json) {
    //TODO Check access structure
  return json;
};