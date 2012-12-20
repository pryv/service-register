/**
 * Load index.html 
 * Redirect to register Home page
 */

var config = require('../utils/config');

module.exports = function(app){ 
  app.get('/', function(req, res, next){
    return res.redirect(config.get('http:static:url')); // good
  });
}