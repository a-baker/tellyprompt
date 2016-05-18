var mongoose = require('mongoose');
var shortid = require('shortid');

module.exports = mongoose.model('Discussion',{
        _id: {type: String, 'default': shortid.generate},
    topic: String,
    username: String,
    episodeID: Number,
    dateTime: Date
});
