/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const info = require('../business/service-info');

/**
 * Load index.html, redirect to register Home page
 * @param app
 */
module.exports = function (app) {
  app.get('/', function (req, res) {
    return res.redirect(info.home);
  });
};
