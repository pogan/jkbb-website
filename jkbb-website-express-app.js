
var express = require('express'),
  app = express(),
  http = require('http'),
  httpServer = http.Server(app);

app.use(express.static(__dirname+'/public'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT,()=>{
	console.log('jkbb-website-app listening at '+PORT+' from ',__dirname);
});
