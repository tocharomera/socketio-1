
$(document).ready(init)
var socket

function init(){
  socket = io('/panel')

  socket.on('newconn',function(connid){
    var btn = $('<button type="button" class="btn phone" data-toggle="button" aria-pressed="false" autocomplete="off">Phone</button>')
    btn.data('connid',connid)
    btn.click(phoneHandler)
    $('.row').append(btn)
  })

  socket.on('disconn',function(connid){
    var btn;
    $('.row > .phone').each(function(){
      if ($(this).data('connid') == connid) {
        $(this).remove()
      }
    })

  })

}

function phoneHandler(event){
  var bg
  var connid = $(this).data('connid')
  if($(this).hasClass('active')){
    bg = 'black'
  }else{
    bg = 'white'
  }
  socket.emit('bg',{'bg':bg,'connid':connid})

}
