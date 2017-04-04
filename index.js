express  = require('express')
var app  = express()
var http = require('http').Server(app)
var io   = require('socket.io')(http)
var os   = require('os')

//
var pixels = [0,1,0,1,0,1,1,1,1,1,0,1,1,0,1]

var port = 3000
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
  //list interfaces
  var ifaces = os.networkInterfaces();
  var address = 'no address'
  for(var ifname in ifaces){
    iface = ifaces[ifname]
    for(var i=0;i<iface.length;i++){
      var ifaddr = iface[i]['address']
      //filter ipv6 and localhost addresses
      if( ifaddr.indexOf('.') != -1 && ifaddr.substr(0,3) != '127'){
        address = ifaddr
      }
    }
  }

  res.render('panel',{address:address,port:port})
})

app.get('/', function (req, res) {
  //if no mobile is specified connect to a empty pixel
  for(var pixelid=0;pixelid<15;pixelid++){
    var room = mobilesock.adapter.rooms[pixelid]
    if(!room){
        res.redirect('/mobile/'+pixelid)
    }
  }
})

app.get('/mobile/:id', function (req, res) {
  //if id is > 15 redirect
  //http://stackoverflow.com/a/11355430/2205297
  if (!req.params.id){
    for(var pixelid=0;pixelid<15;pixelid++){
      var room = mobilesock.adapter.rooms[pixelid]
      if(!room){
          res.redirect('/mobile/'+pixelid)
      }
    }
  }
  //render template
  res.render('mobile',{id:req.params.id})
})

/* panel connection */
panelsock.on('connection',function(socket){

  console.log('a user connected to panel: '+socket.id)
  //send pixel data
  socket.emit('pixels',pixels)
  //send connection data
  connCount()
  socket.on('disconnect', function(){
    console.log('user disconnected from panel: '+socket.id)
  })
  //updates all bg of all the mobile devices
  socket.on('pixels',function(_pixels){
    pixels = _pixels
    console.log(pixels)
    //update rest of panels
    socket.broadcast.emit('pixels',pixels)
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

http.listen(port,function(){
  console.log('listening on ' + port)
})
