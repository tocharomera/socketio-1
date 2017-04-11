
$(document).ready(init)
var socket
var cells
function init(){
  socket = io('/panel')

  cells = []
  for(var i=0;i<15;i++){
    //select every cell
    var cell = $('#c'+i)
    cells.push(cell)
  }

  //display how many devices are associated to each pixel
  socket.on('connCount',function(connCount){
    for(var i=0;i<15;i++){
      if(connCount[i] > 0){
        cells[i].addClass('connected')
      }else{
        cells[i].removeClass('connected')
      }
    }
  })

  socket.on('pixels',function(code){
    displayBits(code)
  })

  $('table.table td').click(function(){
    $(this).toggleClass('selected')
    var code = getUpdate()
    displayBits(code)
    socket.emit('pixels',code)
  })

  //message forme
  $('#msgsend').click(function(){
    var msg = $('#msginput').val()
    $.get('/msg/'+msg)
  })
}
//display the code of the character display
function getUpdate(){
  var bits = []
  for(var i=0;i<cells.length;i++){
    var cell = cells[i]
    var bit  = cell.hasClass('selected')
    //http://stackoverflow.com/questions/7820683/convert-boolean-result-into-number-integer#7820695
    bits.push(bit + false)
  }
  return bits
}

function displayBits(bits){
  var code = ''
  for(var i=0;i<bits.length;i++){
    var cell = cells[i]
    var bit  = bits[i]
    if(bit){
      cell.addClass('selected')
    }else{
      cell.removeClass('selected')
    }
  }
  code = '['+bits.join(',')+']'
  $('#code').text(code)
}
