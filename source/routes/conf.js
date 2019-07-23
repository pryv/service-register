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

    coreConf.auth = Object.assign({}, coreConf.auth, {
      adminAccessKey: secrets.core.adminAccessKey,
      ssoCookieSignSecret: secrets.core.ssoCookieSignSecret,
      filesReadTokenSecret: secrets.core.filesReadTokenSecret,
      passwordResetPageURL: `https://sw.${domain}/access/reset-password.html`
    });

    coreConf.auth.trustedApps += `, *@https://*.${domain}*`;

    coreConf.services = Object.assign({}, coreConf.services, {
      register: {
        url: `https://reg.${domain}`,
        key: secrets.register.adminAccessKey
      },
      email: {
        url: `https://mail.${domain}/sendmail/`,
        key: secrets.core.mailKey
      }
    });

    res.json(coreConf);
  });
};
