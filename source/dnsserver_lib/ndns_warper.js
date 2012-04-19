var ndns = require('./ndns.js');

require('./_extend.js');

var dgram = require('dgram');
var server = ndns.createServer('udp4');

var logger = require('winston');
console = logger;

//LIGHTENED VERSION OF  https://github.com/badlee/fun-dns


exports.start = function(NAMES,BIND_PORT,BIND_HOST,dynamic_call,done) {

//server launch
  UpdateConfFile = (new Date()).format("Ymd11");
//console.log("UpdateConfFile "+UpdateConfFile);


//STEP 2
  var send_response = function (req,res,rec) {
    res.setHeader(req.header);	
    for (var i = 0; i < req.q.length; i++)
      res.addQuestion(req.q[i]);

    /* ** */
    if(!rec){
      logger.info("Not found",req.q[0].name,"on this server, and proxy list is empty");
      // no proxy on this server (added by Perki)
      // maybe some code should be sent
      res.setHeader(req.header);
      res.send();
      return;
    }


    res.header.qr = 1;
    res.header.ra = 1;
    res.header.rd = 0;

    /* Nombre de reponse */
    res.header.ancount = rec.REP.length;
    /* Nombre de namespace */
    res.header.nscount = rec.NS.length;
    /* Nombre de reponse aditionnel */
    res.header.arcount = rec.ADD.length;
    /* ajout des reponses */
    var j = 1;
    for(var i=0;i<rec.REP.length;i++){
      res.addRR.apply(res,rec.REP[i]);
    }

    /* ajout des NS */
    for(var i=0;i<rec.NS.length;i++){
      res.addRR.apply(res,rec.NS[i]);
    }

    /* ajout des ADD */
    for(var i=0;i<rec.ADD.length;i++){
      res.addRR.apply(res,rec.ADD[i]);
    }

    res.send();
  }

  server.on("request", function(req, res) {
    if (req.q.length > 0) {
      var name = req.q[0].name;
      if (name == ".") name = "";



      return dynamic_call(name,send_response,req,res);

    }
    var rec;
    // close 
    send_response(req,res,rec);
  }
  );

//STEP 1
  /** REMOVED FOR A SIMPLER ONE
server.on("request", function(req, res) {
    if (req.q.length > 0) {
        var name = req.q[0].name;
        if (name == ".")
                name = "";


        // Test le nom 
        //find info dns here
        var rec;
        if(NAMES && NAMES[name]){
            rec = getRecords(NAMES[name],name);
            return send_response(req,res,rec);
        }

        if(NAMES){ // regexp search
            for(i in NAMES){
                if(i.search(/\!/) != 0) continue;	
                t = i
                    .replace("!","")
                    .replace(/\./g,"\\.")
                    .replace("*",".*")
                    .replace("%w","[a-zA-Z0-9_]+")
                    .replace("%d","[0-9]+")
                    .replace("%h","[a-fA-F0-9]+");
                t = new RegExp("^"+t+"$");
                if(t.test(name)){
                    console.info("Found",t,"in",name);
                    if (NAMES[i] == 'dynamic') {
                         return dynamic_call(name,send_response,req,res);
                    }
                    rec = getRecords(NAMES[i],name);
                }
                t = '';
            }

       }

    }
    // close 
    send_response(req,res,rec);
});
   **/

  /**
process.on('uncaughtException', function (err) {
  if (err == false || err == undefined) {
      err = new Error();
  }
  logger.error("NDNS Erreur:"+ err);
  logger.error(err.stack);
  if(err.code){
  	switch(err.code){
  		case 'EADDRNOTAVAIL':
  			console.error("\tL'adresse n'est pas disponible!");
  			break;
  		case 'EADDRINUSE':
  			console.error("\tLe port est deja utilise!");
  			break;
  		case 'EACCES':
  			console.error("\tVerifier vos droits!");
  			break;
  	}
  	process.exit();
  };
});
   **/

  server.bind(BIND_PORT,BIND_HOST);
  done("DNS Started on "+BIND_HOST+":"+BIND_PORT);
}


var getRecords = function(data,name){
  // check if this is a dynamic request

  var ret = {
      REP : [],
      NS  : [],
      ADD : []
  };
  var i=0;
  var j,k=0;
  for(i in data){
    j = String(data[i]).replace(/{name}/g,name);

    switch(i.toLowerCase()){
    case 'ip':
      /* adresse IP */
      data[i] = data[i] instanceof Array ? data[i] : [data[i]];
      data[i].rotate(1);
      for(var x=0; x< data[i].length;x++)
        ret.REP.push([name,77, "IN", "A", data[i][x]]);
      break;
    case 'description':
      ret.REP.push([name, 86400, "IN", "TXT", data[i]]);
      break;
    case 'autority':
      data[i] = String(j).split(',').slice(0,2);
      data[i] = data[i].length ==1 ? data[i].concat(data[i]) : data[i]; 
      ret.REP.push([name, 86400, "IN", "SOA"].concat(data[i]).concat([UpdateConfFile,1800, 900, 604800, 86400]));
      break;
    case 'mail':
      data[i] = data[i] instanceof Array ? data[i] : [data[i]];
      var k = 0;
      for(j = 0;j< data[i].length;j++){
        data[i].name = data[i][j].name? data[i].name.replace(/{name}/g,name) : "mail."+name;
        ret.REP.push([name, 86400, "IN", "MX", data[i][j].priority || (++k)*10, data[i][j].name]);
        if(data[i][j].ip){
          data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
          data[i][j].ip.rotate(1);
          for(var x=0; x< data[i][j].ip.length;x++)
            ret.ADD.push([data[i][j].name, 77, "IN", "A", data[i][j].ip[x]]);
        }
      }
      break;
    case 'nameserver':
      for(j = 0;j< data[i].length;j++){
        data[i][j].name = data[i][j].name? data[i][j].name.replace(/{name}/g,name) : "ns"+(++k++)+"."+name;
        ret.NS.push([name, 86400, "IN", "NS" , data[i][j].name]);
        if(data[i][j].ip){
          data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
          data[i][j].ip.rotate(1);
          for(var x=0; x< data[i][j].ip.length;x++)
            ret.ADD.push([data[i][j].name, 77, "IN", "A", data[i][j].ip[x]]);
        };
      }
      break;

    case 'alias':
      data[i] = data[i] instanceof Array ? data[i] : [data[i]];
      for(j = 0;j< data[i].length;j++){
        data[i][j].name = data[i][j].name? data[i][j].name.replace(/{name}/g,name) : "ns"+(++k++)+"."+name;
        ret.REP.push([name, 86400, "IN", "CNAME" , data[i][j].name]);

        if(data[i][j].ip){
          data[i][j].ip = data[i][j].ip instanceof Array ? data[i][j].ip : [data[i][j].ip];
          data[i][j].ip.rotate(1);
          for(var x=0; x< data[i][j].ip.length;x++)
            ret.REP.push([data[i][j].name, 77, "IN", "A", data[i][j].ip[x]]);
        };
      }
      break;
    }
  }
  return ret;
};

exports.getRecords = getRecords;
