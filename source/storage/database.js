// handle the database
var logger = require('winston');
var redis = require('redis').createClient();
var config = require('../utils/config');


// check redis connectivity
redis.set('hello','world', function(error, result) {
  if (error) console.log('Error: '+ error);
    else {
      if (error) 
        logger.error('Failed to connect redis database: '+ error, error);
      else
        logger.info('Connected to redis database: '+ result);
     }
});

// Generic

function uidExists(uid,callback) {
  uid = uid.toLowerCase();
  redis.exists(uid,function(error, result) {
    if (error) logger.error('Redis to uidExists: '+ uid +' e: '+ error, error);
    callback(error, result == 1); // callback anyway
  });
}
exports.uidExists = uidExists;

function getJSON(key, callback) {
  redis.get(key,function(error, result) {
    if (error) logger.error('Redis getJSON: '+ key +' e: '+ error, error);
    if (! result) callback(error, null);
    callback(error, JSON.parse(result)); 
  });
}
exports.getJSON = getJSON;

// Specialized

exports.initSet = function initSet(uid, password, email, language, challenge, callback) {
  var multi = redis.multi();
  var value = {userName: uid, password: password, email: email, language: language};
  var key = challenge+":init";
  multi.set(key, JSON.stringify(value));
  multi.expire(key, config.get('persistence:init-ttl'));
  multi.exec(function(error, result) {
    if (error) logger.error('Redis initSet: '+ uid +' e: '+ error, error);
      callback(error, result); // callback anyway
  });
}


exports.getServer = function getServer(uid, callback) {
  redis.get(uid +":server",function(error, result) {
    if (error) logger.error('Redis getServer: '+ uid +' e: '+ error, error);
    callback(error, result); 
  });
}


exports.setServerAndInfos = function setServerAndInfos(uid, server, infos ,callback) {
  var multi = redis.multi();
  multi.set(uid +":infos", JSON.stringify(infos));
  multi.set(uid +":server", server);
  multi.exec(function(error, result) {
    if (error) logger.error('Redis setServerAndInfos: '+ uid +' e: '+ error, error);
      callback(error, result); // callback anyway
  });
}

