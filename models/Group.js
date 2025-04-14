const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
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
    description: {
        type: String,
        maxLength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

GroupSchema.set('toJSON', {
    transform: (doc, ret) => {
        return {
            id: ret._id,
            subscriber: ret.subscriber,
            name: ret.name,
            description: ret.description,
            createdAt: ret.createdAt
        };
    }
});

module.exports = mongoose.model('Group', GroupSchema);
