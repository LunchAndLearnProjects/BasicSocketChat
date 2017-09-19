var express = require('express');
var ejs = require('ejs');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Message = require('./models/message');

mongoose.connect('mongodb://localhost/basicsocketchat', { useMongoClient: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/scripts', express.static(__dirname + '/assets/js/'));
app.use('/stylesheets', express.static(__dirname + '/assets/css/'));

app.set('view engine', 'ejs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/sign-in.html');
});

app.post('/login', function(req, res){
  var chatHandle = req.body.chatHandle;
  var uriChatHandle = encodeURIComponent(chatHandle);
  res.redirect('/chat?name=' + uriChatHandle);
})

app.get('/chat', function(req, res){
  console.log(req.body);
  console.log(req.query);
  var name = req.query.name;
  if (name === undefined)
    res.redirect('/');
  else
    res.render('index', {chatName: name});
})

io.on('connection', function(socket){
  console.log('A user connected');
  socket.on('disconnect', function(){
    console.log('A user disconnected');
  });
  socket.on('chat message', function(data){
    var newMessage;
    console.log('msg:' + data);
    data.date = dateFormat(new Date(), "mmmm dS, yyyy, h:MM TT");
    newMessage = new Message({
      value: data.message,
      date: data.date,
      username: data.chatHandle
    });
    newMessage.save(function(err) {
      if (err)
        console.log(err);
      else
        console.log('message saved');
    });
    io.emit('chat message', data);
  })
})

http.listen(3000, function(){
  console.log('Listening on :3000...');
})
