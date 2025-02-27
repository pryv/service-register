/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const _ = require('lodash');
const appsList = require('../config').get('appList');
const messages = require('../utils/messages');
const dataservers = require('../business/dataservers');

const info = require('../business/service-info');

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
    const data = [];
    Object.keys(appsList).forEach(function (appid) {
      const appData = { id: appid };
      _.extend(appData, appsList[appid]);
      data.push(appData);
    });

    res.json({ apps: data });
  });

  /**
   * GET /apps/:appid: retrieve specific information about specified application
   */
  app.get('/apps/:appid', function (req, res, next) {
    const appid = req.params.appid;
    if (!appid) {
      return next(
        messages.e(400, 'INVALID_DATA', { message: 'missing appid' })
      );
    }

    const appData = { id: appid };
    _.extend(appData, appsList[appid]);
    if (!appData) {
      return next(
        messages.e(400, 'INVALID_DATA', { message: 'unknown appid : ' + appid })
      );
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
