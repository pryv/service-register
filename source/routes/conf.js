// @flow

const config = require('../utils/config');

/**
 * Routes for handling centralized configuration
 */
module.exports = function (app: any) {
  // GET /conf/core: get configuration for a core
  app.get('/conf/core', function (req, res) {
    const coreConf = config.get('coreConf');
    const mainConf = config.get('mainConf');
    const domain = mainConf.domain;
    const secrets = mainConf.secrets;
    coreConf.auth.adminAccessKey = secrets.core.adminAccessKey;
    coreConf.auth.trustedApps += `, *@https://*.${domain}*`;
    coreConf.auth.ssoCookieSignSecret = secrets.core.ssoCookieSignSecret;
    coreConf.auth.filesReadTokenSecret = secrets.core.filesReadTokenSecret;
    coreConf.auth.passwordResetPageURL = `https://sw.${domain}${coreConf.auth.passwordResetPath}`;
    coreConf.services.register.url = `https://reg.${domain}`;
    coreConf.services.register.key = secrets.register.adminAccessKey;
    coreConf.services.email.url = `https://mail.${domain}${coreConf.services.email.path}`;
    coreConf.services.email.key = secrets.core.mailKey;

    res.json(coreConf);
  });
};
