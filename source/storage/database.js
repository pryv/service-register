//handle the database
var logger = require('winston');
var redis = require('redis').createClient();
var config = require('../utils/config');
var _s = require('underscore.string');





var connectionChecked = require('readyness').waitFor('database');
function checkConnection() {
  //check redis connectivity
  // do not remove, "wactiv.server" is use by tests
  redis.set('wactiv:server','rec.la', function(error, result) {
    if (error)
      logger.error('Failed to connect redis database: '+ error, error);
    else {
      redis.set('wactiv@pryv.io:email','wactiv', function(error, result) {
        connectionChecked('Redis');
      });
    }
  });
}

// PASSWORD CHECKING
if (config.get("redis:password")) {
  redis.auth(config.get("redis:password"), function() {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  checkConnection();
}


//Generic
function emailExists(email,callback) {
  email = email.toLowerCase();
  redis.exists(email+":email",function(error, result) {
    if (error) logger.error('Redis emailExists: '+ email +' e: '+ error, error);
    callback(error, result == 1); // callback anyway
  });
}
exports.emailExists = emailExists;

function uidExists(uid,callback) {
  uid = uid.toLowerCase();
  redis.exists(uid+":server",function(error, result) {
    if (error) logger.error('Redis to uidExists: '+ uid +' e: '+ error, error);
    callback(error, result == 1); // callback anyway
  });
}
exports.uidExists = uidExists;

function getJSON(key, callback) {
  redis.get(key,function(error, result) {
    if (error) logger.error('Redis getJSON: '+ key +' e: '+ error, error);
    if (! result) return callback(error, null);
    try {
      var res_json = JSON.parse(result);
      return callback(error, res_json);
    } catch (e) {
      return callback(new Error("string is not JSON"), result);
    }
    return callback(error, result); // should not be there

  });
}
exports.getJSON = getJSON;

//Specialized

exports.initSet = function initSet(uid, passwordHash, email, language, challenge, callback) {
  var multi = redis.multi();
  var value = {userName: uid, passwordHash: passwordHash, email: email, language: language};
  var key = challenge+":init";
  multi.set(key, JSON.stringify(value));
  multi.expire(key, config.get('persistence:init-ttl'));
  multi.exec(function(error, result) {
    if (error) logger.error('Redis initSet: '+ uid +' e: '+ error, error);
    callback(error, result); // callback anyway
  });
}


exports.getServer = function getServer(uid, callback) {
  uid = uid.toLowerCase();
  redis.get(uid +":server",function(error, result) {
    if (error) logger.error('Redis getServer: '+ uid +' e: '+ error, error);
     callback(error, result);
  });
}

exports.setServerAndInfos = function setServerAndInfos(uid, server, infos ,callback) {
  uid = uid.toLowerCase();
  var multi = redis.multi();
  multi.set(uid +":infos", JSON.stringify(infos));
  multi.set(uid +":server", server);
  multi.set(infos.email +":email", uid);
  multi.exec(function(error, result) {
    if (error) logger.error('Redis setServerAndInfos: '+ uid +' e: '+ error, error);
    callback(error, result); // callback anyway
  });
}

/**
 *
 * @param uid
 * @param email
 * @param callback function(error) error is null if successfull;
 */
exports.changeEmail = function changeEmail(uid, email, callback) {
  // check that email does not exists
  email = email.toLowerCase();
  uid = uid.toLowerCase();
  redis.get(email +":email",function(error1,email_uid) {
    if (error1) return callback(error1);
    if (email_uid == uid) {
      logger.debug("trying to update an e-mail to the same value "+uid+" "+email);
      return callback(null);
    }

    if (email_uid != null)
      return callback(new Error("Cannot set e-mail: "+email+" it's already used"));


    // get infos string
    getJSON(uid+":infos", function(error2,infos) {
      if (error2) return callback(error2);
      if (! infos) infos = {};
      infos.email = email;

      var multi = redis.multi();
      multi.set(uid +":infos", JSON.stringify(infos));
      multi.set(infos.email +":email", uid);
      multi.exec(function(error3, result) {
        if (error3) logger.error('Redis changeEmail: '+ uid +'email: '+email+' e: '+ error3, error3);
        callback(error3);
      });
    });
  });
}
