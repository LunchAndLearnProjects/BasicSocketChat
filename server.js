var express = require('express');
var ejs = require('ejs');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

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
  else{
    Message.find().sort({ date: 1 }).exec(function(err, messageList){
      if (err)
        res.send(err);
      
      messageList.forEach(function(msg){
        msg.formattedDate = dateFormat(msg.date, "mmmm dS, yyyy, h:MM TT");
      });
      res.render('index', {chatName: name, messages: messageList});
    });
  }
})

io.on('connection', function(socket){
  console.log('A user connected');
  
  socket.on('load messages', function(){
    console.log('load messages');
    Message.find().sort({ date: 1 }).exec(function(err, messages){
      var messageList = [];
      if (err) 
        console.log(err);
      else {
        messages.forEach(function(msg){
          var message = {
            username: msg.username,
            formattedDate: dateFormat(msg.date, "mmmm dS, yyyy, h:MM TT"),
            value: msg.value
          };
          messageList.push(message);
        });
        socket.emit('loaded messages', messageList);
      }
    });
  });
  socket.on('disconnect', function(){
    console.log('A user disconnected');
  });
  socket.on('chat message', function(data){
    var newMessage;
    var now = new Date()
    console.log('msg:' + JSON.stringify(data));
    data.formattedDate = dateFormat(now, "mmmm dS, yyyy, h:MM TT");
    newMessage = new Message({
      value: data.value,
      date: now,
      username: data.username
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
