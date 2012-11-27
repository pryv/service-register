var logger = require('winston');
var config = require('../utils/config');
var dataservers = require('../network/dataservers.js');
var messages = require('../utils/messages.js');
var db = require('../storage/database.js');

var domain = '.'+config.get('dns:domain');

/**
 * 
 * @param host
 * @param json_infos
 * @param req
 * @param res
 * @param next
 */
exports.create = function create(host,json_infos,req,res,next) {
  dataservers.postToAdmin(host,'/register/create-user',201,json_infos,function(error,json_result) {
    if (error) {
      logger.error('Confirm: findServer: '+error+'\n host'+
          JSON.stringify(host)+'\n info:'+JSON.stringify(json_infos));
      return next(messages.ei());
    }
    if (json_result.id) {
      json_infos.id = json_result.id;
      saveToDB(host,json_infos,req,res,next);
    } else {
      logger.error('findServer, invalid data from admin server: '+JSON.stringify(json_result));
      return next(messages.ei());
    }

  });

}

function saveToDB(host,json_infos,req,res,next) {
//logger.info('SaveToDB: '+ json_infos.username  );
  db.setServerAndInfos(json_infos.username, host.name, json_infos, function(error,result) {
    if (error) {
      logger.error('Confirm: saveToDB:'+error);
      return next(messages.ei());
    }
    res({server: host.name, alias: json_infos.username + domain},200);
  });
}