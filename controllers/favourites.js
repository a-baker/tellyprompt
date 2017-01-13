var Favourite = require('../models/favourite');
var Favouritenumber = require('../models/favouritenumber');
var shows = require('./shows');
var async = require('async');

module.exports = {
    getFavourites: getFavourites,
    getOneFavourite: getOneFavourite,
    isFavourite: isFavourite
}

function getFavourites(username, page, callback){
    var favouritesData = {pages: 0, page: 0, episodes: []};
//    Favourite.find( { username: username } ).lean().exec(function (err, favourites) {
//        async.each(favourites, function(item, cb){
//            shows.getEpisodeInfo(item.discussionID, function(err, data){
//                var ep = {"show": data.show, "season": data.season, "episode": data.episode, "title": data.title, "still": data.still, "showID": data.showID};
//                favouritesData.episodes.push(ep);
//                cb();
//            });
//        }, function(){
//            if(!err){
//                callback(null, favouritesData);
//            } else {
//                callback(err);
//            }
//        });
//    });

    Favourite.paginate({username: username}, { page: 1, limit: 5 } , function(err, paginatedResults) {

        if ( page > paginatedResults.pages ) { page = paginatedResults.pages; }
        if ( page < 1) { page = 1; }

        favouritesData.pages = paginatedResults.pages;
        favouritesData.page = page;

        Favourite.paginate({username: username}, { page: page, limit: 5 } , function(err, paginatedResults) {
          if (err) {
            console.error(err);
          } else {
            console.log(paginatedResults);

            async.each(paginatedResults.docs, function(item, cb){
                shows.getEpisodeInfo(item.discussionID, function(err, data){
                    var ep = {"show": data.show, "season": data.season, "episode": data.episode, "title": data.title, "still": data.still, "showID": data.showID};
                    favouritesData.episodes.push(ep);
                    cb();
                });
            }, function(){
                if(!err){
                    callback(null, favouritesData);
                } else {
                    callback(err);
                }
            });

          }
        });
    });
}

function getOneFavourite(username, callback){
    Favourite.find({username: username}).exec(function(err, favourites) {
        var length = favourites.length;

        var i = Math.floor(Math.random() * favourites.length);

        if(!err && favourites[i]){
            shows.getEpisodeInfo(favourites[i].discussionID, function(err, data){
                if(!err){
                    Favouritenumber.findOne({discussionID: favourites[i].discussionID}).exec(function(err, favinfo) {
                        if(!err){
                            data.favourites = favinfo.favourites - 1;
                            console.log(data.favourites);
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            })
        } else {
            callback(err);
        }
    });
}

function isFavourite(username, episode, callback){
    Favourite.findOne({username: username, discussionID: episode}).exec(function(err, favourites) {
        if(!err) {
            if(favourites){
                 callback(null, '1');
            } else {
                callback(null, '0');
            }
        } else { callback(err); }
    });
}