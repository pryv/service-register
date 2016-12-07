var model = module.exports;

// curl "http://localhost:9090/oauth/authorise?client_id=ifttt&"
// curl -X -v -d 'client_id=ifttt&client_secret=sadfjt125dasvhGSDdhas&grant_type=authorization_code'
// -X POST "http://localhost:9090/oauth/token"

// curl "http://localhost:9090/oauth/authorise?client_id=ifttt-all
// &response_type=code&redirect_uri=https://ifttt.com/channels/pryv/authorize&scope=ifttt&state=-8da2pciLMkqa4X_XdaQ4g"

/**
 * POST /oauth2/token HTTP/1.1
 Accept-Encoding: gzip,deflate
 host: s2.simpledata.ch:9090
 content-type: application/x-www-form-urlencoded; charset=utf-8
 content-length: 170
 Connection: keep-alive

 client_id=ifttt&client_secret=sadfjt125dasvhGSDdhas&grant_type=authorization_code&code=UhdDI7wTQWhJWGhQ&redirect_uri=https%3A%2F%2Fifttt.com%2Fchannels%2Fpryv%2Fauthorize
 */

// curl -X POST -d "client_id=ifttt-all&client_secret=sadfjt125dasvhGSDdhas
// &grant_type=authorization_code&code=UhdDI7wTQWhJWGhQ&redirect_uri=https%3A%2F%2Fifttt.com%2Fchannels%2Fpryv%2Fauthorize"
//  "http://localhost:9090/oauth/token"

// In-memory datastores:
var oauthAccessTokens = [],
  oauthRefreshTokens = [],
  oauthClients = [
    {
      clientId : 'ifttt-all',
      clientSecret : 'sadfjt125dasvhGSDdhas',
      redirectUri : ''
    }
  ],
  authorizedClientIds = {
    'authorization_code' : [
      'ifttt-all'
    ],
    refreshToken: [
      'ifttt-all'
    ]
  },
  users = [
    {
      id : '123',
      username: 'thomseddon',
      password: 'nightworld'
    }
  ];

// Debug function to dump the state of the data stores
model.dump = function () {
  console.log('oauthAccessTokens', oauthAccessTokens);
  console.log('oauthClients', oauthClients);
  console.log('authorizedClientIds', authorizedClientIds);
  console.log('oauthRefreshTokens', oauthRefreshTokens);
  console.log('users', users);
};

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
  console.log('*21');
  for(var i = 0, len = oauthAccessTokens.length; i < len; i++) {
    var elem = oauthAccessTokens[i];
    if(elem.accessToken === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getRefreshToken = function (bearerToken, callback) {
  console.log('*27');
  for(var i = 0, len = oauthRefreshTokens.length; i < len; i++) {
    var elem = oauthRefreshTokens[i];
    if(elem.refreshToken === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getClient = function (clientId, clientSecret, callback) {
  console.log('*23');
  for(var i = 0, len = oauthClients.length; i < len; i++) {
    var elem = oauthClients[i];
    if(elem.clientId === clientId && elem.clientSecret === clientSecret) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.grantTypeAllowed = function (clientId, grantType, callback) {
  console.log('*22' + grantType + '>' + clientId + ' .. ' + authorizedClientIds[grantType]);
  callback(false, authorizedClientIds[grantType] &&
    authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
};

model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
  console.log('*28', accessToken, clientId, expires, userId);
  oauthAccessTokens.unshift({
    accessToken: accessToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback(false);
};

model.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
  oauthRefreshTokens.unshift({
    refreshToken: refreshToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback(false);
};


model.getAuthCode = function (bearerCode, callback) {
  console.log('in getAuthCode (bearerCode: ' + bearerCode + ')');

  callback(null, {
    accessToken: 'youpipipi',
    clientId: 'ifttt-all',
    userId: 'perkikiki'
  });
};



