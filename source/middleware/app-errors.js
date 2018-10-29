/*jshint -W098*/

var logger = require('winston');
var messages = require('./../utils/messages');

/**
 * Error middleware, may be used for user management
 */
function app_errors(app) {
  app.use(function (error, req, res, next) {
    if (error instanceof messages.REGError) {
      //logger.debug('app_errors : '+ JSON.stringify(error.data));
      return res.status(error.httpCode).json(error.data);
    }

    if (! (error instanceof Error)) {
      logger.error('app_errors unknown object : ' + error);
      logger.error((new Error()).stack);
    }  else {
      logger.error('app_errors : ' + error);
      logger.error(error.stack);
    }
    var err = new messages.REGError(500, messages.say('INTERNAL_ERROR'));
    res.status(err.httpCode).json(err.data);
  });

  /** We let this to airbrake
  process.on('uncaughtException', function (err) {
    if (! err) {
      err = new Error();
    }
    logger.error('uncaughtException : ' + err);
    logger.error(err.stack);
  });
  **/
}

module.exports = app_errors;

