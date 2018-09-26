'use strict';

var db = require('../storage/database'),
    messages = require('./messages'),
    config = require('./config'),
    checkAndConstraints = require('./check-and-constraints'),
    domain = config.get('dns:domain'),
    accessLib = module.exports = {};

accessLib.ssoCookieSignSecret = config.get('settings:access:ssoCookieSignSecret') ||
  'Hallowed Be Thy Name, O Node';

/** Update an app access state in the database.
 * 
 * @param key: the key referencing the access to be updated
 * @param accessState: the new state of this access, which is defined by parameters like:
 *  status (NEED_SIGNIN, ACCEPTED, REFUSED), requesting app id, requested permissions, etc.
 * @param successHandler: callback in case of success
 * @param errorCallback: callback in case of error
 */
accessLib.setAccessState = function (key, accessState, successHandler, errorCallback) {
  db.setAccessState(key, accessState, function (error) {
    if (error) {
      return errorCallback(messages.ei());
    }
    return successHandler(accessState);
  });
};

/**
 * Request and generate an app access
 * @param parameters: parameters defining the access such as:
 *  requesting app id, requested permissions, language code, return url, oauth or other dev options
 * @param successHandler: callback in case of success
 * @param errorHandler: callback in case of error
 * @returns {*}
 */
accessLib.requestAccess = function (parameters, successHandler, errorHandler) {

  // Parameters
  var requestingAppId = checkAndConstraints.appID(parameters.requestingAppId);
  if (!requestingAppId) {
    return errorHandler(messages.e(400, 'INVALID_APP_ID',
      {requestingAppId: parameters.requestingAppId}));
  }

  var requestedPermissions = checkAndConstraints.access(parameters.requestedPermissions);
  if (requestedPermissions == null) {
    return errorHandler(messages.e(400, 'INVALID_DATA',
      {detail: 'Missing or invalid requestedPermissions field'}));
  }

  const lang = checkAndConstraints.lang(parameters.languageCode);
  if (lang == null) 
    return errorHandler(messages.e(400, 'INVALID_LANGUAGE'));

  if (parameters.returnURL == null) {
    return errorHandler(messages.e(400, 'INVALID_DATA', {detail: 'Missing Return Url field'}));
  }

  var returnURL = parameters.returnURL,
      oauthState = parameters.oauthState;
  
  var key = randGenerator(16),
      pollURL = config.get('http:register:url') + '/access/' + key,
      url = config.get('http:static:access');

  if (typeof parameters.localDevel !== 'undefined') {
    url = config.get('devel:static:access') + parameters.localDevel;
  }

  if (typeof parameters.reclaDevel !== 'undefined') {
    url = 'https://sw.rec.la' + parameters.reclaDevel;
  }

  url = url +
    '?lang=' + lang +
    '&key=' + key +
    '&requestingAppId=' + requestingAppId +
    '&returnURL=' + encodeURIComponent(returnURL) +
    '&domain=' + domain +
    '&registerURL=' + encodeURIComponent(config.get('http:register:url'));

  if (oauthState) {
    url += '&oauthState=' + oauthState;
  }

  const accessURIc = '&requestedPermissions=' +
    encodeURIComponent(JSON.stringify(requestedPermissions));

  if ((url.length + accessURIc.length) > 2000) {
    // URL too long
    url = url + '&poll=' + encodeURIComponent(pollURL);
  } else {
    url = url + accessURIc;
  }

  var accessState = {
    status: 'NEED_SIGNIN',
    code: 201,
    key: key,
    requestingAppId: requestingAppId,
    requestedPermissions: requestedPermissions,
    url: url,
    poll: pollURL,
    returnURL: returnURL,
    oauthState: oauthState,
    poll_rate_ms: 1000
  };

  accessLib.setAccessState(key, accessState, successHandler, errorHandler);
};

/**
 * Check the validity of the access by checking its associated key.
 * 
 * @param key
 * @param success
 * @param failed
 * @returns {*}
 */
accessLib.testKeyAndGetValue = function (key, success, failed) {
  if (!checkAndConstraints.accesskey(key)) {
    return failed(messages.e(400, 'INVALID_KEY'));
  }

  db.getAccessState(key, function (error, result) {
    if (error) {
      return failed(messages.ei(error));
    }
    if (!result) {
      return failed(messages.e(400, 'INVALID_KEY'));
    }

    success(result);
  });
};

/**
 * Local random key generator
 * @param stringLength: the key length
 * @returns {string}: the generated key
 */
function randGenerator(stringLength) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  var randomstring = '';
  for (var i=0; i<stringLength; i++) {
    randomstring += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomstring;
}