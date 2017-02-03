var checkAndConstraints = require('../utils/check-and-constraints'),
    messages = require('../utils/messages'),
    users = require('../storage/server'),
    requireRoles = require('../middleware/requireRoles');

/**
 * Routes for users
 * This file is meant to contain all /users routes, after routes are changed to
 * REST-like structure, cf. https://trello.com/c/NVdNVqMN/53
 * @param app
 */
module.exports = function (app) {

  /**
   * POST /users/:username/change-email: change the email address for given user
   */
  app.post('/users/:username/change-email', requireRoles('system'), function (req, res, next) {
    var email = checkAndConstraints.email(req.body.email);
    if (! email) {
      return next(new messages.REGError(400, {
        id: 'INVALID_EMAIL',
        message: '"' + req.body.email + '" is not a valid e-mail address'
      }));
    }

    users.setEmail(req.params.username, email, res, next);
  });
};