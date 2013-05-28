//success : changeEmail
var success = exports.success = {
  type: 'object',
  properties: {
    success : {
      type: 'boolean',
      required: true
    }
  }
};

//route : check
var checkExists = exports.checkExists = {
  type: 'object',
  properties: {
    exists : {
      type: 'boolean',
      required: true
    }
  }
};

//route : check
var checkUID = exports.checkUID = {
  type: 'object',
  properties: {
    reserved : {
      type: 'boolean',
      required: true
    }
  }
};

//route : admin-users
var userList = exports.userList = {
  type: 'object',
  properties: {
    users : {
      type: 'array',
      required: true
    }
  }
};


//route : admin-users
var serverList = exports.serverList = {
  type: 'object',
  properties: {
    servers : {
      type: 'object',
      required: true
    }
  }
};



//route : admin-users
var count = exports.count = {
  type: 'object',
  properties: {
    count : {
      type: 'integer',
      required: true
    }
  }
};


//route : init
var userCreated = exports.userCreated = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      required: true
    },
    server: {
      type: 'string',
      required: true
    }
  }
};


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
};

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
};

//hostings
var hostings = exports.hostings = {
  type: 'object',
  properties: {
    regions: {
      type: 'object'
      // TODO add references to
    }
  }
};


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
};

var accessGET = exports.accessGET = {
  type: 'object',
  properties: {
    status : {
      type: 'string',
      required: true
    }
  }
};