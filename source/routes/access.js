//check if a UID exists

var express = express = require('express');
var messages = require('../utils/messages.js');
var checkAndConstraints = require('../utils/check-and-constraints.js');

var accessCommon = require('../access/access-lib.js');

var invitationToken = require('../storage/invitations-management.js');


function requestAccess(req, res, next) {

  var params =  req.body;
  params.sso = req.signedCookies.sso;

  accessCommon.requestAccess(params, function (accessState) {

    res.json(accessState, accessState.code);
  }, next);
}


function setAccessState(res, next, key, accessState) {
  accessCommon.setAccessState(key, accessState, function (accessState) {
    res.json(accessState, accessState.code);
  }, function (errorMessage) {
    next(errorMessage);
  });
}

function access(app) {


  app.all('/access/*', express.cookieParser(accessCommon.ssoCookieSignSecret));

  /**
   * request an access
   */
  app.post('/access', requestAccess);

  /**
   * access tester
   */
  app.post('/access/invitationtoken/check', function (req, res) {
    invitationToken.checkIfValid(req.body.invitationtoken, function (isValid/*, error*/) {
      res.header('Content-Type', 'text/plain');
      res.send(isValid ? 'true' : 'false');
    });
  });

  /**
   * polling responder
   */
  app.get('/access/:key', function (req, res, next) {
    accessCommon.testKeyAndGetValue(req.params.key, function (value) {
      return res.json(value, value.code);
    }, next);
  });

  /**
   * refuse access
   */
  app.post('/access/:key', function (req, res, next) {
    var key = req.params.key;
    accessCommon.testKeyAndGetValue(key, function (/*value*/) {


      if (req.body.status === 'REFUSED') {
        var accessStateA = {
          status: 'REFUSED',
          reasonID: req.body.reasonID || 'REASON_UNDEFINED',
          message:  req.body.message || '',
          code: 403
        };

        setAccessState(res, next, key, accessStateA);
      }  else if (req.body.status === 'ERROR') {
        var accessStateB = {
          status: 'ERROR',
          id: req.body.id || 'INTERNAL_ERROR',
          message:  req.body.message || '',
          detail:  req.body.detail || '',
          code: 403
        };

        setAccessState(res, next, key, accessStateB);
      } else if (req.body.status === 'ACCEPTED') {

        if (! checkAndConstraints.uid(req.body.username)) {
          return next(messages.e(400, 'INVALID_USER_NAME'));
        }

        if (! checkAndConstraints.appToken(req.body.token)) {
          return next(messages.e(400, 'INVALID_DATA'));
        }

        var accessStateC = {
          status: 'ACCEPTED',
          username: req.body.username,
          token: req.body.token,
          code: 200
        };

        setAccessState(res, next, key, accessStateC);
      }
    }, next);
  });


}


module.exports = access;