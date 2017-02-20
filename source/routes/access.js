var express = require('express'),
  messages = require('../utils/messages.js'),
  checkAndConstraints = require('../utils/check-and-constraints.js'),
  accessCommon = require('../utils/access-lib.js'),
  invitationToken = require('../storage/invitations.js');

/**
 * Routes handling applications access
 * @param app
 */
module.exports = function (app) {

  /**
   * All access routes use cookies
   */
  app.all('/access/*', express.cookieParser(accessCommon.ssoCookieSignSecret));

  /**
   * POST /access: request an access
   */
  app.post('/access', _requestAccess);

  /**
   * POST /access/invitationtoken/check: check validity of an invitation token
   */
  app.post('/access/invitationtoken/check', function (req, res) {
    invitationToken.checkIfValid(req.body.invitationtoken, function (isValid/*, error*/) {
      res.header('Content-Type', 'text/plain');
      res.send(isValid ? 'true' : 'false');
    });
  });

  /**
   * GET /access/:key: access polling with given key
   */
  app.get('/access/:key', function (req, res, next) {
    accessCommon.testKeyAndGetValue(req.params.key, function (value) {
      return res.json(value, value.code);
    }, next);
  });

  /**
   * POST /access/:key: update state of access polling
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
        _setAccessState(res, next, key, accessStateA);

      } else if (req.body.status === 'ERROR') {
        var accessStateB = {
          status: 'ERROR',
          id: req.body.id || 'INTERNAL_ERROR',
          message:  req.body.message || '',
          detail:  req.body.detail || '',
          code: 403
        };
        _setAccessState(res, next, key, accessStateB);

      } else if (req.body.status === 'ACCEPTED') {
        var username = checkAndConstraints.uid(req.body.username);
        if (! username) {
          return next(messages.e(400, 'INVALID_USER_NAME'));
        }

        if (! checkAndConstraints.appToken(username)) {
          return next(messages.e(400, 'INVALID_DATA'));
        }

        var accessStateC = {
          status: 'ACCEPTED',
          username: req.body.username,
          token: req.body.token,
          code: 200
        };

        _setAccessState(res, next, key, accessStateC);
      }
    }, next);
  });
};

function _requestAccess(req, res, next) {
  var params =  req.body;
  params.sso = req.signedCookies.sso;

  accessCommon.requestAccess(params, function (accessState) {
    res.json(accessState, accessState.code);
  }, next);
}


function _setAccessState(res, next, key, accessState) {
  accessCommon.setAccessState(key, accessState, function (accessState) {
    res.json(accessState, accessState.code);
  }, function (errorMessage) {
    next(errorMessage);
  });
}