var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Message = require('../models/message');
var Discussion = require('../models/discussion');
var Episode = require('../models/episode');
var Show = require('../models/show');
var User = require('../models/user');

var ObjectId = require('mongoose').Types.ObjectId;


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/login', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/chat',
		failureRedirect: '/login',
		failureFlash : true
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/chat',
		failureRedirect: '/signup',
		failureFlash : true
	}));

    router.get('/', function(req, res){
        res.redirect('/chat');
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





