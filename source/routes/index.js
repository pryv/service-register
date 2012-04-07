var config = require('../utils/config');
// This file left for reference, TODO: review and cleanup/remove

module.exports = index;

function index(app){ 
  var static_url = "http://"+ config.get('http:host_static') +":"+ config.get('http:port_static');

  app.get('/', function(req, res, next) { 
    //res.render('index', { title: 'Express' })
    res.redirect(static_url,301);
    console.log("redirected");
  });
  
  app.options('*', function(req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'authorization');
    
    next();
  });

};