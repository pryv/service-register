var model = module.exports;

// curl "http://localhost:9090/oauth/authorise?client_id=ifttt&"
// curl -X -v -d 'client_id=ifttt&client_secret=sadfjt125dasvhGSDdhas&grant_type=authorization_code' -X POST "http://localhost:9090/oauth/token"


// In-memory datastores:
var oauthAccessTokens = [],
  oauthRefreshTokens = [],
  oauthClients = [
    {
      clientId : 'ifttt',
      clientSecret : 'sadfjt125dasvhGSDdhas',
      redirectUri : ''
    }
  ],
  authorizedClientIds = {
    'authorization_code' : [
      'thom'
    ],
    refreshToken: [
      'thom'
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
  console.log('*22');
  callback(false, authorizedClientIds[grantType] &&
    authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
};

model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
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

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
  for(var i = 0, len = users.length; i < len; i++) {
    var elem = users[i];
    if(elem.username === username && elem.password === password) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};
