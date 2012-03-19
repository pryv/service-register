// may be used for user management
var logger = require('winston');
var messages = require('./messages');

function app_errors(app) {

app.error(function(error, req, res, next) {
    if (error instanceof messages.REGError) {
      res.json(error.data, error.httpCode);
    } else {
      logger.debug("app_errors : "+ error);
      next();
    }
  });
  
}

module.exports = app_errors;

