/**
* provides tools to construct messages for clients.
*/

var mstrings = new Array();
require('../public/messages-en.js');
var  _ = require('underscore');
mstrings['en'] = register_messages;

function say(id,addons) {
  var content = mstrings['en'][id];
  content.id = id;
  // merge addons
  if (addons)
    for(var i in addons) 
      if (addons.hasOwnProperty(i)) content[i] = addons[i];
  
  return content ;
}

// create a JSON ready error for this code 
function error_data(id, extra) {
  var content = mstrings['en'][id];
  if (content == undefined) {
      throw(new Error("Missing message code :"+id));
  }
  content.id = id;
  content.more = extra;
  return content;
}

/** close the response with a 500 error **/
function internal(res) {
    return res.json(error('INTERNAL_ERROR'),500);
}


// sugar for errors
/** internal error **/
exports.ei = function ei() {
    return new REGError(500, error_data('INTERNAL_ERROR'));
}

/** single error **/
exports.e = function e(httpCode, id, extra) {
    return new REGError(httpCode, error_data(id, extra));
}

/** error with sub errors **/
exports.ex = function ex(httpCode, id, suberrors ) {
    var data = error_data(id);
    data.errors = new Array();
    for (var i = 0; i < suberrors.length ; i++) {
        data.errors[i] = error_data(suberrors[i]);
    }
    return new REGError(httpCode, data);
}

// REG ERRORS
var REGError = exports.REGError = function(httpCode, data) {
  this.httpCode = httpCode;
  this.data = data;
};

REGError.prototype.__proto__ = Error.prototype;


exports.say = say; 
exports.internal = internal; 