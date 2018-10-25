// @flow

//frameworks
var logger = require('winston');
var express = require('express');
const config = require('./utils/config');

//Dependencies
const app: express$Application = module.exports = express();

// The code below will give you better error reports; don't enable this 
// in production. Code begins here: ...
//
// app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
// logger['default'].transports.console.level = 'debug';
// logger['default'].transports.console.colorize = true;
//
// and ends here.

logger['default'].transports.console.level = 'info';
app.use(express.errorHandler());

app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(require('./middleware/patchJsonBodyParser'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(require('./middleware/cross-domain'));
logger.setLevels(logger.config.syslog.levels);

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
activateAirbrake(app);
require('./middleware/app-errors')(app);

function activateAirbrake(app) {
  /*
  Quick guide on how to test Airbrake notifications (under logs entry):
  1. Update configuration file with Airbrake information:
      "airbrake": {
       "active": true,
       "key": "get it from pryv.airbrake.io settings",
       "projectId": "get it from pryv.airbrake.io settings"
     }
  2. Throw a fake error in the code (/routes/index.js is easy to trigger):
      throw new Error('This is a test of Airbrake notifications');
  3. Trigger the error by running the faulty code (run a local core)
 */
  if(config.get('airbrake:disable') !== true) {
    const projectId = config.get('airbrake:projectId');
    const key = config.get('airbrake:key');
    if(projectId != null && key != null) {
      const airbrake = require('airbrake').createClient(projectId, key);
      app.use(app.router);
      app.use(airbrake.expressHandler());
    }
  }
}
