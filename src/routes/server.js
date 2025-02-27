/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
'use strict';

const checkAndConstraints = require('../utils/check-and-constraints');
const db = require('../storage/database');
const messages = require('../utils/messages');
const config = require('../config');

const logger = require('winston');

// patch compatibility issue with winston
// there is a difference between v2.3 and 2.4: .warn() vs .warning()
// forcing the version number in package.json does not seem to fix the issue
// we suspect yarn to load the wrong version
if (logger.warn == null) {
  logger.warn = function (...args) {
    logger.warning(...args);
  };
}

/** Routes to discover server assignations.
 */
function discoverServerAssignations (app) {
  const domain = '.' + config.get('dns:domain');
  const aaserversMode = config.get('net:aaservers_ssl') ? 'https' : 'http';

  /** GET /:uid/server - find the server hosting the provided username (uid).
   */
  app.get('/:uid/server', function (req, res, next) {
    const uid = checkAndConstraints.uid(req.params.uid);

    if (!uid) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    db.getServer(uid, function (error, result) {
      if (error) {
        return next(messages.ei(error));
      }

      if (!result) {
        return next(messages.e(404, 'UNKNOWN_USER_NAME'));
      }

      return res.redirect(
        aaserversMode + '://' + result + '/?username=' + uid
      );
    });
  });

  /** POST /:uid/server - find the server hosting the provided username (uid)
   */
  app.post('/:uid/server', function (req, res, next) {
    const uid = checkAndConstraints.uid(req.params.uid);

    if (!uid) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    db.getServer(uid, function (error, result) {
      if (error) {
        return next(messages.ei(error));
      }
      if (!result) {
        return next(messages.e(404, 'UNKNOWN_USER_NAME'));
      }

      return res.status(200).json({ server: result, alias: uid + domain });
    });
  });
}

module.exports = discoverServerAssignations;
