// init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');

var dataservers = require('../network/dataservers.js');

// STEP 3

// STEP 2
function do_confirm(uid,challenge,req,res) {
  logger.info("Confirm: "+ uid + " challenge:"+challenge );
 
  db.getJSON(uid+":init", function(error, json_result) {
    if (error) { message.internal(res) ; return ;} 
    if (! json_result) { res.json(messages.error('NO_PENDING_CREATION'),404); return; }
    
    console.log("JSON: "+ json_result);
  });
}


// STEP 1, check if request is valid or user already confirmed
function pre_confirm(uid,req,res) {
  var uid = ck.uid(uid);
  if (! uid) { res.json(message.error('INVALID_USER_NAME'),400); return; }
  var challenge = ck.challenge(req.body.challenge);
  if (! challenge) { res.json(message.error('INVALID_CHALLENGE'),400); return; }
  
  db.getServer(uid, function(error, result) {
    if (error) { message.internal(res) ; return ;} 
    if (result) res.json({server: result},400); // already confirmed
    else do_confirm(uid,challenge,req,res);
  });
}


// register to express
function init(app) {
app.get('/:uid/confirm', function(req, res){
    pre_init(req.params.uid,req,res);
});

app.post('/:uid/confirm', function(req, res){
     pre_init(req.params.uid,req,res);
});
}
module.exports = init;