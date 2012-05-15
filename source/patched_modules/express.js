var express = require('express');
var messages = require('../utils/messages');

/**
 * This patch express instance to detect if a String is not JSON
 */

//workaround to detect if a String is not JSON
express.bodyParser.parse['application/json'] = function(req, options, fn){
  var buf = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk){ buf += chunk ;});
  req.on('end', function(){
    try {
      req.body = buf.length
      ? JSON.parse(buf)
          : {};
          fn();
    } catch (err){
      //logger.debug('INVALID_JSON_REQUEST '+buf);
      fn(messages.e(400,'INVALID_JSON_REQUEST',{received: buf}));
    }
  });
};


module.exports = express;