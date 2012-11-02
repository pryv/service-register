//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');
var config = require('../utils/config');
var randGenerator = require('../utils/random');

function access(app) {

  /**
   * request an access
   */
  app.post('/access', function(req, res,next){
    //--- parameters --//
    var appID = checkAndConstraints.appID(req.body.appID);
    if (! appID) {
      return next(messages.e(400,'INVALID_APP_ID'));
    }

    var access = checkAndConstraints.access(req.body.access);
    if (! access) {
      return next(messages.e(400,'INVALID_DATA'));
    }
    
    var lang = checkAndConstraints.lang(req.body.languageCode);
    
    // TODO 
    var returnURL = req.body.returnURL;
    
    //--- END parameters --//
    
    /**
     * appname: "a name for the app",
     * access: "the required access",
     */
    // is this a known user
    // foreach req.cookies. ...

    // .... do some stuff here


    // step 2 .. register or log in
    var error = false;
    if (error) {
      return next(messages.ei()) ; 
    }

    var key = randGenerator.string(16);
    var accessState = { status: 'VALIDATING', appID: appID, access: access };

    db.setAccessState(key, accessState, function(error, result) {
      if (error) { return next(messages.ei()) ; }

      return res.json(
          { url: config.get('http:access')+'?lang='+lang+'&key='+key, 
            poll: config.get('http:register:url')+'/access/'+key+'/status' },201); 
    }); 

  });
  
  /**
   * polling responder
   */
  app.get('/access/:key/status', function(req, res,next) {
    
    if (checkAndConstraints.accesskey(req.params.key) == null) {
        return next(messages.e(400,'INVALID_KEY'));
    }
    
    db.getAccessState(req.params.key, function(error, result) {
      if (error) { return next(messages.ei()) ; }
      if (! result) {
        return next(messages.e(400,'INVALID_KEY'));
      }
      if (result.status == 'VALIDATING') {
        return res.json(
            { status: 'VALIDATING', 
              retry_in_ms: 1000 },449); 
      } else if (result.status == 'VALIDATION_REFUSED') {
        return res.json( { status: 'VALIDATION_REFUSED', reason: 'Not Specified' },403); 
        // here we could remove the key from redis (will be done automagically in 1 hour)
      } else if (result.status == 'VALID') {
        return res.json( { status: 'VALID', username: result.username, token: result.token }, 100); 
     // here we could remove the key from redis (will be done automagically in 1 hour)
      }
      return next(messages.ei()) ;
    }); 
    
  });

}

module.exports = access;