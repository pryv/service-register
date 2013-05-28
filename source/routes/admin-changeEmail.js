/**
 * private route for servers to change e-mails
 */
//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var messages = require('../utils/messages.js');
var users = require('../utils/users-management.js');

function check(app) {

  app.post('/:username/email/admin', function (req, res, next) {
    //TODO add authorization checking

    var username = checkAndConstraints.uid(req.params.username);
    if (! username) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    var email = checkAndConstraints.email(req.body.email);
    if (! email) { return next(messages.e(400, 'INVALID_EMAIL')); }

    users.setEmail(username, email, res, next);
  });

}

module.exports = check;