express  = require('express')
var app  = express()
var http = require('http').Server(app)
var io   = require('socket.io')(http)

var panelsock  = io.of('/panel')
var mobilesock = io.of('/mobile')

app.use(express.static('public'))

panelsock.on('connection',function(socket){
  console.log('a user connected to panel: '+socket.id)
  //send al connected devices
  mobilesock.clients(function(error, clients){
    for(var i=0;i<clients.length;i++){
      var connid = clients[i]
      socket.emit('newconn',connid)
    }
  })
  socket.on('disconnect', function(){
    console.log('user disconnected from panel: '+socket.id)
  });

  socket.on('bg',function(msg){
    var connid = msg['connid']
    var bg = msg['bg']
    console.log(msg);
    //http://stackoverflow.com/a/24224146/2205297
    mobilesock.to(connid).emit('bg', bg);
  })

})

mobilesock.on('connection',function(socket){
  console.log('a mobile connected: '+socket.id)
  //send to all panel connections
  panelsock.emit('newconn',socket.id)

  socket.on('disconnect', function(){
    console.log('mobile disconnect: '+socket.id)
    panelsock.emit('disconn',socket.id)
  });

})

http.listen(3000,function(){
  console.log('listening on 3000')
})
