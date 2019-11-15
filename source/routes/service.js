const config = require('../utils/config');
const _ = require('lodash');
const appsList = config.get('appList');
const messages = require('../utils/messages');
const dataservers = require('../utils/dataservers');

const info = config.get('service');
info.access = 'https://access.' + config.get('dns:domain') + '/access';
info.api = 'https://{username}.' +  config.get('dns:domain') + '/';

setConfig('serial', 'serial');
setConfig('register', 'http:register:url');
setConfig('home', 'http:static:url');
setConfig('event-types', 'eventTypes:sourceURL');



function setConfig(memberName, configPath) {
  const value = config.get(configPath);
  if(value)
    info[memberName] = value;
}

/**
 * Routes that provide information about the service and its applications
 * @param app
 */
module.exports = function (app) {

  /**
   * GET /service/info: retrieve service information
   * (version, name, terms, register/access/api url, etc...)
   */
  app.get('/service/info', function (req, res) {
    res.json(info);
  });

  // Old route, we keep it for backward compatibility
  // but we should remove it
  app.get('/service/infos', function (req, res) {
    res.json(info);
  });

  /**
   * GET /apps: retrieve the list of applications linked to this service
   */
  app.get('/apps', function (req, res) {
    var data = [];
    Object.keys(appsList).forEach(function(appid) {
      var appData = {id : appid};
      _.extend(appData, appsList[appid]);
      data.push(appData);
    });

    res.json({ apps: data });
  });

  /**
   * GET /apps/:appid: retrieve specific information about specified application
   */
  app.get('/apps/:appid', function (req, res, next) {
    var appid = req.params.appid;
    if (! appid) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'missing appid'}));
    }

    var appData = {id : appid};
    _.extend(appData, appsList[appid]);
    if (! appData) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'unkown appid : ' + appid}));
    }

    res.json({ app: appData });
  });

  /**
   * GET /hostings:  get the list of available hostings
   */
  app.get('/hostings', function (req, res) {
    res.json(dataservers.getHostings());
  });
};