/**
 * private route for servers
 */
//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var messages = require('../utils/messages.js');
var users = require('../storage/server-management.js');

module.exports = function (app) {

  app.post('/system/:username/email', function (req, res, next) {
    //TODO add authorization checking

    var username = checkAndConstraints.uid(req.params.username);
    if (! username) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    var email = checkAndConstraints.email(req.body.email);
    if (! email) { return next(messages.e(400, 'INVALID_EMAIL')); }

    users.setEmail(username, email, res, next);
  });

};