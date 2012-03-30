// init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');

var dataservers = require('../network/dataservers.js');


// STEP 4
function save_to_db(host,json_infos,req,res,next) {
   // logger.info("SaveToDB: "+ json_infos.userName  );
    db.setServerAndInfos(json_infos.userName, host.name, json_infos, function(error,result) {
      if (error) {
        logger.error(error);
        return next(messages.ei());
      }
      res.json({server: host.name},200);
    });
}

// STEP 3
function find_server(challenge,json_infos,req,res,next) {
  //logger.info("Confirm: "+ json_result.userName + " challenge:"+challenge );
  //logger.info(JSON.stringify(json_result));
  dataservers.recommanded(req,function(error,host) {
      //logger.info("found server "+host.name +" for uid: "+ json_infos.userName + " challenge:"+challenge );
     
      dataservers.post_to_admin(host,"/register/create-user",201,json_infos,function(error,json_result) {
         if (error) {
             logger.error(error);
             return next(messages.ei());
         }
         if (json_result.id) {
             json_infos.id = json_result.id;
             save_to_db(host,json_infos,req,res,next);
         } else {
             logger.error("find_server, invalid data from admin server: "+JSON.stringify(json_result));
             return next(messages.ei());
         }
         
      });
      // call server to register user 
  });
}


// STEP 2
function check_uid(challenge,json_result,req,res,next) {
  //logger.info("check_uid: "+ json_result.userName + " challenge:"+challenge );
  //logger.info(JSON.stringify(json_result));
  db.getServer(json_result.userName, function(error, result) {
    if (error) return next(messages.ei()) ; 
    if (result) return res.json(messages.say('ALREADY_CONFIRMED',{server: result}),400); // already confirmed
    find_server(challenge,json_result,req,res,next);
  });
}


// STEP 1, check if request is valid == the challenge is token known
function pre_confirm(_challenge,req,res,next) {
  var challenge = ck.challenge(_challenge);
  if (! challenge) return next(messages.e(400,'INVALID_CHALLENGE')); 
  db.getJSON(challenge +":init", function(error, json_result) {
    if (error) return next(messages.ei()) ; 
    if (! json_result) return  next(messages.e(404,'NO_PENDING_CREATION')); 
    check_uid(challenge,json_result,req,res,next);
  });
}


// register to express
function init(app) {
app.get('/:challenge/confirm', function(req, res,next){
    pre_confirm(req.params.challenge,req,res,next);
});

app.post('/confirm_post', function(req, res,next){
     pre_confirm(req.body.challenge,req,res,next);
});
}
module.exports = init;