var mongoose = require('mongoose');

module.exports = mongoose.model('Show',{
        ID: integer,
    title: String
});
