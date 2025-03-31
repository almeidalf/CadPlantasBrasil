const mongoose = require('mongoose');

const fruitSchema = new mongoose.Schema({
    type: String
});

module.exports = mongoose.model('Fruit', fruitSchema, 'fruit');