var logger = require('winston');
var dump = require('../utils/dump.js');
/**
 * Tiny middleware to monitor queries.
 */
module.exports = function(req, res, next) {
 
  
  
  dump.inspect({ url: req.url, method: req.method, head: req.headers, body: req.body});
  
  //dump.inspect({ url: req.url, method: req.method, cookie: req.cookies, });
  
  res.cookie('access_2', 'XXXXXXXXXXXXX---SEE--ME---XXXXXXXXXX',
      { maxAge: 900000, httpOnly: true }); // do not set the domain!!!
  next();
}
