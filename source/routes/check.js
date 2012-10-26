//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');

function check(app) {

  app.get('/:uid/check', function(req, res,next){

    if (! checkAndConstraints.uid(req.params.uid)) 
      return next(messages.e(400,'INVALID_USER_NAME'));
    db.uidExists(req.params.uid,function(error, exists) {
      if (error) return next(messages.ei());
      res.json({exists: exists });
    });
  });

}

module.exports = check;