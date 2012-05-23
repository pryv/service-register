//init user creation 
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');
var config = require('../utils/config');

var dataservers = require('../network/dataservers.js');

var aaservers_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
var domain = "."+config.get('dns:domain');
var confirm_display_error_url = config.httpUrl('http:static')+"register/error.html";

//STEP 4
function save_to_db(host,json_infos,req,myres,next) {
  // logger.info("SaveToDB: "+ json_infos.userName  );
  db.setServerAndInfos(json_infos.userName, host.name, json_infos, function(error,result) {
    if (error) {
      logger.error("Confirm: save_to_db:"+error);
      return next(messages.ei());
    }
    myres({server: host.name, alias: json_infos.userName + domain},200);
  });
}

//STEP 3
function find_server(challenge,json_infos,req,myres,next) {
  //logger.info("Confirm: "+ json_result.userName + " challenge:"+challenge );
  //logger.info(JSON.stringify(json_result));
  dataservers.recommanded(req,function(error,host) {
    //logger.info("found server "+host.name +" for uid: "+ json_infos.userName + " challenge:"+challenge );

    dataservers.post_to_admin(host,"/register/create-user",201,json_infos,function(error,json_result) {
      if (error) {
        logger.error("Confirm: find_server:"+error);
        return next(messages.ei());
      }
      if (json_result.id) {
        json_infos.id = json_result.id;
        save_to_db(host,json_infos,req,myres,next);
      } else {
        logger.error("find_server, invalid data from admin server: "+JSON.stringify(json_result));
        return next(messages.ei());
      }

    });
    // call server to register user 
  });
}


//STEP 2
function check_uid(challenge,json_result,req,myres,next) {
  var userName = json_result.userName;
  //logger.info("check_uid: "+ json_result.userName + " challenge:"+challenge );
  //logger.info(JSON.stringify(json_result));
  db.getServer(userName, function(error, result) {
    if (error) return next(messages.ei()) ; 
    var alias = userName + domain;
    if (result) return next(messages.e(400,'ALREADY_CONFIRMED',{server: result, alias: alias})); // already confirmed
    find_server(challenge,json_result,req,myres,next);
  });
}


//STEP 1, check if request is valid == the challenge is token known
function pre_confirm(_challenge,req,myres,next) {
  var challenge = ck.challenge(_challenge);
  if (! challenge) return next(messages.e(400,'INVALID_CHALLENGE')); 

  db.getJSON(challenge +":init", function(error, json_result) {
    if (error) return next(messages.ei()) ; 
    if (! json_result) return next(messages.e(404,'NO_PENDING_CREATION')); 
    check_uid(challenge,json_result,req,myres,next);
  });
}



function init(app) {
//GET REQUESTS SEND REDIRECTS
  app.get('/:challenge/confirm', function(req, res,next){
    function my_next(error) {
      if (error instanceof messages.REGError) {
        if (error.data && error.data.server) {
           res.redirect(aaservers_mode+'://'+error.data.alias+'/?msg=CONFIRMED_ALREADY');
        } else {
           res.redirect(confirm_display_error_url+'?id='+error.data.id);
          return;
        }
      }
      next(error);
    }

    function jsonres(json) { // shortcut to get the result
      res.redirect(aaservers_mode+'://'+json.alias+'/?msg=CONFIRMED');
    }
   
    pre_confirm(req.params.challenge,req,jsonres,my_next);
  });

  //POST REQUEST SND JSON 
  app.post('/:challenge/confirm', function(req, res,next){
    function jsonres(json) { // shortcut to get the result
      res.json(json);
    }
    pre_confirm(req.params.challenge,req,jsonres,next);
  });
  
  //POST REQUEST SND JSON (hidden in documentation)
  app.post('/confirm_post', function(req, res,next){
    function jsonres(json) { // shortcut to get the result
      res.json(json);
    }
    pre_confirm(req.body.challenge,req,jsonres,next);
  });
}
module.exports = init;