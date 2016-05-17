var mongoose = require('mongoose');

module.exports = mongoose.model('Message',{
        ID: Number,
    username: String,
    discussionID: Number,
    content: String,
    dateTime: Date
});
