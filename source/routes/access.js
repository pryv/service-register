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
  
  function _setAccessState(res,next,key,accessState) {
    db.setAccessState(key, accessState, function(error, result) {
      if (error) { return next(messages.ei()) ; }
      //require('../utils/dump.js').inspect(accessState,result);
      return res.json(accessState,accessState.code);
    }); 
  }
  
  
  /**
   * request an access
   */
  app.post('/access', function(req, res,next){
    //--- parameters --//
    var requestingAppId = checkAndConstraints.appID(req.body.requestingAppId);
    if (! requestingAppId) {
      return next(messages.e(400,'INVALID_APP_ID'));
    }

    var requestedPermissions = checkAndConstraints.access(req.body.requestedPermissions);
    if (! requestedPermissions) {
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
    if ( req.cookies.accessKey ) {
      require('../utils/dump.js').inspect( { cookie: req.cookies});
      checkKeyAndGetValue(req,res,next,function(key,value) { 
        return res.json(value,value.code);
      });
    }
    //alert (Chaine_commande);
    // .... do some stuff here


    // step 2 .. register or log in
    var error = false;
    if (error) {
      return next(messages.ei()) ; 
    }
    
    
    
    
    
    var key = randGenerator.string(16);
    var pollURL = config.get('http:register:url')+'/access/'+key;
    
    var url = config.get('http:static:access')+
    '?lang='+lang+
    '&key='+key+
    '&requestingAppId='+requestingAppId+
    '&returnURL='+encodeURIComponent(returnURL)+
    '&domain='+domain+
    '&registerURL='+encodeURIComponent(config.get('http:register:url'));
    
    //TODO add username & sessionID if possible
    
    
    var accessURIc = '&requestedPermissions='+encodeURIComponent(JSON.stringify(requestedPermissions));
    
    if ((url.length + accessURIc.length) > 2000) {
      console.log("url too long");
      url = url + '&poll='+encodeURIComponent(pollURL);
    } else {
      url = url + accessURIc;
    }
    
    var accessState = { status: 'NEED_SIGNIN', 
        code: 201,
        key: key,
        requestingAppId: requestingAppId, 
        requestedPermissions: requestedPermissions, 
        url: url, 
        poll: pollURL,
        returnURL: returnURL,
        poll_rate_ms: 1000};
    
    _setAccessState(res,next,key,accessState);
  });
  
  /**
   * polling responder
   */
  app.get('/access/:key', function(req, res,next) {
    checkKeyAndGetValue(req,res,next,function(key,value) { 
      return res.json(value,value.code);
    });
  });
  
  /**
   * refuse access
   */
  app.post('/access/:key', function(req, res,next) {
    checkKeyAndGetValue(req,res,next,function(key,value) { 
      
      if (req.body.status == 'REFUSED') {
        var accessState = { 
            status: 'REFUSED', 
            reasonID: req.body.reasonID || 'REASON_UNDEFINED',
            message:  req.body.message || '',
            code: 403};

        _setAccessState(res,next,key,accessState);
      };
      
      if (req.body.status == 'ERROR'){
        var accessState = { 
            status: 'ERROR', 
            id: req.body.id || 'INTERNAL_ERROR',
            message:  req.body.message || '',
            detail:  req.body.detail || '',
            code: 403};
        
        _setAccessState(res,next,key,accessState);
      };
      
      if (req.body.status == 'ACCEPTED'){
        
        if (! checkAndConstraints.uid(req.body.username)) {
          return next(messages.e(400,'INVALID_USER_NAME'));
        }

        if (! checkAndConstraints.appToken(req.body.token)) {
          return next(messages.e(400,'INVALID_DATA'));
        }
        
        var accessState = { 
            status: 'ACCEPTED',
            username: req.body.username,
            token: req.body.token,
            code: 200};
        
        _setAccessState(res,next,key,accessState);
      }
    });
  });
  
 
}


/**
 * Test the key 
 */
function testKeyAndGetValue(key,success,failed) {
  if (checkAndConstraints.accesskey(key) == null) {
    return failed(messages.e(400,'INVALID_KEY'));
  }
  
  db.getAccessState(key, function(error, result) {
    if (error) { return failed(messages.ei(error)) ; }
    if (! result) {
      return failed(messages.e(400,'INVALID_KEY'));
    }

    success(result);
  }); 
}

/**
 * Check the key in the request and call ifOk() if a value is found
 * @param ifOk callback(value)
 */
function checkKeyAndGetValue(req,res,next,ifOk) {
  testKeyAndGetValue(req.params.key,function(value) {
    ifOk(req.params.key,value);
  },next);
}

module.exports = access;