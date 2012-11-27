module.exports = function(templates) {
  templates['confirm:en'] = {
      from: 'Pryv', // sender address
      subject: 'Registration: confirm your e-mail address', // Subject line
      text: 'Hello %uid% \n\n Please confirm your adresse e-mail by visiting %url%', // plaintext body
      html: 'Hello <b>%uid%</b> <br/><br/>Please confirm your adresse e-mail <a href="%url%">CLICK HERE</a></b>' // html body
  };
}