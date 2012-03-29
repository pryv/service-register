// init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');

var dataservers = require('../network/dataservers.js');

// STEP 3

// STEP 2
function do_confirm(challenge,req,res,next) {
  logger.info("Confirm: "+ uid + " challenge:"+challenge );
 
  db.getServer(uid, function(error, result) {
    if (error) return message.internal(res) ; 
    if (result) return res.json({server: result},400); // already confirmed
    do_confirm(uid,challenge,req,res,next);
  });
  
  
}


// STEP 1, check if request is valid the challenge token known
function pre_confirm(_challenge,req,res,next) {
  var challenge = ck.challenge(_challenge);
  if (! challenge) return res.json(message.error('INVALID_CHALLENGE'),400); 
  
  db.getJSON("init:"+challenge, function(error, json_result) {
    if (error) return message.internal(res) ; 
    if (! json_result) return res.json(messages.error('NO_PENDING_CREATION'),404); 
    
    // check json_result structure
    
    console.log("JSON: "+ json_result);
  });
  
 
}


// register to express
function init(app) {
app.get('/:challenge/confirm', function(req, res,next){
    pre_init(req.params.challenge,req,res);
});

app.post('/confirm_post', function(req, res,next){
     pre_init(req.body.challenge,req,res);
});
}
module.exports = init;