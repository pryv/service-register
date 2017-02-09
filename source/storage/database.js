/*global require*/

var logger = require('winston'),
  redis = require('redis').createClient(),
  config = require('../utils/config'),
  async = require('async'),
  semver = require('semver');

var exports = exports || {}; // just for IJ to present structure

// Redis error management
redis.on('error', function (err) {
  logger.error('Redis: ' + err.message);
});

var LASTEST_DB_VERSION = '0.1.1',
  DBVERSION_KEY = 'dbversion',
  dbversion = null;

var connectionChecked = require('readyness').waitFor('database');

// Password check
if (config.get('redis:password')) {
  redis.auth(config.get('redis:password'), function () {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  checkConnection();
}

function checkConnection() {
  // Check redis connectivity
  // Do not remove, 'wactiv.server' is used by tests
  async.series([
    function (nextStep) { // Check db exits
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
  ],
    function (error) {
      if (error) {
        logger.error('DB not available: ', error);
        throw error;
      } else {
        // Check db structure
        _findGhostsEmails();
        _findGhostsServer();

        connectionChecked('Redis');
      }
    }
  );
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
 * Get all Sets matching
 */
exports.getSetsMatching = function (keyMask, done, cleanKey) {
  redis.keys(keyMask, function (error, keys) {
    if (error) {
      logger.error('Redis getAllSetsMatching: ' + keyMask + ' e: ' + error, error);
      return done(error, null);
    }

    var result = {};

    async.times(keys.length, function (n, next) {
      this.getSet(keys[n], function (error, data) {
        if (error) {
          return next(error);
        }
        var key = cleanKey ? cleanKey(keys[n]) : keys[n];
        result[key] = data;
        next(error);
      });
    }.bind(this), function (error) {
      done(error, result);
    });
  }.bind(this));
};

/**
 * Get all Sets matching
 */
exports.getSetsAsArrayMatching = function (keyMask, done, tweak) {
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
        if (tweak) {
          tweak(keys[n], data);
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

// Model

exports.emailExists = function (email, callback) {
  email = email.toLowerCase();
  redis.exists(email + ':email', function (error, result) {
    if (error) {
      logger.error('Redis emailExists: ' + email + ' e: ' + error, error);
    }
    callback(error, result === 1); // callback anyway
  });
};

exports.uidExists = function (uid, callback) {
  uid = uid.toLowerCase();
  redis.exists(uid + ':users', function (error, result) {
    if (error) {
      logger.error('Redis to uidExists: ' + uid + ' e: ' + error, error);
    }
    callback(error, result === 1); // callback anyway
  });
};

//Specialized

exports.getServer = function (uid, callback) {
  uid = uid.toLowerCase();
  redis.get(uid + ':server', function (error, result) {
    if (error) {
      logger.error('Redis getServer: ' + uid + ' e: ' + error, error);
    }
    callback(error, result);
  });
};

exports.setServer = function (uid, serverName, callback) {
  uid = uid.toLowerCase();
  redis.set(uid + ':server', serverName, function (error, result) {
    if (error) {
      logger.error('Redis setServer: ' + uid + ' -> ' + serverName + ' e: ' + error, error);
    }
    callback(error, result);
  });
};

/**
 * Search into keys
 * @param keyMask  '*:...'
 * @param action function (key)
 * @param done function (error,count) called when done ..  with the count of "action" sent
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
 * "Search into values "
 * @param keyMask
 * @param valueMask .. a string for now.. TODO a regexp
 * @param done function (error, result_count) called when done ..
 */
function doOnKeysValuesMatching(keyMask, valueMask, action, done) {

  var receivedCount = 0,
    actionThrown = 0,
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
          if (valueMask === '*' || valueMask === result) {
            action(key, result);
            actionThrown++;
          }
        }
        receivedCount++;
        checkDone();
      });
    }, doOnKeysMatchingDone);
}
exports.doOnKeysValuesMatching = doOnKeysValuesMatching;

exports.getUIDFromMail = function (mail, callback) {
  mail = mail.toLowerCase();
  redis.get(mail + ':email', function (error, uid) {
    if (error) {
      logger.error('Redis getServerFromMail: ' + mail + ' e: ' + error, error);
    }
    return callback(null, uid);
  });
};


// This user will never been created for real
var blackHoleUser = 'recla';

function setServerAndInfos(username, server, infos, callback) {

  if (username === blackHoleUser)  { return callback(); }

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
 * Change email address
 * @param username
 * @param email
 * @param callback function (error) error is null if successful;
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
      return callback(null);
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

// DB index structural checks ---//
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
        //require('../utils/dump.js').inspect( { cookie: user});
      }
    });
  });
}

function _findGhostsServer() {
  doOnKeysValuesMatching('*:server', '*', function (key, server) {
    var username = key.substring(0, key.lastIndexOf(':'));

    // TODO Check that server is really known
    redis.hgetall(username + ':users', function (error, user) {

      if (! user) {
        logger.warning('Db structure _findGhostsServer ' + server +
          ' cannot find user :' + username);
        //redis.del(key);
        // require('../utils/dump.js').inspect( { cookie: user});
      }
    });
  });
}

//------------------ Access management ------------//

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

exports.getAccessState = function (key, callback) {
  getJSON(key + ':access', callback);
};

//----------------- Reserved words --------------//

var RESERVED_WORDS_VERSION = 'reservedwords:version';
var RESERVED_WORDS_LIST = 'reservedwords:list';

exports.reservedWordsVersion = function (callback) {
  redis.get(RESERVED_WORDS_VERSION, function (error, version) {
    if (error) {
      logger.error('ReservedWordManagement version ' + error, error);
      return callback(error, false);
    }
    return callback(false, version);
  });
};

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
  ],
    function (serieError) {
      if (serieError) {
        logger.error('ReservedWordManagement error ' + serieError, serieError);
      }
      if (callback) {
        callback(serieError); // callback anyway
      }
    });
};

exports.reservedWordsExists = function (word, callback) {
  redis.sismember(RESERVED_WORDS_LIST, word, function (error, result) {
    if (error) {
      logger.error('DB reservedWordsExists ' + error, error);
      return callback(error, false);
    }
    callback(false, result === 1);
  });
};

// Password check
if (config.get('redis:password')) {
  redis.auth(config.get('redis:password'), function () {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  checkConnection();
}