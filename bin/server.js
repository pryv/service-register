/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
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
