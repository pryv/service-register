/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
// @flow

/**
 * Extension of database.js dedicated to user management
 */
const bluebird = require('bluebird');
const db = require('../storage/database');
const async = require('async');
const lodash = require('lodash');
const logger = require('winston');
const config = require('../config');
const dataservers = require('../business/dataservers');
const domain = '.' + config.get('dns:domain');
const invitationToken = require('./invitations');
const messages = require('../utils/messages');

const info = require('../business/service-info');
const Pryv = require('pryv');

type GenericCallback<T> = (err?: ?Error, res: ?T) => mixed;
type Callback = GenericCallback<mixed>;

export type UserInformation = {
  id?: string, 

  username: string,
  email: string,
  language: string, 

  password: string, 
  passwordHash: string, 

  invitationToken: string, 
  registeredTimestamp?: number,

  server?: string, 
}

import type ServerConfig from '../config';

type CreateResult = {
  username: string, 
  apiEndpoint: string, 
};

/**
 * Create (register) a new user
 * 
 * @param host the hosting for this user
 * @param user the user data, a json object containing: username, password hash, language and email
 * @param callback function(error,result), result being a json object containing new user data
 */
exports.create = function create(host: ServerConfig, inUser: UserInformation, callback: GenericCallback<CreateResult>) {
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
  
  dataservers.postToAdmin(host, '/register/create-user', 201, request,
    function (error, result) {
      if (error != null) {
        logger.error('dataservers.postToAdmin: ' + error.toString() + 
          '\n host' + JSON.stringify(host) + 
          '\n info:' + JSON.stringify(user));

        if (typeof error === 'string')
          error = new Error(error);

        return callback(error);
      }

      if (result == null)
        return callback(new Error('Core answered empty, unknown error.'));

      if (result.id == null) {
        const err = 'findServer, invalid data from admin server: ' + JSON.stringify(result);
        logger.error(err);

        return callback(new Error(err));
      }

      user.id = result.id;
      createUserOnServiceRegister(host, user, ['email'], callback);
    });
  };


/**
 * Create a new user in the service-register
 * (not on the service-core)
 *
 * @param host the hosting for this user
 * @param user the user data, a json object containing: username, password hash, language and email
 * @param callback function(error,result), result being a json object containing new user data
 */
function createUserOnServiceRegister(
  host: ServerConfig,
  user: UserInformation,
  uniqueFields: array<string>,
  callback: GenericCallback<CreateResult>) {

  // Construct the request for core, including the password.
  db.setServerAndInfos(user.username, host.name, user, uniqueFields, function (error) {
    if (error != null) return callback(error);
    invitationToken.consumeToken(user.invitationToken, user.username, function (error) {
      if (error != null) return callback(error);

      return callback(null, {
        username: user.username,
        server: user.username + domain,
        apiEndpoint: Pryv.Service.buildAPIEndpoint(info, user.username, null)
      });
    });
  });
}
exports.createUserOnServiceRegister = createUserOnServiceRegister;

/**
 * Check if reservation still is valid (by default it is valid for 10 minutes)
 *
 * @param reservationTime timestamp of saved reservation
 */
function isReservationStillValid(reservationTime){
  if (reservationTime >= (Date.now() - 10 * 60 * 1000)) {
    return true;
  }else{
    return false;
  }
}
/**
 * Create user reservation or return error if reservation already exists
 * (not on the service-core)
 *
 * @param host the hosting for this user
 * @param user the user data, a json object containing: username, password hash, language and email
 * @param callback function(error,result), result being a json object containing new user data
 */
exports.createUserReservation = async (
  uniqueFields: String,
  core: String) => {

  // Check if there is no reservation for any of uniqueFields
  //const reservation = await bluebird.fromCallback(cb => db.getReservations(username, uniqueFields, cb));
  try{
    const reservations = await db.getReservations(uniqueFields);
    let reservation;
    let reservationExists = false;
      for (reservation of reservations) {
        if (reservation !== null) {
          // if reservation was done in the last 10 minutes
          if (isReservationStillValid(reservation.time)) {

            // a) return success if core is the same
            // b) if in last 10 minutes reservation was made from different core, return false
            if (reservation.core != core) {
              reservationExists = true;
              break;
            }
          }
      }
    }

    if(reservationExists === true){
      return false;
    }
    await db.setReservations(uniqueFields, core, Date.now());
    return true;
  } catch(error){
    throw error;
  }
};


/**
 * Update the email address for an user
 * @param username: the user
 * @param email: the new email address
 * @param callback: function(error,result), result being a json object containing success boolean
 */
exports.setEmail = function create(username: string, email: string, callback: Callback) {

  db.uidExists(username, function (error, exists) {
    if (error) {
      return callback(error);
    }

    if (! exists) 
      return callback(new messages.REGError(404, {
        id: 'UNKNOWN_USER_NAME',
        message: 'No such user',
      }));

    db.changeEmail(username, email, function (error) {
      if (error) {
        return callback(error);
      }
      callback(null, {success: true});
    });
  });
};

/**
 * Update all fields for the user
 */
exports.updateFields = async (username: string, fields: array) => {
  try{
    const exists = await bluebird.fromCallback(cb => db.uidExists(username, cb));
    if (! exists){
      throw(new messages.REGError(404, {
        id: 'UNKNOWN_USER_NAME',
        message: 'No such user',
      }));
    }

    const fieldsForUpdate = fields.map(field => bluebird.fromCallback(cb => db.updateField(username, field, cb)));
    await Promise.all(fieldsForUpdate);
    return true;
  } catch (error) {
    throw error;
  }
};

type ServerUsageStats = {
  [name: string]: number
};

/// Get a list of servers currently in use on this registry. 
/// 
/// @param callback: function(error, result) with result of the form: {serverName : usage count}
/// 
exports.getServers = function (callback: GenericCallback<ServerUsageStats>) {
  const result: ServerUsageStats = {};
  db.doOnKeysValuesMatching('*:server', '*',
    function _countUserForServer(key, serverName) {
      result[serverName] = (result[serverName] || 0) + 1;
    },
    function (error) {
      callback(error, result);
    });
};

/**
 * Get a list of users on a specific server
 * @param serverName: the name of the server
 * @param callback: function(error, result), result being an array of users
 */
exports.getUsersOnServer = function (serverName: string, callback: Callback) {
  var result = [];
  db.doOnKeysValuesMatching('*:server', serverName,
    function (key) {
      result.push(key.split(':')[0]);
    },
    function (error) {
      callback(error, result);
    });
};

/**
 * Rename a server
 * @param srcServerName: the old server name
 * @param dstServerName: the new server name
 * @param callback: function(error, result), result being the count of renamed occurrences
 */
exports.renameServer = function (srcServerName: string, dstServerName: string, callback: Callback) {
  const errors = [];
  let receivedCount = 0;
  let actionThrown = 0;
  let waitForDone = true;

  const checkDone = function () {
    if ((! waitForDone) && actionThrown === receivedCount) {
      if (errors.length > 0) 
        return callback(new Error(errors.join(', ')));

      return callback(null, receivedCount);
    }
  };

  var done = function (error) {
    if (error) {
      errors.push(error);
    }
    waitForDone = false;
    checkDone();
  };

  db.doOnKeysValuesMatching('*:server', srcServerName,
    function (key) {
      var uid = key.split(':')[0];
      actionThrown++;
      checkDone();
      db.setServer(uid, dstServerName, function (error) {
        if (error) {
          errors.push(error);
        }
        receivedCount++;
        checkDone();
      });
    }, done);
};

/**
 * Get a list of all user's information (see getUserInfos)
 * @param callback: function(error, result), result being a list of information for all users
 */
exports.getAllUsersInfos = function (callback: GenericCallback<Array<UserInformation>>) {
  const userlist = [];
  let waiter = 1;

  function done() {
    waiter--;
    if (waiter === 0) {
      callback(null, userlist);
    }
  }

  db.doOnKeysMatching('*:users',
    function (userkey) { // action
      const user = userkey.substring(0, userkey.length - 6);
      waiter++;

      this.getUserInfos(user, function (errors, userInfos) {
        if (errors != null && errors.length > 0) {
          userInfos.errors =  errors;
        }
        userlist.push(userInfos);
        done();
      });
    }.bind(this), function (/*error, count*/) {  // done
      done();
    });
};

/**
 * Get information about an user
 * @param username: the name of requested user
 * @param callback: function(error, result), result being an object containing user information
 */
function getUserInfos(username: string, callback: Callback) {
  let result: UserInformation;
  let errors = [];

  async.parallel([
    function (stepDone) { // Get user information
      db.getSet(username + ':users', function (error, user) {
        if (error != null) {
          errors.push({user: error});
        } else if (user == null) {
          errors.push({user: username + ':users is empty'});
        } else {
          // BUG We have no guarantee here about the structure of `user`. It 
          //  could look like nothing... 

          // FLOW See bug above.
          result = user; 
        }
        stepDone();
      });
    },
    function (done) { // Get server location
      db.getServer(username, function (error, server) {
        if (error) {
          errors.push({server: error});
        } else if (! server) {
          errors.push({server: username + ':server is empty'});
        } else {
          result.server = server;
        }
        done();
      });
    }
  ],
  function () {
    return callback(errors, result);
  });
}
exports.getUserInfos = getUserInfos;