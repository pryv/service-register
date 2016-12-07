var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var config = require('../utils/config');
var randGenerator = require('../utils/random');
var checkAndConstraints = require('../utils/check-and-constraints.js');


var domain = config.get('dns:domain');

var accessLib = module.exports = {};


accessLib.ssoCookieSignSecret = config.get('settings:access:ssoCookieSignSecret') || 
  'Hallowed Be Thy Name, O Node';


accessLib.setAccessState =
  function setAccessState(key, accessState, successHandler, errorCallback) {
  db.setAccessState(key, accessState, function (error) {
    if (error) { return errorCallback(messages.ei()); }
    //require('../utils/dump.js').inspect(accessState);
    return successHandler(accessState);
  });
};



accessLib.requestAccess = function (parameters, successHandler, errorHandler) {

  console.log('accessLib.requestAccess sso:' + parameters.sso);

  //--- parameters --//
  var requestingAppId = checkAndConstraints.appID(parameters.requestingAppId);
  if (! requestingAppId) {
    return errorHandler(messages.e(400, 'INVALID_APP_ID',
      {requestingAppId: parameters.requestingAppId}));
  }

  var requestedPermissions = checkAndConstraints.access(parameters.requestedPermissions);
  if (! requestedPermissions) {
    return errorHandler(messages.e(400, 'INVALID_DATA',
      {detail: 'Missing or invalid requestedPermissions field'}));
  }

  var lang = checkAndConstraints.lang(parameters.languageCode);

  //-- TODO Complete Check URL validity
  if (typeof (parameters.returnURL) === 'undefined') {
    return errorHandler(messages.e(400, 'INVALID_DATA', {detail: 'Missing Return Url field'}));
  }
  var returnURL = parameters.returnURL;

  var oauthState = parameters.oauthState;

  //--- END parameters --//



  //--- CHECK IF APP IS AUTHORIZED ---//


  //-- TODO


  //--- END CHECK APP AUTH ---//

  /**
   * appname: 'a name for the app',
   * access: 'the required access',
   */

  // is this a returning user (look in cookies)


  // .... do some stuff here


  // step 2 .. register or log in
  var error = false;
  if (error) {
    return errorHandler(messages.ei());
  }


  var key = randGenerator.string(16);
  var pollURL = config.get('http:register:url') + '/access/' + key;

  var url = config.get('http:static:access');

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

  //TODO add username & sessionID if possible


  var accessURIc = '&requestedPermissions=' +
    encodeURIComponent(JSON.stringify(requestedPermissions));

  if ((url.length + accessURIc.length) > 2000) {
    console.log('url too long');
    url = url + '&poll=' + encodeURIComponent(pollURL);
  } else {
    url = url + accessURIc;
  }

  var accessState = { status: 'NEED_SIGNIN',
    code: 201,
    key: key,
    requestingAppId: requestingAppId,
    requestedPermissions: requestedPermissions,
    url: url,
    poll: pollURL,
    returnURL: returnURL,
    oauthState: oauthState,
    poll_rate_ms: 1000};

  accessLib.setAccessState(key, accessState, successHandler, errorHandler);

};





/**
 * Test the key
 */
accessLib.testKeyAndGetValue = function testKeyAndGetValue(key, success, failed) {
  if (! checkAndConstraints.accesskey(key)) {
    return failed(messages.e(400, 'INVALID_KEY'));
  }

  db.getAccessState(key, function (error, result) {
    if (error) { return failed(messages.ei(error)); }
    if (! result) {
      return failed(messages.e(400, 'INVALID_KEY'));
    }

    success(result);
  });
};




