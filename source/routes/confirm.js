// init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');

var dataservers = require('../network/dataservers.js');

// STEP 3

// STEP 2
function do_confirm(uid,challenge,req,res,next) {
  logger.info("Confirm: "+ uid + " challenge:"+challenge );
 
  db.getJSON(uid+":init", function(error, json_result) {
    if (error) return message.internal(res) ; 
    if (! json_result) return res.json(messages.error('NO_PENDING_CREATION'),404); 
    
    console.log("JSON: "+ json_result);
  });
}


// STEP 1, check if request is valid or user already confirmed
function pre_confirm(uid,req,res,next) {
  var uid = ck.uid(uid);
  if (! uid) return res.json(message.error('INVALID_USER_NAME'),400);
  var challenge = ck.challenge(req.body.challenge);
  if (! challenge) return res.json(message.error('INVALID_CHALLENGE'),400); 
  
  db.getServer(uid, function(error, result) {
    if (error) return message.internal(res) ; 
    if (result) return res.json({server: result},400); // already confirmed
    do_confirm(uid,challenge,req,res,next);
  });
}


// register to express
function init(app) {
app.get('/:uid/confirm', function(req, res,next){
    pre_init(req.params.uid,req,res);
});

app.post('/:uid/confirm', function(req, res,next){
     pre_init(req.params.uid,req,res);
});
}
module.exports = init;