/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
/**
 * Provides tools to construct messages for clients.
 */
const logger = require('winston');
const mstrings = require('../public/messages-en');
// Add ids to all messages
Object.keys(mstrings).forEach(function (key) {
  mstrings[key].id = key;
});
/**
 * Add also the id into the message
 * @returns {{ id: any; message: any; detail: any; errors: any[]; }}
 */
function cloneMessage (id) {
  const t = mstrings[id];
  if (t == null) {
    throw new Error('Missing message code :' + id);
  }
  return {
    id: t.id,
    message: t.message,
    detail: t.detail,
    errors: [] // One error may have several children (causes)
  };
}
/**
 * Construct a message to display according to message id
 * @param {string} id  : string key of the message (public/messages-<lang code>.js)
 * @param {any | null} addons  : optional key/value json object to be dumped with the message
 * @return {{ id: any; message: any; detail: any; errors: any[]; }} : the generated message
 */
function say (id, addons) {
  const content = cloneMessage(id);
  // merge addons
  if (addons != null) {
    for (const i in addons) {
      if (Object.prototype.hasOwnProperty.call(addons, i)) {
        content[i] = addons[i];
      }
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
  if (!error) {
    error = new Error();
  }
  if (!(error instanceof Error)) {
    error = new Error(error);
  }
  logger.error('internal error : ' + error.message + '\n' + error.stack);
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
  const data = cloneMessage(id);
  data.errors = [];
  for (let i = 0; i < suberrors.length; i++) {
    data.errors[i] = say(suberrors[i]);
  }
  return new REGError(httpCode, data);
};
/// Error class for all register errors.
///
/** @extends Error */
class REGError extends Error {
  /** */
  httpCode = undefined;
  /** */
  data = undefined;
  constructor (httpCode, data) {
    super();
    this.httpCode = httpCode;
    this.data = data;
  }
}
exports.REGError = REGError;
