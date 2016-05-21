var mongoose = require('mongoose');

module.exports = mongoose.model('Episode',{
        _id: String,
    showID: Number,
    title: String,
    date: Date,
    season: Number,
    number: Number
});
