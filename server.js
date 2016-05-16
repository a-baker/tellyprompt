var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//path to comments file - temporary, to be replaced by database



//database config
var dbConfig = require('./db.js');
var mongoose = require('mongoose');
mongoose.connect(dbConfig.url);
var Message = require('./models/message');


// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret: 'secret'}));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


//set port for app
app.set('port', (process.env.PORT || 3000));

//app.use('/', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var routes = require('./routes/index')(passport);
app.use('/', routes);

app.get('/api/messages/:id', function(req, res) {

    var filename = "";
    if(req.params.id == 1) {filename = "messages.json"} else {filename = 'messages'+req.params.id+'.json';}
    var COMMENTS_FILE = path.join(__dirname, filename);

  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/messages/:id', function(req, res) {
    var filename = "";
    if(req.params.id == 1) {filename = "messages.json"} else {filename = 'messages'+req.params.id+'.json';}
    var COMMENTS_FILE = path.join(__dirname, filename);

  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var comments = JSON.parse(data);
    // NOTE: In a real implementation, we would likely rely on a database or
    // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
    // treat Date.now() as unique-enough for our purposes.
    var newComment = {
      id: Date.now(),
      author: req.body.author,
      text: req.body.text,
      dateTime: req.body.dateTime,
    };

    //test save to DB
       var newMessage = new Message();
      // set the message's local credentials
        newMessage.id = newComment.id;
        newMessage.userID = 0;
        newMessage.discussionID = req.params.id;
        newMessage.content = newComment.text;
        newMessage.dateTime = newComment.dateTime;

        // save the message
        newMessage.save(function(err) {
            if (err){
                console.log('Error in Saving message: '+err);
                throw err;
            }
            console.log('message save succesful');
        });

      //end of DB save


    comments.push(newComment);
    fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(comments);
    });
  });
});

app.get('/api/getmessages/:id', function(req, res){
    Message.find( { discussionID : req.params.id } ).lean().exec(function (err, messages) {
        return res.end(JSON.stringify(messages));
    });

});



//get logged in user
app.get('/api/user_data', function(req, res) {

            if (req.user === undefined) {
                // The user is not logged in
                res.json({});
            } else {
                res.json({
                    username: req.user.username
                });
            }
        });

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(function(req, res, next) {
  res.status(404).send("Sorry, can't find that!");
});


io.on('connection', function(socket){
  socket.on('message', function(msg){
    io.emit('message', msg);
      console.log('message received');
  });
});


http.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
