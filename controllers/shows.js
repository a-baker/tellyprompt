var unirest = require('unirest');
var API_KEY = require('../models/tmdbAPIKey');

module.exports = {
    getShowInfo: getShowInfo,
    getSeasonInfo: getSeasonInfo,
    getSeasons: getSeasons,
    getEpisodeInfo: getEpisodeInfo
}

function getShowInfo(search, callback){

    var obj = {"title": "", id: 0, poster:"", "seasons": []};

    unirest.get("https://api.themoviedb.org/3/search/tv?query=" + search + "&api_key=" + API_KEY)
                    .send()
                    .end(response=> {
                        if (response.ok) {
                            var data = response.body;
                            if(data.total_results > 0){
                                var id = data.results[0].id;
                                obj.id = id;
                                unirest.get("https://api.themoviedb.org/3/tv/" + id + "?api_key=" + API_KEY)
                                    .send()
                                    .end(response=> {
                                        if (response.ok) {
                                            var data = response.body;
                                            obj.title = data.name;
                                            obj.poster = data.poster_path;
                                            var seasons = data.seasons;
                                            seasons.forEach(function(item,index){
                                                obj.seasons.push({"season": item.season_number, "episodes": item.episode_count, "poster": item.poster_path});
                                            });

                                            callback(null, obj);

                                        } else {
                                            console.log("Error getting show: ", response.error);
                                            callback("Sorry, there was a problem loading that show.");
                                        }
                                    });
                            } else {
                                callback("No shows found with the name " + search + ".");
                                return;
                            }
                        } else {
                            console.log("Error in search: ", response.error);
                            callback("Sorry, there was a problem loading that show.")
                        }
                    });
}

function getSeasonInfo(series, season, callback){
    //GET SEASON
         unirest.get("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "?api_key=" + API_KEY)
            .send()
            .end(response=> {
                if (response.ok) {
                    var showseason = response.body;

                        //GET SHOW
                        unirest.get("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + API_KEY)
                            .send()
                            .end(response=> {
                                if (response.ok) {
                                    var show = response.body;

                                    var seasonData = {"season": season, "show": show.name, "episodes": [], "backdrop": "http://image.tmdb.org/t/p/original" + show.backdrop_path, "showID" : show.id};

                                    showseason.episodes.forEach(function(item, index){
                                        seasonData.episodes.push({"episode": item.episode_number, "title": item.name, "still": item.still_path == null? "/img/nostill.jpg" : "http://image.tmdb.org/t/p/original" + item.still_path });
                                    });

                                    callback(null, seasonData);

                                } else {
                                    console.log("Got an error: ", response.error);
                                    callback("Sorry, there was a problem loading that season.");
                                }
                            });
                } else {
                    console.log("Got an error: ", response.error);
                    callback("Sorry, there was a problem loading that season.");
                }
            });
}

function getSeasons(series, callback){
    var seriesData = {"title": series.title, "id": series.id, seasons: []};
    async.eachSeries(series.seasons, function(item, cb){
        getSeasonInfo(series.id, item.season, function(err, data){
            var season = {"season": data.season, "episodes": data.episodes};
            seriesData.seasons.push(season);
            cb();
        });
    }, function(){
        if(!err){
            callback(seriesData);
        } else {
            callback(err);
        }

    });
}

function getEpisodeInfo(id, callback){
    var epstring = id;

    var s = epstring.indexOf("s");
    var e = epstring.indexOf("e");

    var series = epstring.substring(0,s);
    var season = epstring.substring(s+1, e);
    var episode = epstring.substring(e+1, epstring.length);

     //GET EPISODE
     unirest.get("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "/episode/" + episode + "?api_key=" + API_KEY)
        .send()
        .end(response=> {
            if (response.ok) {
                var ep = response.body;

                    //GET SHOW
                    unirest.get("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + API_KEY)
                        .send()
                        .end(response=> {
                            if (response.ok) {
                                var show = response.body;

                                var showData = {'title': ep.name, "season": season, "episode": episode, show: show.name, "still": ep.still_path == null? "/img/nostill.jpg" : "http://image.tmdb.org/t/p/original" + ep.still_path , "showID": show.id};

                                callback(null, showData);


                            } else {
                                console.log("Got an error: ", response.error);
                                callback("Sorry, there was a problem loading that episode.");
                            }
                        });
            } else {
                console.log("Got an error: ", response.error);
                callback("Sorry, there was a problem loading that episode.");
            }
        });
}