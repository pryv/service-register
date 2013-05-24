//init user creation
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var logger = require('winston');
var randGenerator = require('../utils/random.js');
var encryption = require('../utils/encryption.js');
var config = require('../utils/config');
var async = require('async');

module.exports = function (app) {

  // request pre processing
  app.post('/user', function (req, res, next) {
    if (req.body === undefined) {
      logger.error('/init : How could body be empty??');
      return next(messages.ei());
    }


    // TODO  check that it's an authorized url 

    var appid = checkAndConstraints.appID(req.body.appid);
    var hosting = checkAndConstraints.uid(req.body.hosting);
    var username = checkAndConstraints.uid(req.body.username);
    var password = checkAndConstraints.password(req.body.password);
    var email = checkAndConstraints.email(req.body.email);
    var lang = checkAndConstraints.lang(req.body.languageCode); // no check

    if (! appid) { return next(messages.e(400, 'INVALID_APPID')); }

    if (! username) { return next(messages.e(400, 'INVALID_USER_NAME')); }
    if (checkAndConstraints.uidReserved(username)) {
      return next(messages.e(400, 'RESERVED_USER_NAME'));
    }
    if (! email) { return next(messages.e(400, 'INVALID_EMAIL')); }
    if (! password) { return next(messages.e(400, 'INVALID_PASSWORD'));  }

    var existsList = [];

    async.parallel([
      function (callback) {  // test username
        db.uidExists(username, function (error, exists) {
          if (exists) { existsList.push('EXISTING_USER_NAME'); }
          callback(error);
        });
      },
      function (callback) {  // test email
        db.emailExists(email, function (error, exists) {
          if (exists) { existsList.push('EXISTING_EMAIL'); }
          callback(error);
        });
      },
      function (callback) { // check host
        //hosting.getServerForHosting(hosting); "continue here"
      }
    ], function (error) {
      if (existsList.length > 0) {
        return next(messages.ex(400, 'INVALID_DATA', existsList));
      }
      if (error) { return next(messages.ei(error)); }


      encryption.hash(password, function (errorEncryt, passwordHash) {
        if (error) { return next(messages.ei(errorEncryt)); }

        require('../utils/dump.js').inspect('INIT_DONE');
        res.send({id: 'INIT_DONE'});
      });
    });

  });

  // all check are passed, do the job
  function doInit(uid,passwordHash,email,lang,req,jsonres) {
    //logger.info('Init: '+ uid + ' pass:'+passwordHash + ' mail: '+ email);
    var challenge = randGenerator.string(16);

    // set on db
    db.initSet(uid,passwordHash,email,lang,challenge, function(error,result) {
      if (error) { return next(messages.ei()); }

      // add challenge string to chain tests
      if (config.get('test:init:add_challenge')) {
        return jsonres(messages.say('INIT_DONE',{captchaChallenge: challenge}));
      }

      return jsonres(messages.say('INIT_DONE'));
    });

    // send mail or not
    if (config.get('test:init:deactivate_mailer')) {
      logger.debug('init: deactivated mailer');
      return ;
    }
    logger.info('send mail: '+ uid + ' mail: '+ email);

    var url = config.get('http:register:url')+'/'+challenge+'/confirm';

    mailer.sendConfirm(uid,email,url,lang);
  }

};