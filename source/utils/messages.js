/**
 * provides tools to construct messages for clients.
 */

var logger = require('winston');
require('../public/messages-en.js');
var  _ = require('underscore');
var mstrings = register_messages;

//add ids to all messages
for (key in mstrings) {
  mstrings[key].id = key;
}

/**
 * add also the id into the message
 */
function cloneMessage(id) {
  var t = mstrings[id];
  if (t == undefined) {
    throw(new Error('Missing message code :'+id));
  }
  return {id: t.id, message: t.message, detail: t.detail};
}

function say(id,addons) {
  // merge addons
  if (addons) {
    var content = cloneMessage(id);
    for(var i in addons) 
      if (addons.hasOwnProperty(i)) content[i] = addons[i];

    return content ;
  }

  return mstrings[id] ;
}

/**
// create a JSON ready error for this code 
function error_data(id, extra) {
  var content = mstrings['en'][id];
  if (content == undefined) {
      throw(new Error('Missing message code :'+id));
  }
  content.id = id;
  content.more = extra;
  return content;
}
 **/


/** close the response with a 500 error **/
function internal(res) {
  return res.json(error('INTERNAL_ERROR'),500);
}


//sugar for errors
/** internal error **/
exports.ei = function ei(error) {
  if (error == null ) error = new Error();
  if (! (error instanceof Error)) error = new Error(error);
  logger.error('internal error : \n'+  error.stack );
  return new REGError(500, say('INTERNAL_ERROR'));
}

/** single error **/
exports.e = function e(httpCode, id, addons) {  
  return new REGError(httpCode, say(id, addons));
}

/** error with sub errors **/
exports.ex = function ex(httpCode, id, suberrors ) {
  var data = cloneMessage(id);
  data.errors = new Array();
  for (var i = 0; i < suberrors.length ; i++) {
    data.errors[i] = say(suberrors[i]);
  }
  return new REGError(httpCode, data);
}

//REG ERRORS
var REGError = exports.REGError = function(httpCode, data) {
  this.httpCode = httpCode;
  this.data = data;
};

REGError.prototype.__proto__ = Error.prototype;


exports.say = say; 
exports.internal = internal; 