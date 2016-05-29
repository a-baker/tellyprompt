var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var favSchema = new mongoose.Schema({
    username: String,
    discussionID: String,
});

favSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Favourite', favSchema);
