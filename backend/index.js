var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var streamApi = require('./api/stream');
var restApi = require('./api/rest');

app.use(express.static('public'));

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api/tokens', restApi.getTokens);

io.on('connection', function(socket){
  console.log('user connected');
    
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('subscribe', streamApi.subscribe(io));
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});

