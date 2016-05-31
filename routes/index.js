var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Message = require('../models/message');
var Discussion = require('../models/discussion');
var Episode = require('../models/episode');
var Show = require('../models/show');
var User = require('../models/user');
var Favourite = require('../models/favourite');
var Favouritenumber = require('../models/favouritenumber');
var unirest = require('unirest');
var async = require('async');

var ObjectId = require('mongoose').Types.ObjectId;

//themoviedb api key
var APIKEY = "ad3cf5b87d8ad52d68ce61f54f36087f";

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login');
}

var handleOnlyXhr = function(req, res, next) {
  if (req.xhr) return next();
  res.redirect('/');
}

function getShowInfo(search, callback){

    var obj = {"title": "", id: 0, poster:"", "seasons": []};

    unirest.get("https://api.themoviedb.org/3/search/tv?query=" + search + "&api_key=" + APIKEY)
                    .send()
                    .end(response=> {
                        if (response.ok) {
                            var data = response.body;
                            if(data.total_results > 0){
                                var id = data.results[0].id;
                                obj.id = id;
                                unirest.get("https://api.themoviedb.org/3/tv/" + id + "?api_key=" + APIKEY)
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
         unirest.get("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "?api_key=" + APIKEY)
            .send()
            .end(response=> {
                if (response.ok) {
                    var showseason = response.body;

                        //GET SHOW
                        unirest.get("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + APIKEY)
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
     unirest.get("https://api.themoviedb.org/3/tv/" + series + "/season/" + season + "/episode/" + episode + "?api_key=" + APIKEY)
        .send()
        .end(response=> {
            if (response.ok) {
                var ep = response.body;

                    //GET SHOW
                    unirest.get("https://api.themoviedb.org/3/tv/" + series + "?api_key=" + APIKEY)
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

function getFavourites(username, page, callback){
    var favouritesData = {pages: 0, page: 0, episodes: []};
//    Favourite.find( { username: username } ).lean().exec(function (err, favourites) {
//        async.each(favourites, function(item, cb){
//            getEpisodeInfo(item.discussionID, function(err, data){
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
                getEpisodeInfo(item.discussionID, function(err, data){
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
            getEpisodeInfo(favourites[i].discussionID, function(err, data){
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

function getPopular(callback){
    var popularData = {episodes: []};
    Favouritenumber.find().sort({'favourites': -1}).limit(5).exec(function(err, shows) {
        async.each(shows, function(item, cb){
            getEpisodeInfo(item.discussionID, function(err, data){
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
    var epData = {};
    Favouritenumber.find().sort({'favourites': -1}).limit(1).exec(function(err, shows) {
        async.each(shows, function(item, cb){
            getEpisodeInfo(item.discussionID, function(err, data){
                var ep = {"show": data.show, "season": data.season, "episode": data.episode, "title": data.title, "still": data.still, "showID": data.showID};
                epData = ep;
                cb();
            });
        }, function(){
            if(!err){
                callback(null, epData);
            } else {
                callback(err);
            }
        });
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

module.exports = function(passport){

	/* GET login page. */
	router.get('/login', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('login', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash : true
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/',
		failureRedirect: '/signup',
		failureFlash : true
	}));

    router.get('/', isAuthenticated, function(req, res){
        mostPopular(function (err, popInfo){
            if(!err){
                getOneFavourite(req.user.username, function(err, favInfo){
                    if(!err) {
                       res.render('index', {username: req.user.username, epFav: favInfo, epPop: popInfo});
                    } else {
                       res.send(err);
                    }
                });
            } else {
                res.send(err);
            }
        });
    });

    router.get('/discussions', isAuthenticated, function(req, res){
        Discussion.find( {  } ).lean().exec(function (err, discussions) {
            res.render('discussions', {discussions: discussions});
        });
    });

	/* GET Home Page */
	router.get('/chat', isAuthenticated, function(req, res){
		res.redirect('/search');
	});

    router.post('/chat/:show/:season/:ep', isAuthenticated, function(req, res){

        var epID = req.params.show + "s" + req.params.season + "e" + req.params.ep;

        isFavourite(req.user.username, epID, function(err, fav) {
            if(!err) {

                getEpisodeInfo(epID, function(err, data){
                    if(!err){
                        if (req.body.ajax) {
                            res.render('chat', {user: req.user, id: epID, ep: data, favourite: fav});
                        }
                    } else {
                        res.send(err);
                    }
                });

            } else { res.send(err); }
        });
	});

    router.get('/chat/:show/:season/:ep', isAuthenticated, function(req, res){
        res.render('index', {username: req.user.username});
    });

    router.get('/episode/:id', function(req, res){
        getEpisodeInfo(req.params.id, function(err, data){
            if(!err){
                res.render('episode', {data: data});
            } else {
                res.send(err)
            }
        });
    });

    router.get('/season/:show/:season', handleOnlyXhr, function(req, res){
        var series = req.params.show;
        var season = req.params.season;

        getSeasonInfo(series, season, function(err, data){
            if(!err){
                res.render('season', {data: data});
            } else {
                res.send(err);
            }

        })


    });

    router.get('/show/search/:name', handleOnlyXhr, function(req, res){
        getShowInfo(req.params.name, function(err, info){
            if(!err){
                res.send(info);
            } else {
                res.send(err);
            }
        });
    });

    router.get('/show/:name', handleOnlyXhr, function(req, res){
        var seriesData = {seasons:[]};
        getShowInfo(req.params.name, function(err, info){
            if(!err){
                getSeasons(info, function(data){
                    res.send(data);
                });
            } else {
                res.send(err);
            }
        });
    });

    router.get('/search', isAuthenticated, function(req, res){
            res.render('index', {username: req.user.username});
    });

    router.get('/search/:term', isAuthenticated, function(req, res){
            res.render('index', {username: req.user.username});
    });

    router.post('/search', isAuthenticated, function(req, res){
        if(req.xhr && req.body.ajax) {
            res.render('search', {defaultSearch: null});
        }
    });

    router.post('/search/:term', isAuthenticated, function(req, res){
        if(req.xhr && req.body.ajax) {
            res.render('search', {defaultSearch: req.params.term});
        }
    });

    router.post('/favourites', function(req, res){
        getFavourites(req.body.username, 1, function(err, info){
           if(!err){
               if(req.xhr) {
                   res.render('favourites', {data: info});
               } else {
                    res.render('index');
                }
           } else {
               res.send(err);
           }
        });
    });

    router.post('/favourites/:page', function(req, res){
        getFavourites(req.body.username, req.params.page, function(err, info){
           if(!err){
               if(req.xhr) {
                   res.render('favourites', {data: info});
               } else {
                   res.render('index');
               }
           } else {
               res.send(err);
           }
        });
    });

    router.get('/favourites', isAuthenticated, function(req, res) {
        res.render('index', {username: req.user.username});
    });

    router.get('/favourites/:page', isAuthenticated, function(req, res) {
        res.render('index', {username: req.user.username});
    });

    router.get('/isfavourite/:u/:e', function(req,res){
        isFavourite(req.params.u, req.params.e, function(err, data){
            res.send(data);
        });
    });

    router.post('/popular', isAuthenticated, function(req, res) {
        if(req.xhr && req.body.ajax) {
            getPopular(function (err, info){
               if(!err) {
                   res.render('popular', {data: info});
               } else {
                   res.send(err);
               }
            });
        }
    });

    router.get('/popular', isAuthenticated, function(req, res) {
            res.render('index', {username: req.user.username});
    });

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/login');
	});


    /* API INTERACTIONS */

    router.get('/api/users/id/:id', function(req, res){
        //var userID = new ObjectId(req.params.id);
        var userID = req.params.id;
        console.log(userID);
        User.findOne( { "_id" : userID }, {password: 0, _id: 0, __v: 0} ).lean().exec(function (err, users) {
            return res.end(JSON.stringify(users));
        });
    });

    router.get('/api/users/username/:name', function(req, res){
        User.findOne( { username : req.params.name }, {password: 0, _id: 0, __v: 0} ).lean().exec(function (err, users) {
            return res.end(JSON.stringify(users));
        });
    });

    router.get('/api/discussions/username/:name', function(req, res){
        Discussion.find( { username : req.params.name } ).lean().exec(function (err, discussions) {
            console.log("discussions: ", discussions);
            return res.end(JSON.stringify(discussions));
        });
    });

    router.get('/api/discussions/episode/:episode', function(req, res){
        Discussion.find( { episodeID : req.params.episode } ).lean().exec(function (err, discussions) {
            return res.end(JSON.stringify(discussions));
        });
    });

    router.get('/api/discussions/add/:topic/:user/:episode/', function(req, res){
        var now = new Date()
        var discussion = new Discussion();
        discussion.username = req.params.user;
        discussion.topic = req.params.topic;
        discussion.episodeID = req.params.episode;
        discussion.dateTime = now.toISOString();

        // save the discussion
        discussion.save(function(err) {
            if (err){
                console.log('Error in Saving discussion: '+err);
                throw err;
            }
            console.log('discussion saving succesful');
            return res.end("Saved!");
        });
    });

    router.get('/api/messages/username/:name', function(req, res){
        Message.find( { username : req.params.name } ).lean().exec(function (err, messages) {
            return res.end(JSON.stringify(messages));
        });
    });

    router.get('/api/messages/discussion/:id', function(req, res){
        Message.find( { discussionID : req.params.id } ).sort('dateTime').exec(function (err, messages) {
            return res.end(JSON.stringify(messages));
        });
    });

    router.post('/api/messages/discussion/:id', function(req, res){
        var message = new Message();
        var now = new Date();
      // set the message's local credentials
        message.id = Date.now();
        message.username = req.body.username;
        message.discussionID = req.params.id;
        message.content = req.body.content;
        message.dateTime = now.toISOString();

        // save the message
        message.save(function(err) {
            if (err){
                console.log('Error in Saving message: '+err);
                throw err;
            }
            console.log('message saving succesful');
            Message.find( { discussionID : req.params.id } ).sort('dateTime').lean().exec(function (err, messages) {
            return res.end(JSON.stringify(messages));
        });
        });

    });

    router.post('/api/favourites/:id', function(req, res) {
        var username = req.body.username;
        var discussionID = req.params.id;
        Favourite.findOne({ 'username' :  username, 'discussionID': discussionID }, function(err, favourite) {
            // In case of any error, return using the done method
            if (err){
                console.log('Error adding to favourites: '+err);
                return err;
            }
            // already exists
            if (favourite) {
                Favourite.remove({ 'username' :  username, 'discussionID': discussionID }, function(err, favourite){
                    if (err) return err;
                    res.send({favourite: 0});

                    Favouritenumber.update({discussionID: discussionID}, {$inc: { favourites: -1 }}, {upsert: true, setDefaultsOnInsert: true}, function(err, data){
                        console.log('fav -1');
                    });
                });
            } else {
                var newFavourite = new Favourite();

                newFavourite.username = username;
                newFavourite.discussionID = discussionID;
                // save the user
                newFavourite.save(function(err) {
                    if (err){
                        console.log('Error in Saving favourite: '+err);
                        throw err;
                    }
                    res.send({favourite: 1});

                    Favouritenumber.update({discussionID: discussionID}, {$inc: { favourites: 1 }}, {upsert: true, setDefaultsOnInsert: true}, function(err, data){
                        console.log('fav +1');
                    });

                    return (newFavourite);
                });
            }
        });
    });

	return router;
}
