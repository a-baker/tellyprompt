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

$(document).ready(function(){

   if (defaultSearch){
       $('.searchBox').val(defaultSearch);
       $('.searchForm').submit();
   }

    //history.replaceState({term: defaultSearch},'', window.location);
});

function update (e, h){
    if(e) { e.preventDefault(); }
    var searchTerm = $('.searchBox').val().replace(/\//g, '%2F');
    if (searchTerm == "" || searchTerm == null){
        if(h){$('.series').html("")}
        return;
    }
    $('.errBar').removeClass('show');
    bar.go(30);

    if (!h && searchTerm !== location.pathname.substr(location.pathname.lastIndexOf('/')+1, location.pathname.length).replace(/%2F/g, "/").replace(/%20/g, " ")) {
        window.history.pushState(null, "", "/search/" + searchTerm);
    }

    $.ajax({
        url: "/show/search/" + searchTerm,
        type: 'GET',
        success: function(res) {
            if(res !== "Sorry, there was a problem loading that show.") {
                if(res !== "No shows found with the name " + searchTerm + ".") {
                    showID = res.id;
                    var length = res.seasons.length;
                    $('.series').html("");

                    for(i = 0; i < length; i++){
                        var data = res.seasons[i];
                        var season = data.season;
                        var seasonTitle = data.season == 0 ? "Specials & Extras" : "Season " + data.season;

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

                                    if(text == "Sorry, there was a problem loading that season.") {
                                        $('.errText').html(res);
                                        $('.errBar').addClass('show');
                                        bar.go(100);
                                        return;
                                    } else {
                                        div.append(text);
                                        thisseason.data("loaded", true);

                                        bar.go(100);

                                        div.toggle();
                                        $('.errBar').removeClass('show');
                                        chatredirect();
                                    }
                                }
                            });
                        } else {
                            div.toggle();
                        }
                    });
                } else {
                    $('.errText').html(res);
                    $('.errBar').addClass('show');
                    bar.go(100);
                }
            } else {
                $('.errText').html('Sorry, there was a problem loading that show. Please try again in a moment.');
                $('.errBar').addClass('show');
                bar.go(100);
            }
        }
    });
}

$('.searchForm').submit(function(e){
    update(e, null);
});

$('.errBar').click(function(){
    $(this).removeClass('show');
});
//
//$(window).bind("popstate", function(event) {
//    var term = location.pathname.substr(location.pathname.lastIndexOf('/')+1, location.pathname.length);
//    term = decodeURI(term).replace(/%2F/g, "/");
//    $('.searchBox').val(term);
//    update(null, true);
//});
