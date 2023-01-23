/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
var info = require('../business/service-info');

/**
 * Load index.html, redirect to register Home page
 * @param app
 */
module.exports = function (app) {
  app.get('/', function (req, res) {
    return res.redirect(info.home);
  });
};
