//success : changeEmail
exports.success = {
  type: 'object',
  properties: {
    success : {
      type: 'boolean',
      required: true
    }
  }
};

//route : check
exports.checkExists = {
  type: 'object',
  properties: {
    exists : {
      type: 'boolean',
      required: true
    }
  }
};

//route : check
exports.checkUID = {
  type: 'object',
  properties: {
    reserved : {
      type: 'boolean',
      required: true
    }
  }
};

//route : admin-users
exports.userList = {
  type: 'object',
  properties: {
    users : {
      type: 'array',
      required: true
    }
  }
};


//route : admin-users
exports.serverList = {
  type: 'object',
  properties: {
    servers : {
      type: 'object',
      required: true
    }
  }
};

//route : admin-users
exports.count = {
  type: 'object',
  properties: {
    count : {
      type: 'integer',
      required: true
    }
  }
};


//route : init
exports.userCreated = {
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
exports.server = {
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
exports.alreadyConfirmed = {
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


//apps
exports.appsList = {
  type: 'object',
  properties: {
    apps: {
      type: 'object'
    }
  }
};

exports.appsSingle = {
  type: 'object',
  properties: {
    app: {
      type: 'object'
    }
  }
};

//hostings
exports.hostings = {
  type: 'object',
  properties: {
    regions: {
      type: 'object'
      // TODO add references to
    }
  }
};


//errors
exports.error = {
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
      type: 'string'
    }
  }
};

//errors multiple
exports.multipleErrors = {
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



exports.accessPOST = {
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

exports.accessGET = {
  type: 'object',
  properties: {
    status : {
      type: 'string',
      required: true
    }
  }
};
