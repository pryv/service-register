var express = require('express'),
  oauthserver = require('node-oauth2-server'); // Would be: 'node-oauth2-server'


var config = require('../utils/config');
var logger = require('winston');

var app = express();

var accessCommon = require('../access/access-lib.js');

app.configure(function () {
  app.oauth = oauthserver({
    model: require('./model'),
    grants: ['authorization_code'],
    debug: true
  });
  app.use(express.bodyParser());
});

app.all('/oauth/*', express.cookieParser(accessCommon.ssoCookieSignSecret));

// Handle token grant requests
app.all('/oauth/token', app.oauth.grant());

// Show them the "do you authorise xyz app to access your content?" page
app.get('/oauth/authorise', function (req, res, next) {


  var parameters = {
    sso: req.signedCookies.sso,
    requestingAppId: req.query.client_id,
    requestedPermissions: [ {streamId : '*', level: 'manage'} ], // TODO adapt to clientId
    languageCode: 'en',
    returnURL: req.query.redirect_uri + '?',
    oauthState: req.query.state
  };

  accessCommon.requestAccess(parameters, function (accessState) {
    console.log(accessState);

    if (accessState.status === 'NEED_SIGNIN') {
      return res.redirect(decodeURIComponent(accessState.url));
    }

    res.render('authorise', {
      client_id: accessState.username,
      redirect_uri: parameters.returnURL
    });

  }, function (errorMessage) { 
    console.error('GET /oauth/authorise', errorMessage);
    next(errorMessage);
  });
});

// Handle authorise
app.post('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?client_id=' + req.query.client_id +
      '&redirect_uri=' + req.query.redirect_uri);
  }

  next();
}, app.oauth.authCodeGrant(function (req, next) {
  // The first param should to indicate an error
  // The second param should a bool to indicate if the user did authorise the app
  // The third param should for the user/uid (only used for passing to saveAuthCode)
  next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
}));

// Error handling
app.use(app.oauth.errorHandler());

app.listen(config.get('oauth2:port'));
logger.info('OAUTH2: port = ' + config.get('oauth2:port'));
