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
 * @param app
 */
module.exports = function (app: express$Application) {
  // POST /user: create a new user
  app.post('/user', (req: express$Request, res, next) => {
    // FLOW Assume body has this type.
    const body: {[string]: ?(string | number | boolean)} = req.body; 

    if (req.body == null) {
      logger.error('/user : How could body be empty??');
      return next(messages.ei());
    }

    const hosting: ?string = checkAndConstraints.hosting(body.hosting);
    if (hosting == null) {
      return next(messages.e(400, 'INVALID_HOSTING'));
    }

    var user = {
      appid: checkAndConstraints.appID(body.appid),
      username: checkAndConstraints.uid(body.username),
      password: checkAndConstraints.password(body.password),
      email: checkAndConstraints.email(body.email),
      invitationToken: body.invitationtoken,
      referer: checkAndConstraints.referer(body.referer),
      language: checkAndConstraints.lang(body.languageCode), // no check
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
    if (user.language === null) {
      return next(messages.e(400, 'INVALID_LANGUAGE'));
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
          if (host == null) {
            return next(messages.e(400, 'UNAVAILABLE_HOSTING'));
          }

          users.create(host, user, function(creationError, result) {
            if(creationError) {
              return next(messages.ei(creationError));
            }
            res.status(200).json(result);
          });
        });
      });
    });
  });

  /**
   * POST /username/check: check the existence/validity of a given username
   */
  app.post('/username/check', (req: express$Request, res, next) => {
    // FLOW Assume body has this type.
    const body: { [string]: ?(string | number | boolean) } = req.body; 

    req.params.username = body.username;
    _check(req, res, next, true);
  });

  /**
   * GET /:username/check_username: check the existence/validity of a given username
   */
  app.get('/:username/check_username', (req: express$Request, res, next) => {
    _check(req, res, next, false);
  });

  /**
   * POST /users/:username/change-email: change the email address for a given user
   */
  app.post('/users/:username/change-email', 
    requireRoles('system'), 
    (req: express$Request, res, next) => {
      // FLOW Assume body has this type.
      const body: { [string]: ?(string | number | boolean) } = req.body; 

      var email = checkAndConstraints.email(body.email);
      if (!email) {
        return next(new messages.REGError(400, {
          id: 'INVALID_EMAIL',
          message: `"${body.email}" is not a valid e-mail address`,
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

// Checks if the username is valid. If `raw` is set to true, this will respond
// to the request directly, sending a 'text/plain' boolean response ('true' or
// 'false'). If `raw` is false, it will either call `next` with an error or 
// answer using the Content-Type 'application/json'. 
// 
// NOTE Yes. In fact, these are two functions that got tied up one in the other. 
// 
function _check(req: express$Request, res: express$Response, next: express$NextFunction, raw: boolean) {
  const username = checkAndConstraints.uid(req.params.username);

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