/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const bluebird = require('bluebird');
const async = require('async');

const checkAndConstraints = require('../utils/check-and-constraints');
const messages = require('../utils/messages');
const users = require('../storage/users');
const requireRoles = require('../middleware/requireRoles');
const db = require('../storage/database');
const encryption = require('../utils/encryption');
const dataservers = require('../business/dataservers');
const reservedWords = require('../storage/reserved-userid');
// START - CLEAN FOR OPENSOURCE
const invitationToken = require('../storage/invitations');
const ErrorIds = require('../utils/errors-ids');
// END - CLEAN FOR OPENSOURCE

/**
 * Routes for users
 * @param app
 */
module.exports = function (app) {
  const errorTemplate = {
    id: '',
    data: {}
  };
  // POST /user: create a new user
  app.post('/user', (req, res, next) => {
    // Assume body has this type.
    const body = req.body;

    const hosting = checkAndConstraints.hosting(body.hosting);
    if (hosting == null) {
      return next(messages.e(400, 'INVALID_HOSTING'));
    }

    const appID = checkAndConstraints.appID(body.appid);
    const username = checkAndConstraints.uid(body.username);
    const password = checkAndConstraints.password(body.password);
    const email = checkAndConstraints.email(body.email);
    const givenInvitationToken = body.invitationtoken || 'no-token';
    const referer = checkAndConstraints.referer(body.referer);
    const language = checkAndConstraints.lang(body.languageCode);

    if (appID == null) return next(messages.e(400, 'INVALID_APPID'));
    if (username == null) return next(messages.e(400, 'INVALID_USER_NAME'));
    if (email == null) return next(messages.e(400, 'INVALID_EMAIL'));
    if (password == null) return next(messages.e(400, 'INVALID_PASSWORD'));
    if (language == null) return next(messages.e(400, 'INVALID_LANGUAGE'));

    const existsList = [];
    async.parallel([
      // START - CLEAN FOR OPENSOURCE
      function _isInvitationTokenValid (callback) {
        invitationToken.checkIfValid(
          givenInvitationToken,
          function (valid, error) {
            if (!valid) {
              existsList.push('INVALID_INVITATION');
            }
            callback(error);
          }
        );
      },
      // END - CLEAN FOR OPENSOURCE
      function _isUserIdReserved (callback) {
        reservedWords.useridIsReserved(username, function (error, reserved) {
          if (reserved) {
            existsList.push('RESERVED_USER_NAME');
          }
          callback(error);
        });
      },
      function _doesUidAlreadyExist (callback) {
        db.uidExists(username, function (error, exists) {
          if (exists) {
            existsList.push('EXISTING_USER_NAME');
          }
          callback(error);
        });
      },
      function _doesEmailAlreadyExist (callback) {
        db.emailExists(email, function (error, exists) {
          if (exists) {
            existsList.push('EXISTING_EMAIL');
          }
          callback(error);
        });
      }
    ], function (error) {
      if (existsList.length > 0) {
        if (existsList.length === 1) { return next(messages.e(400, existsList[0])); }
        return next(messages.ex(400, 'INVALID_DATA', existsList));
      }
      if (error != null) return next(messages.ei(error));
      encryption.hash(password, function (errorEncryt, passwordHash) {
        if (errorEncryt != null) return next(messages.ei(errorEncryt));
        // Create user
        dataservers.getCoreForHosting(hosting, (hostError, host) => {
          if (hostError != null) return next(messages.ei(hostError));
          if (host == null) { return next(messages.e(400, 'UNAVAILABLE_HOSTING')); }
          const userAttrs = {
            username,
            email,
            language,
            password,
            passwordHash,
            invitationToken: givenInvitationToken,
            referer,
            appid: appID
          };
          users.create(host, userAttrs, function (creationError, result) {
            if (creationError) {
              return next(messages.ei(creationError));
            }
            res.status(200).json(result);
          });
        });
      });
    });
  });

  // POST /users: create a new user only in service-register (system call)
  app.post('/users', requireRoles('system'), async (req, res, next) => {
    // form user data to match previous format
    const userData = req.body.user;
    // compatibility with old structure
    if (userData.appId) {
      userData.appid = userData.appId;
      delete userData.appId;
    }
    const host = Object.assign({}, req.body.host);
    try {
      const result = await bluebird.fromCallback((cb) =>
        users.createUserOnServiceRegister(host, userData, req.body.unique, cb)
      );
      return res.status(201).json(result);
    } catch (creationError) {
      if (creationError.httpCode && creationError.data) {
        return next(creationError);
      } else {
        return next(messages.ei(creationError));
      }
    }
  });

  // START - CLEAN FOR OPENSOURCE
  /**
   * PUT /users: update the user only in service-register (system call)
   * no validation is applied because it is system call
   */
  app.put('/users', requireRoles('system'), async (req, res, next) => {
    const body = req.body;
    // Allow update and delete for all fields except for username
    const username = body.username;

    const fieldsforDeletion = body.fieldsToDelete ? body.fieldsToDelete : {};
    const fieldsforUpdate = body.user ? body.user : {};

    // just make sure that username would not be changed
    delete fieldsforDeletion.username;
    delete fieldsforUpdate.username;
    try {
      await users.validateUpdateFields(username, fieldsforUpdate);
      const response = await users.updateFields(username, fieldsforUpdate, fieldsforDeletion);

      // null if 0 fields were updated and false if something went wrong
      if (!response) {
        res.status(400).json({ user: response });
      } else {
        res.status(200).json({ user: true });
      }
    } catch (error) {
      if (typeof error === 'object') {
        return res.status(400).json({ user: false, error });
      }
      next(error);
    }
  });

  /// DELETE /username/:username: Delete an existing user
  ///
  /// If given 'onlyReg', the user is only deleted from the registry.
  /// If given 'dryRun', the system will check if the user can be deleted - but
  ///   will not delete it.
  ///
  app.delete('/users/:username',
    requireRoles('system'),
    async (req, res, next) => {
      try {
        let deleted = false;
        const onlyReg = req.query.onlyReg === 'true';
        const dryRun = req.query.dryRun === 'true';
        const username = req.params.username;
        // NOTE We might permit actual deletion via this route someday. This
        //  will allow staying compatible.
        if (!onlyReg) {
          throw produceError('NO_SUCH_FUNCTION',
            'This method needs onlyReg=true for now (query).');
        }

        await checkDeletion(username);
        if (!dryRun) {
          await performDeletion(username);
          deleted = true;
        }

        const result = {
          dryRun: !!dryRun,
          deleted
        };
        res.status(200).json({ result });
      } catch (err) {
        return next(err);
      }
    }
  );
  // END - CLEAN FOR OPENSOURCE

  /**
   * POST /username/check: check the existence/validity of a given username
   */
  app.post('/username/check', (req, res, next) => {
    // Assume body has this type.
    const body = req.body;
    req.params.username = body.username;
    _check(req, res, next, true);
  });

  /**
   * GET /:username/check_username: check the existence/validity of a given username
   */
  app.get('/:username/check_username', (req, res, next) => {
    _check(req, res, next, false);
  });

  // do username, email and invitation token validations (system call)
  app.post('/users/validate',
    requireRoles('system'),
    async (req, res, next) => {
      const body = req.body;
      let error = null;
      try {
        // 1. Validate invitation toke
        const invitationTokenValid = await bluebird.fromCallback((cb) =>
          invitationToken.checkIfTokenIsValid(body.invitationToken, cb)
        );
        const uniqueFields = body.uniqueFields;
        if (!invitationTokenValid) {
          error = errorTemplate;
          error.id = ErrorIds.InvalidInvitationToken;
        } else {
          // continue validation only if invitation token is valid

          // 2. Check if Uid already exists
          const uidExists = await bluebird.fromCallback((cb) =>
            db.uidExists(body.username, cb)
          );
          if (uidExists === true) {
            error = errorTemplate;
            error.id = ErrorIds.ItemAlreadyExists;
            error.data.username = body.username;
          }

          // 3. check if each field is unique
          // just in case username is here, remove it , because it was already checked
          delete uniqueFields.username;
          for (const [key, value] of Object.entries(uniqueFields)) {
            const unique = await db.isFieldUnique(key, value);
            if (!unique) {
              if (!error) error = errorTemplate;
              error.id = error.id = ErrorIds.ItemAlreadyExists;
              error.data[key] = value;
            }
          }
        }

        if (error) {
          return res.status(400).json({ reservation: false, error });
        } else {
          // if there are no validation errors, do the reservation for the core
          // username should always be unique, so lets add it to unique Fields
          uniqueFields.username = body.username;
          const result = await users.createUserReservation(
            uniqueFields,
            body.core
          );
          if (result === true) {
            return res.status(200).json({ reservation: true });
          } else {
            error = errorTemplate;
            error.id = ErrorIds.ItemAlreadyExists;
            error.data[result] = uniqueFields[result];
            return res.status(400).json({ reservation: false, error: ['Existing_' + result] });
          }
        }
      } catch (err) {
        return next(err);
      }
    }
  );
};

/**
 * Checks if the username is valid. If `raw` is set to true, this will respond
 * to the request directly, sending a 'text/plain' boolean response ('true' or
 * 'false'). If `raw` is false, it will either call `next` with an error or
 * answer using the Content-Type 'application/json'.
 *
 * NOTE Yes. In fact, these are two functions that got tied up one in the other.
 *
 * @param {express$Request} req
 * @param {express$Response} res
 * @param {express$NextFunction} next
 * @param {boolean} raw
 * @returns {any}
 */
function _check (req, res, next, raw) {
  const username = checkAndConstraints.uid(req.params.username);
  if (!username) {
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
      return res.json({ reserved: true, reason: 'RESERVED_USER_NAME' });
    }
    db.uidExists(username, function (error, exists) {
      if (error) {
        console.log(error);
        return next(messages.ei(error));
      }
      if (raw) {
        res.header('Content-Type', 'text/plain');
        return res.send(exists ? 'false' : 'true');
      } else {
        return res.json({ reserved: exists });
      }
    });
  });
}

// START - CLEAN FOR OPENSOURCE
/**
 * Checks if the conditions are right to be able to delete a given user
 * (identified by `username`). If this function finds any reason why the delete
 * would not work, it throws this reason in the form of an Error (rejects the
 * promise).
 *
 * @param {string} username
 * @returns {Promise<unknown>}
 */
async function checkDeletion (username) {
  const exists = await bluebird.fromCallback((cb) =>
    db.uidExists(username, cb)
  );
  if (!exists) { throw produceError('NO_SUCH_USER', `No such user ('${username}')`); }
}

/**
 * Deletes the user identified by `username` from the redis database.
 *
 * @param {string} username
 * @returns {Promise<unknown>}
 */
async function performDeletion (username) {
  return db.deleteUser(username);
}

/**
 * @typedef {"NO_SUCH_USER" | "NO_SUCH_FUNCTION"} ErrorId
 */

/**
 * @param {ErrorId} errorId
 * @param {string} msg
 * @returns {Error}
 */
function produceError (errorId, msg) {
  const idToStatusCodeMap = {
    NO_SUCH_USER: 404,
    NO_SUCH_FUNCTION: 421
  };
  const statusCode = idToStatusCodeMap[errorId];
  return new messages.REGError(statusCode, {
    id: errorId,
    message: msg
  });
}
// END - CLEAN FOR OPENSOURCE
