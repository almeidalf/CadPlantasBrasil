const mongoose = require('mongoose');

const stemSchema = new mongoose.Schema({
    type: String
});

module.exports = mongoose.model('Stem', stemSchema, 'stem');