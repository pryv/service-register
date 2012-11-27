var nodemailer = require('nodemailer');
var config = require('../utils/config');
var logger = require('winston');

//Create an Amazon SES transport object
var SESTransport = nodemailer.createTransport('SES', {
  AWSAccessKeyID: config.get('mailer:amazon_ses:accesskeyid'),
  AWSSecretKey: config.get('mailer:amazon_ses:secretkey'),
  ServiceUrl: config.get('mailer:amazon_ses:serviceurl') // optional
});

//load mails templates
var mailTemplates = new Array();
require('../mails/confirm-en.js')(mailTemplates);

for (key in mailTemplates) {
  mailTemplates[key].from += ' <'+config.get('mailer:confirm-sender-email') +'>';
  logger.debug('Loaded mail template: '+key);
}

exports.sendConfirm = function (uid,to,url,lang) {
    
  if ( config.get('mailer:deactivated')) {
    logger.debug('mailer: deactivated mailer');
    return true; //
  }
  // find mail template
  var templateCode = 'confirm:'+lang;
  if (! templateCode in mailTemplates) {
    logger.debug('Missing mail template translation: '+templateCode);
    templateCode = 'confirm:en';
  }
  var template = mailTemplates[templateCode]; // do not modify template

  
  // send mail with defined transport object
  var mailc = {from: template.from, to: to, subject: template.subject};
  mailc.text = template.text.replace('%uid%',uid);
  mailc.html = template.html.replace('%uid%',uid);
  mailc.text = mailc.text.replace('%url%',url);
  mailc.html = mailc.html.replace('%url%',url);
  SESTransport.sendMail(mailc, function(error, response){
    if(error){
      logger.debug(error);
    }else{
      //logger.info('Message sent: ' + response.message);
    }
    SESTransport.close(); // shut down the connection pool, no more messages
  });

}