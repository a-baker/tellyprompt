var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
        ID: Number,
    username: String,
    username_lower: String,
    password: String,
    email: String
});
