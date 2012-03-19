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

// errors
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