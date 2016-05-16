var mongoose = require('mongoose');

module.exports = mongoose.model('Show',{
        ID: Number,
    title: String
});
