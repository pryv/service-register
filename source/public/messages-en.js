register_messages = {
  'INTERNAL_ERROR' : {'message' : 'Internal Error', 
    'detail' : 'Something went bad on our side, sorry for this inconvenience.'},
  'INVALID_DATA' : {'message' : 'Invalid Data', 
    'detail' : 'Some of the data transmited is invalid.'},
  'INVALID_JSON_REQUEST' : {'message' : 'Invalid Data', 
    'detail' : 'The data transmited is not in a valid JSON format.'},
  'INVALID_USER_NAME' : { 'message' : 'Invalid user name', 
    'detail' : 'User name must be made of 5 to 21 alphanumeric characters.'},
  'EXISTING_USER_NAME' : { 'message' : 'User name exists', 
    'detail' : 'User name must be unique.'},
  'INVALID_PASSWORD' : { 'message' : 'Invalid password', 
    'detail' : 'Password must be between 6 and 50 characters'},
  
  'INVALID_EMAIL' : { 'message' : 'Invalid email adress', 
    'detail' : 'E-mail address format not recognized'},
  'EXISTING_EMAIL' : { 'message' : 'This e-mail is known', 
      'detail' : 'This e-mail is already assigned to a user.'},
    
  'INIT_DONE' : { 'message' : 'Registration started', 
    'detail' : 'An e-mail has been sent, please check your mailbox to confirm your registration  '},
    
  'ALREADY_CONFIRMED' : { 'message' : 'Already confirmed', 
    'detail' : 'The registration for this user has already been confirmed.'},
  'NO_PENDING_CREATION' : { 'message' : 'No pending creation', 
    'detail' : 'User unkown or creation time elapsed.'},
  'INVALID_CHALLENGE' : { 'message' : 'Invalid challenge', 
    'detail' : 'Data format of the challenge is not recognized.'},
    
  'UNKOWN_USER_NAME' : { 'message' : 'Unkown user name', 
    'detail' : ''},
};