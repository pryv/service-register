// init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');


// all check are passed, do the job
function do_init(uid,password,email,lang,req,res) {
  logger.info("Init: "+ uid + " pass:"+password + " mail: "+ email);
  var challenge = "ABCDEF";
  db.initSet(uid,password,email,lang,challenge, function(error,result) {
    if (error) return messages.internal(res); 
    res.json({captchaChallenge: challenge});
  });
}



function init(app) {

// request pre processing
app.post('/init', function(req, res,next){
  var uid = ck.uid(req.body.userName);
  var password = ck.password(req.body.password);
  var email = ck.email(req.body.email);
  var lang = ck.lang(req.body.langCode); // no check
  
  var errors = new Array();
  var tests = 1;
  
  function test_done(title) {
   tests--;
    if (tests <= 0) {
      if (errors.length > 0) return next(messages.ex(400,'INVALID_DATA',errors));
      do_init(uid,password,email,lang,req,res,next);
    }
  }
  
  // test input
  if (! uid) errors.push('INVALID_USER_NAME');
  else {
    tests++;
    db.uidExists(uid, function(error, exists) {
      if (error) return next(messages.ei());
      if (exists) errors.push('EXISTING_USER_NAME');
      test_done();
    });
  }
  if (password == null) errors.push('INVALID_PASSWORD');
  if (email == null) errors.push('INVALID_EMAIL');
  test_done();
});


}
module.exports = init;