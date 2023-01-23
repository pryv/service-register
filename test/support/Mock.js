const nock = require('nock');
/** */
class Mock {
  /** */
  scope = undefined;
  constructor(endpoint, path, method, status, res, cb) {
    this.scope = nock(endpoint)
      .persist()
      .intercept(path, method)
      .reply(function (uri, reqBody) {
        cb(reqBody);
        return [status, res || reqBody];
      });
  }
  /** @returns {void} */
  stop() {
    // Should work but doesn't
    // https://www.npmjs.com/package/nock#persist
    // this.scope.persist(false);
    nock.cleanAll();
  }
}
module.exports = Mock;
