var mongoose = require('mongoose');

module.exports = mongoose.model('Episode',{
        ID: Number,
    showID: Number,
    title: String,
    date: Date,
    season: Number
});
