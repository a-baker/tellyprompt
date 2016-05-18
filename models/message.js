var mongoose = require('mongoose');

module.exports = mongoose.model('Message',{
        ID: Number,
    username: String,
    discussionID: String,
    content: String,
    dateTime: Date
});
