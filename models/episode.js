var mongoose = require('mongoose');

module.exports = mongoose.model('Episode',{
        ID: integer,
    showID: integer,
    title: String,
    date: Date,
    season: integer
});
