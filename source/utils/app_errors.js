// may be used for user management
var logger = require('winston');
var messages = require('./messages');

function app_errors(app) {

app.error(function(error, req, res, next) {
    if (error instanceof messages.REGError) {
      //logger.debug("app_errors : "+ JSON.stringify(error.data));
      res.json(error.data, error.httpCode);
    } else {
      if (! (error instanceof Error)) {
        logger.error("app_errors unkown object : "+ error);
        return console.log( (new Error()).stack );
      }
      logger.error("app_errors : "+ error);
      logger.error( error.stack );
      //next();
    }
  });
  
}

module.exports = app_errors;

