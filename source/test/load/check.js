var app = require('../../app');
var config = require('../../utils/config');
var mode = config.get('http:register:ssl') ? 'https' : 'http';
var http = require(mode); 

//TODO Data validation

describe('LOAD ', function(){
  it('GET /:uid/check  10000x', function(done){

    var requests = 5000;
    var count = requests + 0;


    function gotit(res,done) {
      count--;
      if (count == 0) done();
    }


    var http_options = { path: '/perki/check', port: config.get('http:register:port')};

    for (var i = 0; i < requests; i++) {
      //console.log(JSON.stringify(test));
      var req = http.request(http_options, function(res){
        gotit(res,done);
      }).on('error', function(e) {
        throw new Error("Got error: " + e.message, e);
      });

      req.end();
    }
  });

});

