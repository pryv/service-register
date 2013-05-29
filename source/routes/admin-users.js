/**
 * private routes for admin to manage users
 */
var checkAndConstraints = require('../utils/check-and-constraints.js');
var users = require('../storage/user-management.js');
var messages = require('../utils/messages.js');

function init(app) {

  /**
   * get the server list, with the number of users on them
   */
  app.get('/admin/servers', function (req, res, next) {
    //TODO add authorization checking

    users.getServers(function (error, list) {
      if (error) { return next(messages.ei()); }
      res.json({servers: list});
    });

  });


  app.get('/admin/servers/:serverName/users', function (req, res, next){
    //TODO add authorization checking

    var serverName = checkAndConstraints.hostname(req.params.serverName);
    if (! serverName) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'serverName invalid'}));
    }

    users.getUsersOnServer(serverName, function (error, list) {
      if (error) { return next(messages.ei(error)); }
      res.json({users: list});
    });

  });



  app.get('/admin/servers/:srcServerName/rename/:dstServerName', function (req, res, next){
    //TODO add authorization checking

    var srcServerName = checkAndConstraints.hostname(req.params.srcServerName);
    if (! srcServerName) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'srcServerName invalid'}));
    }
    var dstServerName = checkAndConstraints.hostname(req.params.dstServerName);
    if (! dstServerName) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'dstServerName invalid'}));
    }

    users.renameServer(srcServerName, dstServerName, function (error, count) {
      if (error) {
        return next(messages.ei());
      }
      res.json({count: count});
    });

  });

}

module.exports = init;