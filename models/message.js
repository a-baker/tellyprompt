var mongoose = require('mongoose');

module.exports = mongoose.model('Message',{
        ID: Number,
    userID: String,
    discussionID: Number,
    content: String,
    dateTime: String
});
