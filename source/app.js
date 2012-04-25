//frameworks
var express = require('express');
var logger = require('winston');
var fs = require('fs');

var ready = require('readyness');
ready.setLogger(logger.info);

//Dependencies
var config = require('./utils/config');
var messages = require('./utils/messages');


//workaround to detect if a String is not JSON
express.bodyParser.parse['application/json'] = function(req, options, fn){
  var buf = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk){ buf += chunk ;});
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
if (config.get('http:register:ssl')) {
  var privateKey = fs.readFileSync('cert/privatekey.pem').toString();
  var certificate = fs.readFileSync('cert/certificate.pem').toString();
  app = express.createServer({key: privateKey, cert: certificate});
} else {
  app = express.createServer();
}

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  logger['default'].transports.console.level = 'debug';
  logger['default'].transports.console.colorize = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.configure(function(){
  app.use(express.bodyParser());
  app.use(require('./middleware/cross-domain'));
  app.use(express.static(__dirname + '/public'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});


// routes
require('./routes/check.js')(app);
require('./routes/check_email.js')(app);
require('./routes/init.js')(app);
require('./routes/confirm.js')(app);
require('./routes/server.js')(app);
require('./routes/index.js')(app);

require('./routes_static/register-config')(app);
require('./routes_static/index')(app);

// index
app.get('/', function(req, res, next){
  console.log(req.connection);
  res.send('Hello World');
});

// error management (evolution)
require('./utils/app_errors.js')(app);


var appListening = ready.waitFor('app:listening');
app.listen(config.get('http:register:port'), config.get('http:register:ip'), function() {
  var address = app.address();  
  appListening('Register server '+ config.httpUrl('http:register')+' in '+app.settings.env+' mode');
});


// start static server 
require('./app_static');

// start dns
require('./app_dns');
