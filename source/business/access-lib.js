// @flow

const db = require('../storage/database');
const messages = require('../utils/messages');
const config = require('../config');
const checkAndConstraints = require('../utils/check-and-constraints');
const domain = config.get('dns:domain');
const accessLib = module.exports = {};
const logger = require('winston');

const info = require('./service-info');

import type { AccessState } from '../storage/database';


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

type RequestAccessParametersV1 = {
  requestVersion: string, // 'v1'
  requestingAppId?: mixed, 
  requestedPermissions?: mixed, 
  languageCode?: mixed, 
  oauthState?: mixed, 
  localDevel?: mixed, 
  reclaDevel?: mixed, 
  returnURL?: mixed, 
  clientData?: mixed, 
  authUrl?: string,
  serviceInfo?: mixed,
}

type RequestAccessParametersV2 = {
  requestVersion: string, // 'v2'
  accessRequest: Object, // matching accesses.create parameters
  languageCode?: mixed,
  oauthState?: mixed,
  localDevel?: mixed,
  reclaDevel?: mixed,
  returnURL?: mixed,
  authUrl?: string,
  serviceInfo?: mixed,
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
  parameters: RequestAccessParametersV1,
  successHandler: (any) => mixed,
  errorHandler: (any) => mixed,
) {
  if (parmaeters.requestVersion == 'v2') {
    return requestAccessV2(parameters, successHandler, errorHandler);
  } else {
    return requestAccessV1(parameters, successHandler, errorHandler);
  }
}


function requestAccessV1 (
  parameters: RequestAccessParametersV1, 
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
  const clientData = parameters.clientData;
  const serviceInfo = parameters.serviceInfo;

  let effectiveReturnURL; 
  if ((returnURL == null) || (typeof returnURL === 'string')) {
    effectiveReturnURL = returnURL;
  } else if ((typeof returnURL === 'boolean') && (returnURL === false)) {
    // deprecated
    logger.warning('Deprecated: received returnURL=false, this optional parameter must be a string.');

    effectiveReturnURL = null; 
  } else {
    return errorHandler(messages.e(400, 'INVALID_DATA', { detail: 'Invalid returnURL field.' }));
  }

  const key = randGenerator(16);
  const pollURL = info.access + key; 
  
  if (serviceInfo != null) {
    if (! isServiceInfoValid(serviceInfo)) {
      return errorHandler(messages.e(400, 'INVALID_SERVICE_INFO_URL', { detail: serviceInfo }));
    }
  }
  

  let url: string;
  if(parameters.authUrl != null) {
    url = parameters.authUrl;
    if(!isAuthURLValid(url)) {
      return errorHandler(messages.e(400, 'INVALID_AUTH_URL', { detail: 'domain : '+domain+' / auth : ' + url }));
    }
    if(!isAuthDomainTrusted(url)) {
      return errorHandler(messages.e(400, 'UNTRUSTED_AUTH_URL', { detail: 'domain : '+domain+' / auth : ' + url }));
    }
  } else {
    url = config.get('access:defaultAuthUrl');
  }

  const reclaDevel = parameters.reclaDevel; 
  if (typeof reclaDevel === 'string') {
    url = 'https://sw.rec.la' + reclaDevel;
  }

  
  
  let firstParamAppender = (url.indexOf('?') >= 0) ? '&' : '?';
  
  let authUrl: string;
  authUrl = url + firstParamAppender;

  url = url +
    firstParamAppender +
    'lang=' + lang +
    '&key=' + key +
    '&requestingAppId=' + requestingAppId;
  
  if (effectiveReturnURL != null)
    url += '&returnURL=' + encodeURIComponent(effectiveReturnURL);

  url +=
    '&domain=' + domain +
    '&registerURL=' + encodeURIComponent(info.register); 
  
  url += '&poll=' + encodeURIComponent(pollURL);
  
  const cleanOauthState = (typeof oauthState) === 'string' ?
    oauthState : 
    null; 

  if (cleanOauthState != null) 
    url += '&oauthState=' + cleanOauthState;

  authUrl += '&pollUrl=' + encodeURIComponent(pollURL);


  const accessState: AccessState = {
    requestVersion: 'v1',
    status: 'NEED_SIGNIN',
    code: 201,
    key: key,
    requestingAppId: requestingAppId,
    requestedPermissions: requestedPermissions,
    url: url,
    authUrl: authUrl,
    poll: pollURL,
    returnURL: effectiveReturnURL,
    oauthState: cleanOauthState,
    poll_rate_ms: 1000,
    clientData: clientData,
    lang: lang,
    serviceInfo: serviceInfo,
  };



  accessLib.setAccessState(key, accessState, successHandler, errorHandler);
};



function requestAccessV2 (
  parameters: RequestAccessParametersV2,
  successHandler: (any) => mixed,
  errorHandler: (any) => mixed,
) {
  // Parameters
  const requestingAppId = checkAndConstraints.appID(parameters.accessRequest.name);
  if (!requestingAppId) {
    return errorHandler(messages.e(400, 'INVALID_APP_ID',
      { name: parameters.accessRequest.name }));
  }

  // FLOW We don't currently verify the contents of the requested permissions. 
  const requestedPermissions = checkAndConstraints.access(parameters.accessRequest.permissions);
  if (requestedPermissions == null || !Array.isArray(requestedPermissions)) {
    return errorHandler(messages.e(400, 'INVALID_DATA',
      { detail: 'Missing or invalid .accessRequest.permissions field' }));
  }

  const lang = checkAndConstraints.lang(parameters.languageCode);
  if (lang == null)
    return errorHandler(messages.e(400, 'INVALID_LANGUAGE'));

  const returnURL = parameters.returnURL;
  const oauthState = parameters.oauthState;
  const clientData = parameters.clientData;
  const serviceInfo = parameters.serviceInfo;

  let effectiveReturnURL;
  if ((returnURL == null) || (typeof returnURL === 'string')) {
    effectiveReturnURL = returnURL;
  } else if ((typeof returnURL === 'boolean') && (returnURL === false)) {
    // deprecated
    logger.warning('Deprecated: received returnURL=false, this optional parameter must be a string.');

    effectiveReturnURL = null;
  } else {
    return errorHandler(messages.e(400, 'INVALID_DATA', { detail: 'Invalid returnURL field.' }));
  }

  const key = randGenerator(16);
  const pollURL = info.access + key;

  if (serviceInfo != null) {
    if (!isServiceInfoValid(serviceInfo)) {
      return errorHandler(messages.e(400, 'INVALID_SERVICE_INFO_URL', { detail: serviceInfo }));
    }
  }


  let url: string;
  if (parameters.authUrl != null) {
    url = parameters.authUrl;
    if (!isAuthURLValid(url)) {
      return errorHandler(messages.e(400, 'INVALID_AUTH_URL', { detail: 'domain : ' + domain + ' / auth : ' + url }));
    }
    if (!isAuthDomainTrusted(url)) {
      return errorHandler(messages.e(400, 'UNTRUSTED_AUTH_URL', { detail: 'domain : ' + domain + ' / auth : ' + url }));
    }
  } else {
    url = config.get('http:static:access');
  }


  const localDevel = parameters.localDevel;
  if (typeof localDevel === 'string') {
    url = config.get('devel:static:access') + localDevel;
  }

  const reclaDevel = parameters.reclaDevel;
  if (typeof reclaDevel === 'string') {
    url = 'https://sw.rec.la' + reclaDevel;
  }


  let firstParamAppender = (url.indexOf('?') >= 0) ? '&' : '?';

  let authUrl: string;
  authUrl = url + firstParamAppender;

  const cleanOauthState = (typeof oauthState) === 'string' ?
    oauthState :
    null;

  authUrl += '&pollUrl=' + encodeURIComponent(pollURL);

  const accessState: AccessState = {
    status: 'NEED_SIGNIN',
    code: 201,
    accessRequest: parameters.accessRequest,
    authUrl: authUrl,
    pollUrl: pollURL,
    returnURL: effectiveReturnURL,
    oauthState: cleanOauthState,
    poll_rate_ms: 1000,
    lang: lang,
    serviceInfo: serviceInfo,
  };

  accessLib.setAccessState(key, accessState, successHandler, errorHandler);
};

function isAuthURLValid(url: string): boolean {
  return checkAndConstraints.url(url);
}

const trustedAuthUrls = config.get('access:trustedAuthUrls');
trustedAuthUrls.push(config.get('access:defaultAuthUrl'));

function isAuthDomainTrusted(url: string) {
  
  for(let i = 0; i < trustedAuthUrls.length; i++) {
    if(url.startsWith(trustedAuthUrls[i])) {
      return true;
    }
  }
  return false;
}

function isServiceInfoValid(serviceInfo: mixed): boolean {
  return serviceInfo && serviceInfo.name ? true : false;
}

/// Check the validity of the access by checking its associated key.
/// 
accessLib.testKeyAndGetValue = function (
  key: string, 
  success: (res: AccessState) => mixed, 
  failed: (err: Error) => mixed, 
) {
  if (!checkAndConstraints.accesskey(key)) {
    return failed(messages.e(400, 'INVALID_KEY'));
  }

  db.getAccessState(key, function (error, result) {
    if (error != null) return failed(messages.ei(error));
    if (result == null) return failed(messages.e(400, 'INVALID_KEY'));

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