var config = require('../utils/config'),
  _ = require('underscore'),
  appsList = config.get('appList'),
  messages = require('../utils/messages.js'),
  dataservers = require('../network/dataservers.js');

var infos = {
  version : '0.1.0',
  register : config.get('http:register:url'),
  access: 'https://access.' + config.get('dns:domain') + '/access',
  api: 'https://{username}.' +  config.get('dns:domain') + '/'
};

if (config.get('service:name')) {
  infos.name = config.get('service:name');
}

if (config.get('http:static:url')) {
  infos.home = config.get('http:static:url');
}

if (config.get('service:support')) {
  infos.support = config.get('service:support');
}

if (config.get('service:terms')) {
  infos.terms = config.get('service:terms');
}

/**
 * Routes that provide information about the service and its applications
 * @param app
 */
module.exports = function (app) {

  /**
   * GET /service/infos: retrieve service information (version, name, terms, register/access/api url, etc...)
   */
  app.get('/service/infos', function (req, res/*, next*/) {
    res.json(infos);
  });

  /**
   * GET /service/apps: retrieve the list of applications linked to this service
   */
  app.get('/service/apps', function (req, res) {
    var data = [];
    Object.keys(appsList).forEach(function(appid) {
      var appData = {id : appid};
      _.extend(appData, appsList[appid]);
      data.push(appData);
    });

    res.json({ apps: data });
  });

  /**
   * GET /service/apps/:appid: retrieve specific information about specified application
   */
  app.get('/service/apps/:appid', function (req, res, next) {
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
   * GET /service/hostings:  get the list of available hostings
   */
    app.get('/service/hostings', function (req, res) {
      res.json(dataservers.hostings());
    });
};