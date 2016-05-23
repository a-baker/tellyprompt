var bar = new Nanobar({
});

var showID = 0;

function scrollDown(amount, time){
    $('html, body').animate({
        scrollTop: '+=' + amount
    }, time);
}

function scrollTop(){
    $('html, body').animate({
        scrollTop: 0
    }, 100);
}

//$(document).ajaxSend(function () {
//    bar.go(30);
//}).ajaxComplete(function () {
//    bar.go(100);
//});

$('.searchForm').submit(function(e){
    e.preventDefault();
    var searchTerm = $('.searchBox').val();

    bar.go(30);

    $.ajax({
        url: "/show/search/" + searchTerm,
        type: 'GET',
        success: function(res) {
            if(res !== "Sorry, there was a problem loading that show.") {
                if(res !== "No shows found with the name " + searchTerm + ".") {
                    showID = res.id;
                    console.log(res);
                    var length = res.seasons.length;
                    $('.series').html("");

                    for(i = 0; i < length; i++){
                        var data = res.seasons[i];
                        var season = data.season;

                        var img = "http://image.tmdb.org/t/p/original" + data.poster;

                        $('.series').append("<div class='showHeader'><div class='seasonImg' style='background-image: url(" + img +") '></div><h1>Season " + season + "</h1></div><div class='seasonWrapper'></div>");
                    }

                    scrollTop()

                    bar.go(100);

                    $('.showHeader').click(function(){
                        var div = $(this).next('.seasonWrapper');
                        var thisseason = $(this);

                        if (!thisseason.data("loaded")) {
                            bar.go(30);
                            var season = $(this).find("h1").text().split(' ').pop();
                            $.ajax({
                                url: "/season/" + showID + "/" + season,
                                type: 'GET',
                                async: true,
                                success: function(res) {
                                      var text = res;
                                    div.append(text);
                                    thisseason.data("loaded", true);

                                    bar.go(100);

                                    div.toggle();
                                }
                            });
                        } else {
                            div.toggle();
                        }
                    });
                } else {
                    alert(res);
                    bar.go(100);
                }
            } else {
                alert('Sorry, there was a problem loading that show. Please try again in a moment.')
                bar.go(100);
            }


        }
    });
});
