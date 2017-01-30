var config = require('../utils/config');

// Load index.html, redirect to register Home page

module.exports = function(app) {
  app.get('/', function(req, res) {
    return res.redirect(config.get('http:static:url'));
  });
};