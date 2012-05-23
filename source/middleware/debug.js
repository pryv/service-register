var logger = require('winston');
/**
 * Tiny middleware to monitor queries.
 */
module.exports = function(req, res, next) {
  logger.debug("REQ: "+req.url);
  next();
}
