var app = require('../../app');
var config = require('../../utils/config');
var should = require('should');

var dataValidation = require('../support/data-validation');
var schema = require('../../model/schema.responses');

var http = require('http'); 

// TODO Data validation
describe('check', function(){

  describe('GET /:uid/check', function(){
   var tests = { todos: [ 
        { uid: 'abcd', status: 400 , desc : 'too short '}, 
        { uid: 'abcdefghijklmnopqrstuvwxyz', status: 400 , desc : 'too long '}, 
        { uid: 'abc%20def', status: 400 , desc : 'invalid character '}, 
        { uid: 'abc.def', status: 400 , desc : 'invalid character ' },  
        { uid: 'abc_def', status: 400 , desc : 'invalid character ' }, 
        { uid: 'wactiv', status: 200 , desc : 'correct ', JSONvalidation : schema.check_exists }, 
        ]};
   
  function doit (test) {
    var path = '/'+ test.uid +'/check';
    it(' '+ path +'  >> '+ test.desc, function(done){
      var req = http.request({ path: path, port: config.get('http:port'), method: 'GET' }, function(res){
        res.should.have.status(test.status);
        
        
        if (test.JSONvalidation != null) { 
            dataValidation.jsonResponse(res,test.JSONvalidation,done);
         } else {
             done();
         }
         
       }).on('error', function(e) {
         throw new Error("Got error: " + e.message, e);
      });
      req.end();
    });
   }
   
   for (i = 0; i < tests.todos.length ; i++) doit (tests.todos[i]); 
  });
  
});