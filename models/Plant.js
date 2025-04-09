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
        required: false,
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
        required: true,
    },
    leaf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leaf',
        required: false,
    },
    leafColor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
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
    inflorescenceColor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
        required: false,
    },
    fruit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fruit',
        required: false,
    },
    fruitColor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
        required: false,
    },
    isPublic: {
        type: Boolean,
        default: false,
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
            leaf: ret.leaf?.type || null,
            leafColor: ret.leafColor?.type || null,
            stem: ret.stem?.type || null,
            inflorescence: ret.inflorescence?.type || null,
            inflorescenceColor: ret.inflorescenceColor?.type || null,
            fruit: ret.fruit?.type || null,
            fruitColor: ret.fruitColor?.type || null,
            isPublic: ret.isPublic,
        };

        delete ret._id;
        delete ret.__v;

        return transformed;
    },
});

module.exports = mongoose.model('Plant', PlantSchema);