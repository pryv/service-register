'use strict';

var checkAndConstraints = require('../utils/check-and-constraints'),
    db = require('../storage/database'),
    messages = require('../utils/messages'),
    config = require('../utils/config');

/** Routes to discover server assignations.
 */
function discoverServerAssignations(app) {
  var domain = '.' + config.get('dns:domain');
  var aaservers_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
  var confirmDisplayErrorUrl = config.get('http:static:errorUrl');

  /** GET /:uid/server - find the server hosting the provided username (uid).
   */
  app.get('/:uid/server', function (req, res, next) {
    var uid = checkAndConstraints.uid(req.params.uid);

    if (! uid) {
      return res.redirect(confirmDisplayErrorUrl + '?id=INVALID_USER_NAME');
    }

    db.getServer(uid, function (error, result) {
      if (error) {
        return next(messages.ei());
      }

      if (!result) {
        return res.redirect(confirmDisplayErrorUrl + '?id=UNKNOWN_USER_NAME');
      }

      return res.redirect(aaservers_mode + '://' + result + '/?username=' + uid);
    });
  });

  /** POST /:uid/server - find the server hosting the provided username (uid)
   */
  app.post('/:uid/server', function (req, res, next) {
    var uid = checkAndConstraints.uid(req.params.uid);

    if (! uid) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    db.getServer(uid, function (error, result) {
      if (error) {
        return next(messages.ei());
      }
      if(!result) {
        return next(messages.e(404, 'UNKNOWN_USER_NAME'));
      }

      return res.status(200).json({server: result, alias: uid + domain });
    });
  });
}
 
module.exports = discoverServerAssignations;
