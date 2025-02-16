/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const logger = require('winston');
const messages = require('../utils/messages');
/**
 * Error middleware, may be used for user management
 * @param {express$Application} app
 * @returns {void}
 */
function appErrors (app) {
  app.use(function (error, req, res, next) {
    if (error instanceof messages.REGError) {
      // logger.debug('app_errors : '+ JSON.stringify(error.data));
      return res.status(error.httpCode).json(error.data);
    }
    // do not log and handle malformed input JSON errors
    if (error instanceof SyntaxError) {
      // custom error format that matches the one used in the core but not in
      // the service-registry
      return res
        .status(error.status, messages.say('INVALID_JSON_REQUEST'))
        .json({
          error: {
            id: 'invalid-parameters-format',
            message: error.toString()
          }
        });
    }
    // API error from core - used in Open Pryv.io for /reg routes
    // same as done by components/errors/src/errorHandling.js#getPublicErrorData()
    if (error.id && error.httpStatus) {
      return res.status(error.httpStatus).json({
        error: {
          id: error.id,
          message: error.message,
          data: error.data
        }
      });
    }
    if (!(error instanceof Error)) {
      logger.error('app_errors unknown object : ' + error);
      logger.error(new Error().stack);
    } else {
      logger.error('app_errors : ' + error.toString());
      logger.error(error.stack);
    }
    const err = new messages.REGError(500, messages.say('INTERNAL_ERROR'));
    res.status(err.httpCode).json(err.data);
  });
}
module.exports = appErrors;
