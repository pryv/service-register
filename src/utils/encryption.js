/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
/**
 * Encryption functions (wraps bcrypt functionality).
 * THIS FILE IS A COPY FROM ACTIVITY SERVER: don't modify one without the other.
 */

const bcrypt = require('bcrypt');

const envIsDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const salt = bcrypt.genSaltSync(envIsDevelopment ? 1 : 10);

/**
 * Generate a hash from provided value
 * @param value: the value to be hashed
 * @param callback: callback (error, result), result being the generated hash
 */
exports.hash = function (value, callback) {
  bcrypt.hash(value, salt, callback);
};

/**
 * Synchronous hash function
 * For tests only
 * @param value: the value to be hashed
 */
exports.hashSync = function (value) {
  return bcrypt.hashSync(value, salt);
};

/**
 * @param {String} value The value to check
 * @param {String} hash The hash to check the value against
 * @param {Function} callback (error, {Boolean} result)
 */
/**
 * Check if a provided value, once hashed, matches the provided hash
 * @param value: the value to check
 * @param hash: the hash to check match
 * @param callback: function(err,res), res being 'true' if there is a match, 'false' otherwise
 */
exports.compare = function (value, hash, callback) {
  bcrypt.compare(value, hash, callback);
};
