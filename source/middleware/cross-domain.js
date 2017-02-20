/**
 * Tiny middleware to allow CORS (cross-domain) requests to the API.
 */
module.exports = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'] ||
    'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ||
    'Content-Type');
  res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  res.header('Access-Control-Allow-Credentials', 'true');

  // Other CORS-related headers are returned on OPTIONS requests

  if (req.method === 'OPTIONS') {
    console.log('Cross Domain OPTIONS REQUEST: ' + req.url);
    res.send(200);
  } else {
    next();
  }
};