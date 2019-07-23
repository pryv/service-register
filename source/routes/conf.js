// @flow

const config = require('../utils/config');

/**
 * Routes for handling centralized configuration
 */
module.exports = function (app: any) {
  // GET /conf/core: get configuration for a core
  app.get('/conf/core', function (req, res) {
    const coreConf = config.get('coreConf');
    res.json(coreConf);
  });
};
