/**
 * Extension of database.js dedicated to user management
 */

var db = require('../storage/database.js'),
  async = require('async'),
  exports = exports || {},
  _ = require('underscore');

/**
 * @param callback function(error, json of {serversName : usage})
 */
exports.getServers = function getServers(callback) {
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
 *
 * @param serverName
 * @param callback function(error, array of users)
 */
exports.getUsersOnServer = function getUsersOnServer(serverName, callback) {
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
 *
 * @param srcServerName
 * @param dstServerName
 * @param callback function(error, number_of_changes)
 */
exports.renameServer = function renameServer(srcServerName, dstServerName, callback) {

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


exports.getAllUsersInfos = function getAllUsersInfos(callback) {
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


exports.getUserInfos = function getUserInfos(username, callback) {
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
        stepDone(null);
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
        done(null);
      });
    }
  ],
    function (error) {
      if (errors.length === 0) {
        errors = null;
      }
      callback(errors, result);

    });
};
