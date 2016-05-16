var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
        ID: Number,
    username: String,
    password: String,
    email: String
});
