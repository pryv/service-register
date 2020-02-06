// @flow

const nock = require('nock');

class Mock {

  constructor(endpoint: string, path: string, method: string, status: number, res: Object, cb: () => any) {
    nock(endpoint)
      .intercept(path, method)
      .reply(function () {
        cb();
        return [status, res];
      });
  }
}

module.exports = Mock;
