var validate = require('json-schema').validate;
var config = require('../../utils/config');
var should = require('should');
var querystring = require('querystring');

// -- 
var mode = config.get('http:register:ssl') ? 'https' : 'http';
var http = require(mode); 


exports.checkJSONValidityResp = function(httpResponse, jsonSchema) {
  httpResponse.should.be.json;
  jsonData(JSON.parse(httpResponse.body), validate(responseData, jsonSchema));
};

/** 
 * helper that test the content of a JSON structure 
 **/
function testJsonValues(tests,data_json) {
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
exports.jsonResponse = jsonResponse = function(res, test, callback_done, error_status,http_options,post_data) {

  var bodyarr = [];
  res.on('data', function (chunk) { bodyarr.push(chunk); });
  res.on('end', function() {
    function display_error() {
      console.log('\nREQUEST: ' + http_options.method +" "+http_options.host+":"+http_options.port+http_options.path);
      console.log('HEADERS: ' + JSON.stringify(http_options.headers));
      console.log('BODY: ' + post_data);
      console.log('\nRESPONSE\nSTATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      console.log("BODY: ");console.log(bodyarr.join(''));
    }
    if (error_status)  {display_error(); throw(error_status); }

    var data = null;

    try {
      if (test.restype == 'html') {// default JSON
        res.should.be.html; 
        data = bodyarr.join('');

      } else {
        res.should.be.json;
        data = JSON.parse(bodyarr.join(''));
        
        // test schema
        if (test.JSchema != null)
          jsonData(data, test.JSchema);

        // test constants
        if (test.JValues != null)
          testJsonValues(test.JValues,data);


      }

      // if everything works.. then callback for result
      if (test.nextStep != null) 
        test.nextStep(test,data);

    } catch (e) { display_error(); throw(e); }
    callback_done();
  });
};

exports.jsonData = jsonData = function(responseData, jsonSchema) {
  var validationResult = validate(responseData, jsonSchema);
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));
};

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
  var http_options = { path: test.path, host: config.get('http:register:host') , port: config.get('http:register:port'), method: test.method };
  var post_data = "";
  if (test.method == 'POST') {
      if (test.contenttype == 'JSON') {
        post_data = JSON.stringify(test.data);
        http_options.headers = {
              'Content-Type': 'application/json',
              'Content-Length': post_data.length
        };
      } else if (test.contenttype == 'JSONSTRING') {
        post_data = test.data;
        http_options.headers = {
              'Content-Type': 'application/json',
              'Content-Length': post_data.length
        };
      } else { // JSON to STRING
          post_data = querystring.stringify(test.data);
          http_options.headers = {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': post_data.length
          };
      }
  }
  //console.log(JSON.stringify(test));
  // console.log(JSON.stringify(http_options));
  var req = http.request(http_options, function(res){
    var error_status = false;
    
    try {
       res.should.have.status(test.status);
    } catch (e) {
        error_status = e;
    }

    jsonResponse(res,test,done,error_status,http_options,post_data);

   }).on('error', function(e) {
     throw new Error("Got error: " + e.message, e);
  });
  if (test.method == 'POST') {
      req.write(post_data);
  }
  req.end();
});
};