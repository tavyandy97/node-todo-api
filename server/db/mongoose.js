const url = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/ToDoApp';

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(url , { useNewUrlParser: true });

module.exports = { mongoose }