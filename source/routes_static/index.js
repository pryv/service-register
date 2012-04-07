module.exports = index;

function index(app){ 
    app.get('/', function(req, res, next){
      res.render("index.html");
    });
}