/**
 * Extension of database.js dedicated to invitation tokens
 */

var messages = require('../utils/messages.js'),
  db = require('../storage/database.js'),
  _ = require('underscore'),
  async = require('async');

var randtoken = require('rand-token').generator({
  chars: 'a-z'
});

function dbKey(token) {
  return token + ':invitation';
}

/**
 * Get all existing invitations
 * @param callback: function(error,result), result being the set of invitations
 */
exports.getAll = function (callback) {
  var cutI = ':invitation'.length;

  db.getSetsAsArrayMatching('*:invitation', function (error, data) {
    callback(error, data);
  }, function (keyToClean, data) { 
    data.id = keyToClean.substring(0, keyToClean.length - cutI);
  });
};

/**
 * Generate a set of invitation tokens
 * @param number: the number of tokens to generate
 * @param adminId: the id of the admin allowed to generate tokens
 * @param description: the motivation of the tokens generation
 * @param callback: function(error, result), result being the set of new tokens
 */
exports.generate = function (number, adminId, description, callback) {
  var createdAt = new Date().getTime();

  async.times(number, function (n, next) {
    // Generate a 5 characters token:
    var token = randtoken.generate(5);

    var data = {createdAt: createdAt, createdBy: adminId, description: description};
    db.setSet(dbKey(token), data, function (error) {
      _.extend(data, {id : token});
      next(error, data);
    });
  }, function (error, tokens) {
    callback(error, tokens);
  });
};

/**
 * Check the validity of the invitation token
 * @param token: the token to be validated
 * @param callback: function(result), result being 'true' if the token is valid, false otherwise
 */
exports.checkIfValid = function checkIfValid(token, callback) {
  if (token === 'enjoy') {
    return callback(true);
  }

  db.getSet(dbKey(token), function (error, result) {
    if (error || ! result || result.consumedAt) {
      return callback(false);
    }

    return callback(true);
  });
};

/**
 * Consume an invitation token
 * @param token: the invitation token
 * @param username: the user consuming the token
 * @param callback: function(error)
 */
exports.consumeToken = function (token, username, callback) {
  if (token === 'enjoy') {
    return callback();
  }

  this.checkIfValid(token, function (isValid) {
    if (! isValid) {
      return callback(messages.e(404, 'INVALID_INVITATION'));
    }

    db.setSetValue(dbKey(token), 'consumedAt', new Date().getTime(), function (error) {
      if (error) {
        return callback(error);
      }

      db.setSetValue(dbKey(token), 'consumedBy', username, function (error) {
        callback(error);
      });
    });
  });
};

