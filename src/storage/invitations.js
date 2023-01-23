/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
/**
 * Extension of database.js dedicated to invitation tokens
 */

const messages = require('../utils/messages');
const db = require('./database');
const _ = require('lodash');
const async = require('async');
const config = require('../config');

const randtoken = require('rand-token').generator({
  chars: 'a-z'
});

function dbKey (token) {
  return token + ':invitation';
}

/**
 * Get all existing invitations
 * @param callback: function(error,result), result being the set of invitations
 */
exports.getAll = function (callback) {
  const cutI = ':invitation'.length;

  db.getMatchingSets(
    '*:invitation',
    function (error, data) {
      callback(error, data);
    },
    function (keyToClean, data) {
      data.id = keyToClean.substring(0, keyToClean.length - cutI);
    }
  );
};

/**
 * Generate a set of invitation tokens
 * @param number: the number of tokens to generate
 * @param adminId: the id of the admin allowed to generate tokens
 * @param description: the motivation of the tokens generation
 * @param callback: function(error, result), result being the set of new tokens
 */
exports.generate = function (number, adminId, description, callback) {
  const createdAt = new Date().getTime();

  async.times(
    number,
    function (n, next) {
      // Generate a 5 characters token:
      const token = randtoken.generate(5);

      const data = {
        createdAt,
        createdBy: adminId,
        description
      };
      db.setSet(dbKey(token), data, function (error) {
        _.extend(data, { id: token });
        next(error, data);
      });
    },
    function (error, tokens) {
      callback(error, tokens);
    }
  );
};

/**
 * Check the validity of the invitation token
 * @param token: the token to be validated
 * @param callback: function(result), result being 'true' if the token is valid, false otherwise
 */
exports.checkIfValid = function checkIfValid (token, callback) {
  const invitationTokens = config.get('invitationTokens');

  // No tokens defined, let everyone sign up
  if (invitationTokens == null) return callback(true); /* eslint-disable-line n/no-callback-literal */

  // Tokens set to empty, let no one sign up
  if (invitationTokens.length === 0) return callback(false); /* eslint-disable-line n/no-callback-literal */

  // Tokens are a list, accept valid ones
  for (let i = 0; i < invitationTokens.length; i++) {
    if (token === invitationTokens[i]) {
      return callback(true); /* eslint-disable-line n/no-callback-literal */
    }
  }

  db.getSet(dbKey(token), function (error, result) {
    if (error || !result || result.consumedAt) {
      return callback(false); /* eslint-disable-line n/no-callback-literal */
    }
    return callback(true); /* eslint-disable-line n/no-callback-literal */
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
    if (!isValid) {
      return callback(messages.e(404, 'INVALID_INVITATION'));
    }

    db.setSetValue(
      dbKey(token),
      'consumedAt',
      new Date().getTime(),
      function (error) {
        if (error) {
          return callback(error);
        }

        db.setSetValue(dbKey(token), 'consumedBy', username, function (error) {
          callback(error);
        });
      }
    );
  });
};

/**
 * Dummy function to form normal callback out of checkIfValid response
 **/
exports.checkIfTokenIsValid = (token, callback) => {
  this.checkIfValid(token, function (isValid) {
    return callback(null, isValid);
  });
};
