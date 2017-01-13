var express = require('express');
var router = express.Router();
var async = require('async');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

//models
var Message = require('../models/message');
var User = require('../models/user');
var Favourite = require('../models/favourite');
var Favouritenumber = require('../models/favouritenumber');

//controllers
var favourites = require('../controllers/favourites');
var shows = require('../controllers/shows');
var popular = require('../controllers/popular');

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

module.exports = function(passport){

	/* GET login page. */
	router.get('/login', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('login', { message: req.flash('message'), title: "Log In - Tellyprompt" });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash : true
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message'), title: "Sign Up - Tellyprompt"});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/',
		failureRedirect: '/signup',
		failureFlash : true
	}));

    // router.get('/', isAuthenticated, function(req, res){
    //     popular.mostPopular(function (err, popInfo){
    //         if(!err){
    //             favourites.getOneFavourite(req.user.username, function(err, favInfo){
    //                 if(!err) {
    //                    res.render('index', {username: req.user.username, epFav: favInfo, epPop: popInfo});
    //                 } else {
    //                    res.send(err);
    //                 }
    //             });
    //         } else {
    //             res.send(err);
    //         }
    //     });
    // });

    router.get('/', isAuthenticated, function(req,res){
        var obj = {username: req.user.username};
        popular.mostPopular()
            .then(function( popInfo ){
                obj.epPop = popInfo;
                return popular.getOneFavourite();
            })
            .then(function( favInfo ){
                obj.epFav = favInfo;
                res.render('index', obj);
            })
            .catch(function(err){
                res.send(err);
            });
    });

	/* GET Home Page */
	router.get('/chat', isAuthenticated, function(req, res){
		res.redirect('/search');
	});

    router.get('/info', function(req, res){
		res.render('info', {title: "Info - Tellyprompt"});
	});

    router.post('/chat/:show/:season/:ep', isAuthenticated, function(req, res){

        var epID = req.params.show + "s" + req.params.season + "e" + req.params.ep;

        favourites.isFavourite(req.user.username, epID, function(err, fav) {
            if(!err) {

                shows.getEpisodeInfo(epID, function(err, data){
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
        shows.getEpisodeInfo(req.params.id, function(err, data){
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

        shows.getSeasonInfo(series, season, function(err, data){
            if(!err){
                res.render('season', {data: data});
            } else {
                res.send(err);
            }

        })


    });

    router.get('/show/search/:name', handleOnlyXhr, function(req, res){
        shows.getShowInfo(req.params.name, function(err, info){
            if(!err){
                res.send(info);
            } else {
                res.send(err);
            }
        });
    });

    router.get('/show/:name', handleOnlyXhr, function(req, res){
        var seriesData = {seasons:[]};
        shows.getShowInfo(req.params.name, function(err, info){
            if(!err){
                shows.getSeasons(info, function(data){
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
        favourites.getFavourites(req.body.username, 1, function(err, info){
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
        favourites.getFavourites(req.body.username, req.params.page, function(err, info){
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
        favourites.isFavourite(req.params.u, req.params.e, function(err, data){
            res.send(data);
        });
    });

    router.post('/popular', isAuthenticated, function(req, res) {
        if(req.xhr && req.body.ajax) {
            popular.getPopular(function (err, info){
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
        User.findOne( { "_id" : userID }, {password: 0, _id: 0, __v: 0} ).lean().exec(function (err, users) {
            return res.end(JSON.stringify(users));
        });
    });

    router.get('/api/users/username/:name', function(req, res){
        User.findOne( { username : req.params.name }, {password: 0, _id: 0, __v: 0} ).lean().exec(function (err, users) {
            return res.end(JSON.stringify(users));
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
                throw err;
            }
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
                return err;
            }
            // already exists
            if (favourite) {
                Favourite.remove({ 'username' :  username, 'discussionID': discussionID }, function(err, favourite){
                    if (err) return err;
                    res.send({favourite: 0});

                    Favouritenumber.update({discussionID: discussionID}, {$inc: { favourites: -1 }}, {upsert: true, setDefaultsOnInsert: true});
                });
            } else {
                var newFavourite = new Favourite();

                newFavourite.username = username;
                newFavourite.discussionID = discussionID;
                // save the user
                newFavourite.save(function(err) {
                    if (err){
                        throw err;
                    }
                    res.send({favourite: 1});

                    Favouritenumber.update({discussionID: discussionID}, {$inc: { favourites: 1 }}, {upsert: true, setDefaultsOnInsert: true});

                    return (newFavourite);
                });
            }
        });
    });

	return router;
}