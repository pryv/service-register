//frameworks
var express = require('express');
var logger = require('winston');

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
  app.use(require('./patched-modules/customJsonBodyParser.js'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(require('./middleware/cross-domain'));
  app.use(require('./middleware/debug'));
  logger.setLevels(logger.config.syslog.levels);
  // TODO: setup logger handling for uncaught exceptions
});

// www
require('./routes/index')(app);

// public API routes
require('./routes/email.js')(app);
require('./routes/user.js')(app);

require('./routes/server.js')(app);
require('./routes/access.js')(app);
require('./routes/hostings.js')(app);

// private API  routes
require('./routes/system.js')(app);
require('./routes/admin.js')(app);

//error management (evolution)
require('./utils/app-errors.js')(app);


