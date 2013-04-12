/**
 * extension of database.js dedicated to user management
 */

var db = require('../storage/database.js');


var exports = exports || {};


/**
 *
 * @param serverName
 * @param callback function(error,array of users)
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


/**
 *
 * @param srcServerName
 * @param dstServerName
 * @param callback function(error,number_of_changes)
 */
exports.renameServer = function renameServer(srcServerName,dstServerName,callback) {

  var errors = new Array();

  var receivedCount = 0;
  var actionThrown = 0;
  var waitForDone = true;

  var checkDone = function() {
    if ((! waitForDone) && actionThrown == receivedCount) {
      callback(errors.length > 0 ? errors : null,receivedCount) ;
    }
  };

  var myDone = function (error) {
    if (error) errors.push(error);
    waitForDone = false;
    checkDone();
  };



  db.doOnKeysValuesMatching('*:server', srcServerName,
    function (key,value) {
      var uid = key.split(':')[0];
      actionThrown++;
      checkDone();
      db.setServer(uid,dstServerName,function(error,result) {
         if (error) {
           errors.push(error);
         }
        receivedCount++;
        checkDone();
      });

    },myDone);
}
