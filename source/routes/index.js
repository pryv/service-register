var info = require('../utils/service-info');

/**
 * Load index.html, redirect to register Home page
 * @param app
 */
module.exports = function(app) {
  app.get('/', function(req, res) {
    return res.redirect(info.home);
  });
};