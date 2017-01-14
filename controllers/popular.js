var Favouritenumber = require('../models/favouritenumber');
var async = require('async');
var shows = require('./shows')

module.exports = {
    getPopular: getPopular,
    mostPopular: mostPopular
}

function getPopular(callback){
    var popularData = {episodes: []};
    Favouritenumber.find().sort({'favourites': -1}).limit(5).exec(function(err, showsData) {
        async.each(showsData, function(item, cb){
            shows.getEpisodeInfo(item.discussionID, function(err, data){
                var ep = {"show": data.show, "season": data.season, "episode": data.episode, "title": data.title, "still": data.still, "showID": data.showID};
                popularData.episodes.push(ep);
                cb();
            });
        }, function(){
            if(!err){
                callback(null, popularData);
            } else {
                callback(err);
            }
        });
    });
}

function mostPopular(callback){
    return new Promise((resolve, reject) => {
        var epData = {};
        Favouritenumber.find().sort({'favourites': -1}).limit(1).exec(function(err, showsData) {
            async.each(showsData, function(item, cb){
                shows.getEpisodeInfo(item.discussionID, function(err, data){
                    var ep = {"show": data.show, "season": data.season, "episode": data.episode, "title": data.title, "still": data.still, "showID": data.showID};
                    epData = ep;
                    cb();
                });
            }, function(){
                if(!err){
                    resolve(epData);
                } else {
                    throw new Error(err);
                }
            });
        });
    });
}