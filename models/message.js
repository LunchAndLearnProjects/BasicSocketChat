var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
    value: { type: String, required: true },
    date: { type: String, required: true },
    username: { type: String, required: true }
});

module.exports = mongoose.model('Message', MessageSchema);