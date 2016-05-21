var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Message = require('../models/message');
var Discussion = require('../models/discussion');
var Episode = require('../models/episode');
var Show = require('../models/show');
var User = require('../models/user');
var unirest = require('unirest');

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

                                            callback(obj);

                                        } else {
                                            console.log("Error getting show: ", response.error);
                                        }
                                    });
                            } else {
                                callback("No shows found with the name " + search + ".");
                                return;
                            }
                        } else {
                            console.log("Error in search: ", response.error);
                        }
                    });
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/login', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
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

    router.get('/', function(req, res){
        res.redirect('/discussions');
    });

    router.get('/discussions', isAuthenticated, function(req, res){
        Discussion.find( {  } ).lean().exec(function (err, discussions) {
            res.render('discussions', {discussions: discussions});
        });
    });

	/* GET Home Page */
	router.get('/chat', isAuthenticated, function(req, res){
		res.render('chat', { user: req.user, id: 1 });
	});

    router.get('/chat/:chatid', isAuthenticated, function(req, res){

        Discussion.findOne( { _id : req.params.chatid } ).lean().exec(function (err, discussions) {

            if (err){
                console.log('Error: '+err);
                throw err;
            }

            if(discussions !== null){
                res.render('chat', { user: req.user, id: req.params.chatid, topic: discussions.topic });
            } else {
                res.status(404).send("Sorry, that discussion doesn't exist!");
            }
        });

	});

     router.get('/episode/:id', function(req, res){
        var epstring = req.params.id;

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

                                    var showData = {'title': ep.name, "season": season, "episode": episode, show: show.name, "still": "http://image.tmdb.org/t/p/w300" + ep.still_path};

                                    res.render('episode', {data: showData});


                                } else {
                                    console.log("Got an error: ", response.error);
                                    res.end("Sorry, there was a problem loading that episode.");
                                }
                            });
                } else {
                    console.log("Got an error: ", response.error);
                    res.end("Sorry, there was a problem loading that episode.");
                }
            });
    });

    router.get('/show/search/:name', function(req, res){
        getShowInfo(req.params.name, function(info){
            res.send(info);
        });
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
        User.findOne( { "_id" : userID } ).lean().exec(function (err, users) {
            return res.end(JSON.stringify(users));
        });
    });

    router.get('/api/users/username/:name', function(req, res){
        User.findOne( { username : req.params.name } ).lean().exec(function (err, users) {
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

	return router;
}





