/**
 * Extension of database.js dedicated to user management
 */

var db = require('../storage/database.js'),
  async = require('async'),
  exports = exports || {},
  _ = require('underscore');

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

  var errors = [],
    receivedCount = 0,
    actionThrown = 0,
    waitForDone = true;

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
  var userlist = [],
    waiter = 1;

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
  var result = { username : username },
    errors = [];

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
    function (error) {
      console.log(error); // Error should be null
      if (errors.length === 0) {
        errors = null;
      }
      callback(errors, result);

    });
}
exports.getUserInfos = getUserInfos;