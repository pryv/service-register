// @flow

const checkAndConstraints = require('../utils/check-and-constraints'),
      messages = require('../utils/messages'),
      users = require('../storage/users'),
      requireRoles = require('../middleware/requireRoles'),
      db = require('../storage/database'),
      logger = require('winston'),
      encryption = require('../utils/encryption'),
      async = require('async'),
      dataservers = require('../utils/dataservers'),
      reservedWords = require('../storage/reserved-userid'),
      invitationToken = require('../storage/invitations');

/**
 * Routes for users
 * This file is meant to contain all /users routes, after routes are changed to
 * REST-like structure, cf. https://trello.com/c/NVdNVqMN/53
 * @param app
 */
module.exports = function (app: any) {
  // POST /user: create a new user
  //
  app.post('/user', function (req, res, next) {
    if (req.body == null) {
      logger.error('/user : How could body be empty??');
      return next(messages.ei());
    }

    // TODO check that it's an authorized url
    const hosting: ?string = checkAndConstraints.hosting(req.body.hosting);
    if (hosting == null) {
      return next(messages.e(400, 'INVALID_HOSTING'));
    }

    var user = {
      appid: checkAndConstraints.appID(req.body.appid),
      username: checkAndConstraints.uid(req.body.username),
      password: checkAndConstraints.password(req.body.password),
      email: checkAndConstraints.email(req.body.email),
      invitationToken: checkAndConstraints.invitationToken(req.body.invitationtoken),
      referer: checkAndConstraints.referer(req.body.referer),
      language: checkAndConstraints.lang(req.body.languageCode), // no check
      passwordHash: null, // filled in by some of the methods.
    };

    if (! user.appid) {
      return next(messages.e(400, 'INVALID_APPID'));
    }
    if (! user.username) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }
    if (! user.email) {
      return next(messages.e(400, 'INVALID_EMAIL'));
    }
    if (! user.password) {
      return next(messages.e(400, 'INVALID_PASSWORD'));
    }
    if (! user.invitationToken) {
      return next(messages.e(400, 'INVALID_INVITATION'));
    }

    var existsList = [];
    async.parallel([
      function (callback) {  // test username
        invitationToken.checkIfValid(user.invitationToken, function (valid, error) {
          if (! valid) {
            existsList.push('INVALID_INVITATION');
          }
          callback(error);
        });
      },
      function (callback) {  // test username
        reservedWords.useridIsReserved(user.username, function (error, reserved) {
          if (reserved) {
            existsList.push('RESERVED_USER_NAME');
          }
          callback(error);
        });
      },
      function (callback) {  // test username
        db.uidExists(user.username, function (error, exists) {
          if (exists) {
            existsList.push('EXISTING_USER_NAME');
          }
          callback(error);
        });
      },
      function (callback) {  // test email
        db.emailExists(user.email, function (error, exists) {
          if (exists) {
            existsList.push('EXISTING_EMAIL');
          }
          callback(error);
        });
      },
    ], function (error) {

      if (existsList.length > 0) {
        if (existsList.length === 1) {
          return next(messages.e(400, existsList[0]));
        }
        return next(messages.ex(400, 'INVALID_DATA', existsList));
      }

      if (error) {
        return next(messages.ei(error));
      }

      encryption.hash(user.password, function (errorEncryt, passwordHash) {
        if (errorEncryt) {
          return next(messages.ei(errorEncryt));
        }

        user.passwordHash =  passwordHash;

        // Create user
        dataservers.getCoreForHosting(hosting, (hostError, host) => {
          if(hostError) {
            return next(messages.ei(hostError));
          }
          if(!host) {
            return next(messages.e(400, 'UNAVAILABLE_HOSTING'));
          }

          users.create(host, user, function(creationError, result) {
            if(creationError) {
              return next(messages.ei(creationError));
            }
            res.json(result, 200);
          });
        });
      });
    });
  });

  /**
   * POST /username/check: check the existence/validity of a given username
   */
  app.post('/username/check', function (req, res, next) {
    req.params.username = req.body.username;
    _check(req, res, next, true);
  });

  /**
   * GET /:username/check_username: check the existence/validity of a given username
   */
  app.get('/:username/check_username', function (req, res, next) {
    _check(req, res, next, false);
  });

  /**
   * POST /users/:username/change-email: change the email address for a given user
   */
  app.post('/users/:username/change-email', requireRoles('system'), function (req, res, next) {
    var email = checkAndConstraints.email(req.body.email);
    if (!email) {
      return next(new messages.REGError(400, {
        id: 'INVALID_EMAIL',
        message: '"' + req.body.email + '" is not a valid e-mail address'
      }));
    }

    users.setEmail(req.params.username, email, function(error, result) {
      if(error) {
        if(error.code && error.message) {
          return next(messages.e(error.code, error.message));
        }
        return next(messages.ei(error));
      }

      res.json(result);
    });
  });
};

function _check(req, res, next, raw) {
  var username = checkAndConstraints.uid(req.params.username);

  if (! username) {
    if (raw) {
      res.header('Content-Type', 'text/plain');
      return res.send('false');
    } else {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }
  }

  reservedWords.useridIsReserved(username, function (error, reserved) {
    if (error) {
      return next(error);
    }

    if (reserved) {
      if (raw) {
        res.header('Content-Type', 'text/plain');
        return res.send('false');
      }
      return res.json({reserved: true, reason: 'RESERVED_USER_NAME' });
    }

    db.uidExists(username, function (error, exists) {
      if (error) {
        return next(messages.ei());
      }
      if (raw) {
        res.header('Content-Type', 'text/plain');
        return res.send(exists ? 'false' : 'true');
      } else {
        return res.json({reserved: exists });
      }
    });
  });
}