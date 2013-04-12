/**
 * extension of database.js dedicated to user management
 */

var db = require('../storage/database.js');


var exports = exports || {};


/**
 *
 * @param serverName
 * @param callback function(error,number_of_changes)
 */
exports.getUsersOnServer = function getUsersOnServer(serverName,callback) {
  var result = new Array();
  db.doOnKeysValuesMatching('*:server', serverName,
    function (key,value) {
      result.push(key.split(':')[0]);
    },
    function (error) {
      callback(error,result);
    });
}