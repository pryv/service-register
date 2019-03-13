// @flow

/**
 * Extension of database.js dedicated to user management
 */

const db = require('../storage/database');
const async = require('async');
const lodash = require('lodash');
const logger = require('winston');
const config = require('../utils/config');
const dataservers = require('../utils/dataservers');
const domain = '.' + config.get('dns:domain');
const invitationToken = require('./invitations');
const messages = require('../utils/messages');

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

import type ServerConfig from '../utils/config';

type CreateResult = {
  username: string, 
  server: string, 
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
      db.setServerAndInfos(user.username, host.name, user, function (error) {
        if (error != null) return callback(error);

        invitationToken.consumeToken(user.invitationToken, user.username, function (error) {
          if (error != null) return callback(error);

          return callback(null, {
            username: user.username, 
            server: user.username + domain});
        });
      });
    });
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
        userInfos.errors =  errors;
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