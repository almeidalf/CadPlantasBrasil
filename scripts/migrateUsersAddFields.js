require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const mongoUri = require('../config/db');

(async () => {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected');

        const result = await User.updateMany(
            { $or: [{msisdn: { $exists: false } }, { role: { $exists: false } }] },
            {
                $setOnInsert: {},
                $set: {
                    msisdn: "",
                    role: 1
                }
            }
        );

        console.log('Usuários atualizados ${result.modifiedCount}');
    } catch (error) {
        console.log("❌ Erro ao atualizar usuários:", error);
    } finally {
        await mongoose.disconnect();
    }
})();