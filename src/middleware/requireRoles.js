/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const authorizedKeys = require('../config').get('auth:authorizedKeys');
const messages = require('../utils/messages');

/**
 * Returns a middleware function that checks request authorization (accepts either `Authorization`
 * header or `auth` query param) for the given roles.
 * Arguments are the authorized roles (e.g. "admin", "system", etc.).
 *
 */
module.exports = function getRequireRolesFN (/* role1, role2, etc. */) {
  const roles =
    arguments.length === 1 && Array.isArray(arguments[0])
      ? arguments[0]
      : [].slice.call(arguments);

  return function (req, res, next) {
    const auth = req.headers.authorization || req.query.auth;

    if (!auth || !authorizedKeys[auth]) {
      return next(
        new messages.REGError(401, {
          id: 'unauthorized',
          message: 'Expected "Authorization" header or "auth" query parameter'
        })
      );
    }
    if (!req.context) {
      req.context = {};
    }

    const tempA = auth.split('|');
    const access = (req.context.access = {
      username: tempA.length > 0 ? tempA[0] : 'system',
      key: auth,
      roles: authorizedKeys[auth].roles
    });

    if (
      !access.roles.some(function (role) {
        return roles.indexOf(role) !== -1;
      })
    ) {
      return next(
        new messages.REGError(403, {
          id: 'forbidden',
          message: 'Access forbidden'
        })
      );
    }
    next();
  };
};
