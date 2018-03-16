'use strict';

var logger = require('winston'),
    config = require('../utils/config'),
    redis = require('redis').createClient(
      config.get('redis:port'), config.get('redis:host'), {}),
    async = require('async'),
    semver = require('semver');
    
/** NodeJS callback. 
 * 
 * @callback nodejsCallback
 * @param err {Object} - if not null, this is the error that occurred during the
 *    asynchronous operation. 
 * @param res {Object} - if not null and err is null, this is the result of the
 *    asynchronous operation.
 */

var exports = exports || {}; // just for IJ to present structure

// Redis error management
redis.on('error', function (err) {
  logger.error('Redis: ' + err.message);
});

var LASTEST_DB_VERSION = '0.1.1',
    DBVERSION_KEY = 'dbversion',
    dbversion = null;

var connectionChecked = require('readyness').waitFor('database');

//PASSWORD CHECKING
if (config.get('redis:password')) {
  redis.auth(config.get('redis:password'), function () {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  logger.info('Redis client initialized, no authentication set.');
  process.nextTick(function() {
    checkConnection();
  });
}

/**
 * Check redis database connectivity
 */
function checkConnection() {
  async.series([
    function (nextStep) { // Check db exits
      // Do not remove, 'wactiv.server' is used by tests
      var user = { id: 0, email: 'wactiv@pryv.io' };
      setServerAndInfos('wactiv', config.get('dns:domain'), user, nextStep);
    },
    function (nextStep) { // Get db version
      redis.get(DBVERSION_KEY, function (error, result) {
        if (error) {
          return nextStep(error);
        }
        dbversion = result;
        if (! dbversion) {
          dbversion = LASTEST_DB_VERSION;
          logger.info('database init to version :' + dbversion);
          redis.set(DBVERSION_KEY, dbversion, nextStep);
        } else {
          nextStep();
        }
      });
    },
    function (nextStep) { // Update db to version 1
      if (semver.lt(dbversion, LASTEST_DB_VERSION)) {
        return nextStep();
      }
      // Convert all users to hashes
      logger.info('updating db to version :' + LASTEST_DB_VERSION);

      doOnKeysValuesMatching('*:infos', '*', function (key, value) {
        try {
          var res_json = JSON.parse(value);
          var username = res_json.username;
          delete  res_json.username;
          redis.hmset(username + ':users', res_json);
          redis.del(key);
        } catch (e) {
          logger.info(' failed to parse json :' + key + ' ' + value);
        }

      }, function (error, count) {
        logger.info('  change ' + count + ' *:infos references');
      });

      nextStep();
    }
  ], function (error) {
    if (error) {
      logger.error('DB not available: ', error);
      throw error;
    } else {
      // Check db structure
      _findGhostsEmails();
      _findGhostsServer();

      connectionChecked('Redis');
    }
  });
}

/**
 * Simply map redis.set
 */
exports.set = function (key, callback) {
  redis.set(key, callback);
};

/**
 * Simply map redis.get
 */
exports.get = function (key, callback) {
  redis.get(key, callback);
};

/**
 * Simply map redis.hgetall
 */
function getSet(key, callback) {
  redis.hgetall(key, callback);
}
exports.getSet = getSet;

/**
 * Get all sets from database matching a provided mask
 * @param keyMask: the mask to filter sets
 * @param done: function(error,result), result being an array of matching sets
 * @param cleanKey: optional function to clean the resulting keys
 */
exports.getMatchingSets = function (keyMask, done, cleanKey) {
  redis.keys(keyMask, function (error, keys) {
    if (error) {
      logger.error('Redis getAllSetsMatching: ' + keyMask + ' e: ' + error, error);
      return done(error, null);
    }

    async.times(keys.length, function (n, next) {
      this.getSet(keys[n], function (error, data) {
        if (error) {
          return next(error);
        }
        if (cleanKey) {
          cleanKey(keys[n], data);
        }
        next(error, data);
      });
    }.bind(this), function (error, result) {
      done(error, result);
    });
  }.bind(this));
};

/**
 * Simply map redis.hmset
 */
exports.setSet = function (key, keyMap, callback) {
  redis.hmset(key, keyMap, callback);
};

/**
 * Simply map redis.hset
 */
exports.setSetValue = function (keySet, key,  value, callback) {
  redis.hset(keySet, key,  value, callback);
};

/**
 * Get database entry as JSON
 * @param key: the key referencing the database entry
 * @param callback: function(error,result), result being the JSON database entry
 */
function getJSON(key, callback) {
  redis.get(key, function (error, result) {
    var res_json = null;
    if (error) {
      logger.error('Redis getJSON: ' + key + ' e: ' + error, error);
    }
    if (! result) {
      return callback(error, res_json);
    }
    try {
      res_json = JSON.parse(result);
    } catch (e) {
      error = new Error(e + ' db.getJSON:(' + key + ') string (' + result + ')is not JSON');
    }
    return callback(error, res_json);
  });
}
exports.getJSON = getJSON;

/**
 * Check if an email address exists in the database
 * @param email: the email address to verify
 * @param callback: function(error,result), result being 'true' if it exists, 'false' otherwise
 */
exports.emailExists = function (email, callback) {
  email = email.toLowerCase();
  redis.exists(email + ':email', function (error, result) {
    if (error) {
      logger.error('Redis emailExists: ' + email + ' e: ' + error, error);
    }
    callback(error, result === 1); // callback anyway
  });
};

/**
 * Check if an user id exists in the database
 * @param uid: the user id to verify
 * @param callback: function(error,result), result being 'true' if it exists, 'false' otherwise
 */
exports.uidExists = function (uid, callback) {
  uid = uid.toLowerCase();
  redis.exists(uid + ':users', function (error, result) {
    if (error) {
      logger.error('Redis to uidExists: ' + uid + ' e: ' + error, error);
    }
    callback(error, result === 1); // callback anyway
  });
};

/**
 * Get the server linked with provided user id
 * @param uid: the user id
 * @param callback: function(error,result), result being the server name
 */
exports.getServer = function (uid, callback) {
  uid = uid.toLowerCase();
  redis.get(uid + ':server', function (error, result) {
    if (error) {
      logger.error('Redis getServer: ' + uid + ' e: ' + error, error);
    }
    callback(error, result);
  });
};

/**
 * Update the server for provided user id
 * @param uid: the user id
 * @param serverName: the new server name
 * @param callback: function(error,result), result being the new server name
 */
exports.setServer = function (uid, serverName, callback) {
  uid = uid.toLowerCase();
  redis.set(uid + ':server', serverName, function (error, result) {
    if (error) {
      logger.error('Redis setServer: ' + uid + ' -> ' + serverName + ' e: ' + error, error);
    }
    callback(error, result);
  });
};

/** Search through keys in the database using a mask and apply a mapping function 
 * on them.
 * 
 * NOTE Redis documentation warns against using this in application code. 
 *    See https://redis.io/commands/keys. We should probably deprecate this 
 *    internally and try to get rid of it in the long run. (ksc, 5Feb17)
 *
 * @param keyMask {string} the mask to filter keys
 * @param action - mapping function to apply on resulting entries
 * @param done - function(error,result), result being the number of entries mapped
 */
function doOnKeysMatching(keyMask, action, done) {

  redis.keys(keyMask, function (error, replies) {
    if (error) {
      logger.error('Redis getAllKeysMatchingValue: ' + keyMask + ' e: ' + error, error);
      return  done(error, 0);
    }
    var i, len;
    for (i = 0, len = replies.length; i < len; i++) {
      action(replies[i]);
    }
    done(null, i);
  });
}
exports.doOnKeysMatching = doOnKeysMatching;

/**
 * Search through keys and values in the database using a mask and apply a mapping function on them
 * @param keyMask: the mask to filter keys
 * @param valueMask: the mask to filter values
 * @param action: mapping function to apply on resulting entries
 * @param done: function(error,result), result being the number of entries mapped
 */
function doOnKeysValuesMatching(keyMask, valueMask, action, done) {

  var receivedCount = 0,
      waitFor = -1,
      errors = [];

  var checkDone = function () {
    if (waitFor > 0 && waitFor === receivedCount) {
      if (done) {
        done(errors.length === 0 ? null : errors, receivedCount);
      }
    }
  };

  var doOnKeysMatchingDone = function (error, count) {
    waitFor = count;
    checkDone();
  };

  doOnKeysMatching(keyMask,
    function (key) {
      redis.get(key, function (error, result) {
        if (error) {
          errors.push(error);
          logger.error('doOnKeysValuesMatching: ' + keyMask + ' ' + valueMask + ' e: ' + error,
            error);
        } else {
          if (valueMask === '*' || valueMask === result) {
            action(key, result);
          }
        }
        receivedCount++;
        checkDone();
      });
    }, doOnKeysMatchingDone);
}
exports.doOnKeysValuesMatching = doOnKeysValuesMatching;

/**
 * Get user id linked with provided email address
 * @param mail: the email address
 * @param callback: function(error,result), result being the requested user id
 */
exports.getUIDFromMail = function (mail, callback) {
  mail = mail.toLowerCase();
  redis.get(mail + ':email', function (error, uid) {
    if (error) {
      logger.error('Redis getServerFromMail: ' + mail + ' e: ' + error, error);
    }
    return callback(null, uid);
  });
};


/**
 * Update server and information linked with provided user
 * @param username: the name of the user
 * @param server: the new server name
 * @param infos: the new user information
 * @param callback: function(error)
 */
function setServerAndInfos(username, server, infos, callback) {
  // This user will never been created for real
  if (username === 'recla')  { return callback(); }

  infos.registeredTimestamp =  Date.now();

  var  previousEmail = null;
  async.series([
    function (stepDone) {
      redis.hget(username + ':users', 'email', function (error, email) {
        previousEmail = email;
        stepDone(error);
      });
    },
    function (stepDone) {
      username = username.toLowerCase();
      var multi = redis.multi();
      multi.hmset(username + ':users', infos);
      multi.set(username + ':server', server);

      // If user exists remove previous email
      if (previousEmail && previousEmail !== infos.email) {
        multi.del(previousEmail + ':email');
      }
      multi.set(infos.email + ':email', username);
      multi.exec(function (error) {
        if (error) {
          logger.error('Redis setServerAndInfos: ' + username + ' e: ' + error, error);
        }
        stepDone(error);
      });
    }
  ],
  function (error) {
    if (callback) {
      callback(error); // Callback anyway
    }
  });
}
exports.setServerAndInfos = setServerAndInfos;

/**
 * Update the email address linked with provided user
 * @param username: the name of the user
 * @param email: the new email address
 * @param callback: function(error)
 */
exports.changeEmail = function (username, email, callback) {
  email = email.toLowerCase();
  username = username.toLowerCase();

  // Check that email does not exists
  redis.get(email + ':email', function (error, email_username) {
    if (error) {
      return callback(error);
    }

    if (email_username === username) {
      logger.debug('trying to update an e-mail to the same value ' + username + ' ' + email);
      return callback();
    }

    if (email_username) {
      return callback(new Error('Cannot set e-mail: ' + email + ' to :' + username +
        ' it\'s already used by: ' + email_username));
    }

    // Remove previous user e-mail
    redis.hget(username + ':users', 'email', function (error, previous_email) {
      if (error) {
        return callback(error);
      }

      var multi = redis.multi();
      multi.hmset(username + ':users', 'email', email);
      multi.set(email + ':email', username);
      multi.del(previous_email + ':email');
      multi.exec(function (error) {
        if (error) {
          logger.error('Redis changeEmail: ' + username + 'email: ' + email + ' e: ' + error,
            error);
        }
        callback(error);
      });
    });
  });
};

/**
 * Private database index structural check for inconsistent email/user
 */
function _findGhostsEmails() {
  doOnKeysValuesMatching('*:email', '*', function (key, username) {
    var email = key.substring(0, key.lastIndexOf(':'));
    redis.hgetall(username + ':users', function (error, user) {

      var e = null;
      if (! user) {
        e = ' cannot find user :' + username;
        // redis.del(key);
      } else if (! user.email) {
        e = ' cannot find email for :' + username;
      } else if (email !== user.email) {
        e = ' != ' + username + ':user.email -> "' + user.email + '"';
        // redis.del(key);
      }

      if (e) {
        logger.warning('Db structure _findGhostsEmails ' + email + e);
      }
    });
  });
}

/**
 * Private database index structural check for inconsistent server/user
 */
function _findGhostsServer() {
  doOnKeysValuesMatching('*:server', '*', function (key, server) {
    var username = key.substring(0, key.lastIndexOf(':'));

    redis.hgetall(username + ':users', function (error, user) {

      if (! user) {
        logger.warning('Db structure _findGhostsServer ' + server +
          ' cannot find user :' + username);
        //redis.del(key);
      }
    });
  });
}

/**
 * Update the state of an access in the database
 * @param key: the database key for this access
 * @param value: the new state of this access
 * @param callback: function(error,result), result being the result of the database transaction
 */
exports.setAccessState = function (key, value, callback) {
  var multi = redis.multi();
  var dbkey = key + ':access';
  multi.set(dbkey, JSON.stringify(value));
  multi.expire(dbkey, config.get('persistence:access-ttl'));
  multi.exec(function (error, result) {
    if (error) {
      logger.error('Redis setAccess: ' + key + ' ' + value + ' e: ' + error, error);
    }
    callback(error, result); // callback anyway
  });
};

/** Get the current state of an access in the database.
 *
 * @param key {string} - the database key for this access
 * @param callback {nodejsCallback} - result being the corresponding JSON 
 *    database entry
 */
exports.getAccessState = function (key, callback) {
  getJSON(key + ':access', callback);
};

//----------------- Reserved words --------------//

var RESERVED_WORDS_VERSION = 'reservedwords:version';
var RESERVED_WORDS_LIST = 'reservedwords:list';

/**
 * Get the current version of the reserved words list in the database
 * @param callback: function(error,result), result being the version
 */
exports.reservedWordsVersion = function (callback) {
  redis.get(RESERVED_WORDS_VERSION, function (error, version) {
    if (error) {
      logger.error('ReservedWordManagement version ' + error, error);
      return callback(error);
    }
    return callback(null, version);
  });
};

/**
 * Load an up-to-date version of the reserved words list in the database
 * @param version: the new version
 * @param wordArray: the new words list
 * @param callback: function(error)
 */
exports.reservedWordsLoad = function (version, wordArray, callback) {
  async.series([
    function (nextStep) { // Delete word set version
      redis.del(RESERVED_WORDS_VERSION, function (error) {
        nextStep(error);
      });
    },
    function (nextStep) { // Delete word list
      redis.del(RESERVED_WORDS_LIST, function (error) {
        nextStep(error);
      });
    },
    function (nextStep) { // Load word list
      redis.sadd(RESERVED_WORDS_LIST, wordArray, function (error) {
        nextStep(error);
      });
    },
    function (nextStep) { // Set version
      redis.set(RESERVED_WORDS_VERSION, version, function (error) {
        nextStep(error);
      });
    }
  ], function (serieError) {
    if (serieError) {
      logger.error('ReservedWordManagement error ' + serieError, serieError);
    }
    if (callback) {
      callback(serieError); // callback anyway
    }
  });
};

/**
 * Check if the reserved words list contains provided word
 * @param word: the word to check for existence
 * @param callback: function(error,result), result being 'true' if existing, 'false' otherwise
 */
exports.reservedWordExists = function (word, callback) {
  redis.sismember(RESERVED_WORDS_LIST, word, function (error, result) {
    if (error) {
      logger.error('DB reservedWordsExists ' + error, error);
      return callback(error);
    }
    callback(null, result === 1);
  });
};
