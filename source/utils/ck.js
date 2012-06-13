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
  console.log(hostname);
  var matchArray = extractRessourceFromHostnameRegExp.exec(hostname);
  console.log(_temp+" "+matchArray[1]);
  if (! matchArray) return null;
  return matchArray[1];
}
var _temp = "([a-z0-9]{3,21})\\."+ config.get("dns:domain").replace(/\./g,"\\.");
var extractRessourceFromHostnameRegExp = new RegExp("^"+_temp+"$");

// (alphanum between 5 an 21 chars) case-insensitive
exports.uid = function(str) {
    if (! str) return null;
    str = _(str).trim();
    //console.log("CHK USERNAME *"+str+"* ");
    if ( /^([a-zA-Z0-9]{5,21})$/.test(str) ) return str;
    return null;
};

// any chars between 6 and 99 chars, with no trailing spaces.
exports.password = function(str) {
    if (! str) return null;
    str = _(str).trim();
    if (str.length > 5 && str.length < 100) return str;
    return null;
};

exports.email = function(str) {
  if (! str) return null;
  str = _(str).trim();
  // not perfect 
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
  if ( filter.test(str)) return str;
  return null;
};

exports.challenge = function(str) {
  if (! str) return null;
    str = _(str).trim();
    if ( /^([a-zA-Z0-9]{5,200})$/.test(str) ) return str;
    return null;
};

exports.lang = function(str) {
  if (! str) return 'en';
  return 'en';
};
