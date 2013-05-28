var dataservers = require('../network/dataservers.js');

module.exports =  function (app) {
  app.get('/hostings', function (req, res) {
    res.json(dataservers.hostings());
  });
};