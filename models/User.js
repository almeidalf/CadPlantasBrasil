const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            const id = ret._id;
            delete ret._id;
            delete ret.updatedAt;
            return {
                id,
                name: ret.name,
                email: ret.email,
                createdAt: ret.createdAt
            };
        }
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;