const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        maxLength: 300
    },
    nameScientific: {
        type: String,
        maxLength: 300
    },
    description: {
        type: String,
        required: true,
        maxLength: 3000
    },
    location: {
        latitude: {
            type: String,
            required: true,
        },
        longitude: {
            type: String,
            required: true,
        },
    },
    images: {
        type: [String],
        required: false,
    },
    leaf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leaf',
        required: false,
    },
    stem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stem',
        required: false,
    },
    inflorescence: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inflorescence',
        required: false,
    },
    fruit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fruit',
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

PlantSchema.set('toJSON', {
    transform: (doc, ret, options) => {
        const transformed = {
            id: ret._id,
            name: ret.name,
            nameScientific: ret.nameScientific,
            description: ret.description,
            images: ret.images,
            location: ret.location,
            createdAt: ret.createdAt,
            leaf: ret.leaf,
            stem: ret.stem,
            inflorescence: ret.inflorescence,
            fruit: ret.fruit,
        };

        delete ret._id;
        delete ret.__v;

        return transformed;
    },
});

module.exports = mongoose.model('Plant', PlantSchema);