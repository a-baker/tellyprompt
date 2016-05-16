var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
        ID: integer,
    username: String,
    password: String,
    email: String
});
