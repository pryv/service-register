//check if a UID exists
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');
var appErrors = require('../utils/app-errors.js');
var config = require('../utils/config');

function check(app) {

  var domain = "."+config.get('dns:domain');

  var aaservers_mode = config.get('net:aaservers_ssl') ? 'https' : 'http';
  var server_display_error_url = config.get('http:static:url')+config.get('http:static:error_page');

  app.get('/:uid/server', function(req, res,next){

    if (! ck.uid(req.params.uid)) 
      return  res.redirect(server_display_error_url+'?id=INVALID_USER_NAME');


    db.getServer(req.params.uid, function(error, result) {
      if (error) return next(messsages.ie()); 
      if (result) 
        return res.redirect(aaservers_mode+'://'+result+'/?userName='+req.params.uid); // good


      return res.redirect(server_display_error_url+'?id=UNKOWN_USER_NAME');
    });
  });


  app.post('/:uid/server', function(req, res,next){

    if (! ck.uid(req.params.uid)) return next(messages.e(400,'INVALID_USER_NAME'));

    db.getServer(req.params.uid, function(error, result) {
      if (error) return next(messages.ei()) ; 
      if (result) return res.json({server: result, alias: req.params.uid+domain },200); // good
      return next(messages.e(404,'UNKOWN_USER_NAME'));
    });
  });

}

module.exports = check;