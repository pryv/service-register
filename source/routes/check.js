//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');

function check(app) {

  app.get('/:uid/check', function(req, res,next){
    var uid = checkAndConstraints.uid(req.params.uid);
    if (! uid)
      return next(messages.e(400,'INVALID_USER_NAME'));

    if (checkAndConstraints.uidReserved(uid)) {
      res.json({reserved: true, reason: 'RESERVED_USER_NAME' });
    } else {
      db.uidExists(req.params.uid,function(error, exists) {
        if (error) return next(messages.ei());
        res.json({reserved: exists });
      });
    }
  });

}

module.exports = check;