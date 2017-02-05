var logger = require('winston');
var config = require('../utils/config');
var dataservers = require('../network/dataservers.js');
var messages = require('../utils/messages.js');
var db = require('../storage/database.js');

var domain = '.' + config.get('dns:domain');


var invitationToken = require('./invitations.js');

/**
 *
 * @param host
 * @param user json object: username / id / email /
 * @param req
 * @param res
 * @param next
 */
exports.create = function create(host, user, req, res, next) {


  var request = {
    username : user.username,
    passwordHash : user.passwordHash,
    language: user.language,
    email: user.email
  };

  delete user.passwordHash; // remove to forget the password
  delete user.password;

  dataservers.postToAdmin(host, '/register/create-user', 201, request,
    function (error, result) {
      if (error) {
        logger.error('dataservers.postToAdmin: ' + error + '\n host' +
            JSON.stringify(host) + '\n info:' + JSON.stringify(user));
        return next(messages.ei(error));
      }
      if (result.id) {
        user.id = result.id;

        db.setServerAndInfos(user.username, host.name, user, function (error) {
          if (error) {
            return next(messages.ei(error));
          }
          invitationToken.consumeToken(user.invitationToken, user.username, function (error) {
            if (error) {
              return next(messages.ei(error));
            }

            res.json({username: user.username, server: user.username + domain}, 200);
          });
        });

      } else {
        logger.error('findServer, invalid data from admin server: ' + JSON.stringify(result));
        return next(messages.ei());
      }
    });
};


/**
 * a user
 */
exports.setEmail = function create(username, email, res, next) {

  db.uidExists(username, function (error, exists) {
    if (error) { return next(messages.ei(error)); }
    if (! exists) { return next(messages.e(404, 'UNKNOWN_USER_NAME')); }

    db.changeEmail(username, email, function (error) {
      if (error) { return next(messages.ei(error)); }
      res.json({success: true});
    });
  });

};
