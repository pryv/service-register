//check if a UID exists
var checkAndConstraints = require('../utils/check-and-constraints.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');
var config = require('../utils/config');
var randGenerator = require('../utils/random');
var dataservers = require('../network/dataservers.js')

var domain = config.get('dns:domain');
var activityServerPort = config.get('net:aaservers_ssl') ? 443 : 80;

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

    var devId = checkAndConstraints.uid(req.body.devID);
    if (! devId) {
      return next(messages.e(400,'INVALID_USER_NAME'));
    }
    
    var appAuthorization = checkAndConstraints.appAuthorization(req.body.appAuthorization);
    if (! appAuthorization) {
      return next(messages.e(400,'INVALID_DATA'));
    }
    
    var access = checkAndConstraints.access(req.body.access);
    if (! access) {
      return next(messages.e(400,'INVALID_DATA'));
    }
    
    
    var lang = checkAndConstraints.lang(req.body.languageCode);
    
    //-- TODO Check URL validity
    var returnURL = req.body.returnURL;
    
    //--- END parameters --//
    
    //--- CHECK IF APP IS AUTHORIZED ---//
    
    
    //-- TODO 
    
    
    //--- END CHECK APP AUTH ---//
    
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
    var accessState = { status: 'NEED_SIGNIN', 
                          code: 201,
                           key: key,
                         appID: appID, 
                        access: access, 
                           url: config.get('http:static:access')+'?lang='+lang+
                               '&key='+key+'&domain='+domain+
                               '&registerURL='+encodeURIComponent(config.get('http:register:url')), 
                          poll: config.get('http:register:url')+'/access/'+key+'/status',
                     returnURL: returnURL,
                  poll_rate_ms: 1000};

    db.setAccessState(key, accessState, function(error, result) {
      if (error) { return next(messages.ei()) ; }
      return res.json(accessState,accessState.code); 
    }); 

  });
  
  /**
   * polling responder
   */
  app.get('/access/:key/status', function(req, res,next) {
    checkKeyAndGetValue(req,res,next,function(value) { 
      return res.json(value,value.code);
    });
  });
  
  /**
   * relay a email login
   * TODO: validate the safety (privacy) of this call that exposes a link between an email and a user.
   * This can be avoided by relaying the call to uid.pryv.io/admin/login
   */
  app.get('/access/:key/idformail/:email', function(req, res,next) {
    if (! checkAndConstraints.email(req.params.email)) {
      return next(messages.e(400,'INVALID_EMAIL'));
    }
    
    checkKeyAndGetValue(req,res,next,function(value) { 
      db.getUIDFromMail(req.params.email, function(error, uid) {
        if (error) return next(messsages.ie()); 
        if (! uid) {
            return next(messages.e(404,'UNKOWN_EMAIL'));
        }
        return res.json({uid: uid});
      });
    });
  });
  
  
  /**
   * get Session ID
   */
  app.post('/access/:key/get-app-token/:uid', function(req, res,next) {
    if (! checkAndConstraints.uid(req.params.uid)) {
      return next(messages.e(400,'INVALID_USER_NAME'));
    }
    
    if (! checkAndConstraints.activitySessionID(req.body.sessionID)) {
      return next(messages.e(400,'INVALID_DATA'));
    }
    
    checkKeyAndGetValue(req,res,next,function(value) { 
    
      var host = {
          name: req.params.uid+'.'+domain,
          port: activityServerPort,
          authorization: req.body.sessionID};

      var jsonData = {
          id: value.appID
      };
      
      dataservers.postToAdmin(host,'/admin/get-app-token',200,jsonData,function(error,json_result) {
        require('../utils/dump.js').inspect(host,value,error,json_result);
      }
          
      );
      
      return res.json({status: 'VALIDATED'});
    });
  });

}

/**
 * Check the key in the request and call ifOk() if a value is found
 * @param ifOk callback(value)
 */
function checkKeyAndGetValue(req,res,next,ifOk) {
  if (checkAndConstraints.accesskey(req.params.key) == null) {
    return next(messages.e(400,'INVALID_KEY'));
  }

  db.getAccessState(req.params.key, function(error, result) {
    if (error) { return next(messages.ei()) ; }
    if (! result) {
      return next(messages.e(400,'INVALID_KEY'));
    }

    ifOk(result);

  }); 
}

module.exports = access;