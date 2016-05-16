var mongoose = require('mongoose');

module.exports = mongoose.model('Discussion',{
        ID: integer,
    topic: String,
    userID: integer,
    episodeID: integer,
    dateTime: Date
});
