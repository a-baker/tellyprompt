$('.showHeader').click(function(){
    console.log("click");
    var div = $(this).next('.seasonWrapper');
    div.toggle();
})
