var mongoose = require('mongoose');

module.exports = mongoose.model('Favourite',{
    username: String,
    discussionID: String,
});
