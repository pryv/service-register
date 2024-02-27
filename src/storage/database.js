/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const bluebird = require('bluebird');
const async = require('async');
const semver = require('semver');
const logger = require('winston');
const lodash = require('lodash');
const config = require('../config');
const redis = require('redis').createClient(
  config.get('redis:port'),
  config.get('redis:host'),
  {}
);

/** @typedef {(err?: Error | null, res?: T | null) => unknown} GenericCallback */

/** @typedef {GenericCallback<unknown>} Callback */

/**
 * @typedef {{
 *   status: "NEED_SIGNIN" | "REFUSED" | "ERROR" | "ACCEPTED"
 *   // HTTP Status Code to send when polling.
 *   code: number
 *   // Poll Key
 *   key?: string
 *   requestingAppId?: string
 *   requestedPermissions?: PermissionSet
 *   url?: string
 *   poll?: string
 *   returnURL?: string | null
 *   oauthState?: OAuthState
 *   poll_rate_ms?: number
 * }} AccessState
 */

/** @typedef {string | null} OAuthState */

// Redis error management
redis.on('error', function (err) {
  logger.error('Redis: ' + err.message);
});

const LASTEST_DB_VERSION = '0.1.1';
const DBVERSION_KEY = 'dbversion';

let dbversion = null;

const connectionChecked = require('readyness').waitFor('database');

// PASSWORD CHECKING
if (config.get('redis:password')) {
  redis.auth(config.get('redis:password'), function () {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  logger.info('Redis client initialized, no authentication set.');
  process.nextTick(function () {
    checkConnection();
  });
}

/**
 * Check redis database connectivity
 * @returns {void}
 */
function checkConnection () {
  async.series(
    [
      function _addWactivFixtureToDatabase (nextStep) {
        // Do not remove, 'wactiv.server' is used by tests
        // NOTE Eventually, we will want to move the 'wactiv' user to a proper
        //  test fixture - and not have it here in production anymore.
        const user = { id: 0, email: 'wactiv@pryv.io', username: 'wactiv1' };
        // FLOW deprecated code; disregard for type checks.
        setServerAndInfos(
          'wactiv',
          config.get('dns:domain'),
          user,
          ['email'],
          nextStep
        );
      },
      function _getDatabaseVersion (nextStep) {
        redis.get(DBVERSION_KEY, function (error, result) {
          if (error) {
            return nextStep(error);
          }
          dbversion = result;
          if (!dbversion) {
            dbversion = LASTEST_DB_VERSION;
            logger.info('database init to version :' + dbversion);
            redis.set(DBVERSION_KEY, dbversion, nextStep);
          } else {
            nextStep();
          }
        });
      },
      function _updateDatabaseVersion (nextStep) {
        if (semver.lt(dbversion, LASTEST_DB_VERSION)) {
          return nextStep();
        }
        // Convert all users to hashes
        logger.info('updating db to version :' + LASTEST_DB_VERSION);
        doOnKeysValuesMatching(
          '*:infos',
          '*',
          function (key, value) {
            try {
              const resJSON = JSON.parse(value);
              const username = resJSON.username;
              delete resJSON.username;
              redis.hmset(username + ':users', resJSON);
              redis.del(key);
            } catch (e) {
              logger.info(' failed to parse json :' + key + ' ' + value);
            }
          },
          function (error, count) {
            if (error) { return nextStep(error); }
            logger.info('  change ' + (count || 'n/a') + ' *:infos references');
          }
        );
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

const INACTIVE_FOLDER_NAME = 'inactive';
/**
 * Inactive user properties are stored in
 * <username>:INACTIVE_FOLDER_NAME:<fieldname>: values list
 */
exports.INACTIVE_FOLDER_NAME = INACTIVE_FOLDER_NAME;

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
 * @param {string} key
 * @param {Callback} callback
 * @returns {void}
 */
function getSet (key, callback) {
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
  redis.keys(
    keyMask,
    function (error, keys) {
      if (error) {
        logger.error(
          'Redis getAllSetsMatching: ' + keyMask + ' e: ' + error,
          error
        );
        return done(error, null);
      }
      async.times(
        keys.length,
        function (n, next) {
          this.getSet(keys[n], function (error, data) {
            if (error) {
              return next(error);
            }
            if (cleanKey) {
              cleanKey(keys[n], data);
            }
            next(error, data);
          });
        }.bind(this),
        function (error, result) {
          done(error, result);
        }
      );
    }.bind(this)
  );
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
exports.setSetValue = function (keySet, key, value, callback) {
  redis.hset(keySet, key, value, callback);
};

/**
 * Get database entry as JSON
 * @param {string} key  : the key referencing the database entry
 * @param {Callback} callback  : function(error,result), result being the JSON database entry
 * @returns {void}
 */
function getJSON (key, callback) {
  redis.get(key, function (error, result) {
    if (error != null) {
      logger.error('Redis getJSON: ' + key + ' e: ' + error.toString(), error);
      return callback(error);
    }
    if (result == null) return callback(null, null);
    try {
      return callback(null, JSON.parse(result));
    } catch (e) {
      return callback(
        new Error(
          e + ' db.getJSON:(' + key + ') string (' + result + ')is not JSON'
        )
      );
    }
  });
}
exports.getJSON = getJSON;

/**
 * Check if an email address exists in the database
 * @param {string} email  : the email address to verify
 * @param {GenericCallback<boolean>} callback  : function(error,result), result being 'true' if it exists, 'false' otherwise
 * @returns {void}
 */
function emailExists (email, callback) {
  email = email.toLowerCase();
  redis.exists(email + ':email', function (error, result) {
    if (error != null) { logger.error('Redis emailExists: ' + email + ' e: ' + error, error); }
    callback(error, result === 1);
  });
}
exports.emailExists = emailExists;

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

exports.getServer = getServer;
/**
 * Get the server linked with provided user id
 * @param uid: the user id
 * @param callback: function(error,result), result being the server name
 */
function getServer (uid, callback) {
  uid = uid.toLowerCase();
  redis.get(ns(uid, 'server'), function (error, result) {
    if (error != null) {
      logger.error('Redis getServer: ' + uid + ' e: ' + error, error);
      return callback(error);
    }
    return callback(null, result);
  });
}

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
      logger.error(
        'Redis setServer: ' + uid + ' -> ' + serverName + ' e: ' + error,
        error
      );
    }
    callback(error, result);
  });
};

exports.getServerByEmail = async function (email) {
  try {
    const username = await bluebird.fromCallback((cb) =>
      getUIDFromMail(email, cb)
    );
    const server = await bluebird.fromCallback((cb) => getServer(username, cb));
    return server;
  } catch (error) {
    return error;
  }
};

/** Search through keys in the database using a mask and apply a mapping function
 * on them.
 *
 * NOTE Redis documentation warns against using this in application code.
 *    See https://redis.io/commands/keys. We should probably deprecate this
 *    internally and try to get rid of it in the long run. (ksc, 5Feb17)
 *
 * @param {string} keyMask  the mask to filter keys
 * @param {(a: string) => unknown} action  - mapping function to apply on resulting entries
 * @param {GenericCallback<number>} done  - function(error,result), result being the number of entries mapped
 * @returns {void}
 */
function doOnKeysMatching (keyMask, action, done) {
  redis.keys(keyMask, function (error, replies) {
    if (error) {
      logger.error(
        'Redis getAllKeysMatchingValue: ' + keyMask + ' e: ' + error,
        error
      );
      return done(error, 0);
    }
    let i, len;
    for (i = 0, len = replies.length; i < len; i++) {
      // skip inactive fields that have a type 'list'
      if (!replies[i].includes(`:${INACTIVE_FOLDER_NAME}:`)) {
        action(replies[i]);
      }
    }
    done(null, i);
  });
}
exports.doOnKeysMatching = doOnKeysMatching;

/**
 * Search through keys and values in the database using a mask and apply a mapping function on them
 * @param {string} keyMask  : the mask to filter keys
 * @param {string} valueMask  : the mask to filter values
 * @param {(key: string, value: string) => unknown} action  : mapping function to apply on resulting entries
 * @param {GenericCallback<number> | null} done  : function(error,result), result being the number of entries mapped
 * @returns {void}
 */
function doOnKeysValuesMatching (keyMask, valueMask, action, done) {
  let receivedCount = 0;
  let waitFor = -1;
  let firstError = null;
  const checkDone = function () {
    if (waitFor > 0 && waitFor === receivedCount) {
      if (done != null) {
        done(firstError, receivedCount);
      }
    }
  };
  const doOnKeysMatchingDone = function (error, count) { /* eslint-disable-line n/handle-callback-err */
    if (count != null) waitFor = count;
    checkDone();
  };
  doOnKeysMatching(
    keyMask,
    function (key) {
      redis.get(key, function (error, result) {
        if (error) {
          if (firstError == null) firstError = error;
          logger.error(
            'doOnKeysValuesMatching: ' +
              keyMask +
              ' ' +
              valueMask +
              ' e: ' +
              error,
            error
          );
        } else {
          if (valueMask === '*' || valueMask === result) {
            action(key, result);
          }
        }
        receivedCount++;
        checkDone();
      });
    },
    doOnKeysMatchingDone
  );
}
exports.doOnKeysValuesMatching = doOnKeysValuesMatching;

exports.getUIDFromMail = getUIDFromMail;
/**
 * Get user id linked with provided email address
 * @param mail: the email address
 * @param callback: function(error,result), result being the requested user id
 */
function getUIDFromMail (mail, callback) {
  mail = mail.toLowerCase();
  redis.get(mail + ':email', function (error, uid) {
    if (error) {
      logger.error('Redis getServerFromMail: ' + mail + ' e: ' + error, error);
    }
    return callback(null, uid);
  });
}

/**
 * Update server and information linked with provided user
 * @param {string} username the name of the user
 * @param {string} server the new server name
 * @param {UserInformation} infos the new user information
 * @param {array} uniqueFields
 * @param {Callback} callback No actual success value is being generated except error == null.
 * @returns {unknown}
 */
function setServerAndInfos (username, server, infos, uniqueFields, callback) {
  const attrs = lodash.clone(infos);
  // This user will never be created for real
  if (username === 'backloop') return callback();
  if (callback == null) throw new Error('AF: Callback was null'); // assert(callback != null);
  attrs.registeredTimestamp = Date.now();
  // Sanitises the user information
  username = username.toLowerCase();
  // leave Backward compatible email saving process
  if (attrs.email) {
    attrs.email = attrs.email.toLowerCase();
  }
  // Ensure that username matches itself
  attrs.username = username;
  let previousEmail = null;
  async.series(
    [
      function _getPreviousEmailValue (stepDone) {
        redis.hget(ns(username, 'users'), 'email', function (error, email) {
          if (error != null) return stepDone(error);
          if (email != null) previousEmail = email.toLowerCase();
          return stepDone();
        });
      },
      async function _storeUser () {
        try {
          const multi = redis.multi();
          multi.hmset(ns(username, 'users'), attrs);
          multi.set(ns(username, 'server'), server);
          // If user exists remove previous email
          if (previousEmail != null && previousEmail !== attrs.email) {
            multi.del(ns(previousEmail, 'email'));
          }
          for (const field of uniqueFields) {
            // make sure that the field has any value
            if (!attrs[field]) continue;
            const value = attrs[field].toLowerCase();
            multi.set(ns(value, field), username);
          }
          await bluebird.fromCallback((cb) => multi.exec(cb));
          callback();
        } catch (error) {
          logger.error(
            `Database#setServerAndInfos: ${username} e: ${error}`,
            error
          );
          return callback(error);
        }
      }
    ],
    callback
  );
}
exports.setServerAndInfos = setServerAndInfos;

/**
 * @returns {object}
 */
async function getUserData (username) {
  return await bluebird.fromCallback((cb) =>
    redis.hgetall(`${username}:users`, cb)
  );
}

/**
 * Get all inactive fields for the username
 * @param string username
 * @returns {object}
 */
async function getAllInactiveData (username) {
  const keys = await bluebird.fromCallback((cb) =>
    redis.keys(`${username}:${INACTIVE_FOLDER_NAME}:*`, cb)
  );
  const queries = keys.map((key) => {
    return bluebird.fromCallback((cb) => redis.lrange(`${key}`, 0, -1, cb));
  });
  const results = await Promise.all(queries);
  // form key -> list object
  const inactiveData = {};
  results.forEach((result, i) => {
    const params = keys[i].split(':');
    inactiveData[params[params.length - 1]] = result;
  });
  return inactiveData;
}
exports.getAllInactiveData = getAllInactiveData;

/**
 * Update indexed and update, create, delete unique values in
 * one transaction
 * @param string username
 * @param object fields
 * @param object fieldsToDelete
 */
exports.updateUserData = async (username, fields, fieldsToDelete) => {
  // get old user data
  const oldUserData = await getUserData(username);
  const inactiveData = await getAllInactiveData(username);
  let multi = redis.multi();
  // save all fields
  for (const [key, valuesList] of Object.entries(fields)) {
    // because each key could have many values, iterate them
    valuesList.forEach((valueObject) => {
      multi = updateField(
        username,
        key,
        valueObject,
        oldUserData[key],
        inactiveData,
        multi
      );
    });
  }
  // delete unique fields
  for (const [key, value] of Object.entries(fieldsToDelete)) {
    multi = deleteUniqueField(key, value, multi);
  }
  // execute the transaction
  const results = await bluebird.fromCallback((cb) => multi.exec(cb));
  if (results.length === 0) {
    return null;
  } else if (
    // any unsuccessful response
    results.some((res) => {
      return !(res === 'OK' || parseInt(res) > 0);
    })
  ) {
    return false;
  }
  return true;
};

/**
 * Deletes the user identified by `username` from redis.
 * Deletion is done with a transaction so that is server or user
 * deletion fails, the request could be repeated
 *
 * @param {string} username  undefined
 * @returns {Promise<unknown>}
 */
async function deleteUser (username) {
  const saneUsername = username.toLowerCase();
  // Get user data
  const fieldsToDelete = await getUserData(username);
  // check which fields were saved as unique and should be deleted
  const fieldsToDeleteVerified = await verifyFieldForDeletion(
    saneUsername,
    fieldsToDelete
  );
  let multi = redis.multi();
  // delete unique fields
  for (const [key, value] of Object.entries(fieldsToDeleteVerified)) {
    multi = deleteUniqueField(key, value, multi);
  }
  // delete inactive unique fields
  const inactiveValuesData = await getAllInactiveData(saneUsername);
  for (const [key, list] of Object.entries(inactiveValuesData)) {
    list.forEach((value) => {
      multi = deleteUniqueField(key, value, multi);
    });
    multi.del(`${saneUsername}:${INACTIVE_FOLDER_NAME}:${key}`);
  }
  // delete user info
  multi.del(ns(saneUsername, 'users'));
  // delete dns entry
  multi.del(ns(saneUsername, 'server'));
  // execute the transaction
  const results = await bluebird.fromCallback((cb) => multi.exec(cb));
  if (
    results.length === 0 ||
    // any unsuccessful response
    results.some((res) => {
      return !(res === 'OK' || parseInt(res) > 0);
    })
  ) {
    return false;
  }
  return true;
}
exports.deleteUser = deleteUser;

/**
 * Validate if field should be deleted - if validation fails,
 * (username under the unique field value matches our username)
 * don't throw any error, just skip the deletion
 *
 * @param string username
 * @param object fieldsToDelete
 * Example:
 * { email: 'testpfx28600@wactiv.chx', RandomField: 'testpfx22989' }
 * @param {string} username
 * @param {object} fieldsToDelete
 * @returns {Promise<{}>}
 */
async function verifyFieldForDeletion (username, fieldsToDelete) {
  // get update action and execute them in parallel
  try {
    const fieldsforDeletionVerified = {};
    for (const [key, value] of Object.entries(fieldsToDelete)) {
      // Get username: users: <fieldname> value if username exists
      const previousValue = await bluebird.fromCallback((cb) =>
        redis.get(`${value}:${key}`, cb)
      );
      // if user field should be unique, save the value as a key separately
      if (previousValue === username) {
        fieldsforDeletionVerified[key] = value;
      }
    }
    return fieldsforDeletionVerified;
  } catch (error) {
    logger.debug(`users#verifyFieldForDeletion: e: ${error}`, error);
    throw error;
  }
}
exports.verifyFieldForDeletion = verifyFieldForDeletion;

/**
 * Validate if field (that has to be unique) has a unique value
 * @param string username
 * @param string fieldName
 * @param string fieldValue
 */
exports.isFieldUniqueForUser = async function (
  username,
  fieldName,
  fieldValue
) {
  fieldValue = fieldValue.toLowerCase();
  username = username.toLowerCase();
  const currentValueBelongsToUsername = await bluebird.fromCallback((cb) =>
    redis.get(ns(fieldValue, fieldName), cb)
  );
  if (currentValueBelongsToUsername === username) {
    logger.debug(
      `trying to update an ${fieldName} to the same value ${username} ${currentValueBelongsToUsername}`
    );
    return true;
  }
  if (currentValueBelongsToUsername != null) {
    logger.debug(
      `#validateUniqueField: Cannot set, in use: ${fieldValue}, current ${currentValueBelongsToUsername}, new ${username}`
    );
    return false;
  }
  return true;
};

/**
 * Updates the user values and if field is unique, saves the value as a key
 * (as it was done for username and email before)
 * @param string username
 * @param string fieldName
 * @param string dataObject
 * @param object multi
 * @param {string} username
 * @param {string} fieldName
 * @param {object} dataObject
 * @param {object} oldValue
 * @param {object} inactiveData
 * @param {object} multi
 * @returns {object}
 */
function updateField (
  username,
  fieldName,
  dataObject,
  oldValue,
  inactiveData,
  multi
) {
  let fieldValue = dataObject.value;
  const unique = dataObject.isUnique;
  const active = dataObject.isActive;
  const creation = dataObject.creation;
  // check if anything should be updated
  if (!unique && !active) {
    return multi;
  }
  fieldValue = fieldValue.toLowerCase();
  username = username.toLowerCase();
  if (active) {
    multi.hmset(ns(username, 'users'), fieldName, fieldValue);
  }
  // if user field should be unique, save the value as a key separately
  if (unique) {
    multi = setUniqueField(fieldName, fieldValue, username, multi);
    if (oldValue !== fieldValue && !creation) {
      // delete old unique reference
      multi = deleteUniqueField(fieldName, oldValue, multi);
    }
    // update inactive list
    multi = updateInactiveUniqueFieldsList(
      fieldName,
      fieldValue,
      oldValue,
      username,
      active,
      inactiveData,
      multi
    );
  }
  return multi;
}
exports.updateField = updateField;

/**
 * Delete unique field using given transaction
 * @param {string} fieldName  undefined
 * @param {string} fieldValue  undefined
 * @param {object} multi  undefined
 * @returns {object}
 */
function deleteUniqueField (fieldName, fieldValue, multi) {
  fieldValue = fieldValue.toLowerCase(); // TODO IEVA
  // Remove unique value
  multi.del(`${fieldValue}:${fieldName}`);
  return multi;
}

/**
 * Set unique field using given transaction
 * @param {string} fieldName  undefined
 * @param {string} fieldValue  undefined
 * @param {string} username  undefined
 * @param {object} multi  undefined
 * @returns {object}
 */
function setUniqueField (fieldName, fieldValue, username, multi) {
  multi.set(`${fieldValue}:${fieldName}`, username);
  return multi;
}

/**
 * @param {string} fieldName
 * @param {string} fieldValue
 * @param {string} oldValue
 * @param {string} username
 * @param {Boolean} active
 * @param {object} inactiveData
 * @param {object} multi
 * @returns {object}
 */
function updateInactiveUniqueFieldsList (
  fieldName,
  fieldValue,
  oldValue,
  username,
  active,
  inactiveData,
  multi
) {
  function fieldExistsInInactiveList () {
    return (
      inactiveData[fieldName] && inactiveData[fieldName].includes(fieldValue)
    );
  }
  function removeFromInactiveList (value) {
    multi.lrem(`${username}:${INACTIVE_FOLDER_NAME}:${fieldName}`, 0, value);
  }
  function addToInactiveList (value) {
    multi.lpush(`${username}:${INACTIVE_FOLDER_NAME}:${fieldName}`, value);
  }
  if (active) {
    // new active replaces old active
    if (oldValue !== fieldValue) {
      addToInactiveList(oldValue);
    }
    // if inactive was changed to active
    if (fieldExistsInInactiveList()) {
      removeFromInactiveList(fieldValue);
    }
  } else if (!fieldExistsInInactiveList()) {
    // new inactive record was created
    addToInactiveList(fieldValue);
  }
  return multi;
}

exports.isFieldUnique = async (fieldName, fieldValue) => {
  fieldValue = fieldValue.toLowerCase();
  // Check that email does not exists
  const exists = await bluebird.fromCallback((cb) =>
    redis.exists(fieldValue + ':' + fieldName, cb)
  );
  return exists !== 1;
};

/**
 * Private database index structural check for inconsistent email/user
 * @returns {void}
 */
function _findGhostsEmails () {
  doOnKeysValuesMatching('*:email', '*', function (key, username) {
    const email = key.substring(0, key.lastIndexOf(':'));
    redis.hgetall(username + ':users', function (error, user) { /* eslint-disable-line n/handle-callback-err */
      let e;
      if (user == null) {
        e = ' cannot find user:' + username;
        // redis.del(key);
      } else if (user.email == null) {
        e = ' cannot find email for:' + username;
      }
      if (e) {
        logger.warn('Db structure _findGhostsEmails ' + email + e);
      }
    });
  });
}

/**
 * Private database index structural check for inconsistent server/user
 * @returns {void}
 */
function _findGhostsServer () {
  doOnKeysValuesMatching('*:server', '*', function (key, server) {
    const username = key.substring(0, key.lastIndexOf(':'));
    redis.hgetall(username + ':users', function (error, user) { /* eslint-disable-line n/handle-callback-err */
      if (!user) {
        logger.warn(
          'Db structure _findGhostsServer ' +
            server +
            ' cannot find user :' +
            username
        );
        // redis.del(key);
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
  const multi = redis.multi();
  const dbkey = key + ':access';
  multi.set(dbkey, JSON.stringify(value));
  multi.expire(dbkey, config.get('persistence:access-ttl'));
  multi.exec(function (error, result) {
    if (error) {
      logger.error('Redis setAccess: ', key, value, error);
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
  // FLOW Since we access the right key, we assume that the data is correct.
  const mixedCallback = callback;
  getJSON(key + ':access', mixedCallback);
};

// ----------------- Reserved words --------------//
const RESERVED_WORDS_VERSION = 'reservedwords:version';
const RESERVED_WORDS_LIST = 'reservedwords:list';

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
  async.series(
    [
      function (nextStep) {
        redis.del(RESERVED_WORDS_VERSION, function (error) {
          nextStep(error);
        });
      },
      function (nextStep) {
        redis.del(RESERVED_WORDS_LIST, function (error) {
          nextStep(error);
        });
      },
      function (nextStep) {
        redis.sadd(RESERVED_WORDS_LIST, wordArray, function (error) {
          nextStep(error);
        });
      },
      function (nextStep) {
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
    }
  );
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

/** @typedef {"users" | "server" | "email"} NamespaceKind */

/**
 * @param {string} a
 * @param {NamespaceKind} b
 * @returns {string}
 */
function ns (a, b) {
  return `${a}:${b}`;
}

/**
 * Get reservations if exists
 *
 * @param object uniqueFields - key is the name of the field (like email)
 * and value is the email itself
 * @param {object} uniqueFields
 * @returns {Promise<any[]>}
 */
async function getReservations (uniqueFields) {
  const results = [];
  let result;
  for (const [key, value] of Object.entries(uniqueFields)) {
    result = await bluebird.fromCallback((cb) =>
      getSet(ns(key + '-reservations', value), cb)
    );
    if (result) {
      result.field = key;
      results.push(result);
    }
  }
  return results;
}
exports.getReservations = getReservations;

/**
 * For each unique property set the reservation
 * and set a reservation for certain core - so if user started the registration
 * on one core he/she would be not registered on another core
 *
 * @param Object uniqueFields - key is the name of the field (like email)
 * @param String core
 * @param Timestamp time
 * @param {object} uniqueFields
 * @param {string} core
 * @param {number} time
 * @returns {Promise<void>}
 */
async function setReservations (uniqueFields, core, time) {
  const multi = redis.multi();
  try {
    for (const [key, value] of Object.entries(uniqueFields)) {
      multi.hmset(ns(key + '-reservations', value), {
        core,
        time
      });
    }
    await bluebird.fromCallback((cb) => multi.exec(cb));
  } catch (error) {
    logger.error(`Database#setReservation: ${error}`, error);
    throw error;
  }
}
exports.setReservations = setReservations;
