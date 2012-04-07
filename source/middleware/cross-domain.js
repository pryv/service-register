/**
 * Tiny middleware to allow CORS (cross-domain) requests to the API.
 */
module.exports = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  // other CORS-related headers are returned on OPTIONS requests
  
  next();
}
