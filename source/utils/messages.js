/**
 * provides tools to construct messages for clients.
 */

var logger = require('winston'),
  mstrings = require('../public/messages-en.js');

//add ids to all messages
Object.keys(mstrings).forEach(function (key) {
  mstrings[key].id = key;
});

/**
 * add also the id into the message
 */
function cloneMessage(id) {
  var t = mstrings[id];
  if (! t) {
    throw (new Error('Missing message code :' + id));
  }
  return {id: t.id, message: t.message, detail: t.detail};
}

/**
 *
 * @param id  string key of the message to display (references /messages-<lang code>.js)
 * @param addons  key / value json object to be dumped with the message
 * @return {*}
 */
function say(id, addons) {
  var content = cloneMessage(id);
  // merge addons
  if (addons) {
    for (var i in addons) {
      if (addons.hasOwnProperty(i)) { content[i] = addons[i]; }
    }
  }
  return content;
}
exports.say = say;

/**
// create a JSON ready error for this code
function error_data(id, extra) {
  var content = mstrings['en'][id];
  if (content == undefined) {
      throw(new Error('Missing message code :' + id));
  }
  content.id = id;
  content.more = extra;
  return content;
}
 **/

//sugar for errors
/** internal error **/
exports.ei = function (error) {
  if (! error) {
    error = new Error();
  }
  if (! (error instanceof Error)) {
    error = new Error(error);
  }
  logger.error('internal error : ' + error.message + '\n' +  error.stack);
  return new REGError(500, say('INTERNAL_ERROR'));
};

/** single error **/
exports.e = function (httpCode, id, addons) {
  return new REGError(httpCode, say(id, addons));
};

/** error with sub errors **/
exports.ex = function (httpCode, id, suberrors) {
  var data = cloneMessage(id);
  data.errors = [];
  for (var i = 0; i < suberrors.length ; i++) {
    data.errors[i] = say(suberrors[i]);
  }
  return new REGError(httpCode, data);
};

//REG ERRORS
var REGError = exports.REGError = function (httpCode, data) {
  this.httpCode = httpCode;
  this.data = data;
};

REGError.prototype = Object.create(Error.prototype, {
  constructor: { value: REGError }
});