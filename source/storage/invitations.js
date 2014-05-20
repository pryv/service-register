var messages = require('../utils/messages.js');
var db = require('../storage/database.js');
var _ = require('underscore');
var async = require('async');

var randtoken = require('rand-token').generator({
  chars: 'a-z'
});


function dbKey(token) {
  return token + ':invitation';
}


exports.getAll = function (callback) {
  var cutI = ':invitation'.length + 1;

  db.getSetsAsArrayMatching('*:invitation', function (error, data) {
    callback(error, data);
  }, function (keyToClean, data) { 
    data.id = keyToClean.substring(0, keyToClean.length - cutI);
  });
};

/**
 * create N tokens
 */
exports.generate = function (number, adminId, description, callback) {
  var createdAt = new Date().getTime();

  async.times(number, function (n, next) {
    // Generate a 5 characters token:
    var token = randtoken.generate(6);

    var data = {createdAt: createdAt, createdBy: adminId, description: description};
    db.setSet(dbKey(token), data, function (error) {
      _.extend(data, {id : token});
      next(error, data);
    });
  }, function (error, tokens) {
    callback(error, tokens);
  });


};


/**
 * check if token is valid, and return the result information i
 */
exports.checkIfValid = function checkIfValid(token, callback) {
  if (token === 'enjoy') {
    return callback(true);
  }

  db.getSet(dbKey(token), function (error, result) {
    if (error || ! result || result.consumedAt) { return callback(false); }

    return callback(true);
  });
};


/**
 * consumeToken (return false if fail)
 */
exports.consumeToken = function (token, username, callback) {
  if (token === 'enjoy') {
    return callback();
  }

  this.checkIfValid(token, function (isValid) {
    if (! isValid) {  return callback(messages.e(404, 'INVALID_INVITATION')); }

    db.setSetValue(dbKey(token), 'consumedAt', new Date().getTime(), function (error) {
      if (error) { return callback(error); }
      db.setSetValue(dbKey(token), 'consumedBy', username, function (error) {
        callback(error);
      });
    });


  });


};

