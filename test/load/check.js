/*global describe,it*/
require('../../source/server');
var config = require('../../source/utils/config');
var mode = config.get('server:ssl') ? 'https' : 'http';
var http = require(mode);

require('readyness/wait/mocha');

//TODO Data validation

describe('LOAD ', function () {
  it('GET /:uid/check  10000x', function(done){

    var requests = 5000;
    var count = requests + 0;


    function gotit(res, done) {
      count--;
      if (count === 0) { done(); }
    }

    function charge() {
      //console.log(JSON.stringify(test));
      var req = http.request(http_options, function (res) {
        gotit(res, done);
      }).on('error', function(e) {
          throw new Error('Got error: ' + e.message, e);
        });

      req.end();
    }

    var http_options = { path: '/perki/check_username', port: config.get('server:port')};
    require('../../source/utils/dump').inspect({mode: mode, http_options: http_options});
    for (var i = 0; i < requests; i++) {
      charge();
    }
  });

});

