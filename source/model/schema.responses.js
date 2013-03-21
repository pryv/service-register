//success : changeEmail
var success = exports.success = {
    type: 'object',
    properties: {
      success : {
        type: 'boolean',
        required: true
      },
    }
}

//route : check
var checkExists = exports.checkExists = {
    type: 'object',
    properties: {
      reserved : {
        type: 'boolean',
        required: true
      }
    }
}

//route : init
var initDone = exports.initDone = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        required: true
      },
      message: {
        type: 'string',
        required: true
      },
      detail: {
        type: 'string',
        required: true
      },
      captchaChallenge : {
        type: 'string',
        required: true
      }
    }
}


//confirm : server & server : server
var server = exports.server = {
    type: 'object',
    properties: {
      server : {
        type: 'string',
        required: true
      },
      alias : {
        type: 'string',
        required: true
      }
    }
}

//confirm : server (already confirmed)
var alreadyConfirmed = exports.alreadyConfirmed = {
    type: 'object',
    properties: {
      server : {
        type: 'string',
        required: true
      },
      alias : {
        type: 'string',
        required: true
      },
      id: {
        type: 'string',
        required: true
      },
      message: {
        type: 'string',
        required: true
      },
      detail: {
        type: 'string',
        required: true
      }
    }
}


//errors
var error = exports.error = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        required: true
      },
      message: {
        type: 'string',
        required: true
      },
      detail: {
        type: 'string',
        required: true
      }
    }
};

//errors multiple
var multipleErrors = exports.multipleErrors = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        required: true
      },
      message: {
        type: 'string',
        required: true
      },
      detail: {
        type: 'string',
        required: true
      },
      errors : {
        type : 'object',
        items : {
          properties : {
            id: {
              type: 'string',
              required: true
            },
            message: {
              type: 'string',
              required: true
            },
            detail: {
              type: 'string',
              required: true
            }
          }
        }
      }
    }
};



var accessPOST = exports.accessPOST = {
    type: 'object',
    properties: {
      url : {
        type: 'string', // url?
        required: true
      },
      poll : {
        type: 'string', // url?
        required: true
      }
    }
}

var accessGET = exports.accessGET = {
    type: 'object',
    properties: {
      status : {
        type: 'string', 
        required: true
      }
    }
}