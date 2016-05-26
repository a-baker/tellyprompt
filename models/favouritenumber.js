var mongoose = require('mongoose');

module.exports = mongoose.model('Favouritenumber',{
    discussionID: String,
    favourites: {type: Number, default: 1}
});
