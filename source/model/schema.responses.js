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