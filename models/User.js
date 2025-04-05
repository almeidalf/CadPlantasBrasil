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
    msisdn: {
        type: String,
        required: false,
        match: /^\+?[1-9]\d{1,14}$/,
    },
    role: {
        type: Number,
        enum: [1, 2, 3], // 1 = usuário, 2 = moderador, 3 = admin master
        default: 1
    }
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
                msisdn: ret.msisdn,
                role: ret.role,
                createdAt: ret.createdAt
            };
        }
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;