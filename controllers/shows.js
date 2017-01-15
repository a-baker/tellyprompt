var got = require('got');
var API_KEY = require('../models/tmdbAPIKey');

module.exports = {
    getShowInfo: getShowInfo,
    getSeasonInfo: getSeasonInfo,
    getSeasons: getSeasons,
    getEpisodeInfo: getEpisodeInfo
}

function getShowInfo(search){
    var searchData, showData; 
    var obj = {"title": "", id: 0, poster:"", "seasons": []};
    return new Promise((resolve, reject) => {
        got("https://api.themoviedb.org/3/search/tv?query=" + search + "&api_key=" + API_KEY, {json: true})
            .then(response=> {
                searchData = response.body;
                if(searchData.total_results > 0){
                    var id = searchData.results[0].id;
                    obj.id = id;
                    return got("https://api.themoviedb.org/3/tv/" + id + "?api_key=" + API_KEY, {json: true});
                } else {
                    throw new Error("No results found");
                }
            })
            .then(response=> {
                showData = response.body;
                obj.title = showData.name;
                obj.poster = showData.poster_path;
                var seasons = showData.seasons;
                seasons.forEach(function(item,index){
                    obj.seasons.push({"season": item.season_number, "episodes": item.episode_count, "poster": item.poster_path});
                });
                resolve(obj);
            })
            .catch(err => {
                console.log("Error getting show: ", err);
                reject("Sorry, there was a problem loading that show.")
            });
    });
}

function getSeasonInfo(series, season, callback){
    var showseason, show;
    //GET SEASON
    got("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "?api_key=" + API_KEY, {json: true})
        .then(response=> {
            showseason = response.body;
            //GET SHOW
            return got("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + API_KEY, {json: true});
        })
        .then(response => {
            show = response.body;
            var seasonData = {"season": season, "show": show.name, "episodes": [], "backdrop": "http://image.tmdb.org/t/p/original" + show.backdrop_path, "showID" : show.id};
            showseason.episodes.forEach(function(item, index){
                seasonData.episodes.push({"episode": item.episode_number, "title": item.name, "still": item.still_path == null? "/img/nostill.jpg" : "http://image.tmdb.org/t/p/original" + item.still_path });
            });
            callback(null, seasonData);
        })
        .catch(err => {
            console.log("Got an error: ", err);
            callback("Sorry, there was a problem loading that season.");
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

    var ep, show;

     //GET EPISODE
     got("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "/episode/" + episode + "?api_key=" + API_KEY, {json: true})
        .then(response=> {
            //GET SHOW
            ep = response.body;
            return got("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + API_KEY, {json: true});         
        })
        .then(response=> {
            show = response.body;
            var showData = {'title': ep.name, "season": season, "episode": episode, show: show.name, "still": ep.still_path == null? "/img/nostill.jpg" : "http://image.tmdb.org/t/p/original" + ep.still_path , "showID": show.id};
            callback(null, showData);
        })
        .catch(err => {
            console.log("Got an error: ", err);
            callback("Sorry, there was a problem loading that episode.");
        });
}