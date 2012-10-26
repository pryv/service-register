/**
 * private route for servers to change e-mails
 */
//check if a UID exists
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var dataservers = require('../network/dataservers.js');

function check(app) {

  app.post('/:uid/email/admin', function(req, res,next){
    //TODO add authorization checking

    var uid = ck.uid(req.params.uid);
    if (! uid) return next(messages.e(400,'INVALID_USER_NAME'));

    var email = ck.email(req.body.email);
    if (! email) return next(messages.e(400,'INVALID_EMAIL'));

    db.uidExists(req.params.uid,function(error, exists) {
      if (error) return next(messages.ei());
      if (! exists) return next(messages.e(404,'UNKOWN_USER_NAME'));

      db.changeEmail(uid,email, function(error) {
        if (error) return next(message.ei());
        res.json({success: true});
      });
    });

  });

}

module.exports = check;