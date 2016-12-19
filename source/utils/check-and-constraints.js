/**
 * Tools to perform test and minimum cleaning on inputs
 */
var config = require('./config');

var  _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var checkUsername = new RegExp('^' + '([a-z0-9-]{1,100})' + '$');
//var checkDomain = new RegExp('([.a-z0-9-]{1,100})' + '$');


String.prototype.endsWith = function(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/**
 * extract resource from hostname
 */
exports.extractRessourceFromHostname = function (hostname) {
    var domains = config.get('dns:domains');

    Object.prototype.getName = function() { 
         var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((this).constructor.toString());
               return (results && results.length > 1) ? results[1] : '';
    };

    for (var i = 0; i < domains.length; i++) {
       if ( hostname.endsWith('.' + domains[i]) ) {
        var resource = hostname.slice(0, - domains[i].length - 1 );
        if (checkUsername.exec(resource)) {
            return resource;
          }
        else {
            throw new Error('Username not recognized in hostname.');
          }
       }
    }
    throw new Error('Domain name not recognized in hostname.');
};

// (alphanumeric between 5 an 21 chars) case-insensitive  -  authorized
// trim the uid ..
exports.uid = function uid(str) {
  if (! str) { return null; }
  str = _(str).trim().toLowerCase();
  var filter = /^([a-zA-Z0-9])(([a-zA-Z0-9\-]){3,100})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};


// (alphanumeric between 2 an 70 chars) case-insensitive  - and . authorized
// trim the hosting ..
exports.hosting = function hosting(str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter =  /^([a-zA-Z0-9])(([a-zA-Z0-9\-\.]){2,70})([a-zA-Z0-9])$/;
  return (filter.test(str)) ? str : null;
};



// any chars between 6 and 99 chars, with no trailing spaces.
exports.password = function password(str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};

// any chars between 5 and 99 chars, with no trailing spaces.
exports.invitationToken = function invitationToken(str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 4 && str.length < 100) ? str : null;
};

// any chars between 1 and 99 chars, with no trailing spaces.
exports.referer = function referer(str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 0 && str.length < 100) ? str : null;
};

exports.email = function email(str) {
  if (! str) { return null; }
  str = _(str).trim();
  // not perfect 
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return (filter.test(str)) ? str : null;
};

exports.challenge = function challenge(str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{5,200})$/;
  return (filter.test(str)) ? str : null;
};

/**
 * Not string check .. just to prevent any string from beeing used
 * @param str
 * @return {*}
 */
exports.hostname = function hostname(str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9_\.\-]{3,256})$/;
  return (filter.test(str)) ? str : null;
};

var supportedLanguages = {en : 'English', fr: 'Français'};
exports.lang = function lang(str) {
  if (! str) { return 'en'; }
  return (supportedLanguages.hasOwnProperty(str)) ? str : 'en';
};


exports.appID = function appID(str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};


exports.activitySessionID = function activitySessionID(str) {
  if (! str) { return null; }
  str = _(str).trim();
  return (str.length > 5 && str.length < 100) ? str : null;
};

exports.appAuthorization = function appAuthorization(str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{10,200})$/;
  return (filter.test(str)) ? str : null;
};

exports.appToken = function appToken(str) {
  if (! str) { return null; }
  return (str.length < 256) ? str : null;
};

exports.accesskey = function accessKey(str) {
  if (! str) { return null; }
  str = _(str).trim();
  var filter = /^([a-zA-Z0-9]{10,200})$/;
  return (filter.test(str)) ? str : null;
};

exports.access = function access(json) {
  //TODO Check access structure
  return json;
};