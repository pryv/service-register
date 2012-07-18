/**
 * Encryption functions (wraps bcrypt functionality).
 * THIS FILE IS A COPY FROM ACTIVITY SERVER: don't modify one without the other.
 */

var bcrypt = require('bcrypt');

var envIsDevelopment = ! process.env.NODE_ENV || process.env.NODE_ENV === 'development';
var salt = bcrypt.genSaltSync(envIsDevelopment ? 1 : 10);

/**
 * @param {String} value The value to be hashed.
 * @param {Function} callback (error, hash)
 */
exports.hash = function(value, callback) {
  bcrypt.hash(value, salt, callback);
};

/**
 * For tests only.
 */
exports.hashSync = function(value) {
  return bcrypt.hashSync(value, salt);
};

/**
 * @param {String} value The value to check
 * @param {String} hash The hash to check the value against
 * @param {Function} callback (error, {Boolean} result)
 */
exports.compare = function(value, hash, callback) {
  bcrypt.compare(value, hash, callback);
};
