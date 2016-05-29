var bar = new Nanobar({
});

$('.btn_search').click(function(e){
    e.preventDefault();
    searchPage();
});

$('.btn_fav').click(function(e){
    e.preventDefault();
    favouritesPage(1);
});

$('.btn_popular').click(function(e){
    e.preventDefault();
    popularPage();
});

var searchPage = function(){
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_search').parent().addClass('active');

    $.ajax({
        url: "/search",
        type: 'POST',
        data: {ajax: 1},
        success: function(res){

            if(!window.location.pathname.split('/')[1] || window.location.pathname.split('/')[1] !== "search" || window.location.pathname.split('/')[2]) {
                window.history.pushState(null, "", "/search");
            }

            $('.body').html("");
            $('.body').append(res);
            bar.go(100);
        }
    });
}

var favouritesPage = function(pagenum) {
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_fav').parent().addClass('active');

    $.ajax({
        url: "/favourites/" + pagenum,
        type: 'POST',
        data: {username: localUser},
        success: function(res){
            if(window.location.pathname !== "/favourites/" + pagenum) {
                window.history.pushState(null, "", "/favourites/" + pagenum);
            }
            $('.body').html("");
            $('.body').append(res);
            bar.go(100);
            chatredirect()
            updateFavPageButtons(page);

            if(pagenum !== page) {
                window.history.replaceState(null, "", "/favourites/" + page);
            }
        }
    });
}

var updateFavPageButtons = function(page){
    $('.btn-next').removeClass('inactive');
    $('.btn-prev').removeClass('inactive');

    if (page >= pages) { $('.btn-next').addClass('inactive'); }
    if (page == 1) { $('.btn-prev').addClass('inactive'); }

    nextPage = page + 1;
    prevPage = page - 1;


    $('.btn-next').click(function(e){
        e.preventDefault();
        favouritesPage(nextPage);
    });

    $('.btn-prev').click(function(e){
        e.preventDefault();
        favouritesPage(prevPage);
    });


}

var popularPage = function() {
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_popular').parent().addClass('active');

    $.ajax({
        url: "/popular",
        type: 'POST',
        data: {ajax:1},
        success: function(res){
            if(!window.location.pathname.split('/')[1] || window.location.pathname.split('/')[1] !== "popular" || window.location.pathname.split('/')[2]) {
                window.history.pushState(null, "", "/popular");
            }
            $('.body').html("");
            $('.body').append(res);
            bar.go(100);
            chatredirect()
        }
    });
}

var performSearch = function(searchterm) {
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_search').parent().addClass('active');

    $.ajax({
        url: "/search",
        type: 'POST',
        data: {ajax: 1},
        success: function(res){

            $('.body').html("");
            $('.body').append(res);
            $('.searchBox').val(searchterm);
            $('.searchForm').submit();
            bar.go(100);
        }
    });

    console.log('This, on the other hand, should not.');
}

function chatredirect() {
    $('.chatLink').click(function(e){
        e.preventDefault();
        $('.navbar-right').children().removeClass('active');
        bar.go(30);
        var link = this.href;

        $.ajax({
            url: link,
            type: 'POST',
            data: {ajax: 1},
            success: function(res){
                $('.body').html("");
                $('.body').append(res);
                $.getScript("/scripts/chat_compiled.js")
                bar.go(100);
                console.log(link.href);
                window.history.pushState(null, "", link);
                favClick();
            }
        });
    });
}

function getChat(link) {
     $('.navbar-right').children().removeClass('active');
        bar.go(30);
        $.ajax({
            url: link,
            type: 'POST',
            data: {ajax: 1},
            success: function(res){
                $('.body').html("");
                $('.body').append(res);
                $.getScript("/scripts/chat_compiled.js")
                bar.go(100);
                favClick();
            }
        });
}

function favClick() {
    $('.favourite').click(function(e){
        e.preventDefault();
        var link = $(this);

        $.ajax({
          url: this.href,
          dataType: 'json',
          type: 'POST',
          data: {username: localUser},
          success: function(data) {
            data.favourite ? link.children().addClass('active') : link.children().removeClass('active');
          },
          error: function(xhr, status, err) {
            console.error("error:", status, err.toString());
          }
        });
    });
}

function updateFromUrl(path){

    var section = path.split('/');

    switch(section[1]) {
        case "search":
            if(window.location.pathname == '/search'){
               searchPage();
                console.log('yay?');
            } else {
                performSearch(decodeURI(section[2]).replace(/%2F/g, "/"));
            }
            break;
        case "favourites":
            if(section[2] && !isNaN(section[2])){
                favouritesPage(Number(section[2]));
            } else {
                favouritesPage(1);
            }

            break;
        case "popular":
            popularPage();
            break;
        case "chat":
            if(section[2] && section[3] && section[4]);
            getChat(window.location.pathname);
            break;
        default:
            $('.body').html('');
            break;
    }
}

$('.navbar-right a').on('click', function(){
    if ($('body').width() < 768) { $('.navbar-toggle').click() }
});

$(window).bind("popstate", function(event) {
    updateFromUrl(window.location.pathname);
});

$(document).ready(function(){
    updateFromUrl(window.location.pathname);
});
