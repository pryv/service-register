/*global it*/
var config = require('../config-test');
var validate = require('json-schema').validate;
var querystring = require('querystring');
var schemas = require('../../source/model/schema.responses');
var _s = require('underscore.string');
var request = require('superagent');
var should = require('should');

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
 *  restype: application/json (default) | text/html, text/plain,  //  result data type
 *  JSchema: json-schema // (optional) schema to validate (doesn not seems to work)
 *  JValues: json object // (optional)  with values, should match result
 *  nextStep: function(test,data) // (optional)  for chained tests, will be called at the end of
  *                                              this one with data received
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
exports.pathStatusSchema = function pathStatusSchema(test) {
  it(test.it, function (done) {

    //-- Prepare the http request --//
    if (_s.startsWith(test.url, '/')) {
      test.url = config.get('http:register:url') + test.url;
    }

    var url = require('url').parse(test.url);

    var post_data = '';
    var req;

    if (test.method === 'POST') {
      req = request.post(url.href);
      if (test.contenttype === 'JSON') {
        post_data = JSON.stringify(test.data);
        req.set('Content-Type', 'application/json');
        req.set('Content-Length', post_data.length);
      } else if (test.contenttype === 'JSONSTRING') {
        post_data = test.data;
        req.set('Content-Type', 'application/json');
        req.set('Content-Length', post_data.length);
      } else { // JSON to STRING
        post_data = querystring.stringify(test.data);
        req.set('Content-Type', 'application/x-www-form-urlencoded');
        req.set('Content-Length', post_data.length);
      }
      req.send(post_data);
    } else if (test.method === 'GET') {
      req = request.get(url.href);
    }

    req.end(function(err, res) {
      should.not.exists(err);
      should.exists(res);
      res.should.have.status(test.status);

      // process response
      jsonResponse(res, test, done);
    });

  });
};

exports.jsonResponse = jsonResponse;
/**
 * test is expected to have the properties
 * JSchema: jscon-schema for validation
 * JValues: expected key-value pair for content validation
 */
function jsonResponse(res, test, callback_done) {

  // test headers?
  if (test.headers) {
    validateHeadersValues(test.headers, res.headers);
  }

  if (test.restype) {
    // also for text/plain
    res.headers['content-type'].should.equal(test.restype);

    // test constants
    if (test.value) {
      res.body.should.equal(test.value);
    }

  } else {// default JSON
    /*jshint -W030 */
    res.should.be.json;

    // test schema
    if (test.JSchema) {
      validateJSONSchema(data, test.JSchema);
    }

    // test constants
    if (test.JValues) {
      validateJsonValues(test.JValues, data);
    }

  }

  // if everything works.. then callback for result

  if (test.nextStep) {
    test.nextStep(test, data);
  }

  callback_done();
}


function validateJSONSchema(responseData, jsonSchema) {
  var validationResult = validate(responseData, jsonSchema);
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));
}


/**
 * helper that test the content of a JSON structure
 **/
function validateJsonValues(tests, data_json) {
  //console.log('\n****'); console.log(tests); console.log(data_json);
  for (var key in tests) {
    if (tests.hasOwnProperty(key)) {
      var testa = tests[key]; //?? I must do this if I don't want to loose refs in the Array loop??
      var dataa = data_json[key];
      if (testa instanceof Array) {
        // check values as of an ordered array
        for (var i = 0; i < testa.length; i++) {
          validateJsonValues(testa[i], dataa[i]);
        }
      } else {
        testa.should.equal(dataa);
      }
    }
  }
}

/**
 * helper that test the content of headers
 **/
function validateHeadersValues(tests, headers) {
  for (var key in tests) {
    if (tests.hasOwnProperty(key)) {
      tests[key].should.equal(headers[key]);
    }
  }
}



// From here on: methods designed to support the recommended test structure
//               (eventually all tests should use that)



/**
 * Checks the given response matches basic expectations.
 *
 * @param {Object} response
 * @param {Object} expected Properties (mandatory unless mentioned):
 *    - {Number} status
 *    - {Object} schema
 *    - {Object} body Optional
 * @param {Function} done Optional
 */
exports.check = function (response, expected, done) {
  response.statusCode.should.eql(expected.status);

  if (expected.schema) {
    checkJSON(response, expected.schema);
  }
  if (expected.body) {
    response.body.should.eql(expected.body);
  }
  if (expected.text) {
    response.text.should.eql(expected.text);
  }

  if (done) { done(); }
};

/**
 * Specific check for errors.
 *
 * @param {Object} response
 * @param {Object} expected Must have `error` object with properties (mandatory unless mentioned):
 *    - {Number} status
 *    - {String} id
 * @param {Function} done Optional
 */
exports.checkError = function (response, expected, done) {
  console.log(response);
  response.statusCode.should.eql(expected.status);
  checkJSON(response, schemas.error);
  var error = response.body; //response.body.error
  error.id.should.eql(expected.id);
  if (done) { done(); }
};

function checkJSON(response, schema) {
  /*jshint -W030 */
  response.should.be.json;
  checkSchema(response.body, schema);
}

/**
 * Checks the given data against the given JSON schema.
 *
 * @param data
 * @param {Object} schema
 */
function checkSchema(data, schema) {
  var validationResult = validate(data, schema);
  validationResult.valid.should.equal(true, JSON.stringify(validationResult.errors));

  // TODO: replace with this code when JSON validation changed to use z-schema lib
//  validator.validate(data, schema).should.equal(true,
//      util.inspect(validator.getLastError(), {depth: 5}));
}
