// check if an EMAIL exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');

function check(app) {

app.get('/hostings', function(req, res,next){

  if (! checkAndConstraints.email(req.params.email)) 
    return next(messages.e(400,'INVALID_EMAIL'));
 
  db.emailExists(req.params.email,function(error, exists) {
    if (error) return next(messages.ei());
    res.json({exists: exists });
  });
});

}

module.exports = check;