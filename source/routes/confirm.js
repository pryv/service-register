//init user creation 
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');
var config = require('../utils/config');

var dataservers = require('../network/dataservers.js');

var aaservers_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
var domain = '.'+config.get('dns:domain');
var confirmDisplayErrorUrl = config.get('http:static:url')+config.get('http:static:error_page');


function init(app) {
//GET REQUESTS SEND REDIRECTS
  app.get('/:challenge/confirm', function(req, res,next){
    function my_next(error) {
      if (error instanceof messages.REGError) {
        if (error.data && error.data.server) {
          res.redirect(aaservers_mode+'://'+error.data.alias+'/?msg=CONFIRMED_ALREADY');
          return;
        } 
        return res.redirect(confirmDisplayErrorUrl+'?id='+error.data.id);

      }
      logger.error('CONFIRM my_next: '+error.stack);
      next(error);
    }

    function jsonres(json) { // shortcut to get the result
      res.redirect(aaservers_mode+'://'+json.alias+'/?msg=CONFIRMED');
    }

    preConfirm(req.params.challenge,req,jsonres,my_next);
  });

  //POST REQUEST SND JSON 
  app.post('/:challenge/confirm', function(req, res,next){
    function jsonres(json) { // shortcut to get the result
      res.json(json);
    }
    preConfirm(req.params.challenge,req,jsonres,next);
  });

  //POST REQUEST SND JSON (hidden in documentation)
  app.post('/confirm_post', function(req, res,next){
    function jsonres(json) { // shortcut to get the result
      res.json(json);
    }
    preConfirm(req.body.challenge,req,jsonres,next);
  });
}



//STEP 1, check if request is valid == the challenge is token known
function preConfirm(_challenge,req,myres,next) {
  var challenge = checkAndConstraints.challenge(_challenge);
  if (! challenge) return next(messages.e(400,'INVALID_CHALLENGE')); 

  db.getJSON(challenge +':init', function(error, json_result) {
    if (error) return next(messages.ei()) ; 
    if (! json_result) return next(messages.e(404,'NO_PENDING_CREATION')); 
    checkUid(challenge,json_result,req,myres,next);
  });
}




//STEP 2
function checkUid(challenge,json_result,req,myres,next) {
  var userName = json_result.userName;
//logger.info('check_uid: '+ json_result.userName + ' challenge:'+challenge );
//logger.info(JSON.stringify(json_result));
  db.getServer(userName, function(error, result) {
    if (error) return next(messages.ei()) ; 
    var alias = userName + domain;
    if (result) return next(messages.e(400,'ALREADY_CONFIRMED',{server: result, alias: alias})); // already confirmed
    findServer(challenge,json_result,req,myres,next);
  });
}


//STEP 3
function findServer(challenge,json_infos,req,myres,next) {
//logger.info('Confirm: '+ json_result.userName + ' challenge:'+challenge );
//logger.info(JSON.stringify(json_result));
  dataservers.recommanded(req,function(error,host) {
    //logger.info('found server '+host.name +' for uid: '+ json_infos.userName + ' challenge:'+challenge );

    dataservers.postToAdmin(host,'/register/create-user',201,json_infos,function(error,json_result) {
      if (error) {
        logger.error('Confirm: findServer: '+error+'\n host'+
            JSON.stringify(host)+'\n info:'+JSON.stringify(json_infos));
        return next(messages.ei());
      }
      if (json_result.id) {
        json_infos.id = json_result.id;
        saveToDB(host,json_infos,req,myres,next);
      } else {
        logger.error('findServer, invalid data from admin server: '+JSON.stringify(json_result));
        return next(messages.ei());
      }

    });
    // call server to register user 
  });
}


//STEP 4
function saveToDB(host,json_infos,req,myres,next) {
//logger.info('SaveToDB: '+ json_infos.userName  );
  db.setServerAndInfos(json_infos.userName, host.name, json_infos, function(error,result) {
    if (error) {
      logger.error('Confirm: saveToDB:'+error);
      return next(messages.ei());
    }
    myres({server: host.name, alias: json_infos.userName + domain},200);
  });
}




module.exports = init;