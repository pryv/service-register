var _ = require('underscore');
var appsList = require('../apps/apps-data.json');
var messages = require('../utils/messages.js');


module.exports =  function (app) {

  /**
   * This single request is cached one hour
   */
  app.get('/apps', function (req, res) {
    res.setHeader('Cache-Control', 'max-age=3600');

    var data = [];
    Object.keys(appsList).forEach(function(appid) {
      var appData = {id : appid};
      _.extend(appData, appsList[appid]);
      data.push(appData);
    });

    res.json({ apps: data });
  });


  app.get('/apps/:appid', function (req, res, next) {
    if (! req.params.appid) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'missing appid'}));
    }
    var appid = req.params.appid;

    var appData = {id : appid};
    _.extend(appData, appsList[appid]);
    if (! appData) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'unkown appid : ' + appid}));
    }

    res.json({ app: appData });
  });
};