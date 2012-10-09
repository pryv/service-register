//frameworks
var express = require('./patched_modules/express')
var logger = require('winston');
var fs = require('fs');

var ready = require('readyness');
ready.setLogger(logger.info);


//Dependencies
var config = require('./utils/config');
var messages = require('./utils/messages');


function setup_app(app,ip,port) {
  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    logger['default'].transports.console.level = 'debug';
    logger['default'].transports.console.colorize = true;
  });

  app.configure('production', function(){
    logger['default'].transports.console.level = 'info';
    app.use(express.errorHandler());
  });

  app.configure(function(){
    app.use(express.favicon(__dirname + '/public/favicon.ico'));
    app.use(express.bodyParser());
    app.use(require('./middleware/cross-domain'));
    //app.use(require('./middleware/debug'));
    logger.setLevels(logger.config.syslog.levels);
    // TODO: setup logger handling for uncaught exceptions
  });

  // www
  require('./routes_to_static/index')(app);
  
  // public API routes
  require('./routes/check.js')(app);
  require('./routes/check_email.js')(app);
  require('./routes/init.js')(app);
  require('./routes/confirm.js')(app);
  require('./routes/server.js')(app);
  require('./routes/index.js')(app);
  
  // private API  routes
  require('./routes/admin_changeEmail')(app);


  //error management (evolution)
  require('./utils/app_errors.js')(app);


  var appListening = ready.waitFor('app:listening:'+ip+':'+port);
  app.listen(port, ip, function() {
    var address = app.address();  
    appListening(' in '+app.settings.env+' mode');
  }).on('error',function (e) {  
    if (e.code == "EACCES") {
      logger.error("Cannot "+e.syscall+" on: "+ip+":"+port); 
      throw(e);
   }});
    
}

//https server
logger.info('Register main server :'+config.httpUrl('http:register'));
logger.info('Static main server :'+config.httpUrl('http:static',true));

if (config.get('http:register:ssl')) {
  var privateKey = fs.readFileSync(__dirname+'/cert/privatekey-'+config.get('http:register:certs')+'.pem').toString();
  var certificate = fs.readFileSync(__dirname+'/cert/cert-'+config.get('http:register:certs')+'.crt').toString();
  var ca = fs.readFileSync(__dirname+'/cert/GandiStandardSSLCA.pem').toString();
  setup_app(express.createServer({key: privateKey, cert: certificate, ca: ca}),
      config.get('http:register:ip'),config.get('http:register:port'));
  
  if (config.get('http:register:no_ssl_on_port') > 0) 
    setup_app(express.createServer(), config.get('http:register:ip'),config.get('http:register:no_ssl_on_port'));
  
} else { // no ssl at all
  setup_app(express.createServer(), config.get('http:register:ip'),config.get('http:register:port'));
}



// start static server 
// require('./app_static');

// start dns
require('./app_dns');
