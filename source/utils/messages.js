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

function _say(code,addons) {
    var content = mstrings['en'][code];
    content.code = code;
    return content ;
}

exports.errors = errors; 
exports.error = error; 
exports.say = say; 
exports.internal = internal; 