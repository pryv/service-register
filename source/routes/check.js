//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');


function _check(req,res,next,raw) {
  var uid = checkAndConstraints.uid(req.params.uid);
  if (! uid)
    return next(messages.e(400,'INVALID_USER_NAME'));

  if (checkAndConstraints.uidReserved(uid)) {
    if (raw) {
      res.header('Content-Type', 'text/plain');
      res.send("false");
    } else {
      res.json({reserved: true, reason: 'RESERVED_USER_NAME' });
    }
  } else {
    db.uidExists(req.params.uid,function(error, exists) {
      if (error) return next(messages.ei());
      if (raw) {
        res.header('Content-Type', 'text/plain');
        res.send(exists ? "false" : "true");
      } else {
        res.json({reserved: exists });
      }
    });
  }
}

function check(app) {

 app.get('/:uid/check/available', function(req, res,next){
    _check(req,res,next,true);
  });


  app.get('/:uid/check', function(req, res,next){
    _check(req,res,next,false);
  });

}

module.exports = check;