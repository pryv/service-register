var validate = require('json-schema').validate;

exports.checkJSONValidityResp = function(httpResponse, jsonSchema) {
  httpResponse.should.be.json;
  jsonData(JSON.parse(httpResponse.body), validate(responseData, jsonSchema));
};

exports.jsonResponse = function(res, jsonSchema, callback_done) {
  res.should.be.json;
  var bodyarr = [];
  res.on('data', function (chunk) { bodyarr.push(chunk); });
  res.on('end', function() {
    var data_json = JSON.parse(bodyarr.join(''));
    jsonData(data_json, jsonSchema);
    callback_done();
  });
}

exports.jsonData = jsonData = function(responseData, jsonSchema) {
  var validationResult = validate(responseData, jsonSchema);
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));
}