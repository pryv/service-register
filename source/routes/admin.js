'use strict';
// @flow

const checkAndConstraints = require('../utils/check-and-constraints'),
      users = require('../storage/users'),
      messages = require('../utils/messages'),
      invitations = require('../storage/invitations'),
      requireRoles = require('../middleware/requireRoles');

/**
 * Routes for admin to manage users
 */
module.exports = function (app: any) {
  // GET /admin/users: get the user list
  app.get('/admin/users', requireRoles('admin'), function (req, res/*, next*/) {

    var headers = {
      registeredDate : 'Registered At',
      username : 'Username',
      email: 'e-mail',
      language: 'lang',
      server: 'Server',
      appid: 'From app',
      referer: 'Referer',
      invitationToken : 'Token',
      errors: 'Errors'
    };

    users.getAllUsersInfos(function (error, list) {

      // Convert timestamp tor readable data
      list.forEach(function (user) {
        if (! user.registeredTimestamp) {
          user.registeredTimestamp = 0;
          user.registeredDate = '';
        } else {
          user.registeredDate = new Date(parseInt(user.registeredTimestamp)).toUTCString();
        }
      });

      // Sort by timestamp
      list.sort(function (a, b) {
        return b.registeredTimestamp - a.registeredTimestamp;
      });

      if (req.query.toHTML) {
        return res.send(toHtmlTables(headers, list));
      }

      res.json({users: list, error: error});
    });
  });

  // GET /admin/users/invitations: get the invitations list
  app.get('/admin/users/invitations', requireRoles('admin'), function (req, res, next) {

    invitations.getAll(function (error, invitations) {
      if (error) {
        return next(messages.ei());
      }

      if (req.query.toHTML) {
        var headers = {
          createdDate : 'Created At',
          createdBy : 'by',
          description: 'description',
          consumedDate: 'ConsumedAt',
          consumedBy: 'ConsumedBy',
          id: 'Token'
        };

        // Convert timestamp tor readable data
        invitations.forEach(function (token) {
          token.consumeDate = (token.consumedAt) ?
            new Date(parseInt(token.consumedAt)).toUTCString() : '';
          token.createdDate = new Date(parseInt(token.createdAt)).toUTCString();
        });

        invitations.sort(function (a, b) {
          return b.createdAt - a.createdAt;
        });

        return res.send(toHtmlTables(headers, invitations));
      }

      res.json({invitations: invitations});
    });
  });

  /**
   * GET /admin/users/invitations/post: generate an invitation
   */
  app.get('/admin/users/invitations/post', requireRoles('admin'), function (req, res, next){

    var count = parseInt(req.query.count);
    var message = req.query.message || '';

    invitations.generate(count, req.context.access.username, message, function (error, result) {
      if (error) {
        return next(messages.ei());
      }
      res.json({data: result});
    });
  });

  /**
   * GET /admin/servers: get the server list with the number of users on them
   */
  app.get('/admin/servers', requireRoles('admin'), function (req, res, next) {

    users.getServers(function (error, list) {
      if (error) { return next(messages.ei()); }
      res.json({servers: list});
    });

  });

  /** GET /admin/servers/:serverName/users - get the list of user for a given server
   */
  app.get('/admin/servers/:serverName/users', requireRoles('admin'), function (req, res, next) {
    const serverName = checkAndConstraints.hostname(req.params.serverName);
    if (! serverName) {
      return next(messages.e(400, 'INVALID_DATA', {'message': 'serverName invalid'}));
    }

    users.getUsersOnServer(serverName, function (error, list) {
      if (error) {
        return next(messages.ei(error));
      }
      res.json({users: list});
    });
  });

  /**
   * GET /admin/server/:srcServerName/rename/:dstServerName: rename a server
   */
  app.get('/admin/servers/:srcServerName/rename/:dstServerName',
    requireRoles('system'), function (req, res, next) {
      var srcServerName = checkAndConstraints.hostname(req.params.srcServerName);
      if (! srcServerName) {
        return next(messages.e(400, 'INVALID_DATA', {'message': 'srcServerName invalid'}));
      }

      var dstServerName = checkAndConstraints.hostname(req.params.dstServerName);
      if (! dstServerName) {
        return next(messages.e(400, 'INVALID_DATA', {'message': 'dstServerName invalid'}));
      }

      users.renameServer(srcServerName, dstServerName, function (error, count) {
        if (error) {
          return next(messages.ei());
        }
        res.json({count: count});
      });
    });
};

function toHtmlTables(headers, infoArray) {
  var result = '<table border="1">\n<tr>';
  Object.keys(headers).forEach(function (key) {
    result += '<th>' + headers[key] + '</th>';
  });
  result += '</tr>\n';

  infoArray.forEach(function (line) {
    result += '<tr>';
    Object.keys(headers).forEach(function (key) {
      var value = '';
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