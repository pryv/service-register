//init user creation
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');
var encryption = require('../utils/encryption.js');
var async = require('async');

var dataservers = require('../network/dataservers.js');
var users = require('../storage/server-management.js');

var reservedWords = require('../storage/reserved-userid-management.js');



var invitationToken = require('../storage/invitations-management.js');

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
      invitationToken: checkAndConstraints.invitationToken(req.body.invitationtoken),
      language: checkAndConstraints.lang(req.body.languageCode) // no check
    };

    if (! user.appid) { return next(messages.e(400, 'INVALID_APPID')); }
    if (! user.username) { return next(messages.e(400, 'INVALID_USER_NAME')); }
    if (! user.email) { return next(messages.e(400, 'INVALID_EMAIL')); }
    if (! user.password) { return next(messages.e(400, 'INVALID_PASSWORD'));  }
    if (! user.invitationToken) { return next(messages.e(400, 'INVALID_INVITATION'));  }

    var existsList = [];
    async.parallel([
      function (callback) {  // test username
        invitationToken.checkIfValid(user.invitationToken, function (valid, error) {
          if (! valid) { existsList.push('INVALID_INVITATION'); }
          callback(error);
        });
      },
      function (callback) {  // test username
        reservedWords.useridIsReserved(user.username, function (error, reserved) {
          if (reserved) { existsList.push('RESERVED_USER_NAME'); }
          callback(error);
        });
      },
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

        if (existsList.length === 1) {
          return next(messages.e(400, existsList[0]));
        }
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

  /***-------   other functions           -------------**/

  app.post('/username/check/', function (req, res, next) {
    req.params.username = req.body.username;
    _check(req, res, next, true);
  });


  app.get('/:username/check_username', function (req, res, next) {
    _check(req, res, next, false);
  });

};



function _check(req, res, next, raw) {
  var username = checkAndConstraints.uid(req.params.username);


  if (! username) {
    if (raw) {
      res.header('Content-Type', 'text/plain');
      return res.send('false');
    } else {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }
  }



  reservedWords.useridIsReserved(username, function (error, reserved) {
    if (error) { return next(error); }

    if (reserved) {
      if (raw) {
        res.header('Content-Type', 'text/plain');
        return res.send('false');
      }
      return res.json({reserved: true, reason: 'RESERVED_USER_NAME' });
    }

    db.uidExists(username, function (error, exists) {
      if (error) { return next(messages.ei()); }
      if (raw) {
        res.header('Content-Type', 'text/plain');
        return res.send(exists ? 'false' : 'true');
      } else {
        return res.json({reserved: exists });
      }
    });
  });

}