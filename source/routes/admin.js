/**
 * private routes for admin to manage users
 */
var checkAndConstraints = require('../utils/check-and-constraints.js');
var users = require('../storage/user.js');
var messages = require('../utils/messages.js');
var tohtml = require('../utils/2html.js');
var invitations = require('../storage/invitations.js');
var requireRoles = require('../middleware/requireRoles');

function init(app) {

  /**
   * get the user list,
   */
  app.get('/admin/users', requireRoles('admin'), function (req, res/*, next*/) {

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


      if (req.query.toHTML) {
        res.send(tohtml.toTable(headers, list));
      }
      res.json({users: list, error: error});

    });

  });


  // --------------- invitations ---

  app.get('/admin/users/invitations', requireRoles('admin'), function (req, res, next) {


    invitations.getAll(function (error, invitations) {
      if (error) {
        return next(messages.ei());
      }


      if (req.query.toHTML) {

        var headers = {
          createdDate : 'Created At',
          createdBy : 'by',
          description: 'description',
          consumedDate: 'ConsumedAt',
          consumedBy: 'ConsumedBy',
          id: 'Token'
        };

        // convert timestamp tor readable data
        invitations.forEach(function (token) {
          if (! token.consumedAt) {
            token.consumedDate = '';
          } else {
            token.consumedDate = new Date(+token.consumedAt).toUTCString();
          }
          token.createdDate = new Date(+token.createdAt).toUTCString();
        });


        invitations.sort(function (a, b) {
          return b.createdAt - a.createdAt;

        });
        res.send(tohtml.toTable(headers, invitations));
        return;
      }

      res.json({invitations: invitations});
    });

  });

  //TODO the following must be handled by a POST /invitations
  app.get('/admin/users/invitations/post', requireRoles('admin'), function (req, res, next){

    var count = req.query.count * 1;
    if (count !== parseInt(count)) {
      return next(messages.e(400, 'INVALID_DATA',
        {'message': 'count is not and integer ' + count}));
    }
    var message = req.query.message || '';

    invitations.generate(count, req.context.access.username, message, function (error, result) {
      if (error) {
        return next(messages.ei());
      }
      res.json({data: result});
    });

  });



  // -------------- servers

  /**
   * get the server list, with the number of users on them
   */
  app.get('/admin/servers', requireRoles('admin'), function (req, res, next) {


    users.getServers(function (error, list) {
      if (error) { return next(messages.ei()); }
      res.json({servers: list});
    });

  });



  app.get('/admin/servers/:serverName/users', requireRoles('admin'), function (req, res, next){

    var serverName = checkAndConstraints.hostname(req.params.serverName);
    if (! serverName) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'serverName invalid'}));
    }

    users.getUsersOnServer(serverName, function (error, list) {
      if (error) { return next(messages.ei(error)); }
      res.json({users: list});
    });

  });



  app.get('/admin/servers/:srcServerName/rename/:dstServerName',
    requireRoles('system'), function (req, res, next) {

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