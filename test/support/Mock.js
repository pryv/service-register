// @flow

const nock = require('nock');

class Mock {
  scope: any;

  constructor(endpoint: string, path: string, method: string, status: number, res: Object, cb: () => any) {
    this.scope = nock(endpoint)
      .persist()
      .intercept(path, method)
      .reply(function (uri, reqBody) {
        cb(reqBody);
        return [status, res || reqBody];
      });
  }

  stop() {
    // Should work but doesn't
    // https://www.npmjs.com/package/nock#persist
    // this.scope.persist(false);
    
    nock.cleanAll();
  }
}

module.exports = Mock;
