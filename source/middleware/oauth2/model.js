var model = module.exports;

// In-memory data stores:
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

/**
 * Look for a specific access token in the data store
 * @param bearerToken: the token to look for
 * @param callback: function(error,result), result being the token if existing, 'null' otherwise
 */
model.getAccessToken = function (bearerToken, callback) {
  for(var i = 0, len = oauthAccessTokens.length; i < len; i++) {
    var elem = oauthAccessTokens[i];
    if(elem.accessToken === bearerToken) {
      return callback(null, elem);
    }
  }
  callback();
};

/**
 * Look for a specific refresh token in the data store
 * @param bearerToken: the token to look for
 * @param callback: function(error,result), result being the token if existing, 'null' otherwise
 */
model.getRefreshToken = function (bearerToken, callback) {
  for(var i = 0, len = oauthRefreshTokens.length; i < len; i++) {
    var elem = oauthRefreshTokens[i];
    if(elem.refreshToken === bearerToken) {
      return callback(null, elem);
    }
  }
  callback();
};

/**
 * Look for a specific client in the data store
 * @param clientId: the client id to look for
 * @param clientSecret: the client secret to match
 * @param callback: function(error,result)
 *  result being the client record if existing, 'null' otherwise
 */
model.getClient = function (clientId, clientSecret, callback) {
  for(var i = 0, len = oauthClients.length; i < len; i++) {
    var elem = oauthClients[i];
    if(elem.clientId === clientId && elem.clientSecret === clientSecret) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

/**
 * Check if specified grant type is allowed for specified client
 * @param clientId: the client id
 * @param grantType: the grant type
 * @param callback: function(error,result), result being 'true' if allowed, 'false' otherwise
 */
model.grantTypeAllowed = function (clientId, grantType, callback) {
  callback(false, authorizedClientIds[grantType] &&
    authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
};

/**
 * Save a new access token in the data store
 * @param accessToken: the new access token
 * @param clientId: the corresponding client id
 * @param expires: the token expiration date
 * @param userId: the corresponding user id
 * @param callback: function(error)
 */
model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
  oauthAccessTokens.unshift({
    accessToken: accessToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback();
};

/**
 * Save a new refresh token in the data store
 * @param refreshToken: the new refresh token
 * @param clientId: the corresponding client id
 * @param expires: the token expiration date
 * @param userId: the corresponding user id
 * @param callback: function(error)
 */
model.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
  oauthRefreshTokens.unshift({
    refreshToken: refreshToken,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  callback();
};

/**
 * Retrieve authentication code
 * For now, only returns object containing dummy accessToken, clientId and userId
 * @param bearerCode: authentication code to look for (not used yet)
 * @param callback: function(error,result), result being the authentication code
 */
model.getAuthCode = function (bearerCode, callback) {
  callback(null, {
    accessToken: 'youpipipi',
    clientId: 'ifttt-all',
    userId: 'perkikiki'
  });
};