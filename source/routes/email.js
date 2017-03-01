'use strict'; 
// @flow

// check if an EMAIL exists
const checkAndConstraints = require('../utils/check-and-constraints'),
      db = require('../storage/database'),
      messages = require('../utils/messages');

/**
 * Routes to handle emails
 * @param app
 */
module.exports = function (app: any) {
  /**
   * POST /email/check/: check existence of an email
   */
  app.post('/email/check', function (req, res, next) {
    req.params.email = req.body.email;
    _checkEmail(req, res, next, true);
  });

  /**
   * GET /:email/check_email: check existence of an email
   */
  app.get('/:email/check_email', function (req, res, next) {
    _checkEmail(req, res, next, false);
  });

  /**
   * GET /:email/uid: get username for a given email
   * TODO: safety (privacy) of this call that exposes a link between an email and a user.
   */
  app.get('/:email/uid', function (req, res, next) {
    if (! checkAndConstraints.email(req.params.email)) {
      return next(messages.e(400, 'INVALID_EMAIL'));
    }

    db.getUIDFromMail(req.params.email, function (error, uid) {
      if (error) {
        return next(messages.ie());
      }
      if (! uid) {
        return next(messages.e(404, 'UNKNOWN_EMAIL'));
      }
      return res.json({uid: uid});
    });
  });

};

function _checkEmail(req, res, next, raw) {
  if (! checkAndConstraints.email(req.params.email)) {
    if (raw) {
      res.header('Content-Type', 'text/plain');
      return res.send('false');
    } else {
      return next(messages.e(400, 'INVALID_EMAIL'));
    }
  }

  db.emailExists(req.params.email, function (error, exists) {
    if (error) {
      return next(messages.ei());
    }
    if (raw) {
      res.header('Content-Type', 'text/plain');
      res.send(exists ? 'true' : 'false');
    } else {
      res.json({exists: exists });
    }
  });
}

