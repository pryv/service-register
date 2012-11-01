var config = require('../utils/config');
var console = require('winston');
// This file left for reference, TODO: review and cleanup/remove

module.exports = index;

function index(app){ 
  app.options('*', function(req, res, next) {
    console.debug('OPTIONS '+req.method+" "+ req.url);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

};