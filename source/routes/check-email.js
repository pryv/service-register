// check if an EMAIL exists
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');

function check(app) {

app.get('/:email/check_email', function(req, res,next){

  if (! ck.email(req.params.email)) return next(messages.e(400,'INVALID_EMAIL'));
 
  db.emailExists(req.params.email,function(error, exists) {
    if (error) return next(messages.ei());
    res.json({exists: exists });
  });
});

}

module.exports = check;