/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const config = require('../../src/config');
const validate = require('json-schema').validate;
const querystring = require('querystring');
const schemas = require('./schema.responses');
const request = require('superagent');
const should = require('should');

const chai = require('chai');
const assert = chai.assert;

/**
 *
 * test structure
 * { it: string,  // the title of the test
 *   url: string, // fully qualified url or path (starts with /)
 *   method: POST | GET | OPTIONS | PUT | DELETE,
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
 * path: path, of the resource
 * method: GET, POST, ...
 * status: expected status
 * JSchema: jscon-schema for validation
 * JValues: expected key-value pair for content validation
 */
exports.pathStatusSchema = function pathStatusSchema (test) {
  it(test.it, function (done) {
    const url = config.get('server:url') + test.url;
    let postData = '';
    let req;

    if (test.method === 'POST') {
      // POST request
      req = request.post(url);
      if (test.contenttype === 'JSON') {
        postData = JSON.stringify(test.data);
        req.set('Content-Type', 'application/json');
        req.set('Content-Length', postData.length);
      } else if (test.contenttype === 'JSONSTRING') {
        postData = test.data;
        req.set('Content-Type', 'application/json');
        req.set('Content-Length', postData.length);
      } else {
        // JSON to STRING
        postData = querystring.stringify(test.data);
        req.set('Content-Type', 'application/x-www-form-urlencoded');
        req.set('Content-Length', postData.length);
      }
      req.send(postData);
    } else {
      // GET request
      req = request.get(url);
    }
    // Validate response
    req.end(function (err, res) {
      should.not.exists(err);
      should.exists(res);
      assert.equal(res.status, test.status, 'Status code must be correct');

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
/* eslint-disable-next-line n/handle-callback-err */
function jsonResponse (err, res, test, done) {
  // not checking error because superagent & co have a different definition of what an error is
  should.exist(res);

  assert.equal(res.status, test.status, 'Status code must be correct');

  // test headers?
  if (test.headers) {
    validateHeadersValues(test.headers, res.headers);
  }

  if (test.restype) {
    // also for text/plain
    res.headers['content-type'].should.equal(test.restype);

    // test constants
    if (test.value) {
      const body =
        test.restype === 'text/plain; charset=utf-8' ? res.text : res.body;
      body.should.equal(test.value);
    }
  } else {
    // default JSON
    res.headers['content-type'].should.containEql('application/json');

    // test schema
    if (test.JSchema) {
      validateJSONSchema(res.body, test.JSchema);
    }

    // test constants
    if (test.JValues) {
      validateJSONValues(test.JValues, res.body);
    }
  }

  // if everything works.. then callback for result

  if (test.nextStep) {
    test.nextStep(test, res.body);
  }

  done();
}

function validateJSONSchema (responseData, jsonSchema) {
  const validationResult = validate(responseData, jsonSchema);
  validationResult.valid.should.equal(
    true,
    JSON.stringify(validationResult.errors)
  );
}

/**
 * helper that test the content of a JSON structure
 **/
function validateJSONValues (tests, dataJSON) {
  for (const key in tests) {
    if (Object.prototype.hasOwnProperty.call(tests, key)) {
      const test = tests[key]; // ?? I must do this if I don't want to loose refs in the Array loop??
      const data = dataJSON[key];
      if (test instanceof Array) {
        // check values as of an ordered array
        for (let i = 0; i < test.length; i++) {
          validateJSONValues(test[i], data[i]);
        }
      } else {
        data.should.equal(test);
      }
    }
  }
}

/**
 * helper that test the content of headers
 **/
function validateHeadersValues (tests, headers) {
  for (const key in tests) {
    if (Object.prototype.hasOwnProperty.call(tests.hasOwnProperty, key)) {
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

  if (done) {
    done();
  }
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
  response.statusCode.should.eql(expected.status);
  checkJSON(response, schemas.error);
  const error = response.body; // response.body.error
  error.id.should.eql(expected.id);
  if (done) {
    done();
  }
};

function checkJSON (response, schema) {
  response.headers['content-type'].should.containEql('application/json');
  checkSchema(response.body, schema);
}

/**
 * Checks the given data against the given JSON schema.
 *
 * @param data
 * @param {Object} schema
 */
function checkSchema (data, schema) {
  const validationResult = validate(data, schema);
  validationResult.valid.should.equal(
    true,
    JSON.stringify(validationResult.errors)
  );
}
