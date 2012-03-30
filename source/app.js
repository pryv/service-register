// Dependencies

var config = require('./utils/config');
var express = require('express');
var logger = require('winston');

// underscore
var  _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var app = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  logger.default.transports.console.level = 'debug';
  logger.default.transports.console.colorize = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
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

// index
app.get('/', function(req, res, next){
  console.log(req.connection);
  res.send('Hello World');
});

// error management (evolution)
require('./utils/app_errors.js')(app);

app.listen(config.get('http:port'));
logger.info(_.sprintf('Express server listening on port %d in %s mode',
                       app.address().port, app.settings.env));
                       


