// frameworks
var express = require('express');
var logger = require('winston');
var fs = require('fs');

// Dependencies
var config = require('./utils/config');
var messages = require('./utils/messages');

// static server 

var app ;
// https server
if (config.get('http:static:ssl')) {
  var privateKey = fs.readFileSync('cert/privatekey.pem').toString();
  var certificate = fs.readFileSync('cert/certificate.pem').toString();
  app = express.createServer({key: privateKey, cert: certificate});
} else {
  app = express.createServer();
}

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});

app.get('*', function(req, res, next){
  console.log(req.url);
  next();
});

require('./routes_static/register-config')(app);
require('./routes_static/index')(app);

readyListening = require('readyness').waitFor('app_static:listening');
app.listen(config.get('http:static:port'), config.get('http:static:ip'), function() {
  var address = app.address();
  readyListening('Static server listening on '+ config.httpUrl('http:static')+
      ' in '+app.settings.env+' mode');
});
