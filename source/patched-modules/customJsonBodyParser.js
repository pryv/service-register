
var messages = require('../utils/messages');

/**
 * This patch express instance to detect if a String is not JSON
 */

module.exports =  function(req, res, next){
  if (req._body) return next();
  req.body = req.body || {};

  // check Content-Type
  if ('application/json' != req.headers['content-type']) return next();

  // flag as parsed
  req._body = true;

  // parse
  var buf = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk){ buf += chunk });
  req.on('end', function(){
    try {
      req.body = buf.length ? JSON.parse(buf) : {};
      next();
    } catch (err){
      err.body = buf;
      err.status = 400;
      next(messages.e(400,'INVALID_JSON_REQUEST',{received: buf}));
    }
  });
};
