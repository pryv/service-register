//frameworks
var logger = require('winston');
var express = require('express');

//Dependencies
var app = module.exports = express();



app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  logger['default'].transports.console.level = 'debug';
  logger['default'].transports.console.colorize = true;
});

app.configure('production', function () {
  logger['default'].transports.console.level = 'info';
  app.use(express.errorHandler());
});

app.configure(function () {
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(require('./middleware/patchJsonBodyParser'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(require('./middleware/cross-domain'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});


// www
require('./routes/index')(app);

// service infos
require('./routes/service')(app);

// public API routes
require('./routes/email')(app);
require('./routes/server')(app);

// private API  routes
require('./routes/users')(app);
require('./routes/admin')(app);

//access
require('./routes/access')(app);

//error management (evolution)
require('./middleware/app-errors')(app);
