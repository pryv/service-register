/**
* Tools to perform test and minimum cleaning on inputs
*/

var  _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// (alphanum between 5 an 21 chars) case-insensitive
exports.uid = function(str) {
    if (! str) return null;
    str = _(str).trim();
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
  if ( /^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/.test(str)) return str;
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
