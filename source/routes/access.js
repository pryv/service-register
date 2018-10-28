// @flow

const messages = require('../utils/messages');
const checkAndConstraints = require('../utils/check-and-constraints');
const accessCommon = require('../utils/access-lib');
const invitationToken = require('../storage/invitations');

const cookieParser = require('cookie-parser');

/**
 * Routes handling applications access
 * @param app
 */
module.exports = function (app: express$Application) {

  /**
   * All access routes use cookies
   */
  app.all('/access/*', cookieParser(accessCommon.ssoCookieSignSecret));

  /**
   * POST /access: request an access
   */
  app.post('/access', _requestAccess);

  /**
   * POST /access/invitationtoken/check: check validity of an invitation token
   */
  app.post('/access/invitationtoken/check', (req: express$Request, res) => {
    // FLOW We're assuming that body will be JSON encoded.
    const body: {[key: string]: string} = req.body; 

    invitationToken.checkIfValid(body.invitationtoken, function (isValid/*, error*/) {
      res.header('Content-Type', 'text/plain');
      res.send(isValid ? 'true' : 'false');
    });
  });

  /** GET /access/:key - access polling with given key
   */
  app.get('/access/:key', (req: express$Request, res, next) => {
    accessCommon.testKeyAndGetValue(req.params.key, (value) => {
      return res.status(value.code).json(value);
    }, next);
  });

  /**
   * POST /access/:key: update state of access polling
   */
  app.post('/access/:key', (req: express$Request, res, next) => {
    // FLOW We're assuming that body will be JSON encoded.
    const body: { [key: string]: ?(string | number)} = req.body; 

    const key = req.params.key;
    accessCommon.testKeyAndGetValue(key, function (/*value*/) {

      if (body.status === 'REFUSED') {
        const accessStateA = {
          status: 'REFUSED',
          reasonID: body.reasonID || 'REASON_UNDEFINED',
          message:  body.message || '',
          code: 403
        };
        _setAccessState(res, next, key, accessStateA);

      } else if (body.status === 'ERROR') {
        const accessStateB = {
          status: 'ERROR',
          id: body.id || 'INTERNAL_ERROR',
          message:  body.message || '',
          detail:  body.detail || '',
          code: 403
        };
        _setAccessState(res, next, key, accessStateB);

      } else if (body.status === 'ACCEPTED') {
        var username = checkAndConstraints.uid(body.username);
        if (! username) {
          return next(messages.e(400, 'INVALID_USER_NAME'));
        }

        if (! checkAndConstraints.appToken(username)) {
          return next(messages.e(400, 'INVALID_DATA'));
        }

        const accessStateC = {
          status: 'ACCEPTED',
          username: body.username,
          token: body.token,
          code: 200
        };

        _setAccessState(res, next, key, accessStateC);
      }
    }, next);
  });
};

function _requestAccess(req: express$Request, res, next) {
  // FLOW We're assuming that body will be JSON encoded.
  const body: { [key: string]: ?string } = req.body; 

  accessCommon.requestAccess(body, function (accessState) {
    res.status(accessState.code).json(accessState);
  }, next);
}


function _setAccessState(res, next, key, accessState) {
  accessCommon.setAccessState(key, accessState, function (accessState) {
    if (accessState.code != null) res.status(accessState.code);

    res.json(accessState);
  }, function (errorMessage) {
    next(errorMessage);
  });
}