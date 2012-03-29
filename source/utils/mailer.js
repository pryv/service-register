var nodemailer = require("nodemailer");
var config = require('../utils/config');
var logger = require('winston');

// Create an Amazon SES transport object
var SESTransport = nodemailer.createTransport("SES", {
        AWSAccessKeyID: config.get('mailer:amazon_ses:accesskeyid'),
        AWSSecretKey: config.get('mailer:amazon_ses:secretkey'),
        ServiceUrl: config.get('mailer:amazon_ses:serviceurl') // optional
    });

logger.debug(config.get('mailer:confirm-sender-email'));
logger.debug(config.get('mailer:amazon_ses:secretkey'));

// setup e-mail data with unicode symbols
var mailOptions_Confirm = {
    from: "TrAcktivist ✔ <"+ config.get('mailer:confirm-sender-email') +">", // sender address
    to: "pml@simpledata.ch", // list of receivers
    subject: "Confirm your e-mail address ✔", // Subject line
    text: "Hello %uid% \n confirm your adresse e-mail %url%: ✔", // plaintext body
    html: "Hello <b>%uid%</b> <br> confirm your adresse e-mail <a href='%url%'>CLICK HERE</a>✔</b>" // html body
}

exports.sendConfirm = function (uid,to,challenge,lang) {
    if ( config.get('mailer:deactivated')) return true; //
    
    var url = config.get('net:confirmurl').replace('%challenge%',challenge);
    // send mail with defined transport object
    var mailc = mailOptions_Confirm;
    mailc.text = mailc.text.replace('%uid%',uid);
    mailc.html = mailc.html.replace('%uid%',uid);
    mailc.text = mailc.text.replace('%url%',url);
    mailc.html = mailc.html.replace('%url%',url);
    SESTransport.sendMail(mailOptions_Confirm, function(error, response){
        if(error){
            logger.debug(error);
        }else{
            //logger.info("Message sent: " + response.message);
        }
        SESTransport.close(); // shut down the connection pool, no more messages
    });

}