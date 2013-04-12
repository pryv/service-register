/**
 * private routes for admin to manage users
 */
//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var users = require('../storage/user-management.js');
var messages = require('../utils/messages.js');
var dataservers = require('../network/dataservers.js');

function init(app) {

  app.get('/admin/servers/:serverName/users', function(req, res,next){
    //TODO add authorization checking

    var serverName = checkAndConstraints.hostname(req.params.serverName);
    if (! serverName) return next(messages.e(400,'INVALID_DATA',{'message': 'serverName invalid'}));

    users.getUsersOnServer(serverName,function(error, list) {
      if (error) return next(messages.ei());
      res.json({users: list});
    });

  });

}

module.exports = init;