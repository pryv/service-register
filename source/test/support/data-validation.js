var validate = require('json-schema').validate;
var config = require('../../utils/config');
var should = require('should');
var http = require('http'); 
var querystring = require('querystring');


exports.checkJSONValidityResp = function(httpResponse, jsonSchema) {
  httpResponse.should.be.json;
  jsonData(JSON.parse(httpResponse.body), validate(responseData, jsonSchema));
};

/** helper that test the content of a JSON structure **/
testJsonValues = function(tests,data_json) {
  //console.log("\n****"); console.log(tests); console.log(data_json); 
  for (key in tests) {
    var testa = tests[key]; //?? I must do this if I don't want to loose refs in the Array loop??
    var dataa = data_json[key];
    if (testa instanceof Array) {
        // check values as of an ordered array
        for(var i = 0; i < testa.length; i++) {
            testJsonValues(testa[i],dataa[i]);
        }
    } else {
        testa.should.equal(dataa);
    }
  }
}

/**
* test is expected to have the properties
* JSchema: jscon-schema for validation
* JValues: expected key-value pair for content validation
*/
exports.jsonResponse = jsonResponse = function(res, test, callback_done) {
  res.should.be.json;
  var bodyarr = [];
  res.on('data', function (chunk) { bodyarr.push(chunk); });
  res.on('end', function() {
    var data_json = JSON.parse(bodyarr.join(''));
    //console.log("\n**data received**\n");console.log(bodyarr.join(''));
    jsonData(data_json, test.JSchema);
    // test constents
    if (test.JValues != null) {
        testJsonValues(test.JValues,data_json);
    }
    // if everything works.. then callback for result
    if (test.nextStep != null) {
        test.nextStep(test,data_json);
    }
    callback_done();
  });
}

exports.jsonData = jsonData = function(responseData, jsonSchema) {
  var validationResult = validate(responseData, jsonSchema);
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));
}

/**
* do a a test. 
* test is expected to have the following properties:
* it: textual description of test
* path: path, of the ressource
* method: GET, POST, ...
* status: expected status
* JSchema: jscon-schema for validation
* JValues: expected key-value pair for content validation
*/
exports.path_status_schema = path_status_schema = function path_status_schema (test) {
it(test.it, function(done){
  var http_options = { path: test.path, port: config.get('http:port'), method: test.method };
  var post_data = "";
  if (test.method == 'POST') {
      post_data = querystring.stringify(test.data);
      http_options.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
      }
  }
  //console.log(JSON.stringify(test));
  var req = http.request(http_options, function(res){
    res.should.have.status(test.status);
    if (test.JSchema != null) 
      jsonResponse(res,test,done);
    else done();
   }).on('error', function(e) {
     throw new Error("Got error: " + e.message, e);
  });
  if (test.method == 'POST') {
      req.write(post_data);
  }
  req.end();
});
}