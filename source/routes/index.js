var config = require('../utils/config');
// This file left for reference, TODO: review and cleanup/remove

module.exports = index;

function index(app){ 
  
  app.options('*', function(req, res, next) {
    console.log('OPTIONS '+ req.url);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

};