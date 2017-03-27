$(document).ready(init)

function init(){
  var socket = io('/mobile')
  socket.on('connect', function() {
    socket.emit('pixel',pixelid)
  });
  socket.on('bg', function(color) {
    // Connected, let's sign-up for to receive messages for this room
     $('body').css('background', color)
  });
}
