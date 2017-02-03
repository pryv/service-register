var dataservers = require('../network/dataservers.js');

/**
 * Route to get the list of available hostings
 * @param app
 */
module.exports =  function (app) {
  app.get('/hostings', function (req, res) {
    res.json(dataservers.hostings());
  });
};