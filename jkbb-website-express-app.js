
var express = require('express'),
  app = express(),
  http = require('http'),
  httpServer = http.Server(app);

app.use(express.static(__dirname+'/public'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3001;
// Domyślnie tylko localhost (ruch z zewnątrz przez nginx); w kontenerze podglądu HOST=0.0.0.0.
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, ()=>{
	console.log('jkbb-website-app listening at '+PORT+' from ',__dirname);
});
