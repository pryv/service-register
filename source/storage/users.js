/**
 * Extension of database.js dedicated to user management
 */

const db = require('../storage/database');
const async = require('async');
const _ = require('lodash');
const logger = require('winston');
const config = require('../utils/config');
const dataservers = require('../utils/dataservers');
const domain = '.' + config.get('dns:domain');
const invitationToken = require('./invitations');

/**
 * Create (register) a new user
 * @param host: the hosting for this user
 * @param user: the user data, a json object containing: username, password hash, language and email
 * @param callback: function(error,result), result being a json object containing new user data
 */
exports.create = function create(host, user, callback) {
  const request = {
    username: user.username,
    passwordHash: user.passwordHash,
    language: user.language,
    email: user.email
  };

  delete user.passwordHash; // Remove to forget the password
  delete user.password;

  // BUG Let's make sure that what we store in redis matches with what we use
  //  on core...
  
  dataservers.postToAdmin(host, '/register/create-user', 201, request,
    function (error, result) {
      if (error) {
        logger.error('dataservers.postToAdmin: ' + error + '\n host' +
          JSON.stringify(host) + '\n info:' + JSON.stringify(user));
        return callback(error);
      }
      if (result.id) {
        user.id = result.id;

        db.setServerAndInfos(user.username, host.name, user, function (error) {
          if (error) {
            return callback(error);
          }
          invitationToken.consumeToken(user.invitationToken, user.username, function (error) {
            if (error) {
              return callback(error);
            }
            callback(null, {username: user.username, server: user.username + domain});
          });
        });
      } else {
        var err = 'findServer, invalid data from admin server: ' + JSON.stringify(result);
        logger.error(err);
        return callback(err);
      }
    });
};

/**
 * Update the email address for an user
 * @param username: the user
 * @param email: the new email address
 * @param callback: function(error,result), result being a json object containing success boolean
 */
exports.setEmail = function create(username, email, callback) {

  db.uidExists(username, function (error, exists) {
    if (error) {
      return callback(error);
    }

    if (! exists) {
      return callback({code:404, message:'UNKNOWN_USER_NAME'});
    }

    db.changeEmail(username, email, function (error) {
      if (error) {
        return callback(error);
      }
      callback(null, {success: true});
    });
  });
};

/**
 * Get a list of servers
 * @param callback: function(error, result) with result of the form: {serverName : usage count}
 */
exports.getServers = function (callback) {
  var result = {};
  db.doOnKeysValuesMatching('*:server', '*',
    function (key, value) {
      if (typeof(result[value]) === 'undefined') {
        result[value] = 0;
      }
      result[value]++;
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
exports.getUsersOnServer = function (serverName, callback) {
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
exports.renameServer = function (srcServerName, dstServerName, callback) {

  const errors = [];
  let receivedCount = 0;
  let actionThrown = 0;
  let waitForDone = true;

  var checkDone = function () {
    if ((! waitForDone) && actionThrown === receivedCount) {
      callback(errors.length > 0 ? errors : null, receivedCount);
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
exports.getAllUsersInfos = function (callback) {
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
      var user = userkey.substring(0, userkey.length - 6);
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
function getUserInfos(username, callback) {
  const result = { username : username };
  let errors = [];

  async.parallel([
    function (stepDone) { // Get user information
      db.getSet(username + ':users', function (error, user) {
        if (error) {
          errors.push({user: error});
        } else if (! user) {
          errors.push({user: username + ':users is empty'});
        } else {
          _.extend(result, user);
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
      if (errors.length === 0) {
        errors = null;
      }
      callback(errors, result);
    });
}
exports.getUserInfos = getUserInfos;