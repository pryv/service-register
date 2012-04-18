// check if a UID exists
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var app_errors = require('../utils/app_errors.js');
var config = require('../utils/config');

function check(app) {

var domain = "."+config.get('dns:domain');

app.get('/:uid/server', function(req, res,next){

  if (! ck.uid(req.params.uid)) return next(messages.e(400,'INVALID_USER_NAME'));
  
  db.getServer(req.params.uid, function(error, result) {
    if (error) return next(messages.ei()) ; 
    if (result) return res.json({server: result, alias: req.params.uid+domain },200); // good
     return next(messages.e(404,'UNKOWN_USER_NAME'));
  });
});

}

module.exports = check;