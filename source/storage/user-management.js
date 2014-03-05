/**
 * extension of database.js dedicated to user management
 */

var db = require('../storage/database.js');
var async = require('async');
var exports = exports || {};
var _ = require('underscore');


/**
 * @param callback function(error, json of {serversName : usage})
 */
exports.getServers = function getServers(callback) {
  var result = {};
  db.doOnKeysValuesMatching('*:server', '*',
    function (key, value) {
      if (typeof(result[value]) === 'undefined') { result[value] = 0; }
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

  var errors = [];

  var receivedCount = 0;
  var actionThrown = 0;
  var waitForDone = true;

  var checkDone = function () {
    if ((! waitForDone) && actionThrown === receivedCount) {
      callback(errors.length > 0 ? errors : null, receivedCount);
    }
  };

  var myDone = function (error) {
    if (error) { errors.push(error); }
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

    }, myDone);
};


exports.getAllUsersInfos = function getAllUsersInfos(callback) {
  var userlist = {};
  var waiter = 1;
  function done1() {
    waiter--;
    if (waiter === 0) {
      callback(null, userlist);
    }
  }


  db.doOnKeysMatching('*:users',
    function (userkey) { // action

      var user = userkey.substring(0, userkey.length - 6);

      userlist[user] = {};
      waiter++;
      this.getUserInfos(user, function (errors, userInfos) {
        userlist[user] = userInfos;
        userlist[user].errors =  errors;
        done1();
      });
    }.bind(this), function (/*error, count*/) {  // done
      done1();
    });
};


exports.getUserInfos = function getUserInfos(username, callback) {
  var result = { username : username };
  var errors = [];

  async.parallel([
    function (done) { // -- get user informations
      db.getSet(username + ':users', function (error, user) {
        if (error) {
          errors.push({user: error});
        } else if (! user) {
          errors.push({user: username + ':users is empty'});
        } else {
          _.extend(result, user);
        }
        done(null);
      });
    },
    function (done) { // -- get server location
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

      if (errors.length === 0) { errors = null; }
      callback(errors, result);

    });


};
