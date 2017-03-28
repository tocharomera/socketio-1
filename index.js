express  = require('express')
var app  = express()
var http = require('http').Server(app)
var io   = require('socket.io')(http)

var pixels = [0,1,0,1,0,1,1,1,1,1,0,1,1,0,1]

//soket to panel and to mobile devices
var panelsock  = io.of('/panel')
var mobilesock = io.of('/mobile')

//template engine using mustache
var cons = require('consolidate')

// assign the mustache engine to .html files
app.engine('html', cons.mustache);
// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
//allow access to public folder
app.use(express.static('public'))

app.get('/panel', function (req, res) {
  res.sendFile(__dirname + '/public/panel.html')
})


app.get('/mobile/:id', function (req, res) {
  //render template
  res.render('mobile',{id:req.params.id,festival:'ars electronica'})
})

/* panel connection */
panelsock.on('connection',function(socket){

  console.log('a user connected to panel: '+socket.id)
  socket.emit('pixels',pixels)
  socket.on('disconnect', function(){
    console.log('user disconnected from panel: '+socket.id)
  })
  //updates all bg of all the mobile devices
  socket.on('pixels',function(_pixels){
    pixels = _pixels
    console.log(pixels)
    for(var pixelid=0;pixelid<15;pixelid++){

      var room = mobilesock.adapter.rooms[pixelid]
      if(room){
        var color = pixels[pixelid] ? 'black' : 'white'
        console.log(color)
        mobilesock.to(pixelid).emit('bg',color)
      }
    }
  })

})

/* mobile connection */
mobilesock.on('connection',function(socket){

  var pixelid = null

  //informs which pixelid is assoc to the device
  socket.on('pixel',function(_pixelid){
    pixelid = _pixelid
    console.log('a mobile connected: '+socket.id + " pixel:" + pixelid)
    socket.join(pixelid)
    //count connections
    connCount()
    //send the color of the pixel
    var color = pixels[pixelid] ? 'black' : 'white'
    console.log(pixels)
    console.log(pixels[pixelid])
    console.log('>'+color)
    socket.emit('bg',color)
  })

  //send to all panel connections
  socket.on('disconnect', function(){
    console.log('mobile disconnect: '+socket.id)
    connCount()
  })

})

//count connections and send to panels
function connCount(){
  var connCount = []
  for(var pixelid=0;pixelid<15;pixelid++){
    connCount.push(null)
    var room = mobilesock.adapter.rooms[pixelid]
    if(room){
      connCount[pixelid] = room.length
    }else{
      connCount[pixelid] = 0
    }
  }
  panelsock.emit('connCount',connCount)
  console.log(connCount)
}
//convert str formed by 0 and 1 to bit aray 
function str2arr(str){
  var bits = []
  for(var i=0;i<str.length;i++){
    var bit = (str[i] == '0') ? 0 : 1
    bits.push(bit)
  }
  return bits
}

http.listen(3000,function(){
  console.log('listening on 3000')
})
