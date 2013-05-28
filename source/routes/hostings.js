


var config = require('../utils/config');

module.exports =  function (app) {
  console.log("********");
  app.get('/hostings', function (req, res, next) {

    res.json(config.get('net:aahostings'));
  });

};