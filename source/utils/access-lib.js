// @flow

const db = require('../storage/database');
const messages = require('./messages');
const config = require('./config');
const checkAndConstraints = require('./check-and-constraints');
const domain = config.get('dns:domain');
const accessLib = module.exports = {};

type AccessState = {
  status: 'NEED_SIGNIN',
  code: number,
  key: string,
  requestingAppId: string,
  requestedPermissions: PermissionSet,
  url: string,
  poll: string,
  returnURL: string,
  oauthState: OAuthState,
  poll_rate_ms: number, 
}
type PermissionSet = Array<PermissionEntry>; 
type OAuthState = string | null; 
type PermissionEntry = Object; 

accessLib.ssoCookieSignSecret = config.get('settings:access:ssoCookieSignSecret') ||
  'Hallowed Be Thy Name, O Node 20180926';

/** Update an app access state in the database.
 * 
 * @param key: the key referencing the access to be updated
 * @param accessState: the new state of this access, which is defined by parameters like:
 *  status (NEED_SIGNIN, ACCEPTED, REFUSED), requesting app id, requested permissions, etc.
 * @param successHandler: callback in case of success
 * @param errorCallback: callback in case of error
 */
accessLib.setAccessState = function (
  key: string, accessState: AccessState, 
  successHandler: (AccessState) => mixed, 
  errorCallback: (any) => mixed, 
) {
  db.setAccessState(key, accessState, function (error) {
    if (error) {
      return errorCallback(messages.ei());
    }
    return successHandler(accessState);
  });
};

type RequestAccessParameters = {
  requestingAppId?: mixed, 
  requestedPermissions?: mixed, 
  languageCode?: mixed, 
  oauthState?: mixed, 
  localDevel?: mixed, 
  reclaDevel?: mixed, 
  returnURL?: mixed, 
}


/**
 * Request and generate an app access
 * @param parameters: parameters defining the access such as:
 *  requesting app id, requested permissions, language code, return url, oauth or other dev options
 * @param successHandler: callback in case of success
 * @param errorHandler: callback in case of error
 * @returns {*}
 */
accessLib.requestAccess = function (
  parameters: RequestAccessParameters, 
  successHandler: (any) => mixed, 
  errorHandler: (any) => mixed, 
) {

  // Parameters
  const requestingAppId = checkAndConstraints.appID(parameters.requestingAppId);
  if (!requestingAppId) {
    return errorHandler(messages.e(400, 'INVALID_APP_ID',
      {requestingAppId: parameters.requestingAppId}));
  }

  // FLOW We don't currently verify the contents of the requested permissions. 
  const requestedPermissions = checkAndConstraints.access(parameters.requestedPermissions);
  if (requestedPermissions == null || !Array.isArray(requestedPermissions)) {
    return errorHandler(messages.e(400, 'INVALID_DATA',
      {detail: 'Missing or invalid requestedPermissions field'}));
  }
  
  const lang = checkAndConstraints.lang(parameters.languageCode);
  if (lang == null) 
    return errorHandler(messages.e(400, 'INVALID_LANGUAGE'));

  const returnURL = parameters.returnURL;
  const oauthState = parameters.oauthState;
  
  if (! (typeof returnURL === 'string') )
    return errorHandler(messages.e(400, 'INVALID_DATA', { detail: 'Missing Return Url field' }));

  const key = randGenerator(16);
  const pollURL = config.get('http:register:url') + '/access/' + key; 
  
  let url = config.get('http:static:access');

  const localDevel = parameters.localDevel; 
  if (typeof localDevel === 'string') {
    url = config.get('devel:static:access') + localDevel;
  }

  const reclaDevel = parameters.reclaDevel; 
  if (typeof reclaDevel === 'string') {
    url = 'https://sw.rec.la' + reclaDevel;
  }

  url = url +
    '?lang=' + lang +
    '&key=' + key +
    '&requestingAppId=' + requestingAppId +
    '&returnURL=' + encodeURIComponent(returnURL) +
    '&domain=' + domain +
    '&registerURL=' + encodeURIComponent(config.get('http:register:url'));

  if (typeof oauthState === 'string') {
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

  const cleanOauthState = (typeof oauthState) === 'string' ?
    oauthState : 
    null; 

  const accessState: AccessState = {
    status: 'NEED_SIGNIN',
    code: 201,
    key: key,
    requestingAppId: requestingAppId,
    requestedPermissions: requestedPermissions,
    url: url,
    poll: pollURL,
    returnURL: returnURL,
    oauthState: cleanOauthState,
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
accessLib.testKeyAndGetValue = function (
  key: string, 
  success: (mixed) => mixed, 
  failed: (any) => mixed, 
) {
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