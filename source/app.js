// frameworks
var express = require('express');
var logger = require('winston');
var fs = require('fs');

// Dependencies
var config = require('./utils/config');
var messages = require('./utils/messages');


// workarround to detect if a String is not JSON
express.bodyParser.parse['application/json'] = function(req, options, fn){
  var buf = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk){ buf += chunk });
  req.on('end', function(){
    try {
      req.body = buf.length
        ? JSON.parse(buf)
        : {};
      fn();
    } catch (err){
      //logger.debug('INVALID_JSON_REQUEST '+buf);
      fn(messages.e(400,'INVALID_JSON_REQUEST',{received: buf}));
    }
  });
};


var app;
// https server
if (config.get('http:register_ssl')) {
  var privateKey = fs.readFileSync('cert/privatekey.pem').toString();
  var certificate = fs.readFileSync('cert/certificate.pem').toString();
  app = express.createServer({key: privateKey, cert: certificate});
} else {
  app = express.createServer();
}


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  logger.default.transports.console.level = 'debug';
  logger.default.transports.console.colorize = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.configure(function(){
  app.use(express.bodyParser());
  app.use(require('./middleware/cross-domain'));
  //app.use(express.static(__dirname + '/public'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});

/**
app.get('*', function(req, res, next){
  console.log(req.url);
  next();
});**/

// routes
require('./routes/check.js')(app);
require('./routes/init.js')(app);
require('./routes/confirm.js')(app);
require('./routes/server.js')(app);
require('./routes/index.js')(app);

// index
app.get('/', function(req, res, next){
  console.log(req.connection);
  res.send('Hello World');
});

// error management (evolution)
require('./utils/app_errors.js')(app);

app.listen(config.get('http:port_register'), config.get('http:host'), function() {
  var address = app.address();
  var mode = config.get('http:register_ssl') ? 'https' : 'http';
  logger.info('Register server '+ mode +' listening on '+ address.address+':'+address.port+
      ' in '+app_static.settings.env+' mode');  
});
          
// static server 

var app_static = express.createServer();

app_static.configure(function(){
  app_static.use(express.bodyParser());
  app_static.use(express.static(__dirname + '/public'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});

app_static.get('*', function(req, res, next){
  console.log(req.url);
  next();
});

require('./routes_static/register-config')(app_static);
require('./routes_static/index')(app_static);

app_static.listen(config.get('http:port_static'), config.get('http:host_static'), function() {
  var address = app_static.address();
  logger.info('Static server listening on '+ address.address+':'+address.port+
      ' in '+app_static.settings.env+' mode');  
});


// start dns
require('./dnsserver');
