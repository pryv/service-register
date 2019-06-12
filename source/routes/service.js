const config = require('../utils/config');
const _ = require('lodash');
const appsList = config.get('appList');
const messages = require('../utils/messages');
const dataservers = require('../utils/dataservers');

var infos = {
  version : '0.1.0',
  serial : '2019061301',
  access: 'https://access.' + config.get('dns:domain') + '/access',
  api: 'https://{username}.' +  config.get('dns:domain') + '/'
};

setConfig('register', 'http:register:url');
setConfig('name', 'service:name');
setConfig('home', 'http:static:url');
setConfig('support', 'service:support');
setConfig('terms', 'service:terms');
setConfig('event-types', 'eventTypes:sourceURL');

function setConfig(memberName, configPath) {
  const value = config.get(configPath);
  if(value)
    infos[memberName] = value;
}

/**
 * Routes that provide information about the service and its applications
 * @param app
 */
module.exports = function (app) {

  /**
   * GET /service/infos: retrieve service information
   * (version, name, terms, register/access/api url, etc...)
   */
  app.get('/service/infos', function (req, res/*, next*/) {
    res.json(infos);
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