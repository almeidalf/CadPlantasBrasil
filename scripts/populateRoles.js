// scripts/populateRoles.js

require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const mongoUri = require('../config/db');

const roles = [
    {
        code: 1,
        name: "Usuário comum",
        permissions: []
    },
    {
        code: 2,
        name: "Moderador",
        permissions: ["view_users", "moderate_content"]
    },
    {
        code: 3,
        name: "Admin Master",
        permissions: ["*"] // pode tudo
    }
];

(async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log("🔌 Conectado ao MongoDB");

        for (const role of roles) {
            const existing = await Role.findOne({ code: role.code });
            if (!existing) {
                await Role.create(role);
                console.log(`✅ Role '${role.name}' criada`);
            } else {
                console.log(`ℹ️ Role '${role.name}' já existe`);
            }
        }

    } catch (err) {
        console.error("❌ Erro ao popular roles:", err);
    } finally {
        mongoose.disconnect();
    }
})();