// check if a UID exists
var ck = require('../utils/ck.js');
var db = require('../storage/database.js');
var messages = require('../utils/messages.js');

function check(app) {

app.get('/:uid/check', function(req, res){
  if (! ck.uid(req.params.uid)) {
    res.json(messages.error('INVALID_USER_NAME'),400);
  } else db.uidExists(req.params.uid,function(error, exists) {
    if (error) message.fatal(res)
    else res.json({exists: (exists ? 'true' : 'false') });
  });
});

}

module.exports = check;