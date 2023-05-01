/**
 * @license
 * Copyright (C) 2012–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const path = require('path');
const logger = require('winston');
const express = require('express');

const errorhandler = require('errorhandler');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

// Dependencies
/**
 * @type {express$Application}
 */
const app = (module.exports = express());

logger.default.transports.console.level = 'info';
app.use(errorhandler({ log: false }));

app.use(favicon(path.join(__dirname, '/public/favicon.ico')));

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

// access
require('./routes/access')(app);

// records
require('./routes/records')(app);

require('./routes/cores')(app);

// error management (evolution)
require('./middleware/app-errors')(app);
