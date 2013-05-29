//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var config = require('../utils/config');

function check(app) {

  var domain = '.' + config.get('dns:domain');

  var aaservers_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
  var confirmDisplayErrorUrl = config.get('http:static:errorUrl');

  app.get('/:uid/server', function (req, res, next) {

    if (! checkAndConstraints.uid(req.params.uid)) {
      return  res.redirect(confirmDisplayErrorUrl + '?id=INVALID_USER_NAME');
    }

    db.getServer(req.params.uid, function (error, result) {
      if (error) { return next(messages.ie()); }
      if (result) {   // good
        return res.redirect(aaservers_mode + '://' + result + '/?username=' + req.params.uid);
      }

      return res.redirect(confirmDisplayErrorUrl + '?id=UNKOWN_USER_NAME');
    });
  });


  app.post('/:uid/server', function (req, res, next) {

    if (! checkAndConstraints.uid(req.params.uid)) {
      return next(messages.e(400, 'INVALID_USER_NAME'));
    }

    db.getServer(req.params.uid, function (error, result) {
      if (error) { return next(messages.ei()); }
      if (result) { return res.json({server: result, alias: req.params.uid + domain }, 200); }//good
      return next(messages.e(404, 'UNKOWN_USER_NAME'));
    });
  });

}

module.exports = check;