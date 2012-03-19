var validate = require('json-schema').validate;
var config = require('../../utils/config');
var should = require('should');
var http = require('http'); 

exports.checkJSONValidityResp = function(httpResponse, jsonSchema) {
  httpResponse.should.be.json;
  jsonData(JSON.parse(httpResponse.body), validate(responseData, jsonSchema));
};

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
    jsonData(data_json, test.JSchema);
    // test constents
    if (test.JValues != null) {
        for (key in test.JValues) {
            test.JValues[key].should.equal(data_json[key]);
        }
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
  var req = http.request({ path: test.path, port: config.get('http:port'), method: test.method }, function(res){
    res.should.have.status(test.status);
    if (test.JSchema != null)
      jsonResponse(res,test,done);
    else done();
   }).on('error', function(e) {
     throw new Error("Got error: " + e.message, e);
  });
  req.end();
});
}