/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const lodash = require('lodash');

const checkAndConstraints = require('../utils/check-and-constraints');
const users = require('../storage/users');
const messages = require('../utils/messages');
const invitations = require('../storage/invitations');
const requireRoles = require('../middleware/requireRoles');

/**
 * Routes for admin to manage users
 */
module.exports = function (app) {
  // GET /admin/users: get the user list
  app.get('/admin/users', requireRoles('admin'), function (req, res, next) {
    const headers = {
      registeredDate: 'Registered At',
      username: 'Username',
      email: 'e-mail',
      language: 'lang',
      server: 'Server',
      appid: 'From app',
      referer: 'Referer',
      invitationToken: 'Token',
      errors: 'Errors'
    };

    users.getAllUsersInfos(function (error, list) {
      if (error != null) return next(error);

      if (list == null) return next(new Error('AF: Missing user list.'));

      // Convert timestamp tor readable data
      const outputList = list
        .map((user) => {
          const output = lodash.clone(user);
          if (output.registeredTimestamp == null) {
            output.registeredTimestamp = 0;
            output.registeredDate = '';
          } else {
            output.registeredDate = new Date(
              parseInt(user.registeredTimestamp)
            ).toUTCString();
          }
          return output;
        })
        .sort((a, b) => b.registeredTimestamp - a.registeredTimestamp);

      if (req.query.toHTML) {
        return res.send(toHtmlTables(headers, outputList));
      }

      res.json({ users: outputList });
    });
  });

  // START - CLEAN FOR OPENSOURCE
  // GET /admin/invitations: get the invitations list
  app.get('/admin/invitations', requireRoles('admin'), function (req, res, next) {
    invitations.getAll(function (error, invitations) {
      if (error) {
        return next(messages.ei(error));
      }
      if (req.query.toHTML) {
        const headers = {
          createdDate: 'Created At',
          createdBy: 'by',
          description: 'description',
          consumedDate: 'ConsumedAt',
          consumedBy: 'ConsumedBy',
          id: 'Token'
        };
        // Convert timestamp tor readable data
        invitations.forEach(function (token) {
          token.consumeDate = token.consumedAt
            ? new Date(parseInt(token.consumedAt)).toUTCString()
            : '';
          token.createdDate = new Date(
            parseInt(token.createdAt)
          ).toUTCString();
        });
        invitations.sort(function (a, b) {
          return b.createdAt - a.createdAt;
        });
        return res.send(toHtmlTables(headers, invitations));
      }
      res.json({ invitations });
    });
  });

  app.get('/admin/users/:username', requireRoles('system'), function (req, res, next) {
    users.getUserInfos(req.params.username, function (errors, user) {
      if (errors.length !== 0) {
        if (errors.find((err) => err.user.includes('users is empty'))) {
          return res.status(404).send('User not found');
        }
        return next(errors);
      }
      // Convert timestamp tor readable data
      const outputUser = lodash.clone(user);
      if (outputUser.registeredTimestamp == null) {
        outputUser.registeredTimestamp = 0;
        outputUser.registeredDate = '';
      } else {
        outputUser.registeredDate = new Date(
          parseInt(user.registeredTimestamp)
        ).toUTCString();
      }
      return res.json(outputUser);
    });
  });

  /**
   * GET /admin/invitations/post: generate an invitation
   */
  app.get('/admin/invitations/post', requireRoles('admin'), function (req, res, next) {
    const count = parseInt(req.query.count);
    const message = req.query.message || '';
    invitations.generate(
      count,
      req.context.access.username,
      message,
      function (error, result) {
        if (error) {
          return next(messages.ei(error));
        }
        res.json({ data: result });
      }
    );
  });

  /**
   * GET /admin/servers: get the server list with the number of users on them
   */
  app.get('/admin/servers', requireRoles('admin'), function (req, res, next) {
    users.getServers(function (error, list) {
      if (error) {
        return next(messages.ei(error));
      }
      res.json({ servers: list });
    });
  });

  /**
   * GET /admin/servers/:serverName/users - get the list of user for a given server
   */
  app.get('/admin/servers/:serverName/users', requireRoles('admin'), function (req, res, next) {
    const serverName = checkAndConstraints.hostname(req.params.serverName);
    if (!serverName) {
      return next(
        messages.e(400, 'INVALID_DATA', { message: 'serverName invalid' })
      );
    }
    users.getUsersOnServer(serverName, function (error, list) {
      if (error) {
        return next(messages.ei(error));
      }
      res.json({ users: list });
    });
  });

  /**
   * GET /admin/server/:srcServerName/rename/:dstServerName: rename a server
   */
  app.get('/admin/servers/:srcServerName/rename/:dstServerName', requireRoles('system'), function (req, res, next) {
    const srcServerName = checkAndConstraints.hostname(
      req.params.srcServerName
    );
    if (!srcServerName) {
      return next(
        messages.e(400, 'INVALID_DATA', { message: 'srcServerName invalid' })
      );
    }
    const dstServerName = checkAndConstraints.hostname(
      req.params.dstServerName
    );
    if (!dstServerName) {
      return next(
        messages.e(400, 'INVALID_DATA', { message: 'dstServerName invalid' })
      );
    }
    users.renameServer(srcServerName, dstServerName, function (error, count) {
      if (error) {
        return next(messages.ei(error));
      }
      res.json({ count });
    });
  });
  // END - CLEAN FOR OPENSOURCE
};

/**
 * @param {{
 *   [x: string]: string
 * }} headers
 * @returns {string}
 */
function toHtmlTables (headers, infoArray) {
  let result = '<table border="1">\n<tr>';
  Object.keys(headers).forEach(function (key) {
    result += '<th>' + headers[key] + '</th>';
  });
  result += '</tr>\n';

  infoArray.forEach(function (line) {
    result += '<tr>';
    Object.keys(headers).forEach(function (key) {
      let value = '';
      if (line[key]) {
        if (typeof line[key] === 'string') {
          value = line[key];
        } else {
          value = JSON.stringify(line[key]);
        }
      }
      result += '<td>' + value + '</td>';
    });

    result += '</tr>\n';
  });

  result += '</table>';
  return result;
}
