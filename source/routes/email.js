// @flow

// check if an EMAIL exists
const checkAndConstraints = require('../utils/check-and-constraints'),
      db = require('../storage/database'),
      messages = require('../utils/messages');

/**
 * Routes to handle emails
 * @param app
 */
module.exports = function (app: any) {
  /** POST /email/check/: check existence of an email
   * 
   * This will return a plaintext response that is either 'true' or 'false'. 
   * Response will be 'true' if the email is valid AND free for the taking. 
   */
  app.post('/email/check', function (req, res) {
    isEmailTaken(req.body.email).then((taken) => {
      res.send(taken ? 'false' : 'true');
    }).catch(() => {
      res.send('false');
    });
  });

  /** GET /:email/check_email: check existence of an email
   * 
   * This will return an 'application/json' response that contains a single 
   * field 'exists'. The value of that field will be true if the email address 
   * is already registered with the system, false otherwise. 
   *
   * NOTE This is not the same as the POST /email/check route above. For a valid
   *  email address that has already been used, this method returns 
   * 
   * ```json    
   * { exists: true }
   * ```
   * 
   * where the above method would return `'false'`.
   */
  app.get('/:email/check_email', function (req, res, next) {
    isEmailTaken(req.params.email).then((taken) => {
      return res.json({exists: taken });
    }).catch(() => {
      return next(messages.e(400, 'INVALID_EMAIL'));
    });
  });

  /**
   * GET /:email/uid: get username for a given email
   */
  app.get('/:email/uid', function (req, res, next) {
    if (! checkAndConstraints.email(req.params.email)) {
      return next(messages.e(400, 'INVALID_EMAIL'));
    }

    db.getUIDFromMail(req.params.email, function (error, uid) {
      if (error) {
        return next(messages.ei());
      }
      if (! uid) {
        return next(messages.e(404, 'UNKNOWN_EMAIL'));
      }
      return res.json({uid: uid});
    });
  });

};

/** Checks if the email given in `email` is taken yet. 
 * 
 * @param email {string} string to check
 * @throws {Error} if the string doesn't look like an email address. 
 * @return {Promise<boolean>} resolves to true if the email is valid and already
 *    in use by a user. 
 */
function isEmailTaken(email: string): Promise<boolean> {
  if (! checkAndConstraints.email(email)) {
    return Promise.reject(new Error('invalid email'));
  }
  
  return new Promise((resolve, reject) => {
    db.emailExists(email, (err, result) => {
      if (err) { return reject(err); }
      
      resolve(result);
    });
  });
}

