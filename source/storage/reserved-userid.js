var logger = require('winston'),
  db = require('../storage/database.js'),
  config = require('../utils/config');

// Reserved words
var wordsLoaded = require('readyness').waitFor('reservedWords');

load(function (error) {
  if (error) {
    logger.error('error loading reserved word list', error);
  }
  wordsLoaded();
});

function load(callback) {
  db.reservedWordsVersion(function (error, currentVersion) {
    if (error) {
      return callback(error);
    }
    var words = require('../references/reserved-words.json');
    if (currentVersion === words.version) {
      logger.info('Reserved word list version: ' + words.version + ' is up to date');
      words = null;
      return callback();
    }

    db.reservedWordsLoad(words.version, words.list, function (error) {
      if (error) {
        return callback(error);
      }
      logger.info('Reserved word list updated to version ' + words.version +
        ' with ' + words.list.length + ' words');
      words = null;
      callback();
    });
  });
}

/**
 * - not a static DNS entry
 * - not starting by "pryv"
 * - not in the reserved word list ) case-insensitive
 * uid must have already been checked and cleaned by check-and-constraints.uid(..
 */
exports.useridIsReserved = function (userid, callback) {
  if (! userid) {
    return null;
  }
  userid = userid.toLowerCase();
  if (/^(pryv)+(.*)$/.test(userid)) {
    return callback(null, true);
  }
  // TODO optimise this with some caching
  if (config.get('dns:staticDataInDomain:' + userid)) {
    return callback(null, true);
  }
  db.reservedWordsExists(userid, callback);
};
