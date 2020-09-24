/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
// @flow

const bluebird = require('bluebird');
const async = require('async');
const semver = require('semver');
const logger = require('winston');
const lodash = require('lodash');

const config = require('../config');  
const messages = require('../utils/messages');

const redis = require('redis').createClient(
  config.get('redis:port'),
  config.get('redis:host'), {});


type GenericCallback<T> = (err?: ?Error, res: ?T) => mixed; 
type Callback = GenericCallback<mixed>;

import type { UserInformation } from './users';

export type AccessState = {
  status: 'NEED_SIGNIN' | 'REFUSED' | 'ERROR' | 'ACCEPTED',
  // HTTP Status Code to send when polling.
  code: number, 
  // Poll Key
  key?: string,
  requestingAppId?: string,
  requestedPermissions?: PermissionSet,
  url?: string,
  poll?: string,
  returnURL?: ?string,
  oauthState?: OAuthState,
  poll_rate_ms?: number,
}
type OAuthState = string | null; 
import type { PermissionSet } from '../utils/check-and-constraints';

// Redis error management
redis.on('error', function (err) {
  logger.error('Redis: ' + err.message);
});

const LASTEST_DB_VERSION = '0.1.1';
const DBVERSION_KEY = 'dbversion';

let dbversion = null;

const connectionChecked = require('readyness').waitFor('database');

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
    function _addWactivFixtureToDatabase(nextStep) { // Check db exits
      // Do not remove, 'wactiv.server' is used by tests

      // NOTE Eventually, we will want to move the 'wactiv' user to a proper
      //  test fixture - and not have it here in production anymore. 

      const user = { id: 0, email: 'wactiv@pryv.io', username: 'wactiv1' };
      // FLOW deprecated code; disregard for type checks. 
      setServerAndInfos('wactiv', config.get('dns:domain'), user, ['email'], nextStep);
    },
    function _getDatabaseVersion(nextStep) { 
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
    function _updateDatabaseVersion(nextStep) { // Update db to version 1
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
        logger.info('  change ' + (count || 'n/a') + ' *:infos references');
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
exports.set = function (key: string, callback: Callback) {
  redis.set(key, callback);
};

/**
 * Simply map redis.get
 */
exports.get = function (key: string, callback: Callback) {
  redis.get(key, callback);
};

/**
 * Simply map redis.hgetall
 */
function getSet(key: string, callback: Callback) {
  redis.hgetall(key, callback);
}
exports.getSet = getSet;

/**
 * Get all sets from database matching a provided mask
 * @param keyMask: the mask to filter sets
 * @param done: function(error,result), result being an array of matching sets
 * @param cleanKey: optional function to clean the resulting keys
 */
exports.getMatchingSets = function (
  keyMask: string, 
  done: Callback, 
  cleanKey: ?((key: string, data: mixed) => mixed),
) {
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
exports.setSet = function (
  key: string, keyMap: {[string]: string}, 
  callback: Callback,
) {
  redis.hmset(key, keyMap, callback);
};

/**
 * Simply map redis.hset
 */
exports.setSetValue = function (
  keySet: string, key: string,  value: string, 
  callback: Callback
) {
  redis.hset(keySet, key,  value, callback);
};

/**
 * Get database entry as JSON
 * @param key: the key referencing the database entry
 * @param callback: function(error,result), result being the JSON database entry
 */
function getJSON(key: string, callback: Callback) {
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
        new Error(e + ' db.getJSON:(' + key + ') string (' + result + ')is not JSON'));
    }
  });
}
exports.getJSON = getJSON;

/**
 * Check if an email address exists in the database
 * @param email: the email address to verify
 * @param callback: function(error,result), result being 'true' if it exists, 'false' otherwise
 */
function emailExists(email: string, callback: GenericCallback<boolean>) {
  email = email.toLowerCase();
  
  redis.exists(email + ':email', function (error, result) {
    if (error != null) 
      logger.error('Redis emailExists: ' + email + ' e: ' + error, error);

    callback(error, result === 1);
  });
}
exports.emailExists = emailExists; 

/**
 * Check if an user id exists in the database
 * @param uid: the user id to verify
 * @param callback: function(error,result), result being 'true' if it exists, 'false' otherwise
 */
exports.uidExists = function (uid: string, callback: Callback) {
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
exports.getServer = function (uid: string, callback: GenericCallback<string>) {
  uid = uid.toLowerCase();
  redis.get(ns(uid, 'server'), function (error, result: string) {
    if (error != null) {
      logger.error('Redis getServer: ' + uid + ' e: ' + error, error);
      return callback(error);
    }

    return callback(null, result);
  });
};

/**
 * Update the server for provided user id
 * @param uid: the user id
 * @param serverName: the new server name
 * @param callback: function(error,result), result being the new server name
 */
exports.setServer = function (uid: string, serverName: string, callback: Callback) {
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
function doOnKeysMatching(
  keyMask: string, 
  action: (string) => mixed, 
  done: GenericCallback<number>
) {

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
function doOnKeysValuesMatching(
  keyMask: string, valueMask: string, 
  action: (key: string, value: string) => mixed, 
  done: ?GenericCallback<number>,
) {

  let receivedCount = 0;
  let waitFor = -1;
  let firstError = null; 

  var checkDone = function () {
    if (waitFor > 0 && waitFor === receivedCount) {
      if (done != null) {
        done(firstError, receivedCount);
      }
    }
  };

  var doOnKeysMatchingDone = function (error, count) {
    if (count != null) waitFor = count;
    checkDone();
  };

  doOnKeysMatching(keyMask,
    function (key) {
      redis.get(key, function (error, result) {
        if (error) {
          if (firstError == null) firstError = error; 

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
exports.getUIDFromMail = function (mail: string, callback: GenericCallback<string>) {
  mail = mail.toLowerCase();
  redis.get(mail + ':email', function (error, uid) {
    if (error) {
      logger.error('Redis getServerFromMail: ' + mail + ' e: ' + error, error);
    }
    return callback(null, uid);
  });
};



/// Update server and information linked with provided user
/// 
/// @param username: the name of the user
/// @param server: the new server name
/// @param infos: the new user information
/// @param callback: callback(error) - No actual success value is being generated
///   except error == null. 
/// 
function setServerAndInfos(
  username: string,
  server: string,
  infos: UserInformation, 
  uniqueFields: array,
  callback: Callback,
) {
  const attrs = lodash.clone(infos);

  // This user will never be created for real
  if (username === 'recla') return callback();

  if (callback == null) 
    throw new Error('AF: Callback was null'); // assert(callback != null);

  attrs.registeredTimestamp =  Date.now();

  // Sanitises the user information
  username = username.toLowerCase();
  // leave Backward compatible email saving process
  if(attrs.email){
    attrs.email = attrs.email.toLowerCase();
  }
  
  // Ensure that username matches itself
  attrs.username = username; 

  let previousEmail = null;
  async.series([
    function _getPreviousEmailValue(stepDone) {
      redis.hget(ns(username, 'users'), 'email', function (error, email) {
        if (error != null) return stepDone(error);

        if (email != null)
          previousEmail = email.toLowerCase();

        return stepDone();
      });
    },
    async function _storeUser () {
      try{
        const multi = redis.multi();
        multi.hmset(ns(username, 'users'), attrs);
        multi.set(ns(username, 'server'), server);

        // If user exists remove previous email
        if (previousEmail != null && previousEmail !== attrs.email) {
          multi.del(ns(previousEmail, 'email'));
        }
        for (field of uniqueFields) {
          // make sure that the field has any value
          if(! attrs[field]) continue;
          value = attrs[field].toLowerCase();
          multi.set(ns(value, field), username);
        }
        await bluebird.fromCallback(cb => multi.exec(cb));
        callback();
      } catch (error) {
        logger.error(`Database#setServerAndInfos: ${username} e: ${error}`, error);
        return callback(error); //TODO IEVA -make sure it is handled
      }
    }
  ],
  callback);
}
exports.setServerAndInfos = setServerAndInfos;

const EMAIL_FIELD = 'email';

/// Deletes the user identified by `username` from redis. 
/// 
async function deleteUser(username: string): Promise<mixed> {
  const saneUsername = username.toLowerCase(); 

  const recordKey = ns(saneUsername, 'users');
  const keysToDelete = [
    recordKey, 
    ns(saneUsername, 'server'),
  ]; 

  const currentEmail = await bluebird.fromCallback(
    cb => redis.hget(recordKey, EMAIL_FIELD, cb));

  if (currentEmail != null) keysToDelete.push(
    ns(currentEmail, 'email'));  

  // Now try to delete all of these, not stopping when one of them fails. 
  return bluebird.fromCallback(
    cb => redis.del(...keysToDelete, cb));
}
exports.deleteUser = deleteUser;

/**
 * Validate if field (that has to be unique) has a unique value
 * @param string username 
 * @param string fieldName
 * @param string fieldValue
 */
exports.isFieldUniqueForUser = async function (
  username: string,
  fieldName: string,
  fieldValue: string
) {
  fieldValue = fieldValue.toLowerCase();
  username = username.toLowerCase();

  try {
    const currentValueBelongsToUsername = await bluebird.fromCallback(cb =>
      redis.get(ns(fieldValue, fieldName), cb));

    if (currentValueBelongsToUsername === username) {
      logger.debug(`trying to update an ${fieldName} to the same value ${username} ${currentValueBelongsToUsername}`);
      return true;
    }

    if (currentValueBelongsToUsername != null) {
      logger.debug(`#validateUniqueField: Cannot set, in use: ${fieldValue}, current ${currentValueBelongsToUsername}, new ${username}`);
      return false;
    }
  } catch (error) {
    throw error;
  }
  return true;
};

/**
 * Updates the user values and if field is unique, saves the value as a key
 * (as it was done for username and email before)
 * @param string username 
 * @param string fieldName
 * @param string fieldValue
 * @param boolean unique 
 */
exports.updateField = async function (
  username: string,
  fieldName: string,
  dataObject: object
) {
  let fieldValue = dataObject.value;
  const unique = dataObject.isUnique;
  const active = dataObject.isActive;
  const creation = dataObject.creation;

  // check if anything should be updated
  if(! unique && !active){
    return;
  }
  fieldValue = fieldValue.toLowerCase();
  username = username.toLowerCase();
  
  try {
    // Get username:users:<fieldname> value if username exists
    const previousValue = await bluebird.fromCallback(cb =>
      redis.hget(ns(username, 'users'), fieldName, cb));

    // Race condition: If two requests enter here at the same time, the
    //  last one to enter will win, writing the values. The verification we
    //  do above is not protected / linked to what follows.
              
    const multi = redis.multi();
    if(active){
      multi.hmset(ns(username, 'users'), fieldName, fieldValue);
    }

    // if user field should be unique, save the value as a key separately
    if (unique){
      multi.set(ns(fieldValue, fieldName), username);
      // Remove previous user field value
      if(previousValue && ! creation){
        multi.del(ns(previousValue, fieldName));
      }
    }

    await bluebird.fromCallback(cb => multi.exec(cb));
    // TODO, better to return true only after checking the response from the redis
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Validate that field belongs to the user
 * and delete it
 * @param {*} username 
 * @param {*} fieldName 
 * @param {*} fieldValue 
 */
exports.deleteUniqueField = async function (
  username: string,
  fieldName: string,
  fieldValue: string
) {
  fieldValue = fieldValue.toLowerCase();
  username = username.toLowerCase();

  try {
    // Get username:users:<fieldname> value if username exists
    const previousValue = await bluebird.fromCallback(cb =>
      redis.get(ns(fieldValue, fieldName), cb));

    // if user field should be unique, save the value as a key separately
    if (previousValue === username) {
      // Remove unique value
      await bluebird.fromCallback(cb => redis.del(ns(fieldValue, fieldName), cb));
    }
    return true;
  } catch (error) {
    throw error;
  }
};

exports.isFieldUnique = async (
  fieldName: string,
  fieldValue: string
) => {
  fieldValue = fieldValue.toLowerCase();

  // Check that email does not exists
  try {
    const exists = await bluebird.fromCallback(
      cb => redis.exists(fieldValue + ':' + fieldName, cb));
    return exists !== 1;
  } catch(error){
    throw error;
  }
};

/**
 * Private database index structural check for inconsistent email/user
 */
function _findGhostsEmails() {
  doOnKeysValuesMatching('*:email', '*', function (key, username) {
    const email = key.substring(0, key.lastIndexOf(':'));
    redis.hgetall(username + ':users', function (error, user) {

      let e;
      if (user == null) {
        e = ' cannot find user:' + username;
        // redis.del(key);
      } else if (user.email == null) {
        e = ' cannot find email for:' + username;
      } else if (email !== user.email) {
        e = ' != ' + username + ':user.email -> "' + user.email + '"';
        // redis.del(key);
      }

      if (e) {
        logger.warn('Db structure _findGhostsEmails ' + email + e);
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
        logger.warn('Db structure _findGhostsServer ' + server +
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
exports.setAccessState = function (
  key: string, value: AccessState, 
  callback: Callback, 
) {
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
exports.getAccessState = function (key: string, callback: GenericCallback<AccessState>) {
  // FLOW Since we access the right key, we assume that the data is correct.
  const mixedCallback: Callback = callback; 
  
  getJSON(key + ':access', mixedCallback);
};

//----------------- Reserved words --------------//

var RESERVED_WORDS_VERSION = 'reservedwords:version';
var RESERVED_WORDS_LIST = 'reservedwords:list';

/**
 * Get the current version of the reserved words list in the database
 * @param callback: function(error,result), result being the version
 */
exports.reservedWordsVersion = function (callback: Callback) {
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
exports.reservedWordsLoad = function (
  version: string, wordArray: Array<string>, 
  callback: Callback
) {
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
exports.reservedWordExists = function (word: string, callback: GenericCallback<boolean>) {
  redis.sismember(RESERVED_WORDS_LIST, word, function (error, result) {
    if (error) {
      logger.error('DB reservedWordsExists ' + error, error);
      return callback(error);
    }
    callback(null, result === 1);
  });
};

/// Given a value (`a`) and a namespace kind (`b`): Assembles and returns the 
/// redis namespace for accessing that value. 
/// 
type NamespaceKind = 'users' | 'server' | 'email';
function ns(a: string, b: NamespaceKind): string {
  return `${a}:${b}`;
}

/**
 * Get reservations if exists
 * 
 * @param object uniqueFields - key is the name of the field (like email) 
 * and value is the email itself
 */
async function getReservations(uniqueFields: object) {
  let results = [];
  let result;
  try{
    for(let [key, value] of Object.entries(uniqueFields)){
      result = await bluebird.fromCallback(cb => getSet(ns(key + '-reservations', value), cb));
      if (result) {
        result['field'] = key;
        results.push(result);
      }
    }
    return results;
  } catch(error){
     throw error;
  }
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
 */
async function setReservations(uniqueFields: object, core: string, time: number) {

  const multi = redis.multi();
  try{
    for(let [key, value] of Object.entries(uniqueFields)){
      //key = key.toLowerCase();
      //value = value.toLowerCase();
      multi.hmset(ns(key + '-reservations', value), {
        core: core,
        time: time
      });
    }
    await bluebird.fromCallback(cb => multi.exec(cb));
  } catch(error){
    logger.error(`Database#setReservation: ${error}`, error);
    throw error;
  }

}
exports.setReservations = setReservations;