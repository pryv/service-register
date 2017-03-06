/**
 * Provides tools to construct messages for clients.
 */

const logger = require('winston'),
      mstrings = require('../public/messages-en');

// Add ids to all messages
Object.keys(mstrings).forEach(function (key) {
  mstrings[key].id = key;
});

/**
 * Add also the id into the message
 */
function cloneMessage(id) {
  var t = mstrings[id];
  if (! t) {
    throw (new Error('Missing message code :' + id));
  }
  return {id: t.id, message: t.message, detail: t.detail};
}

/**
 * Construct a message to display according to message id
 * @param id: string key of the message (public/messages-<lang code>.js)
 * @param addons : optional key/value json object to be dumped with the message
 * @return {*}: the generated message
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
// Create a JSON ready error for this code
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

/**
 * Sugar for internal error
 * @param error: object representing the error
 * @returns: the error to be thrown
 */
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

/**
 * Sugar for single error
 * @param httpCode: http code for this error
 * @param id: id of the error message
 * @param addons: optional key/value json object to be dumped with the message
 * @returns: the error to be thrown
 */
exports.e = function (httpCode, id, addons) {
  return new REGError(httpCode, say(id, addons));
};

/**
 * Sugar for error with sub errors
 * @param httpCode: http code for this error
 * @param id: id of the error message
 * @param suberrors: array of suberrors
 * @returns: the error to be thrown
 */
exports.ex = function (httpCode, id, suberrors) {
  var data = cloneMessage(id);
  data.errors = [];
  for (var i = 0; i < suberrors.length ; i++) {
    data.errors[i] = say(suberrors[i]);
  }
  return new REGError(httpCode, data);
};

/**
 * Custom object for register errors
 */
var REGError = exports.REGError = function (httpCode, data) {
  this.httpCode = httpCode;
  this.data = data;
};

REGError.prototype = Object.create(Error.prototype, {
  constructor: { value: REGError }
});