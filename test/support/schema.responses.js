//success : changeEmail
exports.success = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      required: true
    }
  }
};

//route : service/info
exports.serviceInfo = {
  type: 'object',
  properties: {
    serial: {
      type: 'string'
    },
    register: {
      type: 'string',
      required: true
    },
    access: {
      type: 'string',
      required: true
    },
    api: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string'
    },
    home: {
      type: 'string'
    },
    support: {
      type: 'string'
    },
    terms: {
      type: 'string'
    },
    event_types: {
      type: 'string'
    }
  }
};

//route : check
exports.checkExists = {
  type: 'object',
  properties: {
    exists: {
      type: 'boolean',
      required: true
    }
  }
};

//route : check
exports.checkUID = {
  type: 'object',
  properties: {
    reserved: {
      type: 'boolean',
      required: true
    }
  }
};

//route : admin-users
exports.userList = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      required: true
    }
  }
};

//route : admin-users
exports.serverList = {
  type: 'object',
  properties: {
    servers: {
      type: 'object',
      required: true
    }
  }
};

//route : admin-users
exports.count = {
  type: 'object',
  properties: {
    count: {
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
    },
    apiEndpoint: {
      type: 'string',
      required: true
    }
  }
};

//confirm : server & server : server
exports.server = {
  type: 'object',
  properties: {
    server: {
      type: 'string',
      required: true
    },
    alias: {
      type: 'string',
      required: true
    }
  }
};

//confirm : server (already confirmed)
exports.alreadyConfirmed = {
  type: 'object',
  properties: {
    server: {
      type: 'string',
      required: true
    },
    alias: {
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
    errors: {
      type: 'object',
      items: {
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
      }
    }
  }
};

const serviceInfo = {
  type: 'object',
  required: true,
  properties: {
    name: {
      type: 'string',
      required: true
    },
    register: {
      type: 'string',
      required: true
    }
  }
};

exports.accessPOST = {
  type: 'object',
  properties: {
    authUrl: {
      type: 'string', // url?
      required: true
    },
    poll: {
      type: 'string', // url?
      required: true
    },
    serviceInfo: serviceInfo
  }
};
