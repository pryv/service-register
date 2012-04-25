// route : check
var check_exists = exports.check_exists = {
    type: 'object',
    properties: {
        'exists' : {
            type: 'boolean',
            require: true
        }
    }
}

// route : init
var init_done = exports.init_done = {
    type: 'object',
      properties: {
        'id': {
          type: 'string',
          required: true
        },
        'message': {
          type: 'string',
          required: true
        },
        'detail': {
          type: 'string',
          required: true
        },
        'captchaChallenge' : {
            type: 'string',
            require: true
        }
    }
}


// confirm : server & server : server
var server = exports.server = {
    type: 'object',
    properties: {
        'server' : {
            type: 'string',
            require: true
        },
        'alias' : {
            type: 'string',
            require: true
        }
    }
}

// confirm : server (already confirmed)
var confirm_already = exports.confirm_already = {
    type: 'object',
    properties: {
        'server' : {
            type: 'string',
            require: true
        },
        'alias' : {
          type: 'string',
          require: true
        },
        'id': {
          type: 'string',
          required: true
        },
        'message': {
          type: 'string',
          required: true
        },
        'detail': {
          type: 'string',
          required: true
        }
    }
}


// errors
var error = exports.error = {
  type: 'object',
  properties: {
    'id': {
      type: 'string',
      required: true
    },
    'message': {
      type: 'string',
      required: true
    },
    'detail': {
      type: 'string',
      required: true
    }
  }
};

// errors multiple
var error_multiple = exports.error_multiple = {
  type: 'object',
  properties: {
    'id': {
      type: 'string',
      required: true
    },
    'message': {
      type: 'string',
      required: true
    },
    'detail': {
      type: 'string',
      required: true
    },
    'errors' : {
        "type" : "object",
        "items" : {
          "properties" : {
            'id': {
              type: 'string',
              required: true
            },
            'message': {
              type: 'string',
              required: true
            },
            'detail': {
              type: 'string',
              required: true
            }
          }
        }
    }
  }
};