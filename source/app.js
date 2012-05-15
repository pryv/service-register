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
    app.use(express.errorHandler());
  });

  app.configure(function(){
    app.use(express.bodyParser());
    app.use(require('./middleware/cross-domain'));
    app.use(express.static(__dirname + '/public'));
    logger.setLevels(logger.config.syslog.levels);
    // TODO: setup logger handling for uncaught exceptions
  });


  //routes
  require('./routes/check.js')(app);
  require('./routes/check_email.js')(app);
  require('./routes/init.js')(app);
  require('./routes/confirm.js')(app);
  require('./routes/server.js')(app);
  require('./routes/index.js')(app);

  require('./routes/admin_changeEmail')(app);


  //error management (evolution)
  require('./utils/app_errors.js')(app);


  var appListening = ready.waitFor('app:listening:'+ip+':'+port);
  app.listen(port, ip, function() {
    var address = app.address();  
    appListening(' in '+app.settings.env+' mode');
  });
}

//https server
logger.info('Register main server :'+config.httpUrl('http:static'))
if (config.get('http:register:ssl')) {
  var privateKey = fs.readFileSync('cert/privatekey.pem').toString();
  var certificate = fs.readFileSync('cert/certificate.pem').toString();
  setup_app(express.createServer({key: privateKey, cert: certificate}),
      config.get('http:register:ip'),config.get('http:register:port'));
  
  if (config.get('http:register:no_ssl_on_port')) 
    setup_app(express.createServer(), config.get('http:register:ip'),config.get('http:register:no_ssl_on_port'));
  
} else { // no ssl at all
  setup_app(express.createServer(), config.get('http:register:ip'),config.get('http:register:port'));
}


// start static server 
require('./app_static');

// start dns
require('./app_dns');
