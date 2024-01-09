/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/**
 * Extension of database.js dedicated to user management
 */
const bluebird = require('bluebird');
const db = require('./database');
const async = require('async');
const lodash = require('lodash');
const logger = require('winston');
const config = require('../config');
const dataservers = require('../business/dataservers');
const domain = '.' + config.get('dns:domain');
const invitationToken = require('./invitations');
const messages = require('../utils/messages');
const ErrorIds = require('../utils/errors-ids');
const helpers = require('../utils/helpers');
const info = require('../business/service-info');

/**
 * Create (register) a new user
 *
 * @param host the hosting for this user
 * @param user the user data, a json object containing: username, password hash, language and email
 * @param callback function(error,result), result being a json object containing new user data
 */
exports.create = function create (host, inUser, callback) {
  const user = lodash.clone(inUser);
  // We store usernames and emails as lower case, allowing comparison with any
  // other lowercase string.
  user.username = user.username.toLowerCase();
  user.email = user.email.toLowerCase();
  // Construct the request for core, including the password.
  const request = {
    username: user.username,
    passwordHash: user.passwordHash,
    language: user.language,
    email: user.email
  };
  // Remove to forget the password
  delete user.passwordHash;
  delete user.password;
  dataservers.postToAdmin(
    host,
    '/register/create-user',
    201,
    request,
    function (error, result) {
      if (error != null) {
        logger.error(
          'dataservers.postToAdmin: ' +
            error.toString() +
            '\n host' +
            JSON.stringify(host) +
            '\n info:' +
            JSON.stringify(user)
        );
        if (typeof error === 'string') error = new Error(error);
        return callback(error);
      }
      if (result == null) { return callback(new Error('Core answered empty, unknown error.')); }
      createUserOnServiceRegister(host, user, ['email'], callback);
    }
  );
};

/**
 * Create a new user in the service-register
 * (not on the service-core)
 *
 * @param {ServerConfig} host  the hosting for this user
 * @param {UserInformation} user  the user data, a json object containing: username, password hash, language and email
 * @param {GenericCallback<CreateResult>} callback  function(error,result), result being a json object containing new user data
 * @param {array<string>} uniqueFields
 * @returns {void}
 */
function createUserOnServiceRegister (host, user, uniqueFields, callback) {
  // Construct the request for core, including the password.
  db.setServerAndInfos(
    user.username,
    host.name,
    user,
    uniqueFields,
    function (error) {
      if (error != null) return callback(error);
      invitationToken.consumeToken(
        user.invitationToken,
        user.username,
        function (error) {
          if (error != null) return callback(error);
          return callback(null, {
            username: user.username,
            server: user.username + domain,
            apiEndpoint: info.getAPIEndpoint(user.username, null)
          });
        }
      );
    }
  );
}
exports.createUserOnServiceRegister = createUserOnServiceRegister;

/**
 * Check if reservation still is valid (by default it is valid for 10 minutes)
 *
 * @param reservationTime timestamp of saved reservation
 * @returns {boolean}
 */
function isReservationStillValid (reservationTime) {
  if (reservationTime >= Date.now() - 10 * 60 * 1000) {
    return true;
  } else {
    return false;
  }
}

/**
 * Create user reservation or return error with field name that was
 * already reserved
 *
 * @param host the hosting for this user
 * @param user the user data, a json object containing: username, password hash, language and email
 * @param callback function(error,result), result being a json object containing new user data
 */
exports.createUserReservation = async (uniqueFields, core) => {
  // Get reservations for all uniqueFields
  const reservations = await db.getReservations(uniqueFields);
  let reservation;
  let reservedField = '';
  let reservationExists = false;
  for (reservation of reservations) {
    if (reservation !== null) {
      // if reservation was done in the last 10 minutes
      if (isReservationStillValid(reservation.time)) {
        // a) return success if core is the same
        // b) if in last 10 minutes reservation was made from different core, return false
        if (reservation.core !== core) {
          reservationExists = true;
          reservedField = reservation.field;
          break;
        }
      }
    }
  }
  if (reservationExists === true) {
    return reservedField;
  }
  await db.setReservations(uniqueFields, core, Date.now());
  return true;
};

/**
 *
 * Validate all fields for the user
 * @param string username
 * @param object fields {fieldname: fieldvalue}
 * @param array<string> uniqueFieldsNames [fieldname1, fieldname2]
 */
exports.validateUpdateFields = async (username, fields) => {
  // get update action and execute them in parallel
  const uniquenessErrorTemplate = {
    id: ErrorIds.ItemAlreadyExists,
    data: {}
  };
  let unique;
  try {
    const exists = await bluebird.fromCallback((cb) =>
      db.uidExists(username, cb)
    );
    if (!exists) {
      throw new messages.REGError(404, {
        id: 'UNKNOWN_USER_NAME',
        message: 'No such user'
      });
    }
    // validate all unique fields
    for (const [key, valuesList] of Object.entries(fields)) {
      // because each key could have many values, iterate them
      const checkUniqueness = async () => {
        await helpers.asyncForEach(valuesList, async (valueObject) => {
          if (valueObject.isUnique === true) {
            unique = await db.isFieldUniqueForUser(
              username,
              key,
              valueObject.value
            );
            if (!unique) {
              uniquenessErrorTemplate.data[key] = valueObject.value;
            }
          }
        });
      };
      await checkUniqueness();
    }
    if (Object.keys(uniquenessErrorTemplate.data).length > 0) {
      throw uniquenessErrorTemplate;
    }
  } catch (error) {
    logger.debug(`users#validateUpdateFields: e: ${error}`, error);
    throw error;
  }
};

/**
 *
 * Update all fields for the user
 * @param string username
 * @param object fields
 * Example :
 * {
    email: [
      {
        value: 'testpfx5537@wactiv.chx',
        isUnique: true,
        isActive: true,
        creation: true
      }
    ],
    RandomField: [
      {
        value: 'testpfx91524',
        isUnique: true,
        isActive: true,
        creation: true
      }
    ]
  }
 * @param object fieldsToDelete
 * Example:
 * { email: 'testpfx28600@wactiv.chx', RandomField: 'testpfx22989' }
 */
exports.updateFields = async (username, fields, fieldsToDelete) => {
  // get update action and execute them in parallel
  try {
    username = username.toLowerCase();
    const fieldsToDeleteVerified = await db.verifyFieldForDeletion(
      username,
      fieldsToDelete
    );
    return await db.updateUserData(username, fields, fieldsToDeleteVerified);
  } catch (error) {
    logger.debug(`users#updateFields: e: ${error}`, error);
    throw error;
  }
};

/// Get a list of servers currently in use on this registry.
///
/// @param callback: function(error, result) with result of the form: {serverName : usage count}
///
exports.getServers = function (callback) {
  const result = {};
  db.doOnKeysValuesMatching(
    '*:server',
    '*',
    function _countUserForServer (key, serverName) {
      result[serverName] = (result[serverName] || 0) + 1;
    },
    function (error) {
      callback(error, result);
    }
  );
};

/**
 * Get a list of users on a specific server
 * @param serverName: the name of the server
 * @param callback: function(error, result), result being an array of users
 */
exports.getUsersOnServer = function (serverName, callback) {
  const result = [];
  db.doOnKeysValuesMatching(
    '*:server',
    serverName,
    function (key) {
      result.push(key.split(':')[0]);
    },
    function (error) {
      callback(error, result);
    }
  );
};

/**
 * Rename a server
 * @param srcServerName: the old server name
 * @param dstServerName: the new server name
 * @param callback: function(error, result), result being the count of renamed occurrences
 */
exports.renameServer = function (srcServerName, dstServerName, callback) {
  const errors = [];
  let receivedCount = 0;
  let actionThrown = 0;
  let waitForDone = true;
  const checkDone = function () {
    if (!waitForDone && actionThrown === receivedCount) {
      if (errors.length > 0) return callback(new Error(errors.join(', ')));
      return callback(null, receivedCount);
    }
  };
  const done = function (error) {
    if (error) {
      errors.push(error);
    }
    waitForDone = false;
    checkDone();
  };
  db.doOnKeysValuesMatching(
    '*:server',
    srcServerName,
    function (key) {
      const uid = key.split(':')[0];
      actionThrown++;
      checkDone();
      db.setServer(uid, dstServerName, function (error) {
        if (error) {
          errors.push(error);
        }
        receivedCount++;
        checkDone();
      });
    },
    done
  );
};

/**
 * Get a list of all user's information (see getUserInfos)
 * @param callback: function(error, result), result being a list of information for all users
 */
exports.getAllUsersInfos = function (callback) {
  const userlist = [];
  let waiter = 1;
  function done () {
    waiter--;
    if (waiter === 0) {
      callback(null, userlist);
    }
  }
  db.doOnKeysMatching(
    '*:users',
    function (userkey) {
      const user = userkey.substring(0, userkey.length - 6);
      waiter++;
      this.getUserInfos(user, function (errors, userInfos) {
        if (errors != null && errors.length > 0) {
          userInfos.errors = errors;
        }
        userlist.push(userInfos);
        done();
      });
    }.bind(this),
    function (/* error, count */) {
      done();
    }
  );
};

/**
 * Get information about an user
 * @param {string} username  : the name of requested user
 * @param {Callback} callback  : function(error, result), result being an object containing user information
 * @returns {void}
 */
function getUserInfos (username, callback) {
  let result;
  const errors = [];
  async.parallel(
    [
      function (stepDone) {
        db.getSet(username + ':users', function (error, user) {
          if (error != null) {
            errors.push({ user: error });
          } else if (user == null) {
            errors.push({ user: username + ':users is empty' });
          } else {
            // BUG We have no guarantee here about the structure of `user`. It
            //  could look like nothing...
            // FLOW See bug above.
            result = user;
          }
          stepDone();
        });
      },
      function (done) {
        db.getServer(username, function (error, server) {
          if (error) {
            errors.push({ server: error });
          } else if (!server) {
            errors.push({ server: username + ':server is empty' });
          } else {
            result.server = server;
          }
          done();
        });
      }
    ],
    function () {
      return callback(errors, result);
    }
  );
}
exports.getUserInfos = getUserInfos;

/** @typedef {(err?: Error | null, res?: T | null) => unknown} GenericCallback */

/** @typedef {GenericCallback<unknown>} Callback */

/**
 * @typedef {{
 *   id?: string
 *   username: string
 *   email: string
 *   language: string
 *   password: string
 *   passwordHash: string
 *   invitationToken: string
 *   registeredTimestamp?: number
 *   server?: string
 * }} UserInformation
 */

/**
 * @typedef {{
 *   username: string
 *   apiEndpoint: string
 * }} CreateResult
 */

/**
 * @typedef {{
 *   [name: string]: [{
 *     value: string
 *     isUnique: boolean
 *     isActive: boolean
 *     creation: boolean
 *   }]
 * }} UpdateFieldsSet
 */

/**
 * @typedef {{
 *   [name: string]: string
 * }} DeleteFieldsSet
 */

/**
 * @typedef {{
 *   [name: string]: number
 * }} ServerUsageStats
 */
