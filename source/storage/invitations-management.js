var messages = require('../utils/messages.js');

/**
 * check if token is valid
 */
exports.checkIfValid = function (token, callback) {
  callback(token === 'enjoy');
};


/**
 * consumeToken (return false if fail)
 */
exports.consumeToken = function (token, username, callback) {
  var error = null;
  if (token !== 'enjoy') {
    error = messages.e(404, 'INVALID_INVITATION');
  }
  callback(error);
};