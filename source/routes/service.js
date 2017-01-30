var config = require('../utils/config');

var infos = {
  version : '0.1.0',
  register : config.get('http:register:url'),
  access: 'https://access.' + config.get('dns:domain') + '/access',
  api: 'https://{username}.' +  config.get('dns:domain') + '/'
};

if (config.get('service:name')) {
  infos.name = config.get('service:name');
}

if (config.get('http:static:url')) {
  infos.home = config.get('http:static:url');
}

if (config.get('service:support')) {
  infos.support = config.get('service:support');
}

if (config.get('service:terms')) {
  infos.terms = config.get('service:terms');
}

module.exports = function (app) {
  // Service info route
  app.get('/service/infos', function (req, res/*, next*/) {
    res.json(infos);
  });
};
