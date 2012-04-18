var config = require('../utils/config');
module.exports = register_config;

function register_config(app){ 
    var register_url = config.httpUrl('http:register');
    var config_js = 'register_config = {"REGISTER_URL": "'+ register_url +'"};';
    var config_js_headers =  {'Content-Type': 'application/javascript'};
    app.get('/register-config.js', function(req, res, next){
      res.send(config_js,config_js_headers);
    });
}