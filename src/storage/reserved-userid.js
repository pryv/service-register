/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
/**
 * Extension of database.js dedicated to reserved user id
 */

const logger = require('winston');
const db = require('./database');
const config = require('../config');

// Reserved words
const wordsLoaded = require('readyness').waitFor('reservedWords');

load(function (error) {
  if (error) {
    logger.error('error loading reserved word list', error);
  }
  wordsLoaded();
});

/**
 * Load an up-to-date version of reserved words
 * @param callback: function(error)
 */
function load (callback) {
  db.reservedWordsVersion(function (error, currentVersion) {
    if (error) {
      return callback(error);
    }
    let words = require('../public/reserved-words.json');
    if (currentVersion === words.version) {
      logger.info(
        'Reserved word list version: ' + words.version + ' is up to date'
      );
      words = null;
      return callback();
    }

    db.reservedWordsLoad(words.version, words.list, function (error) {
      if (error) {
        return callback(error);
      }
      logger.info(
        'Reserved word list updated to version ' +
          words.version +
          ' with ' +
          words.list.length +
          ' words'
      );
      words = null;
      callback();
    });
  });
}

/**
 * Check if username is available by verifying the following:
 * - not a static DNS entry
 * - not starting by "pryv"
 * - not in the reserved word list
 * uid must have already been checked and cleaned by check-and-constraints.uid
 */
exports.useridIsReserved = function (userid, callback) {
  if (!userid) {
    return null;
  }
  userid = userid.toLowerCase();
  if (/^(pryv)+(.*)$/.test(userid)) {
    return callback(null, true);
  }
  if (config.get('dns:staticDataInDomain:' + userid)) {
    return callback(null, true);
  }
  db.reservedWordExists(userid, callback);
};
