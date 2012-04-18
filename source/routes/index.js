var config = require('../utils/config');
// This file left for reference, TODO: review and cleanup/remove

module.exports = index;

function index(app){ 
  var static_url = "http://"+ config.get('http:static_host') +":"+ config.get('http:static_port');

  app.get('/', function(req, res, next) { 
    res.redirect(static_url,301);
  });
  
  app.options('*', function(req, res, next) {
    console.log("OPTIONS "+ req.url);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

};