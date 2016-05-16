var mongoose = require('mongoose');

module.exports = mongoose.model('Message',{
        ID: Number,
    userID: Number,
    discussionID: Number,
    content: String,
    dateTime: String
});
