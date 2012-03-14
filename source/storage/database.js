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

function uidExists(uid,callback) {
  uid = uid.toLowerCase();
  redis.exists(uid,function(error, result) {
    if (error) logger.error('Redis to uidExists: '+ uid +' e: '+ error, error);
    callback(error, result == 1); // callback anyway
  });
}

function initSet(uid, password, email, lang, challenge, callback) {
  var multi = redis.multi();
  var value = {password: password, email: email, challenge: challenge, lang: lang};
  var key = 'init-'+ uid.toLowerCase();
  multi.set(key, JSON.stringify(value));
  multi.expire(key, config.get('persistence:init-ttl'));
  multi.exec(function(error, result) {
    if (error) logger.error('Redis initSet: '+ uid +' e: '+ error, error);
      callback(error, result); // callback anyway
  });
}

exports.uidExists = uidExists;
exports.initSet = initSet;