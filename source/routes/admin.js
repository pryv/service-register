/**
 * private routes for admin to manage users
 */
var checkAndConstraints = require('../utils/check-and-constraints.js');
var users = require('../storage/user.js');
var messages = require('../utils/messages.js');
var tohtml = require('../utils/2html.js');
var invitations = require('../storage/invitations.js')

function init(app) {

  /**
   * get the user list,
   */
  app.get('/admin/users', function (req, res, next) {
    //TODO add authorization checking

    var headers = {
      registeredDate : 'Registered At',
      username : 'Username',
      email: 'e-mail',
      language: 'lang',
      server: 'Server',
      appid: 'From app',
      invitationToken : 'Token',
      errors: 'Errors'
    };

    users.getAllUsersInfos(function (error, list) {

      // convert timestamp tor readable data
      list.forEach(function (user) {
        if (! user.registeredTimestamp) {
          user.registeredTimestamp = 0;
          user.registeredDate = '';
        } else {

          user.registeredDate = new Date(+user.registeredTimestamp).toUTCString();
        }
      });

      // convert timestamp tor readable data
      list.sort(function (a, b) {
        return b.registeredTimestamp - a.registeredTimestamp;

      });


      //res.json({users: list, error: error});

      res.send(tohtml.toTable(headers, list));

    });

  });


  // --------------- invitations ---

  app.get('/admin/users/invitations', function (req, res, next){
    //TODO add authorization checking

    invitations.getAll(function (error, invitations) {
      if (error) {
        return next(messages.ei());
      }
      res.json(invitations);
    });

  });


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