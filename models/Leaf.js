const mongoose = require('mongoose');

const leafSchema = new mongoose.Schema({
    type: String
});

module.exports = mongoose.model('Leaf', leafSchema, 'leaf');