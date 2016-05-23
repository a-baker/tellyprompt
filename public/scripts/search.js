var bar = new Nanobar({
    bg: "#333"
});

var showID = 0;

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
            showID = res.id;
            var length = res.seasons.length;
            $('.series').html("");

            for(i = 0; i < length; i++){
                var data = res.seasons[i];
                var season = data.season;

                var img = "http://image.tmdb.org/t/p/original" + data.poster;

                $('.series').append("<div class='showHeader'><div class='seasonImg' style='background-image: url(" + img +") '></div><h1>Season " + season + "</h1></div><div class='seasonWrapper'></div>");


            }

            bar.go(100);

            $('.showHeader').click(function(){
                var div = $(this).next('.seasonWrapper');
                var thisseason = $(this);

                if (!thisseason.data("loaded")) {
                    var season = $(this).find("h1").text().split(' ').pop();
                    bar.go(30);
                    $.ajax({
                        url: "/season/" + showID + "/" + season,
                        type: 'GET',
                        async: false,
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


        }
    });
});
