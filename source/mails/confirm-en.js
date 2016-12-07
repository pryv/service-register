module.exports = function(templates) {
  templates['confirm:en'] = {
    // Sender address
      from: 'Pryv',
    // Subject line
      subject: 'Registration: confirm your e-mail address',
    // Plaintext body
      text: 'Hello %uid% \n\n Please confirm your adresse e-mail by visiting %url%',
    // HTML body
      html: 'Hello <b>%uid%</b> <br/><br/>Please confirm your adresse e-mail ' +
      '<a href="%url%">CLICK HERE</a></b>'
  };
};