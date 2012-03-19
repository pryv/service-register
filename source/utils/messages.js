/**
* provides tools to construct messages for clients.
*/

var mstrings = new Array();
require('../public/messages-en.js');
mstrings['en'] = register_messages;

function say(code,addons) {
    return {message: _say(code,addons)};
}

function error(code,addons) {
    return {error: _say(code,addons)};
}

/** close the response with a 500 error **/
function internal(res) {
    return res.json(error('INTERNAL_ERROR'),500);
}

function errors(errors_array) {
    var content = new Array();
    for (var i = 0; i < errors_array.length ; i++) {
        console.log("**"+ errors_array[i]);
        content.push(error(errors_array[i]));
    }
    return {errors: content};
}

function _say(id,addons) {
    var content = mstrings['en'][id];
    content.id = id;
    return content ;
}


// sugar for errors
exports.e = function e(httpCode, id, message) {
    var data = mstrings['en'][id];
    data.id = id;
    if (message != null) data.message = message;
    return new REGError(httpCode, data);
}

// REG ERRORS
var REGError = exports.REGError = function(httpCode, data) {
  this.httpCode = httpCode;
  this.data = data;
};

REGError.prototype.__proto__ = Error.prototype;





exports.errors = errors; 
exports.error = error; 
exports.say = say; 
exports.internal = internal; 