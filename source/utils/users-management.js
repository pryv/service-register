var logger = require('winston');
var config = require('../utils/config');
var dataservers = require('../network/dataservers.js');
var messages = require('../utils/messages.js');
var db = require('../storage/database.js');

var domain = '.' + config.get('dns:domain');

/**
 * 
 * @param host
 * @param user json object: username / id / email /
 * @param req
 * @param res
 * @param next
 */
exports.create = function create(host, user, req, res, next) {

  dataservers.postToAdmin(host, '/register/create-user', 201, user,
    function (error, result) {
    if (error) {
      logger.error('Confirm: findServer: ' + error + '\n host' +
          JSON.stringify(host) + '\n info:' + JSON.stringify(user));
      return next(messages.ei());
    }
    if (result.id) {
      user.id = result.id;

      db.setServerAndInfos(user.username, host.name, user, function (error) {
        if (error) {
          logger.error('setServerAndInfos:' + error);
          return next(messages.ei());
        }
        res({server: host.name, alias: user.id + domain}, 200);
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
    if (error) { return next(messages.ei()); }
    if (! exists) { return next(messages.e(404, 'UNKOWN_USER_NAME')); }

    db.changeEmail(username, email, function (error) {
      if (error) { return next(messages.ei()); }
      res.json({success: true});
    });
  });

};
