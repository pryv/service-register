/**
 * Tiny middleware to allow CORS (cross-domain) requests to the API.
 */
module.exports = function(req, res, next) {
  
  //console.log('REQ: '+req.method+" "+req.url);
  
  if(req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }

  if(req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
  } else {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  }
  if(req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
  } else {
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);


  res.header('Access-Control-Allow-Credentials', 'true');
  // other CORS-related headers are returned on OPTIONS requests
  next();
}
