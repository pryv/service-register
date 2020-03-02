const config = require('../source/utils/config');
const Server = require('../source/server');
const logger = require('winston');

(async () => {
  const server = new Server(config);
  await server.start();
})()
  .then(() => logger.info('Startup sequence complete, Server is running.'))
  .catch(e => {
    if (logger) logger.error(e);
    console.dir(e);
    process.exit(1);
  });