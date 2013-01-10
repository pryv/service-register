// check if an EMAIL exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');

function check(app) {

app.get('/:email/check_email', function(req, res,next){

  if (! checkAndConstraints.email(req.params.email)) 
    return next(messages.e(400,'INVALID_EMAIL'));
 
  db.emailExists(req.params.email,function(error, exists) {
    if (error) return next(messages.ei());
    res.json({exists: exists });
  });
});

/**
 * get an userName for an email
 * TODO: validate the safety (privacy) of this call that exposes a link between an email and a user.
 */
app.get('/:email/uid', function(req, res,next) {
  if (! checkAndConstraints.email(req.params.email)) {
    return next(messages.e(400,'INVALID_EMAIL'));
  }

  db.getUIDFromMail(req.params.email, function(error, uid) {
    if (error) return next(messsages.ie()); 
    if (! uid) {
      return next(messages.e(404,'UNKOWN_EMAIL'));
    }
    return res.json({uid: uid});
  });
});

}

module.exports = check;