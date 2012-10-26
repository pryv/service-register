/**
 * Load index.html 
 * Bootstrap an http://pryv.io session
 */

var config = require('../utils/config');
var fs = require('fs');

function replaceAll(text,key_values) {
  var re ;
  for (key in key_values) {
    if (key_values.hasOwnProperty(key)) {
      re = new RegExp("{"+key+"}", "g");
      text = text.replace(re,key_values[key]);
    }
  }
  return text;
}

var rawHtml = fs.readFileSync(__dirname + '/index.html', 'utf8').toString();


var indexHtmlSSL = replaceAll(rawHtml,
    {protocol: "https", 
  http_static: config.get('http:static:url'),
  http_register: config.get('http:register:url')});


module.exports = function(app){ 
  app.get('/', function(req, res, next){
    res.send(indexHtmlSSL);
  });
}