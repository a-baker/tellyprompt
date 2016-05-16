var mongoose = require('mongoose');

module.exports = mongoose.model('Discussion',{
        ID: Number,
    topic: String,
    userID: Number,
    episodeID: Number,
    dateTime: Date
});
