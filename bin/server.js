/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const Server = require('../src/server');
const logger = require('winston');

(async () => {
  const server = new Server();
  await server.start();
  logger.info('Startup sequence complete, Server is running.');
})()
  .then(() => logger.info('Startup sequence complete, Server is running.'))
  .catch((e) => {
    if (logger) logger.error(e);
    console.dir(e);
    process.exit(1);
  });
