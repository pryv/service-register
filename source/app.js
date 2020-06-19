/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
// @flow

//frameworks
var logger = require('winston');
var express = require('express');
const config = require('./config');

const errorhandler = require('errorhandler');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

//Dependencies
const app: express$Application = module.exports = express();

logger['default'].transports.console.level = 'info';
app.use(errorhandler({ log: false }));

app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

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

//records
require('./routes/records')(app);

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
      app.use(airbrake.expressHandler());
    }
  }
}
