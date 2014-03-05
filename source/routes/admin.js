/**
 * private routes for admin to manage users
 */
var checkAndConstraints = require('../utils/check-and-constraints.js');
var users = require('../storage/user-management.js');
var messages = require('../utils/messages.js');
var tohtml = require('../utils/2html.js');

function init(app) {

  /**
   * get the user list,
   */
  app.get('/admin/users', function (req, res, next) {
    //TODO add authorization checking

    var headers = {
      username : 'Username',
      email: 'e-mail',
      language: 'lang',
      server: 'Server',
      appid: 'From app',
      invitationToken : 'Token',
      errors: 'Errors'
    };

    users.getAllUsersInfos(function (error, list) {
      console.log(error, list);

      //res.json({users: list, error: error});

      res.send(tohtml.toTable(headers, list));

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