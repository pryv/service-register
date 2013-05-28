//init user creation
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');
var randGenerator = require('../utils/random.js');
var encryption = require('../utils/encryption.js');
var config = require('../utils/config');
var async = require('async');

var dataservers = require('../network/dataservers.js');
var users = require('../utils/users-management.js');

module.exports = function (app) {

  // request pre processing
  app.post('/user', function (req, res, next) {
    if (req.body === undefined) {
      logger.error('/init : How could body be empty??');
      return next(messages.ei());
    }

    // TODO  check that it's an authorized url

    var hosting = checkAndConstraints.hosting(req.body.hosting);
    if (! hosting) { return next(messages.e(400, 'INVALID_HOSTING')); }

    var user = {
      appid: checkAndConstraints.appID(req.body.appid),
      username: checkAndConstraints.uid(req.body.username),
      password: checkAndConstraints.password(req.body.password),
      email: checkAndConstraints.email(req.body.email),
      language: checkAndConstraints.lang(req.body.languageCode) // no check
    };

    if (! user.appid) { return next(messages.e(400, 'INVALID_APPID')); }

    if (! user.username) { return next(messages.e(400, 'INVALID_USER_NAME')); }
    if (checkAndConstraints.uidReserved(user.username)) {
      return next(messages.e(400, 'RESERVED_USER_NAME'));
    }
    if (! user.email) { return next(messages.e(400, 'INVALID_EMAIL')); }
    if (! user.password) { return next(messages.e(400, 'INVALID_PASSWORD'));  }

    var existsList = [];

    async.parallel([
      function (callback) {  // test username
        db.uidExists(user.username, function (error, exists) {
          if (exists) { existsList.push('EXISTING_USER_NAME'); }
          callback(error);
        });
      },
      function (callback) {  // test email
        db.emailExists(user.email, function (error, exists) {
          if (exists) { existsList.push('EXISTING_EMAIL'); }
          callback(error);
        });
      },
      function (callback) { // check host
        callback(null);
        //hosting.getServerForHosting(hosting); "continue here"
      }
    ], function (error) {
      if (existsList.length > 0) {
        return next(messages.ex(400, 'INVALID_DATA', existsList));
      }
      if (error) { return next(messages.ei(error)); }


      encryption.hash(user.password, function (errorEncryt, passwordHash) {
        if (errorEncryt) { return next(messages.ei(errorEncryt)); }

        user.passwordHash =  passwordHash;

        //------------- create user
        var host = dataservers.getHostForHosting(hosting);
        if (!host) { return next(messages.e(400, 'UNAVAILABLE_HOSTING')); }


        users.create(host, user, req, res, next);


      });
    });

  });


};