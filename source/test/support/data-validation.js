var config = require('../config-test');
var validate = require('json-schema').validate;
var should = require('should');
var querystring = require('querystring');
var dump = require('../../utils/dump.js');
var _s = require('underscore.string');
/**
 * 
 * test structure
 * { it: string,  // the title of the test
 *   url: string, // fully qualified url or path (starts with /)
 *                // if path config.get('http:register:url') will be used
 *   method: POST | GET | OPTIONS | PUT | DELETE,
 *   data: mixed, //The data to send,
 *   contenttype: JSON | JSONSTRING | STRING, // (for POST METHOD ONLY) 
 *                // JSON -> JSON.stringify(will be applied) -- send JSON
 *                // JSONSTRING -> nothing applied -- send JSON
 *                // STRING -> querystring.stringify(test.data) -- send x-www-form-urlencoded
 *  status: 100 | 200 | ...,  // expected status code,
 *  restype: json (default) | html,  //  result data type
 *  JSchema: json-schema // (optional) schema to validate (doesn not seems to work)
 *  JValues: json object // (optional)  with values, should match result 
 *  nextStep: function(test,data) // (optional)  for chained tests, will be called at the end of this one with data received 
 * 
 */


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
exports.pathStatusSchema = pathStatusSchema = function pathStatusSchema (test) {
  it(test.it, function(done){
    var _protocol = false;
    
    //-- Prepare the http request --//
    if (_s.startsWith(test.url,'/')) {
     test.url = config.get('http:register:url')+test.url;
    } 
    if (_s.startsWith(test.url,'http')) {
      _protocol = _s.startsWith(test.url,'https') ? 'https': 'http';
    } else {
      throw new Error('Cannot determine protocol: '+test.url);
    }
    
    var urlO = require('url').parse(test.url);
    
    var http_options = { 
        host: urlO.hostname,
        port: urlO.port,
        path: urlO.path , 
        method: test.method};
 
    var http = require(_protocol); 
    
    
    var post_data = '';
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
    //console.log(JSON.stringify(http_options));


    //-- Do request --//
    var req = http.request(http_options, function(res){
      var error_status = false;

      try {
        res.should.have.status(test.status);
      } catch (e) {
        error_status = e;
      }
      
      // process response
      jsonResponse(res,test,done,error_status,http_options,post_data);

    }).on('error', function(e) {
      throw new Error('Got error: ' + e.message, e);
    });
    if (test.method == 'POST') {
      req.write(post_data);
    }
    req.end();
  });
};





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
      console.log('\nREQUEST: ' + http_options.method +' '+http_options.host+':'+http_options.port+http_options.path);
      console.log('HEADERS: ' + JSON.stringify(http_options.headers));
      console.log('BODY: ' + post_data);
      console.log('\nRESPONSE\nSTATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      console.log('BODY: ');console.log(bodyarr.join(''));
    }
    if (error_status)  {display_error(); throw(error_status); }

    var data = null;

    try {
      // test headers?
      if (test.headers)
        validateHeadersValues(test.headers,res.headers);

      if (test.restype == 'html') {// default JSON
        res.should.be.html; 
        data = bodyarr.join('');

      } else {
        res.should.be.json;
        data = JSON.parse(bodyarr.join(''));

        // test schema
        if (test.JSchema != null)
          validateJSONSchema(data, test.JSchema);

        // test constants
        if (test.JValues != null)
          validateJsonValues(test.JValues,data);


      }

      // if everything works.. then callback for result
      if (test.nextStep != null) 
        test.nextStep(test,data);

    } catch (e) { display_error(); throw(e); }
    callback_done();
  });
};


function validateJSONSchema(responseData, jsonSchema) {
  var validationResult = validate(responseData, jsonSchema);
  
  //dump.inspect({jsonSchema : jsonSchema, responseData: responseData, validationResult: validationResult});
  
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));
};

/** 
 * helper that test the content of a JSON structure 
 **/
function validateJsonValues(tests,data_json) {
  //console.log('\n****'); console.log(tests); console.log(data_json); 
  for (key in tests) {
    var testa = tests[key]; //?? I must do this if I don't want to loose refs in the Array loop??
    var dataa = data_json[key];
    if (testa instanceof Array) {
      // check values as of an ordered array
      for(var i = 0; i < testa.length; i++) {
        validateJsonValues(testa[i],dataa[i]);
      }
    } else {
      testa.should.equal(dataa);
    }
  }
}

/** 
 * helper that test the content of headers
 **/
function validateHeadersValues(tests,headers) { 
  for (key in tests) {
    if (tests.hasOwnProperty(key))
      tests[key].should.equal(headers[key]);
  }
}

