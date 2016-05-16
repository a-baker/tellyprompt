var mongoose = require('mongoose');

module.exports = mongoose.model('Message',{
        id: integer,
    userID: integer,
    discussionID: integer,
    content: String,
    dateTime: Date
});
