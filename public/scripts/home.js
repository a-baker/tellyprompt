var bar = new Nanobar({
});

$('.btn_search').click(function(e){
    e.preventDefault();
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_search').parent().addClass('active');

    $.ajax({
        url: "/search",
        type: 'GET',
        success: function(res){
            window.history.pushState(null, "", "/search");
            $('.body').html("");
            $('.body').append(res);
            bar.go(100);
        }
    });
});

$('.btn_fav').click(function(e){
    e.preventDefault();
    bar.go(30);

    $('.navbar-right').children().removeClass('active');
    $('.btn_fav').parent().addClass('active');

    $.ajax({
        url: "/favourites",
        type: 'POST',
        data: {username: localUser},
        success: function(res){
            window.history.pushState(null, "", "/favourites");
            $('.body').html("");
            $('.body').append(res);
            bar.go(100);
            chatredirect()
        }
    });
});

function chatredirect() {
    $('.chatLink').click(function(e){
        e.preventDefault();

        bar.go(30);
        var link = this.href;

        $.ajax({
            url: link,
            type: 'GET',
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
