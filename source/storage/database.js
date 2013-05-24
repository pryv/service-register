/*global require*/
//handle the database
var logger = require('winston');
var redis = require('redis').createClient();
var config = require('../utils/config');
var _s = require('underscore.string');
var async = require('async');
var semver = require('semver');

var exports = exports || {};

//redis error management
redis.on('error', function (err) {
  logger.error('Redis: ' + err.message);
});

var LASTEST_DB_VERSION = '0.1.1';
var DBVERSION_KEY = 'dbversion';
var dbversion = null;

var connectionChecked = require('readyness').waitFor('database');


//PASSWORD CHECKING
if (config.get('redis:password')) {
  redis.auth(config.get('redis:password'), function () {
    logger.info('Redis client authentified');
    checkConnection();
  });
} else {
  checkConnection();
}


function checkConnection() {
  //check redis connectivity
  // do not remove, 'wactiv.server' is use by tests
     
  async.series([
    function (nextStep) { // check db exits
   
      redis.set('wactiv:server', config.get('dns:domain'), function (error, result) {
        if (error) { return nextStep(error); }
        redis.set('wactiv@pryv.io:email', 'wactiv', function (error, result) {
          nextStep(error);
        });

      });
    },
    function (nextStep) { // get db version
      redis.get(DBVERSION_KEY, function(error, result) {
        if (error) { return nextStep(error); }
        dbversion = result;
        if (! dbversion) {
          dbversion = LASTEST_DB_VERSION;
          logger.info('database init to version :' + dbversion);
          redis.set(DBVERSION_KEY, dbversion, nextStep);
        } else {
          nextStep();
        }
      });
    },
    function (nextStep) { // update db to version 1
      if (semver.lt(dbversion, LASTEST_DB_VERSION)) { return nextStep(); }
      // convert all users to hashes
      logger.info('updating db to version :' + LASTEST_DB_VERSION);

      //doOnKeysMatching('*:infos',function(),done);

      nextStep();
    }
  ],
    function (error, results) {
      if (error) {
        logger.error("DB not available",error);
        throw error;
      } else {
        connectionChecked('Redis');
      }
    }
  );
}



//Generic
function emailExists(email, callback) {
  email = email.toLowerCase();
  redis.exists(email + ':email', function (error, result) {
    if (error) { logger.error('Redis emailExists: ' + email + ' e: ' + error, error); }
    callback(error, result === 1); // callback anyway
  });
}
exports.emailExists = emailExists;

function uidExists(uid, callback) {
  uid = uid.toLowerCase();
  redis.exists(uid + ':server', function (error, result) {
    if (error) { logger.error('Redis to uidExists: ' + uid +' e: ' + error, error); }
    callback(error, result === 1); // callback anyway
  });
}
exports.uidExists = uidExists;

function getJSON(key, callback) {
  redis.get(key, function (error, result) {
    var res_json = null;
    if (error) { logger.error('Redis getJSON: ' + key + ' e: ' + error, error); }
    if (! result) { return callback(error, res_json); }
    try {
      res_json = JSON.parse(result);
    } catch (e) {
      error = new Error(e + ' db.getJSON:(' + key + ') string (' + result + ')is not JSON');
    }
    return callback(error, res_json);
  });
}
exports.getJSON = getJSON;

//Specialized

exports.initSet = function initSet(uid, passwordHash, email, language, challenge, callback) {
  var multi = redis.multi();
  var value = {username: uid, passwordHash: passwordHash, email: email, language: language};
  var key = challenge + ':init';
  multi.set(key, JSON.stringify(value));
  multi.expire(key, config.get('persistence:init-ttl'));
  multi.exec(function (error, result) {
    if (error) logger.error('Redis initSet: '+ uid +' e: '+ error, error);
    callback(error, result); // callback anyway
  });
}

exports.getServer = function getServer(uid, callback) {
  uid = uid.toLowerCase();
  redis.get(uid +':server',function (error, result) {
    if (error) logger.error('Redis getServer: '+ uid +' e: '+ error, error);
    callback(error, result);
  });
}

exports.setServer = function setServer(uid, serverName, callback) {
  uid = uid.toLowerCase();
  redis.set(uid +':server',serverName,function (error, result) {
    if (error) logger.error('Redis setServer: '+ uid +' -> '+serverName+' e: '+ error, error);
    callback(error, result);
  });
}


/**
 * "search into keys"
 * @param keyMask  '*:...'
 * @param action function (key)
 * @param done function (error,count) called when done ..  with the count of "action" sent
 */
function doOnKeysMatching(keyMask, action, done) {
  redis.keys(keyMask, function (error,replies) {
    if (error) {
      logger.error('Redis getAllKeysMatchingValue: '+ keyMask+' e: '+ error, error);
      return  done(error,0);
    }
    var i;
    for (i = 0, len = replies.length; i < len; i++) {
      action(replies[i]);
    }
    done(null,i);
  });
};
exports.doOnKeysMatching = doOnKeysMatching;


/**
 * "search into values "
 * @param keyMask
 * @param valueMask .. a string for now.. TODO a regexp
 * @param done function (error) called when done ..
 */
exports.doOnKeysValuesMatching = function doOnKeysValuesMatching(keyMask, valueMask, action, done) {

  var receivedCount = 0;
  var actionThrown = 0;
  var waitFor = -1;

  var checkDone = function () {
    if (waitFor > 0 && waitFor == receivedCount) done() ;
  };

  var myDone = function (error,count) {
    waitFor = count;
    checkDone();
  };



  doOnKeysMatching(keyMask,
    function (key) {
      redis.get(key, function (error,result) {
        if (error) {
          logger.error('doOnKeysValuesMatching: '+ keyMask+' '+valueMask+' e: '+ error, error);
        } else {
          if (valueMask == "*" || valueMask == result) {
            action(key,result);
            actionThrown++;
          }
        }
        receivedCount++;
        checkDone();
      });
    }
    , myDone);
}




exports.getUIDFromMail = function getUIDFromMail(mail, callback) {
  mail = mail.toLowerCase();
  redis.get(mail +':email',function (error, uid) {
    if (error) logger.error('Redis getServerFromMail: '+ mail +' e: '+ error, error);
    return callback(null,uid);
  });
}

exports.setServerAndInfos = function setServerAndInfos(uid, server, infos ,callback) {
  uid = uid.toLowerCase();
  var multi = redis.multi();
  multi.set(uid +':infos', JSON.stringify(infos));
  multi.set(uid +':server', server);
  multi.set(infos.email +':email', uid);
  multi.exec(function (error, result) {
    if (error) logger.error('Redis setServerAndInfos: '+ uid +' e: '+ error, error);
    callback(error, result); // callback anyway
  });
}

/**
 *
 * @param uid
 * @param email
 * @param callback function (error) error is null if successfull;
 */
exports.changeEmail = function changeEmail(uid, email, callback) {
  // check that email does not exists
  email = email.toLowerCase();
  uid = uid.toLowerCase();
  redis.get(email +':email',function (error1,email_uid) {
    if (error1) return callback(error1);
    if (email_uid == uid) {
      logger.debug('trying to update an e-mail to the same value '+uid+' '+email);
      return callback(null);
    }

    if (email_uid != null)
      return callback(new Error('Cannot set e-mail: '+email+' it\'s already used'));


    // get infos string
    getJSON(uid+':infos', function (error2,infos) {
      if (error2) return callback(error2);
      if (! infos) infos = {};
      infos.email = email;

      var multi = redis.multi();
      multi.set(uid +':infos', JSON.stringify(infos));
      multi.set(infos.email +':email', uid);
      multi.exec(function (error3, result) {
        if (error3) logger.error('Redis changeEmail: '+ uid +'email: '+email+' e: '+ error3, error3);
        callback(error3);
      });
    });
  });
}

//------------------ access management ------------//


exports.setAccessState = function setAccessState(key, value, callback) {
  var multi = redis.multi();
  var dbkey = key+':access';
  multi.set(dbkey, JSON.stringify(value));
  multi.expire(dbkey, config.get('persistence:access-ttl'));
  multi.exec(function (error, result) {
    if (error) logger.error('Redis setAccess: '+ key +' '+value+' e: '+ error, error);
    callback(error, result); // callback anyway
  });
}

exports.getAccessState = function getAccessState(key, callback) {
  getJSON(key+':access', callback);
}


