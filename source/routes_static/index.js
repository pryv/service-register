/**
 * Load index.html 
 * Bootstrap an http://rec.la session
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

var raw_html = fs.readFileSync(__dirname + '/index.html', 'utf8').toString();

var index_html = replaceAll(raw_html,
    {protocol: "http", 
  http_static: config.httpUrl('http:static',false),
  http_register: config.httpUrl('http:register',false)});

var index_html_ssl = replaceAll(raw_html,
    {protocol: "https", 
  http_static: config.httpUrl('http:static',true),
  http_register: config.httpUrl('http:register',true)});


module.exports = function(app){ 
  app.get('/', function(req, res, next){
      if (req.client.pair) {
        res.send(index_html_ssl);
      } else {
        res.send(index_html);
      }
  });
}