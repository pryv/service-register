/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const bluebird = require('bluebird');

const checkAndConstraints = require('../utils/check-and-constraints');
const db = require('../storage/database');
const dataservers = require('../business/dataservers');
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
function registerCoresRoutes(app) {

  /** GET /:uid/server - find the server hosting the provided username (uid).
   */
  app.get('/cores', async (req, res, next) => {
    
    const params = validateParameters(req.query, next);

    let username;
    if (params.username != null) {
      username = params.username;
    } else {
      // retrieve username from email
      try {
        username = await bluebird.fromCallback(cb => db.getUIDFromMail(params.email, cb));
      } catch (error) { 
        logger.error(error);
        return next(messages.ei()); 
      }
    }

    let serverName;
    try {
      serverName = await bluebird.fromCallback(cb => db.getServer(username, cb));
    } catch (error) {
      logger.error(error);
      return next(messages.ei());
    }

    if (serverName == null) {
      return next(messages.e(404, 'UNKNOWN_USER_NAME'));
    }
    const coreUrl = dataservers.getCore(serverName).base_url;
    if (coreUrl == null) {
      return next(messages.e(404, 'UNKNOWN_USER_NAME'));
    }

    res.status(200).json({core: { url: coreUrl }});
  });
}
module.exports = registerCoresRoutes;


function validateParameters(params, callback) {
  if (params == null) return callback(messages.e(400, 'INVALID_PARAMETERS', { message: 'provide "username" or "email" as query parameters.'}));
  if (params.username != null && params.email != null) return callback(messages.e(400, 'INVALID_PARAMETERS', { message: 'provide only "username" or "email" as query parameter, not both.'}));
  if (params.username != null) {
    const username = checkAndConstraints.uid(params.username);
    if (!username) return callback(messages.e(400, 'INVALID_USER_NAME'));
    return { username };
  }
  if (params.email != null) {
    const email = checkAndConstraints.email(params.email);
    if (!email) return callback(messages.e(400, 'INVALID_EMAIL'));
    return { email };
  }
}