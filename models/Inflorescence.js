const mongoose = require('mongoose');

const inflorescenceSchema = new mongoose.Schema({
    type: String
});

module.exports = mongoose.model('Inflorescence', inflorescenceSchema, 'inflorescence');