var app = require('../../app');
var config = require('../../utils/config');
var should = require('should');

var http = require('http'); 

describe('check', function(){

  describe('GET /:uid/check', function(){
   var tests = { todos: [ 
        { uid: 'abcd', status: 400 , desc : 'too short '}, 
        { uid: 'abcdefghijklmnopqrstuvwxyz', status: 400 , desc : 'too long '}, 
        { uid: 'abc def', status: 400 , desc : 'invalid character '}, 
        { uid: 'abc.def', status: 400 , desc : 'invalid character ' },  
        { uid: 'abc_def', status: 400 , desc : 'invalid character ' }, 
        { uid: 'wactiv', status: 200 , desc : 'correct '}, 
        ]};
   
   for (i = 0; i < tests.todos.length ; i++) {
      var test = tests.todos[i];
      var path = '/'+ test.uid +'/check';
      it(' '+ path +'  >> '+ test.desc, function(done){
      http.get({ path: path, port: config.get('http:port') }, function(res){
        res.should.have.status(test.status);
        done();
      });
     });
   }
   
    
  });
  
});