var logger = require('winston');
/**
 * Tiny middleware to monitor queries.
 */
module.exports = function(req, res, next) {
 
  
  
  //logger.debug('REQ: '+req.url+' COOKIE:'+JSON.stringify(req.cookies));
  
  res.cookie('access_2', 'XXXXXXXXXXXXX---SEE--ME---XXXXXXXXXX',
      { maxAge: 900000, httpOnly: false }); // do not set the domain!!!
  next();
}
