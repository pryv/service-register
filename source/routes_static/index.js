module.exports = index;
var fs = require('fs');

function index(app){ 
  var index_cache = null; 
  function read_index(req,res,next) {
    fs.readFile(__dirname + '/../public/index-en.html', 'utf8', function(err, text){
      index_cache = text;
      res.send(text);
    });
  }

  app.get('/', function(req, res, next){
    if (index_cache != null) {
      res.send(index_cache);
    } else {
      read_index(req,res,next);
    }
  });
}